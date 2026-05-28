import { LexiconSentence } from "@/lib/lexicon/types";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function flattenTranslationGroups(raw: unknown): Record<string, unknown>[] {
  const list = asArray<unknown>(raw);
  const flattened: Record<string, unknown>[] = [];

  for (const entry of list) {
    if (Array.isArray(entry)) {
      for (const nested of entry) {
        if (nested && typeof nested === "object" && !Array.isArray(nested)) {
          flattened.push(nested as Record<string, unknown>);
        }
      }
      continue;
    }
    if (entry && typeof entry === "object") {
      flattened.push(entry as Record<string, unknown>);
    }
  }

  return flattened;
}

export function parseTranslations(raw: unknown): LexiconSentence["translations"] {
  return flattenTranslationGroups(raw)
    .map((entry) => ({
      id: String(entry.id ?? ""),
      text: typeof entry.text === "string" ? entry.text : "",
      language:
        typeof entry.lang === "string"
          ? entry.lang
          : typeof entry.language === "string"
            ? entry.language
            : "",
    }))
    .filter((entry) => entry.id && entry.text);
}

export function parseV1Sentences(raw: unknown, sourceLanguage: string): LexiconSentence[] {
  const payload = raw as Record<string, unknown>;
  const list = asArray<Record<string, unknown>>(payload.data ?? payload.sentences);
  return list
    .map((entry) => ({
      id: String(entry.id ?? ""),
      text: typeof entry.text === "string" ? entry.text : "",
      language:
        typeof entry.lang === "string"
          ? entry.lang
          : typeof entry.language === "string"
            ? entry.language
            : sourceLanguage,
      translations: parseTranslations(entry.translations),
    }))
    .filter((entry) => entry.id && entry.text);
}

export function parseV0Sentences(raw: unknown, sourceLanguage: string): LexiconSentence[] {
  const payload = raw as Record<string, unknown>;
  const list = asArray<Record<string, unknown>>(payload.results ?? payload.sentences);
  return list
    .map((entry) => ({
      id: String(entry.id ?? ""),
      text: typeof entry.text === "string" ? entry.text : "",
      language:
        typeof entry.lang === "string"
          ? entry.lang
          : typeof entry.from === "string"
            ? entry.from
            : sourceLanguage,
      translations: parseTranslations(entry.translations),
    }))
    .filter((entry) => entry.id && entry.text);
}
