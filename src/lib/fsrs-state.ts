import { State } from "fsrs.js";

const FSRS_STATE_LABELS: Record<number, string> = {
  [State.New]: "New",
  [State.Learning]: "Learning",
  [State.Review]: "Review",
  [State.Relearning]: "Relearning",
};

const FSRS_STATE_BADGE_CLASSES: Record<number, string> = {
  [State.New]:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  [State.Learning]:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  [State.Review]:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  [State.Relearning]:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

export function normalizeFsrsState(state: number | null | undefined): State {
  if (
    state === State.New ||
    state === State.Learning ||
    state === State.Review ||
    state === State.Relearning
  ) {
    return state;
  }
  return State.New;
}

export function getFsrsStateDisplay(state: number | null | undefined) {
  const normalized = normalizeFsrsState(state);
  return {
    label: FSRS_STATE_LABELS[normalized],
    badgeClassName: FSRS_STATE_BADGE_CLASSES[normalized],
  };
}
