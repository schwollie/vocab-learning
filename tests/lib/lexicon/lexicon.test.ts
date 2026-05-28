import { describe, expect, it } from "vitest";
import { toIso639_3 } from "@/lib/languages";
import { buildTatoebaSearchQueries } from "@/lib/lexicon/search-terms";
import {
  parseTranslations,
  parseV0Sentences,
  parseV1Sentences,
} from "@/lib/lexicon/providers/tatoeba-parse";

describe("toIso639_3", () => {
  it("maps BCP-47 Spanish to spa", () => {
    expect(toIso639_3("es-ES")).toBe("spa");
  });
});

describe("buildTatoebaSearchQueries", () => {
  it("strips leading Spanish articles", () => {
    expect(buildTatoebaSearchQueries("la empanada", "es-ES")).toEqual([
      "la empanada",
      "empanada",
    ]);
  });

  it("returns the original phrase for single words", () => {
    expect(buildTatoebaSearchQueries("empanada", "es-ES")).toEqual(["empanada"]);
  });
});

describe("parseV1Sentences", () => {
  it("parses v1 sentence payloads", () => {
    const parsed = parseV1Sentences(
      {
        data: [
          {
            id: 7258222,
            text: "Una empanada de camarones, por favor.",
            lang: "spa",
            translations: [
              {
                id: 10112129,
                text: "One shrimp empanada, please.",
                lang: "eng",
              },
            ],
          },
        ],
      },
      "spa"
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.text).toContain("empanada");
    expect(parsed[0]?.translations[0]?.text).toContain("shrimp empanada");
  });
});

describe("parseV0Sentences", () => {
  it("parses nested v0 translation groups", () => {
    const parsed = parseV0Sentences(
      {
        results: [
          {
            id: 7258222,
            text: "Una empanada de camarones, por favor.",
            lang: "spa",
            translations: [
              [
                {
                  id: 10112129,
                  text: "One shrimp empanada, please.",
                  lang: "eng",
                },
              ],
              [],
            ],
          },
        ],
      },
      "spa"
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.translations).toHaveLength(1);
    expect(parsed[0]?.translations[0]?.text).toBe("One shrimp empanada, please.");
  });
});

describe("parseTranslations", () => {
  it("flattens nested translation arrays", () => {
    const parsed = parseTranslations([
      [{ id: 1, text: "Hello", lang: "eng" }],
      [{ id: 2, text: "Hi", lang: "eng" }],
    ]);

    expect(parsed).toHaveLength(2);
  });
});
