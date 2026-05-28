"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth";
import { getFolderDescendantIds } from "@/lib/folders";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await ensureUser(userId);
  return userId;
}

export async function createSet(title: string, folderId: string | null) {
  const userId = await requireUser();
  const cleanTitle = title.trim();
  if (!cleanTitle) throw new Error("Set title is required");

  if (folderId) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
    if (!folder) throw new Error("Folder not found");
  }

  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  await prisma.vocabSet.create({
    data: {
      title: cleanTitle,
      userId,
      folderId: folderId ?? null,
      sideALanguage: settings?.defaultSideALanguage ?? "es-ES",
      sideBLanguage: settings?.defaultSideBLanguage ?? "en-US",
    },
  });

  revalidatePath("/dashboard");
}

export async function renameSet(setId: string, title: string) {
  const userId = await requireUser();
  const cleanTitle = title.trim();
  if (!cleanTitle) throw new Error("Set title is required");

  const set = await prisma.vocabSet.findFirst({ where: { id: setId, userId } });
  if (!set) throw new Error("Set not found");

  await prisma.vocabSet.update({ where: { id: setId }, data: { title: cleanTitle } });
  revalidatePath("/dashboard");
  revalidatePath(`/sets/${setId}`);
}

export async function moveSet(setId: string, folderId: string | null) {
  const userId = await requireUser();
  const set = await prisma.vocabSet.findFirst({ where: { id: setId, userId } });
  if (!set) throw new Error("Set not found");

  if (folderId) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
    if (!folder) throw new Error("Folder not found");
  }

  await prisma.vocabSet.update({
    where: { id: setId },
    data: { folderId: folderId ?? null },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/sets/${setId}`);
}

export async function deleteSetFromDashboard(setId: string) {
  const userId = await requireUser();
  const set = await prisma.vocabSet.findFirst({ where: { id: setId, userId } });
  if (!set) throw new Error("Set not found");

  await prisma.vocabSet.delete({ where: { id: setId } });
  revalidatePath("/dashboard");
}

export async function createFolder(name: string, parentId: string | null) {
  const userId = await requireUser();
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Folder name is required");

  if (parentId) {
    const parent = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT "id" FROM "Folder"
      WHERE "id" = ${parentId} AND "userId" = ${userId}
      LIMIT 1
    `);
    if (!parent.length) throw new Error("Parent folder not found");
  }

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "Folder" ("id", "name", "userId", "parentId", "createdAt", "updatedAt")
    VALUES (${createId()}, ${cleanName}, ${userId}, ${parentId}, NOW(), NOW())
  `);
  revalidatePath("/dashboard");
}

export async function renameFolder(folderId: string, name: string) {
  const userId = await requireUser();
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Folder name is required");

  const existing = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT "id" FROM "Folder"
    WHERE "id" = ${folderId} AND "userId" = ${userId}
    LIMIT 1
  `);
  if (!existing.length) throw new Error("Folder not found");

  await prisma.$executeRaw(Prisma.sql`
    UPDATE "Folder"
    SET "name" = ${cleanName}, "updatedAt" = NOW()
    WHERE "id" = ${folderId} AND "userId" = ${userId}
  `);
  revalidatePath("/dashboard");
}

export async function moveFolder(folderId: string, parentId: string | null) {
  const userId = await requireUser();
  if (folderId === parentId) throw new Error("Folder cannot be its own parent");

  const existing = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT "id" FROM "Folder"
    WHERE "id" = ${folderId} AND "userId" = ${userId}
    LIMIT 1
  `);
  if (!existing.length) throw new Error("Folder not found");

  if (parentId) {
    const descendants = await getFolderDescendantIds(userId, folderId);
    if (descendants.includes(parentId)) {
      throw new Error("Cannot move folder inside its own subtree");
    }
  }

  await prisma.$executeRaw(Prisma.sql`
    UPDATE "Folder"
    SET "parentId" = ${parentId}, "updatedAt" = NOW()
    WHERE "id" = ${folderId} AND "userId" = ${userId}
  `);
  revalidatePath("/dashboard");
}

export async function deleteFolder(folderId: string) {
  const userId = await requireUser();
  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM "Folder"
    WHERE "id" = ${folderId} AND "userId" = ${userId}
  `);
  revalidatePath("/dashboard");
}
