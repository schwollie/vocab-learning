import { describe, expect, it } from "vitest";
import {
  isSupportedLanguageCode,
  LANGUAGE_OPTIONS,
  toIso639_3,
} from "@/lib/languages";

describe("LANGUAGE_OPTIONS", () => {
  it("includes Spanish Spain", () => {
    expect(LANGUAGE_OPTIONS.some((o) => o.code === "es-ES")).toBe(true);
  });
});

describe("toIso639_3", () => {
  it("maps BCP-47 Spanish to spa", () => {
    expect(toIso639_3("es-ES")).toBe("spa");
  });

  it("maps en-US and en-GB to eng", () => {
    expect(toIso639_3("en-US")).toBe("eng");
    expect(toIso639_3("en-GB")).toBe("eng");
  });
});

describe("isSupportedLanguageCode", () => {
  it("returns true for catalog codes", () => {
    expect(isSupportedLanguageCode("de-DE")).toBe(true);
  });

  it("returns false for unknown codes", () => {
    expect(isSupportedLanguageCode("xx-XX")).toBe(false);
  });
});
