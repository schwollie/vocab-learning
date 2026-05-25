"use server";

import { Prisma } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/auth";
import { getFolderDescendantIds } from "@/lib/folders";
import {
  normalizeAutoplayMode,
  resolveAutoplayMode,
} from "@/lib/autoplay";
import {
  directionToPromptSide,
  PersistedStudySession,
  shuffle,
  StudyDirection,
  StudyMode,
  StudyQueueItem,
  StudyScopeType,
} from "@/lib/study";
import { State } from "fsrs.js";
import { processReview } from "@/lib/fsrs";
import { Rating } from "fsrs.js";

const VALID_RATINGS = new Set<number>([
  Rating.Again,
  Rating.Hard,
  Rating.Good,
  Rating.Easy,
]);

interface StartSessionInput {
  scopeType: StudyScopeType;
  scopeId: string;
  includeSubfolders: boolean;
  mode: StudyMode;
  direction: StudyDirection;
  isLearning: boolean;
}

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await ensureUser(userId);
  return userId;
}

function parseSessionRow(row: {
  id: string;
  scopeType: string;
  scopeId: string;
  includeSubfolders: boolean;
  mode: string;
  direction: string;
  isLearning: boolean;
  queueJson: Prisma.JsonValue;
  cursor: number;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): PersistedStudySession {
  const queue = Array.isArray(row.queueJson)
    ? (row.queueJson as unknown as StudyQueueItem[])
    : [];

  return {
    id: row.id,
    scopeType: row.scopeType as StudyScopeType,
    scopeId: row.scopeId,
    includeSubfolders: row.includeSubfolders,
    mode: row.mode as StudyMode,
    direction: row.direction as StudyDirection,
    isLearning: row.isLearning,
    queue,
    cursor: row.cursor,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function verifyScopeOwnership(
  userId: string,
  scopeType: StudyScopeType,
  scopeId: string
) {
  if (scopeType === "SET") {
    const set = await prisma.vocabSet.findFirst({ where: { id: scopeId, userId } });
    if (!set) throw new Error("Set not found");
    return;
  }

  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT "id" FROM "Folder"
    WHERE "id" = ${scopeId} AND "userId" = ${userId}
    LIMIT 1
  `);
  if (!rows.length) throw new Error("Folder not found");
}

async function loadCardsForSession(
  userId: string,
  input: StartSessionInput
): Promise<StudyQueueItem[]> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const defaultAutoplayMode = normalizeAutoplayMode(settings?.defaultAutoplayMode);

  let items = await prisma.vocabItem.findMany({
    where: {
      set: input.scopeType === "SET"
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
    select: {
      id: true,
      setId: true,
      term: true,
      definition: true,
      state: true,
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
    },
    orderBy: { createdAt: "asc" },
  });

  const newItems = items.filter((i) => i.state === State.New || i.state === State.Learning);
  const reviewItems = items.filter((i) => i.state === State.Review || i.state === State.Relearning);
  reviewItems.sort(
    (a, b) => (a.nextReview?.getTime() ?? 0) - (b.nextReview?.getTime() ?? 0)
  );

  if (input.mode === "random") {
    items = [...shuffle(newItems), ...shuffle(reviewItems)];
  } else {
    items = [...newItems, ...reviewItems];
  }

  return items.map((item, index) => {
    const learningSide = item.set.learningSide === "B" ? "B" : "A";
    const promptSide = directionToPromptSide(input.direction, index);
    const resolvedMode = resolveAutoplayMode(
      item.set.autoplayModeOverride,
      defaultAutoplayMode
    );

    return {
      itemId: item.id,
      setId: item.setId,
      sideAText: item.term,
      sideBText: item.definition,
      sideALabel: item.set.sideALabel,
      sideBLabel: item.set.sideBLabel,
      sideALanguage: item.set.sideALanguage,
      sideBLanguage: item.set.sideBLanguage,
      learningSide,
      autoplayMode: resolvedMode,
      promptSide: promptSide === "term" ? "A" : "B",
      fsrsState: item.state,
      startedAsNew: item.state === State.New,
      nextReview: item.nextReview?.toISOString() ?? null,
      correctCount: 0,
      firstAttemptCompleted: false,
    };
  });
}

export async function getLatestOpenStudySession(
  scopeType: StudyScopeType,
  scopeId: string
): Promise<PersistedStudySession | null> {
  const userId = await requireUser();
  await verifyScopeOwnership(userId, scopeType, scopeId);

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      scopeType: string;
      scopeId: string;
      includeSubfolders: boolean;
      mode: string;
      direction: string;
      isLearning: boolean;
      queueJson: Prisma.JsonValue;
      cursor: number;
      completedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }>
  >(Prisma.sql`
    SELECT
      "id",
      "scopeType",
      "scopeId",
      "includeSubfolders",
      "mode",
      "direction",
      "isLearning",
      "queueJson",
      "cursor",
      "completedAt",
      "createdAt",
      "updatedAt"
    FROM "StudySession"
    WHERE "userId" = ${userId}
      AND "scopeType" = ${scopeType}
      AND "scopeId" = ${scopeId}
      AND "completedAt" IS NULL
    ORDER BY "updatedAt" DESC
    LIMIT 1
  `);

  if (!rows.length) return null;
  return parseSessionRow(rows[0]);
}

export async function startStudySession(
  input: StartSessionInput
): Promise<PersistedStudySession> {
  const userId = await requireUser();
  await verifyScopeOwnership(userId, input.scopeType, input.scopeId);

  const queue = await loadCardsForSession(userId, input);
  const id = createId();

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "StudySession" (
      "id", "userId", "scopeType", "scopeId",
      "includeSubfolders", "mode", "direction", "isLearning",
      "queueJson", "cursor", "createdAt", "updatedAt"
    )
    VALUES (
      ${id}, ${userId}, ${input.scopeType}, ${input.scopeId},
      ${input.includeSubfolders}, ${input.mode}, ${input.direction}, ${input.isLearning},
      ${JSON.stringify(queue)}::jsonb, 0, NOW(), NOW()
    )
  `);

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      scopeType: string;
      scopeId: string;
      includeSubfolders: boolean;
      mode: string;
      direction: string;
      isLearning: boolean;
      queueJson: Prisma.JsonValue;
      cursor: number;
      completedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }>
  >(Prisma.sql`
    SELECT
      "id",
      "scopeType",
      "scopeId",
      "includeSubfolders",
      "mode",
      "direction",
      "isLearning",
      "queueJson",
      "cursor",
      "completedAt",
      "createdAt",
      "updatedAt"
    FROM "StudySession"
    WHERE "id" = ${id}
    LIMIT 1
  `);

  if (!rows.length) throw new Error("Failed to create study session");
  return parseSessionRow(rows[0]);
}

export async function updateSessionQueueState(
  sessionId: string,
  queueJson: StudyQueueItem[],
  completed = false
) {
  const userId = await requireUser();
  await prisma.$executeRaw(Prisma.sql`
    UPDATE "StudySession"
    SET
      "queueJson" = ${JSON.stringify(queueJson)}::jsonb,
      "updatedAt" = NOW(),
      "completedAt" = CASE
        WHEN ${completed} THEN NOW()
        ELSE "completedAt"
      END
    WHERE "id" = ${sessionId} AND "userId" = ${userId}
  `);
}

export async function submitSessionReview(
  sessionId: string,
  itemId: string,
  rating: number
): Promise<{ state: number; nextReview: string } | null> {
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
  return { state, nextReview };
}
