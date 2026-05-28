"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ensureUser } from "@/lib/auth";
import { VocabItemDTO } from "./types";

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await ensureUser(userId);
  return userId;
}

export async function requireOwnedVocabItem(itemId: string, userId: string) {
  const item = await prisma.vocabItem.findFirst({
    where: { id: itemId, set: { userId } },
    include: { set: true },
  });
  if (!item) throw new Error("Item not found");
  return item;
}

async function requireOwnedSet(setId: string, userId: string) {
  const set = await prisma.vocabSet.findFirst({ where: { id: setId, userId } });
  if (!set) throw new Error("Set not found");
  return set;
}

function toDTO(item: { id: string; term: string; definition: string }): VocabItemDTO {
  return { id: item.id, term: item.term, definition: item.definition };
}

function revalidateVocabPaths(setId: string) {
  revalidatePath(`/sets/${setId}`);
  revalidatePath(`/study/${setId}`);
}

export async function addVocabItems(
  setId: string,
  items: { term: string; definition: string }[]
): Promise<VocabItemDTO[]> {
  const userId = await requireUserId();
  await requireOwnedSet(setId, userId);

  const cleaned = items
    .map((t) => ({ term: t.term.trim(), definition: t.definition.trim() }))
    .filter((t) => t.term.length > 0);
  if (cleaned.length === 0) return [];

  const created = await prisma.$transaction(
    cleaned.map((t) =>
      prisma.vocabItem.create({
        data: { setId, term: t.term, definition: t.definition },
      })
    )
  );

  revalidateVocabPaths(setId);
  return created.map(toDTO);
}

export async function updateVocabItem(
  itemId: string,
  data: { term: string; definition: string }
): Promise<VocabItemDTO> {
  const userId = await requireUserId();
  const item = await requireOwnedVocabItem(itemId, userId);

  const term = data.term.trim();
  if (!term) throw new Error("Term is required");

  const updated = await prisma.vocabItem.update({
    where: { id: itemId },
    data: { term, definition: data.definition.trim() },
  });

  revalidateVocabPaths(item.setId);
  return toDTO(updated);
}

export async function deleteVocabItem(itemId: string): Promise<{ setId: string }> {
  const userId = await requireUserId();
  const item = await requireOwnedVocabItem(itemId, userId);

  await prisma.vocabItem.delete({ where: { id: itemId } });
  revalidateVocabPaths(item.setId);
  return { setId: item.setId };
}
