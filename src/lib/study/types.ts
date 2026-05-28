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
  startedAsNew: boolean;
  nextReview: string | null;
  stability?: number;
  difficulty?: number;
  elapsedDays?: number;
  scheduledDays?: number;
  reps?: number;
  lastReview?: string | null;
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
