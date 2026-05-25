"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isValidSetAutoplayOverride } from "@/lib/autoplay";
import {
  addVocabItems,
  deleteVocabItem,
  updateVocabItem,
} from "@/lib/vocab-items";

async function requireOwnedSet(setId: string, userId: string) {
  const set = await prisma.vocabSet.findFirst({ where: { id: setId, userId } });
  if (!set) throw new Error("Set not found");
  return set;
}

export async function addTermsToSet(
  setId: string,
  terms: { term: string; definition: string }[]
) {
  return addVocabItems(setId, terms);
}

export async function addTermToSet(
  setId: string,
  term: string,
  definition: string
) {
  const [item] = await addVocabItems(setId, [{ term, definition }]);
  return item;
}

export async function updateTerm(
  itemId: string,
  setId: string,
  data: { term: string; definition: string }
) {
  return updateVocabItem(itemId, data);
}

export async function deleteTerm(itemId: string, setId: string) {
  await deleteVocabItem(itemId);
}

export async function deleteSet(setId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await requireOwnedSet(setId, userId);
  await prisma.vocabSet.delete({ where: { id: setId } });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function renameSet(setId: string, title: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const cleanTitle = title.trim();
  if (!cleanTitle) throw new Error("Set title is required");

  await requireOwnedSet(setId, userId);
  await prisma.vocabSet.update({ where: { id: setId }, data: { title: cleanTitle } });

  revalidatePath("/dashboard");
  revalidatePath(`/sets/${setId}`);
}

export async function moveSet(setId: string, folderId: string | null) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await requireOwnedSet(setId, userId);

  if (folderId) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
    if (!folder) throw new Error("Folder not found");
  }

  await prisma.vocabSet.update({ where: { id: setId }, data: { folderId } });
  revalidatePath("/dashboard");
  revalidatePath(`/sets/${setId}`);
}

export async function updateSetStudyLanguageSettings(
  setId: string,
  data: {
    sideALabel: string;
    sideBLabel: string;
    sideALanguage: string;
    sideBLanguage: string;
    learningSide: "A" | "B";
    autoplayModeOverride: "default" | "off" | "A" | "B" | "both";
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await requireOwnedSet(setId, userId);

  const sideALabel = data.sideALabel.trim() || "Side A";
  const sideBLabel = data.sideBLabel.trim() || "Side B";
  const sideALanguage = data.sideALanguage.trim() || "es-ES";
  const sideBLanguage = data.sideBLanguage.trim() || "en-US";
  const learningSide = data.learningSide === "B" ? "B" : "A";
  const autoplayModeOverride = isValidSetAutoplayOverride(data.autoplayModeOverride)
    ? data.autoplayModeOverride
    : "default";

  await prisma.vocabSet.update({
    where: { id: setId },
    data: {
      sideALabel,
      sideBLabel,
      sideALanguage,
      sideBLanguage,
      learningSide,
      autoplayModeOverride,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/sets/${setId}`);
}
