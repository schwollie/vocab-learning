"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

type PastedItem = { term: string; definition: string };

export default function SmartImporter() {
  const [inputText, setInputText] = useState("");
  const [parsedItems, setParsedItems] = useState<PastedItem[]>([]);

  const handleParse = () => {
    // Regex splits by newline and matches optional numbering "1. ", "1)", etc.
    const lines = inputText.split("\n");
    const newItems: PastedItem[] = [];

    // Simple Regex: (numbering.) (Term) : (Definition)
    // Works securely with: "1. el día a día: Alltag"
    const regex = /^(?:\d+[\.\)]\s*)?(.+?):\s*(.+)$/;

    lines.forEach((line) => {
      const match = line.trim().match(regex);
      if (match) {
        newItems.push({
          term: match[match.length - 2].trim(),
          definition: match[match.length - 1].trim(),
        });
      }
    });

    setParsedItems(newItems);
  };

  return (
    <div className="p-4 border rounded-xl shadow-sm bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
      <h2 className="text-xl font-bold mb-4">Smart Paste Import</h2>
      <p className="text-gray-500 mb-4 text-sm">
        Paste your exported Quizlet text below. E.g., <code>1. la canción: Lied</code>
      </p>
      
      <textarea
        className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="1. el día a día: Alltag&#10;2. la canción: Lied"
      />
      
      <button
        onClick={handleParse}
        className="mt-3 w-full bg-black text-white dark:bg-white dark:text-black py-2 rounded-lg font-medium hover:opacity-80 transition"
      >
        Parse Vocabulary
      </button>

      {parsedItems.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-3">Preview ({parsedItems.length} items)</h3>
          <ul className="space-y-2">
            {parsedItems.map((item, idx) => (
              <li key={idx} className="flex flex-col sm:flex-row p-3 bg-gray-50 dark:bg-zinc-800 rounded-md border border-gray-200 dark:border-zinc-700">
                <span className="font-medium mr-2 sm:w-1/2">{item.term}</span>
                <span className="text-gray-600 dark:text-gray-400 sm:w-1/2">{item.definition}</span>
              </li>
            ))}
          </ul>
          
          <button className="mt-4 flex items-center justify-center w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
            <Plus className="w-5 h-5 mr-2" />
            Add to Set
          </button>
        </div>
      )}
    </div>
  );
}