export interface LanguageEntry {
  code: string;
  label: string;
  iso639_3: string;
}

/** Single source for UI language pickers and lexicon API language codes. */
export const LANGUAGE_CATALOG: LanguageEntry[] = [
  { code: "en-US", label: "English (US)", iso639_3: "eng" },
  { code: "en-GB", label: "English (UK)", iso639_3: "eng" },
  { code: "es-ES", label: "Spanish (Spain)", iso639_3: "spa" },
  { code: "es-MX", label: "Spanish (Mexico)", iso639_3: "spa" },
  { code: "de-DE", label: "German", iso639_3: "deu" },
  { code: "fr-FR", label: "French", iso639_3: "fra" },
  { code: "it-IT", label: "Italian", iso639_3: "ita" },
  { code: "pt-PT", label: "Portuguese (Portugal)", iso639_3: "por" },
  { code: "pt-BR", label: "Portuguese (Brazil)", iso639_3: "por" },
  { code: "nl-NL", label: "Dutch", iso639_3: "nld" },
  { code: "sv-SE", label: "Swedish", iso639_3: "swe" },
  { code: "da-DK", label: "Danish", iso639_3: "dan" },
  { code: "no-NO", label: "Norwegian", iso639_3: "nor" },
  { code: "fi-FI", label: "Finnish", iso639_3: "fin" },
  { code: "pl-PL", label: "Polish", iso639_3: "pol" },
  { code: "cs-CZ", label: "Czech", iso639_3: "ces" },
  { code: "sk-SK", label: "Slovak", iso639_3: "slk" },
  { code: "hu-HU", label: "Hungarian", iso639_3: "hun" },
  { code: "ro-RO", label: "Romanian", iso639_3: "ron" },
  { code: "el-GR", label: "Greek", iso639_3: "ell" },
  { code: "tr-TR", label: "Turkish", iso639_3: "tur" },
  { code: "ru-RU", label: "Russian", iso639_3: "rus" },
  { code: "uk-UA", label: "Ukrainian", iso639_3: "ukr" },
  { code: "ar-SA", label: "Arabic", iso639_3: "ara" },
  { code: "he-IL", label: "Hebrew", iso639_3: "heb" },
  { code: "hi-IN", label: "Hindi", iso639_3: "hin" },
  { code: "bn-BD", label: "Bengali", iso639_3: "ben" },
  { code: "ur-PK", label: "Urdu", iso639_3: "urd" },
  { code: "ja-JP", label: "Japanese", iso639_3: "jpn" },
  { code: "ko-KR", label: "Korean", iso639_3: "kor" },
  { code: "zh-CN", label: "Chinese (Simplified)", iso639_3: "zho" },
  { code: "zh-TW", label: "Chinese (Traditional)", iso639_3: "zho" },
  { code: "th-TH", label: "Thai", iso639_3: "tha" },
  { code: "vi-VN", label: "Vietnamese", iso639_3: "vie" },
  { code: "id-ID", label: "Indonesian", iso639_3: "ind" },
  { code: "ms-MY", label: "Malay", iso639_3: "msa" },
];

export interface LanguageOption {
  code: string;
  label: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = LANGUAGE_CATALOG.map(
  ({ code, label }) => ({ code, label })
);

const BCP47_TO_ISO639_3 = Object.fromEntries(
  LANGUAGE_CATALOG.map((entry) => [entry.code, entry.iso639_3])
) as Record<string, string>;

export function isSupportedLanguageCode(code: string): boolean {
  return code.trim() in BCP47_TO_ISO639_3;
}

/**
 * Converts app language tags (BCP-47, e.g. es-ES) into Tatoeba/Wiktionary
 * three-letter ISO-639 codes.
 */
export function toIso639_3(language: string): string | null {
  const normalized = language.trim();
  if (!normalized) return null;

  const direct = BCP47_TO_ISO639_3[normalized];
  if (direct) return direct;

  const base = normalized.split("-")[0]?.toLowerCase();
  if (!base) return null;

  const fromBase = Object.entries(BCP47_TO_ISO639_3).find(([key]) =>
    key.toLowerCase().startsWith(`${base}-`)
  )?.[1];
  return fromBase ?? null;
}
