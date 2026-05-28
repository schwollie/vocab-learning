import { toIso639_3 } from "@/lib/languages";
import {
  LexiconDefinition,
  LexiconForm,
  LexiconProvider,
  LexiconQuery,
} from "@/lib/lexicon/types";

const WIKTAPI_BASE = process.env.WIKTAPI_BASE_URL ?? "https://api.wiktapi.dev";
const WIKTAPI_EDITION = process.env.WIKTAPI_EDITION ?? "en";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function parseDefinitions(entries: Array<Record<string, unknown>>): LexiconDefinition[] {
  const definitions: LexiconDefinition[] = [];
  for (const entry of entries) {
    const senses = asArray<Record<string, unknown>>(entry.senses);
    const partOfSpeech =
      typeof entry.pos === "string" ? entry.pos : typeof entry.part_of_speech === "string" ? entry.part_of_speech : undefined;
    for (const sense of senses) {
      const glosses = asArray<string>(sense.glosses);
      const tags = asArray<string>(sense.tags);
      for (const gloss of glosses) {
        if (!gloss) continue;
        definitions.push({ text: gloss, partOfSpeech, tags });
      }
    }
  }
  return definitions;
}

function parseForms(entries: Array<Record<string, unknown>>): LexiconForm[] {
  const forms: LexiconForm[] = [];
  for (const entry of entries) {
    const list = asArray<Record<string, unknown>>(entry.forms);
    for (const form of list) {
      const text = typeof form.form === "string" ? form.form : "";
      if (!text) continue;
      forms.push({
        form: text,
        tags: asArray<string>(form.tags),
      });
    }
  }
  return forms;
}

export const wiktapiProvider: LexiconProvider = {
  id: "wiktapi",
  supports(language: string) {
    return toIso639_3(language) !== null;
  },
  async fetch(query: LexiconQuery) {
    const word = query.word.trim();
    const source = toIso639_3(query.sourceLanguage);
    if (!word || !source) return { definitions: [], forms: [] };

    const url = new URL(
      `/v1/${encodeURIComponent(WIKTAPI_EDITION)}/word/${encodeURIComponent(word)}`,
      WIKTAPI_BASE
    );
    url.searchParams.set("lang", source);

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "force-cache",
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!response.ok) return { definitions: [], forms: [] };

    const payload = (await response.json()) as Record<string, unknown>;
    const entries = asArray<Record<string, unknown>>(payload.entries);
    return {
      definitions: parseDefinitions(entries).slice(0, 8),
      forms: parseForms(entries).slice(0, 24),
    };
  },
};
