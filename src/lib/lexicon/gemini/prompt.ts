import { LANGUAGE_CATALOG } from "@/lib/languages/catalog";

function languageLabel(code: string): string {
  const entry = LANGUAGE_CATALOG.find((item) => item.code === code);
  if (entry) return entry.label;
  const base = code.split("-")[0];
  const fallback = LANGUAGE_CATALOG.find((item) => item.code.startsWith(`${base}-`));
  return fallback?.label ?? code;
}

export function buildLexiconPrompt(
  word: string,
  sourceLanguage: string,
  targetLanguage?: string
): string {
  const sourceLabel = languageLabel(sourceLanguage);
  const targetLabel = targetLanguage ? languageLabel(targetLanguage) : "English";

  return [
    "You are a language tutor helping a vocabulary flashcard learner.",
    "",
    `Term: "${word}"`,
    `Source language: ${sourceLabel} (${sourceLanguage})`,
    `Target language: ${targetLabel}${targetLanguage ? ` (${targetLanguage})` : ""}`,
    "",
    "Instructions:",
    "- Write definition in the source language only.",
    "- Write definitionTranslation in the target language only.",
    "- If the term is a phrase or contains articles/slash variants (e.g. el/la, mucho/a), identify the grammatically relevant headWord and apply conjugation/declension to that word only.",
    "- For single words, set headWord equal to the term (without articles if the term includes them).",
    "- grammar.kind: use conjugation for verbs, declension for nouns/adjectives/pronouns when useful, otherwise none with empty rows.",
    "- Provide exactly 2 or 3 natural example sentences in the source language with translations in the target language.",
    "- Keep all answers concise and accurate for learners.",
    "- Return JSON only matching the provided schema.",
  ].join("\n");
}
