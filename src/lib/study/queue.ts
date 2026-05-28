import type { StudyDirection, PromptSide } from "./types";

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function directionToPromptSide(
  direction: StudyDirection,
  index: number
): PromptSide {
  if (direction === "term_to_definition") return "term";
  if (direction === "definition_to_term") return "definition";
  return index % 2 === 0 ? "term" : "definition";
}
