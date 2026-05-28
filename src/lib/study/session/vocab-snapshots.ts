import { prisma } from "@/lib/db";
import { getFolderDescendantIds } from "@/lib/folders";
import type { VocabSnapshot } from "../session-refresh";
import type { StartSessionInput } from "./types";

export const vocabSnapshotSelect = {
  id: true,
  setId: true,
  term: true,
  definition: true,
  state: true,
  stability: true,
  difficulty: true,
  elapsedDays: true,
  scheduledDays: true,
  reps: true,
  lastReview: true,
  nextReview: true,
  createdAt: true,
  set: {
    select: {
      sideALabel: true,
      sideBLabel: true,
      sideALanguage: true,
      sideBLanguage: true,
      learningSide: true,
      autoplayModeOverride: true,
    },
  },
} as const;

export async function fetchVocabSnapshots(
  userId: string,
  input: StartSessionInput
): Promise<VocabSnapshot[]> {
  return prisma.vocabItem.findMany({
    where: {
      set:
        input.scopeType === "SET"
          ? { id: input.scopeId, userId }
          : {
              userId,
              folderId: {
                in: await (async () => {
                  const ids = await getFolderDescendantIds(userId, input.scopeId);
                  return input.includeSubfolders ? ids : [input.scopeId];
                })(),
              },
            },
      ...(input.mode === "due"
        ? {
            OR: [{ nextReview: null }, { nextReview: { lte: new Date() } }],
          }
        : {}),
    },
    select: vocabSnapshotSelect,
    orderBy: { createdAt: "asc" },
  });
}

export async function fetchVocabSnapshotsByIds(
  userId: string,
  itemIds: string[]
): Promise<VocabSnapshot[]> {
  if (itemIds.length === 0) return [];

  return prisma.vocabItem.findMany({
    where: { id: { in: itemIds }, set: { userId } },
    select: vocabSnapshotSelect,
  });
}
