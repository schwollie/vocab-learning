import {
  normalizeAutoplayMode,
  resolveAutoplayMode,
} from "@/lib/autoplay";
import { StudyQueueItem } from "@/lib/study";

export type VocabSnapshot = {
  id: string;
  setId: string;
  term: string;
  definition: string;
  state: number;
  nextReview: Date | null;
  set: {
    sideALabel: string;
    sideBLabel: string;
    sideALanguage: string;
    sideBLanguage: string;
    learningSide: string;
    autoplayModeOverride: string;
  };
};

/** Merge live vocab/set fields into a saved session queue; keep in-session progress. */
export function refreshSessionQueue(
  queue: StudyQueueItem[],
  dbItems: VocabSnapshot[],
  defaultAutoplayModeRaw: string | null | undefined
): StudyQueueItem[] {
  const defaultAutoplayMode = normalizeAutoplayMode(defaultAutoplayModeRaw);
  const byId = new Map(dbItems.map((item) => [item.id, item]));

  return queue.flatMap((queueItem) => {
    const db = byId.get(queueItem.itemId);
    if (!db) return [];

    const learningSide = db.set.learningSide === "B" ? "B" : "A";
    const autoplayMode = resolveAutoplayMode(
      db.set.autoplayModeOverride,
      defaultAutoplayMode
    );

    return [
      {
        ...queueItem,
        setId: db.setId,
        sideAText: db.term,
        sideBText: db.definition,
        sideALabel: db.set.sideALabel,
        sideBLabel: db.set.sideBLabel,
        sideALanguage: db.set.sideALanguage,
        sideBLanguage: db.set.sideBLanguage,
        learningSide,
        autoplayMode,
        fsrsState: db.state,
        nextReview: db.nextReview?.toISOString() ?? null,
      },
    ];
  });
}
