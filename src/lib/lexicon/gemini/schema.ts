import type { LexiconGrammarKind } from "@/lib/lexicon/types";

export interface GeminiLexiconPayload {
  headWord: string;
  partOfSpeech: string;
  definition: string;
  definitionTranslation: string;
  grammar: {
    kind: LexiconGrammarKind;
    title: string;
    rows: Array<{ label: string; form: string }>;
  };
  examples: Array<{ source: string; translation: string }>;
}

/** JSON schema passed to Gemini responseSchema for deterministic output. */
export const GEMINI_LEXICON_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    headWord: {
      type: "string",
      description: "Focus word for grammar; same as term when term is a single word.",
    },
    partOfSpeech: {
      type: "string",
      description: "Part of speech of headWord, e.g. noun, verb, adjective.",
    },
    definition: {
      type: "string",
      description: "Short definition in the source language (1-2 sentences).",
    },
    definitionTranslation: {
      type: "string",
      description: "Short definition translated into the target language.",
    },
    grammar: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["conjugation", "declension", "none"],
        },
        title: {
          type: "string",
          description: "Section title, e.g. Present tense or Singular/plural.",
        },
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              form: { type: "string" },
            },
            required: ["label", "form"],
          },
        },
      },
      required: ["kind", "title", "rows"],
    },
    examples: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          source: {
            type: "string",
            description: "Example sentence in the source language.",
          },
          translation: {
            type: "string",
            description: "Example sentence translated into the target language.",
          },
        },
        required: ["source", "translation"],
      },
    },
  },
  required: [
    "headWord",
    "partOfSpeech",
    "definition",
    "definitionTranslation",
    "grammar",
    "examples",
  ],
} as const;
