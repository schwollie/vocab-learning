import { State } from "fsrs.js";
import { StudyQueueItem } from "@/lib/study";

export const SESSION_WINDOW_SIZE = 20;
export const SESSION_NEW_SLOTS = 10;
export const SESSION_REVIEW_SLOTS = 10;

/** Card is due for FSRS scheduling (no future due date). */
export function isDueNow(item: StudyQueueItem, now: Date = new Date()): boolean {
  if (!item.nextReview) return true;
  return new Date(item.nextReview).getTime() <= now.getTime();
}

/** Intro double-pass applies only to never-reviewed cards that started this session as New. */
export function needsIntroDoublePass(item: StudyQueueItem): boolean {
  const startedAsNew = item.startedAsNew ?? item.fsrsState === State.New;
  return startedAsNew && item.correctCount < 2;
}

export function isSessionItemComplete(
  item: StudyQueueItem,
  now: Date = new Date()
): boolean {
  // FSRS due date wins — don't keep cycling cards scheduled for later
  if (!isDueNow(item, now)) return true;

  if (needsIntroDoublePass(item)) return false;

  return item.correctCount >= 1;
}

export function isNewSlotItem(item: StudyQueueItem): boolean {
  const startedAsNew = item.startedAsNew ?? item.fsrsState === State.New;
  return startedAsNew && !isSessionItemComplete(item);
}

export function buildActiveWindowIndices(
  queue: StudyQueueItem[],
  now: Date = new Date()
): number[] {
  const pending = queue
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => !isSessionItemComplete(item, now));

  const news = pending.filter(({ item }) => isNewSlotItem(item));
  const reviews = pending.filter(({ item }) => !isNewSlotItem(item));

  let selected = [
    ...news.slice(0, SESSION_NEW_SLOTS),
    ...reviews.slice(0, SESSION_REVIEW_SLOTS),
  ];

  if (selected.length < SESSION_WINDOW_SIZE) {
    const used = new Set(selected.map((s) => s.idx));
    const need = SESSION_WINDOW_SIZE - selected.length;
    const shortNew = selected.filter(({ item }) => isNewSlotItem(item)).length < SESSION_NEW_SLOTS;
    const pool = shortNew
      ? reviews.filter((r) => !used.has(r.idx))
      : news.filter((n) => !used.has(n.idx));
    selected = [...selected, ...pool.slice(0, need)];

    if (selected.length < SESSION_WINDOW_SIZE) {
      const used2 = new Set(selected.map((s) => s.idx));
      const rest = pending.filter((p) => !used2.has(p.idx));
      selected = [...selected, ...rest.slice(0, SESSION_WINDOW_SIZE - selected.length)];
    }
  }

  return selected.slice(0, SESSION_WINDOW_SIZE).map((s) => s.idx);
}

export function nextCorrectCount(
  item: StudyQueueItem,
  rating: number
): number {
  if (rating < 3) return 0;
  return item.correctCount + 1;
}

/** @deprecated Use isSessionItemComplete; kept for browse-mode skip. */
export function sessionPassTarget(item: StudyQueueItem): number {
  return needsIntroDoublePass(item) ? 2 : 1;
}
