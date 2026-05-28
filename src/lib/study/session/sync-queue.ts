import { prisma } from "@/lib/db";
import { refreshSessionQueue } from "../session-refresh";
import type { PersistedStudySession } from "../types";
import { parseSessionRow } from "./parse-row";
import type { SessionRow } from "./types";
import { fetchVocabSnapshotsByIds } from "./vocab-snapshots";
import { persistRefreshedQueue } from "./repository";

export async function syncSessionQueueWithDb(
  userId: string,
  row: SessionRow
): Promise<PersistedStudySession> {
  const parsed = parseSessionRow(row);
  const itemIds = parsed.queue.map((item) => item.itemId);
  const [dbItems, settings] = await Promise.all([
    fetchVocabSnapshotsByIds(userId, itemIds),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  const refreshedQueue = refreshSessionQueue(
    parsed.queue,
    dbItems,
    settings?.defaultAutoplayMode
  );

  const queueChanged =
    refreshedQueue.length !== parsed.queue.length ||
    refreshedQueue.some((item, index) => {
      const prev = parsed.queue[index];
      return (
        !prev ||
        prev.itemId !== item.itemId ||
        prev.sideAText !== item.sideAText ||
        prev.sideBText !== item.sideBText ||
        prev.fsrsState !== item.fsrsState ||
        prev.nextReview !== item.nextReview ||
        prev.stability !== item.stability ||
        prev.difficulty !== item.difficulty ||
        prev.elapsedDays !== item.elapsedDays ||
        prev.scheduledDays !== item.scheduledDays ||
        prev.reps !== item.reps ||
        prev.lastReview !== item.lastReview ||
        prev.sideALabel !== item.sideALabel ||
        prev.sideBLabel !== item.sideBLabel ||
        prev.sideALanguage !== item.sideALanguage ||
        prev.sideBLanguage !== item.sideBLanguage ||
        prev.learningSide !== item.learningSide ||
        prev.autoplayMode !== item.autoplayMode
      );
    });

  if (queueChanged) {
    await persistRefreshedQueue(userId, parsed.id, refreshedQueue);
  }

  return {
    ...parsed,
    queue: refreshedQueue,
  };
}
