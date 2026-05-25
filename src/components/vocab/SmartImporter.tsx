"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { parseVocabPaste } from "@/lib/vocab-paste";
import type { PastedVocabItem } from "@/lib/vocab-paste";

export default function SmartImporter({
  onAddItems,
}: {
  onAddItems: (items: PastedVocabItem[]) => void | Promise<void>;
}) {
  const [inputText, setInputText] = useState("");
  const [parsedItems, setParsedItems] = useState<PastedVocabItem[]>([]);

  const handleParse = () => {
    setParsedItems(parseVocabPaste(inputText));
  };

  return (
    <div>
      <p className="text-gray-500 mb-3 text-sm">
        Paste exported text (e.g. Quizlet). Use <code className="text-xs">term: definition</code> per line.
      </p>

      <textarea
        className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={"40. ligero/-a: leicht\n39. después de: nach..."}
      />

      <button
        type="button"
        onClick={handleParse}
        className="mt-3 w-full bg-gray-900 text-white dark:bg-zinc-100 dark:text-black py-2 rounded-lg font-medium hover:opacity-80 transition"
      >
        Parse
      </button>

      {parsedItems.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Preview ({parsedItems.length})</h3>
          <ul className="space-y-2 max-h-48 overflow-y-auto mb-4">
            {parsedItems.map((item, idx) => (
              <li
                key={idx}
                className="p-2 text-sm bg-gray-50 dark:bg-zinc-800 rounded-md border border-gray-200 dark:border-zinc-700"
              >
                <span className="font-medium">{item.term}</span>
                {item.definition ? (
                  <span className="text-gray-500"> — {item.definition}</span>
                ) : (
                  <span className="text-red-400 italic"> (no definition)</span>
                )}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => {
              onAddItems(parsedItems);
              setParsedItems([]);
              setInputText("");
            }}
            className="flex items-center justify-center w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add {parsedItems.length} to set
          </button>
        </div>
      )}
    </div>
  );
}
