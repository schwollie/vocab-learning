import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { StudyQueueItem, StudyScopeType } from "../types";
import { parseSessionRow } from "./parse-row";
import type { SessionRow } from "./types";

export const sessionSelectSql = Prisma.sql`
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
`;

export async function findLatestOpenSessionRow(
  userId: string,
  scopeType: StudyScopeType,
  scopeId: string
): Promise<SessionRow | null> {
  const rows = await prisma.$queryRaw<SessionRow[]>(Prisma.sql`
    ${sessionSelectSql}
    WHERE "userId" = ${userId}
      AND "scopeType" = ${scopeType}
      AND "scopeId" = ${scopeId}
      AND "completedAt" IS NULL
    ORDER BY "updatedAt" DESC
    LIMIT 1
  `);
  return rows[0] ?? null;
}

export async function findSessionRowById(id: string): Promise<SessionRow | null> {
  const rows = await prisma.$queryRaw<SessionRow[]>(Prisma.sql`
    ${sessionSelectSql}
    WHERE "id" = ${id}
    LIMIT 1
  `);
  return rows[0] ?? null;
}

export async function insertStudySession(
  id: string,
  userId: string,
  input: {
    scopeType: StudyScopeType;
    scopeId: string;
    includeSubfolders: boolean;
    mode: string;
    direction: string;
    isLearning: boolean;
  },
  queue: StudyQueueItem[]
) {
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
}

export async function updateSessionQueueInDb(
  userId: string,
  sessionId: string,
  queueJson: StudyQueueItem[],
  completed = false
) {
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

export async function persistRefreshedQueue(
  userId: string,
  sessionId: string,
  queue: StudyQueueItem[]
) {
  await prisma.$executeRaw(Prisma.sql`
    UPDATE "StudySession"
    SET
      "queueJson" = ${JSON.stringify(queue)}::jsonb,
      "updatedAt" = NOW()
    WHERE "id" = ${sessionId} AND "userId" = ${userId}
  `);
}

export { parseSessionRow };
