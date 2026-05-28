import type { GeminiLexiconPayload } from "@/lib/lexicon/gemini/schema";
import type { LexiconGrammarKind, LexiconResult } from "@/lib/lexicon/types";

const GRAMMAR_KINDS = new Set<LexiconGrammarKind>(["conjugation", "declension", "none"]);

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseGrammarKind(value: unknown): LexiconGrammarKind {
  const kind = asString(value).toLowerCase();
  if (GRAMMAR_KINDS.has(kind as LexiconGrammarKind)) {
    return kind as LexiconGrammarKind;
  }
  return "none";
}

export function parseGeminiLexiconPayload(raw: unknown): GeminiLexiconPayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("Gemini response was not a JSON object");
  }

  const payload = raw as Record<string, unknown>;
  const grammarRaw = payload.grammar;
  if (!grammarRaw || typeof grammarRaw !== "object") {
    throw new Error("Gemini response missing grammar object");
  }
  const grammarObj = grammarRaw as Record<string, unknown>;

  const rowsRaw = Array.isArray(grammarObj.rows) ? grammarObj.rows : [];
  const rows = rowsRaw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const entry = row as Record<string, unknown>;
      const label = asString(entry.label);
      const form = asString(entry.form);
      if (!label || !form) return null;
      return { label, form };
    })
    .filter((row): row is { label: string; form: string } => row !== null);

  const examplesRaw = Array.isArray(payload.examples) ? payload.examples : [];
  const examples = examplesRaw
    .map((example) => {
      if (!example || typeof example !== "object") return null;
      const entry = example as Record<string, unknown>;
      const source = asString(entry.source);
      const translation = asString(entry.translation);
      if (!source || !translation) return null;
      return { source, translation };
    })
    .filter((example): example is { source: string; translation: string } => example !== null);

  const headWord = asString(payload.headWord);
  const definition = asString(payload.definition);
  const definitionTranslation = asString(payload.definitionTranslation);

  if (!headWord) throw new Error("Gemini response missing headWord");
  if (!definition) throw new Error("Gemini response missing definition");
  if (!definitionTranslation) throw new Error("Gemini response missing definitionTranslation");
  if (examples.length < 2) throw new Error("Gemini response must include at least 2 examples");

  return {
    headWord,
    partOfSpeech: asString(payload.partOfSpeech) || "unknown",
    definition,
    definitionTranslation,
    grammar: {
      kind: parseGrammarKind(grammarObj.kind),
      title: asString(grammarObj.title) || "Grammar",
      rows,
    },
    examples: examples.slice(0, 3),
  };
}

export function mapGeminiPayloadToResult(
  payload: GeminiLexiconPayload,
  query: { word: string; sourceLanguage: string; targetLanguage?: string }
): LexiconResult {
  return {
    word: query.word,
    sourceLanguage: query.sourceLanguage,
    targetLanguage: query.targetLanguage,
    headWord: payload.headWord,
    partOfSpeech: payload.partOfSpeech,
    definition: payload.definition,
    definitionTranslation: payload.definitionTranslation,
    grammar: payload.grammar,
    examples: payload.examples,
    provider: "gemini",
  };
}

export function parseGeminiLexiconResponse(
  text: string,
  query: { word: string; sourceLanguage: string; targetLanguage?: string }
): LexiconResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini response was not valid JSON");
  }
  const payload = parseGeminiLexiconPayload(parsed);
  return mapGeminiPayloadToResult(payload, query);
}
