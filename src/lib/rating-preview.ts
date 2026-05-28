import { Rating, State } from "fsrs.js";
import {
  NEW_CARD_EASY_DAYS,
  NEW_CARD_GOOD_DAYS,
} from "@/lib/fsrs";
import { fsrsScheduler } from "@/lib/fsrs-scheduler";
import { StudyQueueItem } from "@/lib/study";

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export const RATING_HINTS: Record<number, string> = {
  1: "Didn't know it or only guessed",
  2: "Correct, but slow or unsure",
  3: "Knew it with normal effort",
  4: "Instant, obvious recall",
};

/** Compact button label: +5min, +3h, +10d, +4w */
export function formatCompactInterval(intervalMs: number): string {
  if (intervalMs <= 0) return "+now";

  if (intervalMs >= 30 * MS_PER_DAY) {
    const weeks = Math.round(intervalMs / (7 * MS_PER_DAY));
    return `+${weeks}w`;
  }

  if (intervalMs >= MS_PER_DAY) {
    const days = Math.round(intervalMs / MS_PER_DAY);
    return `+${days}d`;
  }

  if (intervalMs >= MS_PER_HOUR) {
    const hours = Math.round(intervalMs / MS_PER_HOUR);
    return `+${hours}h`;
  }

  const minutes = Math.max(1, Math.round(intervalMs / MS_PER_MINUTE));
  return `+${minutes}min`;
}

function queueItemToPreviewCard(item: StudyQueueItem) {
  return {
    due: item.nextReview ? new Date(item.nextReview) : new Date(),
    stability: item.stability ?? 2,
    difficulty: item.difficulty ?? 5,
    elapsed_days: item.elapsedDays ?? 0,
    scheduled_days: item.scheduledDays ?? 0,
    reps: item.reps ?? 0,
    lapses: 0,
    state: item.fsrsState ?? 0,
    last_review: item.lastReview ? new Date(item.lastReview) : new Date(),
  };
}

export function previewRatingIntervals(
  item: StudyQueueItem,
  now: Date = new Date()
): Record<number, string> {
  const card = queueItemToPreviewCard(item);
  const results = fsrsScheduler.repeat(card, now);

  const againMs = results[Rating.Again].card.due.getTime() - now.getTime();
  const hardMs = results[Rating.Hard].card.due.getTime() - now.getTime();

  if ((item.fsrsState ?? State.New) === State.New) {
    return {
      [Rating.Again]: formatCompactInterval(againMs),
      [Rating.Hard]: formatCompactInterval(hardMs),
      [Rating.Good]: formatCompactInterval(NEW_CARD_GOOD_DAYS * MS_PER_DAY),
      [Rating.Easy]: formatCompactInterval(NEW_CARD_EASY_DAYS * MS_PER_DAY),
    };
  }

  return {
    [Rating.Again]: formatCompactInterval(againMs),
    [Rating.Hard]: formatCompactInterval(hardMs),
    [Rating.Good]: formatCompactInterval(
      results[Rating.Good].card.due.getTime() - now.getTime()
    ),
    [Rating.Easy]: formatCompactInterval(
      results[Rating.Easy].card.due.getTime() - now.getTime()
    ),
  };
}
