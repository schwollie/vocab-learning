"use server";

import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth";
import { getFolderDescendantIds } from "@/lib/folders";
import {
  buildReviewScheduleSnapshot,
  ReviewScheduleSnapshot,
} from "@/lib/study";
import { StudyScopeType } from "@/lib/study";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await ensureUser(userId);
  return userId;
}

async function verifyScopeOwnership(
  userId: string,
  scopeType: StudyScopeType,
  scopeId: string
) {
  if (scopeType === "SET") {
    const set = await prisma.vocabSet.findFirst({
      where: { id: scopeId, userId },
    });
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

async function loadDueDatesForScope(
  userId: string,
  scopeType: StudyScopeType,
  scopeId: string,
  includeSubfolders: boolean
): Promise<Array<Date | null>> {
  if (scopeType === "SET") {
    const items = await prisma.vocabItem.findMany({
      where: { set: { id: scopeId, userId } },
      select: { nextReview: true },
    });
    return items.map((i) => i.nextReview);
  }

  const folderIds = includeSubfolders
    ? await getFolderDescendantIds(userId, scopeId)
    : [scopeId];

  const items = await prisma.vocabItem.findMany({
    where: {
      set: { userId, folderId: { in: folderIds } },
    },
    select: { nextReview: true },
  });
  return items.map((i) => i.nextReview);
}

export async function getReviewScheduleSnapshot(input: {
  scopeType: StudyScopeType;
  scopeId: string;
  includeSubfolders?: boolean;
}): Promise<ReviewScheduleSnapshot> {
  const userId = await requireUser();
  await verifyScopeOwnership(userId, input.scopeType, input.scopeId);

  const dueDates = await loadDueDatesForScope(
    userId,
    input.scopeType,
    input.scopeId,
    input.includeSubfolders ?? false
  );

  return buildReviewScheduleSnapshot(dueDates);
}
