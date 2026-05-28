export type LexiconGrammarKind = "conjugation" | "declension" | "none";

export interface LexiconGrammarRow {
  label: string;
  form: string;
}

export interface LexiconGrammar {
  kind: LexiconGrammarKind;
  title: string;
  rows: LexiconGrammarRow[];
}

export interface LexiconExample {
  source: string;
  translation: string;
}

export interface LexiconResult {
  word: string;
  sourceLanguage: string;
  targetLanguage?: string;
  headWord?: string;
  partOfSpeech?: string;
  definition: string;
  definitionTranslation: string;
  grammar: LexiconGrammar;
  examples: LexiconExample[];
  provider: "gemini";
}

export interface LexiconQuery {
  word: string;
  sourceLanguage: string;
  targetLanguage?: string;
}
