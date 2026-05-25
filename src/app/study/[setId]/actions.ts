"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { processReview } from "@/lib/fsrs";
import { Rating } from "fsrs.js";

const VALID_RATINGS = new Set<number>([
  Rating.Again,
  Rating.Hard,
  Rating.Good,
  Rating.Easy,
]);

export async function submitReview(itemId: string, rating: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!VALID_RATINGS.has(rating)) {
    throw new Error("Invalid rating");
  }

  const item = await prisma.vocabItem.findFirst({
    where: {
      id: itemId,
      set: { userId },
    },
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

  return { nextReview: updatedItem.nextReview };
}
