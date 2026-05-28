import { fetchLexiconFromGemini } from "@/lib/lexicon/gemini/client";
import type { LexiconQuery, LexiconResult } from "@/lib/lexicon/types";

const CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const cache = new Map<string, { expiresAt: number; result: LexiconResult }>();

function cacheKey(query: LexiconQuery): string {
  return `${query.word.trim().toLowerCase()}::${query.sourceLanguage}::${query.targetLanguage ?? ""}`;
}

function emptyGrammar() {
  return { kind: "none" as const, title: "Grammar", rows: [] };
}

export function emptyLexiconResult(word: string, sourceLanguage: string, targetLanguage?: string): LexiconResult {
  return {
    word,
    sourceLanguage,
    targetLanguage,
    definition: "",
    definitionTranslation: "",
    grammar: emptyGrammar(),
    examples: [],
    provider: "gemini",
  };
}

export async function getLexiconData(query: LexiconQuery): Promise<LexiconResult> {
  const word = query.word.trim();
  if (!word) {
    return emptyLexiconResult("", query.sourceLanguage, query.targetLanguage);
  }

  const key = cacheKey({ ...query, word });
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const result = await fetchLexiconFromGemini({ ...query, word });
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result });
  return result;
}

/** Test helper to reset in-memory cache between unit tests. */
export function clearLexiconCacheForTests(): void {
  cache.clear();
}
