"use server";

import { createId } from "@paralleldrive/cuid2";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { Rating } from "fsrs.js";
import { ensureUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { processReview } from "@/lib/fsrs";
import { loadCardsForSession } from "@/lib/study/session/build-queue";
import {
  findLatestOpenSessionRow,
  findSessionRowById,
  insertStudySession,
  parseSessionRow,
  updateSessionQueueInDb,
} from "@/lib/study/session/repository";
import { verifyScopeOwnership } from "@/lib/study/session/scope";
import { syncSessionQueueWithDb } from "@/lib/study/session/sync-queue";
import type { StartSessionInput } from "@/lib/study/session/types";
import type {
  PersistedStudySession,
  StudyQueueItem,
  StudyScopeType,
} from "@/lib/study";

const VALID_RATINGS = new Set<number>([
  Rating.Again,
  Rating.Hard,
  Rating.Good,
  Rating.Easy,
]);

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await ensureUser(userId);
  return userId;
}

export async function getLatestOpenStudySession(
  scopeType: StudyScopeType,
  scopeId: string
): Promise<PersistedStudySession | null> {
  const userId = await requireUser();
  await verifyScopeOwnership(userId, scopeType, scopeId);

  const row = await findLatestOpenSessionRow(userId, scopeType, scopeId);
  if (!row) return null;
  return syncSessionQueueWithDb(userId, row);
}

export async function resumeStudySession(
  scopeType: StudyScopeType,
  scopeId: string
): Promise<PersistedStudySession | null> {
  return getLatestOpenStudySession(scopeType, scopeId);
}

export async function startStudySession(
  input: StartSessionInput
): Promise<PersistedStudySession> {
  const userId = await requireUser();
  await verifyScopeOwnership(userId, input.scopeType, input.scopeId);

  const queue = await loadCardsForSession(userId, input);
  const id = createId();

  await insertStudySession(id, userId, input, queue);

  const row = await findSessionRowById(id);
  if (!row) throw new Error("Failed to create study session");
  return parseSessionRow(row);
}

export async function updateSessionQueueState(
  sessionId: string,
  queueJson: StudyQueueItem[],
  completed = false
) {
  const userId = await requireUser();
  await updateSessionQueueInDb(userId, sessionId, queueJson, completed);
}

export async function submitSessionReview(
  sessionId: string,
  itemId: string,
  rating: number
): Promise<{
  state: number;
  nextReview: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lastReview: string;
} | null> {
  const userId = await requireUser();
  if (!VALID_RATINGS.has(rating)) throw new Error("Invalid rating");

  const sessionRows = await prisma.$queryRaw<
    Array<{ id: string; isLearning: boolean }>
  >(Prisma.sql`
    SELECT "id", "isLearning"
    FROM "StudySession"
    WHERE "id" = ${sessionId} AND "userId" = ${userId}
    LIMIT 1
  `);
  const session = sessionRows[0];
  if (!session) throw new Error("Session not found");
  if (!session.isLearning) return null;

  const item = await prisma.vocabItem.findFirst({
    where: { id: itemId, set: { userId } },
  });
  if (!item) throw new Error("Item not found");

  const { updatedItem, newLog } = processReview(item, rating as Rating);

  await prisma.$transaction([
    prisma.vocabItem.update({
      where: { id: itemId },
      data: updatedItem,
    }),
    prisma.reviewLog.create({
      data: newLog,
    }),
  ]);

  revalidatePath(`/sets/${item.setId}`);
  const state = typeof updatedItem.state === "number" ? updatedItem.state : item.state;
  const nextReview =
    updatedItem.nextReview instanceof Date
      ? updatedItem.nextReview.toISOString()
      : item.nextReview?.toISOString() ?? new Date().toISOString();
  const lastReview =
    updatedItem.lastReview instanceof Date
      ? updatedItem.lastReview.toISOString()
      : nextReview;
  return {
    state,
    nextReview,
    stability:
      typeof updatedItem.stability === "number" ? updatedItem.stability : item.stability,
    difficulty:
      typeof updatedItem.difficulty === "number" ? updatedItem.difficulty : item.difficulty,
    elapsedDays:
      typeof updatedItem.elapsedDays === "number" ? updatedItem.elapsedDays : item.elapsedDays,
    scheduledDays:
      typeof updatedItem.scheduledDays === "number"
        ? updatedItem.scheduledDays
        : item.scheduledDays,
    reps: typeof updatedItem.reps === "number" ? updatedItem.reps : item.reps + 1,
    lastReview,
  };
}
