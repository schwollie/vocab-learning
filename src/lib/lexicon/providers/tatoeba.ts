import { buildTatoebaSearchQueries } from "@/lib/lexicon/search-terms";
import { toIso639_3 } from "@/lib/languages";
import { LexiconProvider, LexiconQuery, LexiconSentence } from "@/lib/lexicon/types";
import { parseV0Sentences, parseV1Sentences } from "@/lib/lexicon/providers/tatoeba-parse";

const TATOEBA_API_BASE = process.env.TATOEBA_API_BASE_URL ?? "https://api.tatoeba.org";
const FALLBACK_API_BASE =
  process.env.TATOEBA_FALLBACK_API_BASE_URL ?? "https://tatoeba.org/en/api_v0";

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Tatoeba request failed (${response.status}): ${body.slice(0, 200)}`);
  }
  return response.json();
}

async function fetchFromV1(word: string, query: LexiconQuery): Promise<LexiconSentence[]> {
  const source = toIso639_3(query.sourceLanguage);
  if (!source) return [];

  const url = new URL("/v1/sentences", TATOEBA_API_BASE);
  url.searchParams.set("q", word);
  url.searchParams.set("lang", source);
  url.searchParams.set("sort", "random");
  url.searchParams.set("showtrans", "all");

  const json = await fetchJson(url.toString());
  return parseV1Sentences(json, source);
}

async function fetchFromV0(word: string, query: LexiconQuery): Promise<LexiconSentence[]> {
  const source = toIso639_3(query.sourceLanguage);
  const target = query.targetLanguage ? toIso639_3(query.targetLanguage) : null;
  if (!source) return [];

  const url = new URL("/search", FALLBACK_API_BASE);
  url.searchParams.set("from", source);
  url.searchParams.set("query", word);
  url.searchParams.set("sort", "relevance");
  url.searchParams.set("trans_filter", "limit");
  if (target) {
    url.searchParams.set("to", target);
  }

  const json = await fetchJson(url.toString());
  return parseV0Sentences(json, source);
}

async function fetchExamplesForWord(word: string, query: LexiconQuery): Promise<LexiconSentence[]> {
  const maxExamples = Math.max(1, Math.min(query.maxExamples ?? 6, 12));

  try {
    const examples = await fetchFromV1(word, query);
    if (examples.length > 0) return examples.slice(0, maxExamples);
  } catch (error) {
    console.error("[tatoeba] v1 lookup failed:", error);
  }

  try {
    const examples = await fetchFromV0(word, query);
    if (examples.length > 0) return examples.slice(0, maxExamples);
  } catch (error) {
    console.error("[tatoeba] v0 lookup failed:", error);
  }

  return [];
}

export const tatoebaProvider: LexiconProvider = {
  id: "tatoeba",
  supports(language: string) {
    return toIso639_3(language) !== null;
  },
  async fetch(query: LexiconQuery) {
    const searchQueries = buildTatoebaSearchQueries(query.word, query.sourceLanguage);
    if (!searchQueries.length) return { examples: [] };

    for (const searchWord of searchQueries) {
      const examples = await fetchExamplesForWord(searchWord, query);
      if (examples.length > 0) return { examples };
    }

    return { examples: [] };
  },
};
