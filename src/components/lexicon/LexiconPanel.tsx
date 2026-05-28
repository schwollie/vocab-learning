"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { fetchLexicon, type LexiconResult } from "@/lib/lexicon";

type QueryKey = `${string}::${string}::${string}`;

function emptyResult(word: string, sourceLanguage: string, targetLanguage?: string): LexiconResult {
  return {
    word,
    sourceLanguage,
    targetLanguage,
    definition: "",
    definitionTranslation: "",
    grammar: { kind: "none", title: "Grammar", rows: [] },
    examples: [],
    provider: "gemini",
  };
}

function buildQueryKey(word: string, sourceLanguage: string, targetLanguage?: string): QueryKey {
  return `${word.toLowerCase()}::${sourceLanguage}::${targetLanguage ?? ""}`;
}

function grammarSectionTitle(kind: LexiconResult["grammar"]["kind"]): string {
  if (kind === "conjugation") return "Conjugation";
  if (kind === "declension") return "Declension";
  return "Grammar";
}

export default function LexiconPanel({
  open,
  word,
  sourceLanguage,
  targetLanguage,
  onClose,
}: {
  open: boolean;
  word: string;
  sourceLanguage: string;
  targetLanguage?: string;
  onClose: () => void;
}) {
  const cacheRef = useRef<Map<QueryKey, LexiconResult>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LexiconResult>(() => emptyResult(word, sourceLanguage, targetLanguage));

  const queryKey = useMemo(
    () => buildQueryKey(word, sourceLanguage, targetLanguage),
    [word, sourceLanguage, targetLanguage]
  );

  useEffect(() => {
    if (!open) return;
    const cleanedWord = word.trim();
    if (!cleanedWord) {
      setResult(emptyResult(cleanedWord, sourceLanguage, targetLanguage));
      setError(null);
      setLoading(false);
      return;
    }

    const cached = cacheRef.current.get(queryKey);
    if (cached) {
      setResult(cached);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchLexicon(cleanedWord, sourceLanguage, targetLanguage)
      .then((data) => {
        if (cancelled) return;
        cacheRef.current.set(queryKey, data);
        setResult(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load word info");
        setResult(emptyResult(cleanedWord, sourceLanguage, targetLanguage));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, queryKey, sourceLanguage, targetLanguage, word]);

  const showHeadWord =
    result.headWord &&
    result.headWord.trim().toLowerCase() !== result.word.trim().toLowerCase();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/25 transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed z-40 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl transition-transform duration-250 ease-out
          inset-x-0 bottom-0 max-h-[70vh] rounded-t-2xl
          sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full sm:max-w-md sm:max-h-none sm:rounded-none
          ${open ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"}`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-700">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Dictionary & usage</p>
            <p className="font-semibold text-lg">{word}</p>
            {showHeadWord ? (
              <p className="text-xs text-gray-500 mt-0.5">Focus word: {result.headWord}</p>
            ) : null}
            {result.partOfSpeech ? (
              <p className="text-xs text-gray-500 mt-0.5 capitalize">{result.partOfSpeech}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
            aria-label="Close dictionary panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="h-[calc(70vh-4.5rem)] sm:h-full sm:max-h-none overflow-y-auto px-4 py-4 space-y-5">
          {loading ? <p className="text-sm text-gray-500">Loading word info...</p> : null}

          {!loading && error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : null}

          {!loading && !error ? (
            <>
              <section className="space-y-2">
                <h3 className="font-medium">Meaning</h3>
                {result.definition ? (
                  <div className="rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2 space-y-2">
                    <p className="text-sm">{result.definition}</p>
                    {result.definitionTranslation ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {result.definitionTranslation}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No definition available.</p>
                )}
              </section>

              {result.grammar.kind !== "none" && result.grammar.rows.length > 0 ? (
                <section className="space-y-2">
                  <h3 className="font-medium">
                    {grammarSectionTitle(result.grammar.kind)}
                  </h3>
                  {result.grammar.title ? (
                    <p className="text-xs text-gray-500">{result.grammar.title}</p>
                  ) : null}
                  <div className="grid grid-cols-1 gap-2">
                    {result.grammar.rows.map((row, index) => (
                      <div
                        key={`${row.label}-${index}`}
                        className="rounded-md border border-gray-200 dark:border-zinc-700 px-3 py-2 flex items-start justify-between gap-3"
                      >
                        <span className="text-xs uppercase tracking-wide text-gray-500 shrink-0">
                          {row.label}
                        </span>
                        <span className="text-sm font-medium text-right">{row.form}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="space-y-2">
                <h3 className="font-medium">Examples</h3>
                {result.examples.length === 0 ? (
                  <p className="text-sm text-gray-500">No example sentences found.</p>
                ) : (
                  <div className="space-y-3">
                    {result.examples.map((example, index) => (
                      <article
                        key={`${example.source}-${index}`}
                        className="rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2"
                      >
                        <p className="text-sm">{example.source}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {example.translation}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
}
