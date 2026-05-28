import { afterEach, describe, expect, it, vi } from "vitest";
import { callGeminiModel, fetchLexiconFromGemini } from "@/lib/lexicon/gemini/client";
import {
  parseGeminiLexiconPayload,
  parseGeminiLexiconResponse,
} from "@/lib/lexicon/gemini/parse";
import { buildLexiconPrompt } from "@/lib/lexicon/gemini/prompt";

const validPayload = {
  headWord: "empanada",
  partOfSpeech: "noun",
  definition: "Una masa rellena y horneada o frita, típica de Latinoamérica.",
  definitionTranslation: "A filled pastry baked or fried, typical in Latin America.",
  grammar: {
    kind: "declension",
    title: "Singular / plural",
    rows: [
      { label: "singular", form: "la empanada" },
      { label: "plural", form: "las empanadas" },
    ],
  },
  examples: [
    {
      source: "Quiero una empanada de carne.",
      translation: "I want a meat empanada.",
    },
    {
      source: "Las empanadas están deliciosas.",
      translation: "The empanadas are delicious.",
    },
  ],
};

function geminiJsonResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
    }),
  } as unknown as Response;
}

describe("buildLexiconPrompt", () => {
  it("includes term, languages, and phrase head-word guidance", () => {
    const prompt = buildLexiconPrompt("la empanada", "es-ES", "en-US");
    expect(prompt).toContain('Term: "la empanada"');
    expect(prompt).toContain("Spanish (Spain) (es-ES)");
    expect(prompt).toContain("English (US) (en-US)");
    expect(prompt).toContain("headWord");
    expect(prompt).toContain("Return JSON only");
  });
});

describe("parseGeminiLexiconPayload", () => {
  it("accepts valid payload and maps to lexicon fields", () => {
    const parsed = parseGeminiLexiconPayload(validPayload);
    expect(parsed.headWord).toBe("empanada");
    expect(parsed.examples).toHaveLength(2);
    expect(parsed.grammar.kind).toBe("declension");
  });

  it("rejects malformed payloads", () => {
    expect(() => parseGeminiLexiconPayload({ headWord: "x" })).toThrow();
    expect(() => parseGeminiLexiconResponse("not json", {
      word: "la empanada",
      sourceLanguage: "es-ES",
      targetLanguage: "en-US",
    })).toThrow("valid JSON");
  });

  it("maps la empanada regression payload to LexiconResult", () => {
    const result = parseGeminiLexiconResponse(JSON.stringify(validPayload), {
      word: "la empanada",
      sourceLanguage: "es-ES",
      targetLanguage: "en-US",
    });
    expect(result.word).toBe("la empanada");
    expect(result.headWord).toBe("empanada");
    expect(result.definitionTranslation).toContain("pastry");
    expect(result.provider).toBe("gemini");
  });
});

describe("fetchLexiconFromGemini", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries with fallback model when primary fails", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/models/gemini-2.5-flash:")) {
        return {
          ok: false,
          status: 429,
          json: async () => ({ error: { message: "Rate limit exceeded" } }),
        } as unknown as Response;
      }
      if (url.includes("/models/gemini-3.1-flash-lite:")) {
        return geminiJsonResponse(validPayload);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const result = await fetchLexiconFromGemini(
      { word: "la empanada", sourceLanguage: "es-ES", targetLanguage: "en-US" },
      {
        apiKey: "test-key",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
        model: "gemini-2.5-flash",
        fallbackModel: "gemini-3.1-flash-lite",
        fetchImpl: fetchMock,
      }
    );

    expect(result.headWord).toBe("empanada");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("calls Gemini with structured JSON generation config", async () => {
    const fetchMock = vi.fn(async () => geminiJsonResponse(validPayload));
    vi.stubGlobal("fetch", fetchMock);

    await callGeminiModel(
      {
        apiKey: "test-key",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
        model: "gemini-2.5-flash",
        fallbackModel: "gemini-3.1-flash-lite",
      },
      "gemini-2.5-flash",
      "prompt text"
    );

    expect(fetchMock).toHaveBeenCalled();
    const firstCall = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(firstCall[1].body));
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema).toBeTruthy();
  });
});
