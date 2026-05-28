import { tatoebaProvider } from "@/lib/lexicon/providers/tatoeba";
import { wiktapiProvider } from "@/lib/lexicon/providers/wiktapi";
import { LexiconProvider, LexiconQuery, LexiconResult } from "@/lib/lexicon/types";

const providers: LexiconProvider[] = [tatoebaProvider, wiktapiProvider];

function dedupeBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];
  for (const item of items) {
    const id = key(item);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    deduped.push(item);
  }
  return deduped;
}

export async function getLexiconData(query: LexiconQuery): Promise<LexiconResult> {
  const base: LexiconResult = {
    word: query.word.trim(),
    sourceLanguage: query.sourceLanguage,
    examples: [],
    definitions: [],
    forms: [],
    providers: [],
  };
  if (!base.word) return base;

  const activeProviders = providers.filter((provider) => provider.supports(query.sourceLanguage));
  if (!activeProviders.length) return base;

  const results = await Promise.all(
    activeProviders.map(async (provider) => {
      try {
        const data = await provider.fetch(query);
        return { id: provider.id, data };
      } catch {
        return { id: provider.id, data: {} };
      }
    })
  );

  for (const result of results) {
    const data = result.data;
    if (Array.isArray(data.examples) && data.examples.length > 0) {
      base.examples.push(...data.examples);
      base.providers.push(result.id);
    }
    if (Array.isArray(data.definitions) && data.definitions.length > 0) {
      base.definitions.push(...data.definitions);
      if (!base.providers.includes(result.id)) base.providers.push(result.id);
    }
    if (Array.isArray(data.forms) && data.forms.length > 0) {
      base.forms.push(...data.forms);
      if (!base.providers.includes(result.id)) base.providers.push(result.id);
    }
  }

  base.examples = dedupeBy(base.examples, (item) => `${item.language}:${item.text}`).slice(
    0,
    query.maxExamples ?? 6
  );
  base.definitions = dedupeBy(base.definitions, (item) => `${item.partOfSpeech}:${item.text}`).slice(0, 8);
  base.forms = dedupeBy(base.forms, (item) => `${item.form}:${item.tags.join(",")}`).slice(0, 24);
  return base;
}
