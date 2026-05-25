export type StudyScopeType = "SET" | "FOLDER";
export type StudyMode = "due" | "ordered" | "random";
export type StudyDirection =
  | "term_to_definition"
  | "definition_to_term"
  | "mixed";
export type AutoplayMode = "off" | "A" | "B" | "both";
export type SetAutoplayOverride = "default" | AutoplayMode;

export type PromptSide = "term" | "definition";
export type CardSide = "A" | "B";

export interface StudyQueueItem {
  itemId: string;
  setId: string;
  sideAText: string;
  sideBText: string;
  sideALabel: string;
  sideBLabel: string;
  sideALanguage: string;
  sideBLanguage: string;
  learningSide: CardSide;
  autoplayMode: AutoplayMode;
  promptSide: CardSide;
  fsrsState: number;
  /** True when the card was State.New at session start (never reviewed before). */
  startedAsNew: boolean;
  /** ISO timestamp from FSRS after each review; null = due now. */
  nextReview: string | null;
  correctCount: number;
  firstAttemptCompleted: boolean;
}

export interface PersistedStudySession {
  id: string;
  scopeType: StudyScopeType;
  scopeId: string;
  includeSubfolders: boolean;
  mode: StudyMode;
  direction: StudyDirection;
  isLearning: boolean;
  cursor: number;
  queue: StudyQueueItem[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

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
