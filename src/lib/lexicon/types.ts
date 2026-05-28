export interface LexiconSentence {
  id: string;
  text: string;
  language: string;
  translations: Array<{
    id: string;
    text: string;
    language: string;
  }>;
}

export interface LexiconDefinition {
  partOfSpeech?: string;
  text: string;
  tags?: string[];
}

export interface LexiconForm {
  form: string;
  tags: string[];
}

export interface LexiconResult {
  word: string;
  sourceLanguage: string;
  examples: LexiconSentence[];
  definitions: LexiconDefinition[];
  forms: LexiconForm[];
  providers: string[];
}

export interface LexiconQuery {
  word: string;
  sourceLanguage: string;
  targetLanguage?: string;
  maxExamples?: number;
}

export interface LexiconProvider {
  id: string;
  supports(language: string): boolean;
  fetch(query: LexiconQuery): Promise<Partial<LexiconResult>>;
}
