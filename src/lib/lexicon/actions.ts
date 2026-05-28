"use server";

import { auth } from "@clerk/nextjs/server";
import { emptyLexiconResult, getLexiconData } from "./get-lexicon";
import type { LexiconResult } from "./types";

export async function fetchLexicon(
  word: string,
  sourceLanguage: string,
  targetLanguage?: string
): Promise<LexiconResult> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const cleanedWord = word.trim();
  if (!cleanedWord) {
    return emptyLexiconResult("", sourceLanguage, targetLanguage);
  }

  return getLexiconData({
    word: cleanedWord,
    sourceLanguage,
    targetLanguage,
  });
}
