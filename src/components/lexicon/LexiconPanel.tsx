"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { fetchLexicon, type LexiconResult } from "@/lib/lexicon";

type QueryKey = `${string}::${string}::${string}`;

function emptyResult(word: string, sourceLanguage: string): LexiconResult {
  return {
    word,
    sourceLanguage,
    examples: [],
    definitions: [],
    forms: [],
    providers: [],
  };
}

function buildQueryKey(word: string, sourceLanguage: string, targetLanguage?: string): QueryKey {
  return `${word.toLowerCase()}::${sourceLanguage}::${targetLanguage ?? ""}`;
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
  const [result, setResult] = useState<LexiconResult>(() => emptyResult(word, sourceLanguage));

  const queryKey = useMemo(
    () => buildQueryKey(word, sourceLanguage, targetLanguage),
    [word, sourceLanguage, targetLanguage]
  );

  useEffect(() => {
    if (!open) return;
    const cleanedWord = word.trim();
    if (!cleanedWord) {
      setResult(emptyResult(cleanedWord, sourceLanguage));
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
        setError(err instanceof Error ? err.message : "Failed to load usage info");
        setResult(emptyResult(cleanedWord, sourceLanguage));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, queryKey, sourceLanguage, targetLanguage, word]);

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
          {loading ? (
            <p className="text-sm text-gray-500">Loading examples...</p>
          ) : null}

          {!loading && error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : null}

          {!loading && !error ? (
            <>
              <section className="space-y-2">
                <h3 className="font-medium">Usage</h3>
                {result.examples.length === 0 ? (
                  <p className="text-sm text-gray-500">No example sentences found.</p>
                ) : (
                  <div className="space-y-3">
                    {result.examples.map((example) => (
                      <article
                        key={example.id}
                        className="rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2"
                      >
                        <p className="text-sm">{example.text}</p>
                        {example.translations.length > 0 ? (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {example.translations[0]?.text}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {result.definitions.length > 0 ? (
                <section className="space-y-2">
                  <h3 className="font-medium">Definitions</h3>
                  <ul className="space-y-2">
                    {result.definitions.map((definition, index) => (
                      <li
                        key={`${definition.text}-${index}`}
                        className="rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2"
                      >
                        <p className="text-sm">{definition.text}</p>
                        {definition.partOfSpeech ? (
                          <p className="text-xs text-gray-500 mt-1">{definition.partOfSpeech}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {result.forms.length > 0 ? (
                <section className="space-y-2">
                  <h3 className="font-medium">Forms</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {result.forms.map((form, index) => (
                      <div
                        key={`${form.form}-${index}`}
                        className="rounded-md border border-gray-200 dark:border-zinc-700 px-2 py-1.5"
                      >
                        <p className="text-sm font-medium">{form.form}</p>
                        {form.tags.length > 0 ? (
                          <p className="text-[11px] text-gray-500 mt-0.5">{form.tags.join(", ")}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
}
