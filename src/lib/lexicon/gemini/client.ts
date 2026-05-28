import { buildLexiconPrompt } from "@/lib/lexicon/gemini/prompt";
import { parseGeminiLexiconResponse } from "@/lib/lexicon/gemini/parse";
import { GEMINI_LEXICON_RESPONSE_SCHEMA } from "@/lib/lexicon/gemini/schema";
import type { LexiconQuery, LexiconResult } from "@/lib/lexicon/types";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_FALLBACK_MODEL = "gemini-3.1-flash-lite";

export interface GeminiClientConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  fallbackModel: string;
  fetchImpl?: typeof fetch;
}

export function getGeminiClientConfig(): GeminiClientConfig | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl: process.env.GEMINI_API_BASE_URL?.trim() || DEFAULT_BASE_URL,
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
    fallbackModel: process.env.GEMINI_MODEL_FALLBACK?.trim() || DEFAULT_FALLBACK_MODEL,
  };
}

function extractResponseText(payload: unknown): string {
  const root = payload as Record<string, unknown>;
  const candidates = Array.isArray(root.candidates) ? root.candidates : [];
  const first = candidates[0] as Record<string, unknown> | undefined;
  const content = first?.content as Record<string, unknown> | undefined;
  const parts = Array.isArray(content?.parts) ? content.parts : [];
  const text = parts
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      return typeof (part as Record<string, unknown>).text === "string"
        ? ((part as Record<string, unknown>).text as string)
        : "";
    })
    .join("")
    .trim();

  if (!text) {
    const message =
      typeof root.error === "object" &&
      root.error &&
      typeof (root.error as Record<string, unknown>).message === "string"
        ? ((root.error as Record<string, unknown>).message as string)
        : "Gemini returned an empty response";
    throw new Error(message);
  }

  return text;
}

export async function callGeminiModel(
  config: GeminiClientConfig,
  model: string,
  prompt: string
): Promise<string> {
  const fetchImpl = config.fetchImpl ?? fetch;
  const url = new URL(`${config.baseUrl.replace(/\/$/, "")}/models/${model}:generateContent`);
  url.searchParams.set("key", config.apiKey);

  const response = await fetchImpl(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: GEMINI_LEXICON_RESPONSE_SCHEMA,
      },
    }),
  });

  const payload = (await response.json()) as unknown;
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload &&
      typeof (payload as Record<string, unknown>).error === "object" &&
      (payload as Record<string, unknown>).error &&
      typeof ((payload as Record<string, unknown>).error as Record<string, unknown>).message ===
        "string"
        ? (((payload as Record<string, unknown>).error as Record<string, unknown>)
            .message as string)
        : `Gemini request failed (${response.status})`;
    throw new Error(message);
  }

  return extractResponseText(payload);
}

export async function fetchLexiconFromGemini(
  query: LexiconQuery,
  configOverride?: Partial<GeminiClientConfig>
): Promise<LexiconResult> {
  const baseConfig = getGeminiClientConfig();
  const config: GeminiClientConfig = {
    apiKey: baseConfig?.apiKey ?? "",
    baseUrl: baseConfig?.baseUrl ?? DEFAULT_BASE_URL,
    model: baseConfig?.model ?? DEFAULT_MODEL,
    fallbackModel: baseConfig?.fallbackModel ?? DEFAULT_FALLBACK_MODEL,
    ...configOverride,
  };

  if (!config.apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const prompt = buildLexiconPrompt(query.word, query.sourceLanguage, query.targetLanguage);

  let responseText: string;
  try {
    responseText = await callGeminiModel(config, config.model, prompt);
  } catch (primaryError) {
    if (config.fallbackModel && config.fallbackModel !== config.model) {
      console.error("[gemini] primary model failed, trying fallback:", primaryError);
      responseText = await callGeminiModel(config, config.fallbackModel, prompt);
    } else {
      throw primaryError;
    }
  }

  return parseGeminiLexiconResponse(responseText, query);
}
