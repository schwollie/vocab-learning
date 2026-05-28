import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { StudyScopeType } from "../types";

export async function verifyScopeOwnership(
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
