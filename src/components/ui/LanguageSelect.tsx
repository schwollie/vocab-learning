"use client";

import { useMemo, useState } from "react";
import { LANGUAGE_OPTIONS } from "@/lib/languages";

export default function LanguageSelect({
  id,
  value,
  onChange,
  placeholder = "Search languages…",
}: {
  id: string;
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGE_OPTIONS;
    return LANGUAGE_OPTIONS.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.code.toLowerCase().includes(q)
    );
  }, [query]);

  const options = useMemo(() => {
    let list: typeof LANGUAGE_OPTIONS;
    if (filtered.length > 0) list = filtered;
    else {
      const current = LANGUAGE_OPTIONS.find((o) => o.code === value);
      list = current ? [current] : LANGUAGE_OPTIONS;
    }
    if (value && !list.some((o) => o.code === value)) {
      return [{ code: value, label: value }, ...list];
    }
    return list;
  }, [filtered, value]);

  return (
    <div className="space-y-1.5">
      <label htmlFor={`${id}-search`} className="sr-only">
        Filter languages
      </label>
      <input
        id={`${id}-search`}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2 text-sm border rounded-lg dark:bg-zinc-900 dark:border-zinc-600"
        autoComplete="off"
      />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-600 bg-white dark:bg-zinc-900"
      >
        {options.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label} ({lang.code})
          </option>
        ))}
      </select>
      {filtered.length === 0 && query.trim() !== "" && (
        <p className="text-xs text-amber-600">
          No matches — clear search or pick from current value below.
        </p>
      )}
    </div>
  );
}
