import type { AutoplayMode, SetAutoplayOverride } from "./types";

const VALID_AUTOPLAY_MODES = new Set<AutoplayMode>(["off", "A", "B", "both"]);

export function normalizeAutoplayMode(
  value: string | null | undefined,
  fallback: AutoplayMode = "both"
): AutoplayMode {
  if (value === "learning_only") return fallback;
  return VALID_AUTOPLAY_MODES.has(value as AutoplayMode)
    ? (value as AutoplayMode)
    : fallback;
}

export function resolveAutoplayMode(
  override: string | null | undefined,
  defaultMode: AutoplayMode
): AutoplayMode {
  if (!override || override === "default" || override === "learning_only") {
    return defaultMode;
  }
  return normalizeAutoplayMode(override, defaultMode);
}

export function shouldAutoplaySide(mode: AutoplayMode, side: "A" | "B"): boolean {
  if (mode === "off") return false;
  if (mode === "both") return true;
  return side === mode;
}

/** @deprecated use shouldAutoplaySide */
export function shouldAutoplayPromptSide(
  mode: AutoplayMode,
  promptSide: "A" | "B"
): boolean {
  return shouldAutoplaySide(mode, promptSide);
}

export function isValidSetAutoplayOverride(
  value: string
): value is SetAutoplayOverride {
  return (
    value === "default" ||
    value === "off" ||
    value === "A" ||
    value === "B" ||
    value === "both"
  );
}
