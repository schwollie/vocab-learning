const SPANISH_ARTICLES = new Set([
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "lo",
  "al",
  "del",
]);

/**
 * Builds Tatoeba search queries for a vocab entry. Tries the full phrase first,
 * then a version with leading articles stripped (e.g. "la empanada" → "empanada").
 */
export function buildTatoebaSearchQueries(word: string, sourceLanguage: string): string[] {
  const cleaned = word.trim();
  if (!cleaned) return [];

  const queries = [cleaned];
  const iso = sourceLanguage.split("-")[0]?.toLowerCase() ?? "";

  if (iso === "es") {
    const tokens = cleaned.split(/\s+/);
    if (tokens.length > 1 && SPANISH_ARTICLES.has(tokens[0]!.toLowerCase())) {
      const withoutArticle = tokens.slice(1).join(" ").trim();
      if (withoutArticle && withoutArticle !== cleaned) {
        queries.push(withoutArticle);
      }
    }
  }

  return [...new Set(queries)];
}
