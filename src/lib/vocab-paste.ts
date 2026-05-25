export type PastedVocabItem = { term: string; definition: string };

const IGNORE_PATTERNS = [
  /^\d+\s*\/\s*\d+$/,
  /^https?:\/\//,
  /Lerne online unter/,
];

const LINE_NUMBER_PREFIX = /^(?:\d+[\.\)]\s*)(.+)$/;

/** Parse pasted vocab lines (Quizlet-style). Splits on first colon only. */
export function parseVocabPaste(text: string): PastedVocabItem[] {
  const lines = text.split("\n");
  const items: PastedVocabItem[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (IGNORE_PATTERNS.some((pattern) => pattern.test(trimmed))) continue;

    const numbered = trimmed.match(LINE_NUMBER_PREFIX);
    const body = numbered ? numbered[1].trim() : trimmed;

    const colonIdx = body.indexOf(":");
    if (colonIdx !== -1) {
      const term = body.slice(0, colonIdx).trim();
      const definition = body.slice(colonIdx + 1).trim();
      if (term) items.push({ term, definition });
      continue;
    }

    if (body.split(" ").length <= 4) {
      items.push({ term: body, definition: "" });
    }
  }

  return items;
}
