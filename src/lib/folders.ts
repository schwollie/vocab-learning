import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface FolderNodeRow {
  id: string;
  name: string;
  userId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function listUserFolders(userId: string): Promise<FolderNodeRow[]> {
  const rows = await prisma.$queryRaw<FolderNodeRow[]>(Prisma.sql`
    SELECT
      "id",
      "name",
      "userId",
      "parentId",
      "createdAt",
      "updatedAt"
    FROM "Folder"
    WHERE "userId" = ${userId}
    ORDER BY "name" ASC
  `);
  return rows;
}

export async function getFolderDescendantIds(
  userId: string,
  folderId: string
): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    WITH RECURSIVE folder_tree AS (
      SELECT "id", "parentId"
      FROM "Folder"
      WHERE "id" = ${folderId} AND "userId" = ${userId}
      UNION ALL
      SELECT f."id", f."parentId"
      FROM "Folder" f
      INNER JOIN folder_tree ft ON f."parentId" = ft."id"
      WHERE f."userId" = ${userId}
    )
    SELECT "id" FROM folder_tree
  `);

  return rows.map((row) => row.id);
}
