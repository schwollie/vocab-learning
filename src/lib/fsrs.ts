import { createId } from "@paralleldrive/cuid2";
import { ReviewLog, VocabItem, Prisma } from "@prisma/client";
import { createEmptyCard, fsrs, Rating, Card } from "fsrs.js";

// Initialize FSRS
export const fsrsScheduler = fsrs();

// Mapper from our Prisma VocabItem to FSRS Card
export function vocabItemToFsrsCard(item: VocabItem): Card {
  return {
    due: item.nextReview ?? new Date(),
    stability: item.stability,
    difficulty: item.difficulty,
    elapsed_days: item.elapsedDays,
    scheduled_days: item.scheduledDays,
    reps: item.reps,
    lapses: 0, // Simplified for now since we don't track lapses distinctly yet
    state: item.state,
    last_review: item.lastReview ?? undefined,
  };
}

export function processReview(
  item: VocabItem,
  rating: Rating // 1=Again, 2=Hard, 3=Good, 4=Easy
): { updatedItem: Prisma.VocabItemUpdateInput; newLog: Prisma.ReviewLogCreateInput } {
  const card = vocabItemToFsrsCard(item);
  const now = new Date();
  
  // Calculate next state
  const schedulingCards = fsrsScheduler.repeat(card, now);
  
  // schedulingCards is a Record<Rating, SchedulingCard>. We pick the one corresponding to the user's rating
  const schedulingInfo = schedulingCards[rating];
  const newCard = schedulingInfo.card;
  const reviewLog = schedulingInfo.review_log;
  
  return {
    updatedItem: {
      stability: newCard.stability,
      difficulty: newCard.difficulty,
      elapsedDays: newCard.elapsed_days,
      scheduledDays: newCard.scheduled_days,
      reps: newCard.reps,
      state: newCard.state,
      lastReview: newCard.last_review,
      nextReview: newCard.due,
    },
    newLog: {
      rating,
      state: reviewLog.state,
      due: reviewLog.due,
      stability: reviewLog.stability,
      difficulty: reviewLog.difficulty,
      elapsedDays: reviewLog.elapsed_days,
      lastElapsedDays: reviewLog.last_elapsed_days,
      scheduledDays: reviewLog.scheduled_days,
      review: reviewLog.review,
      item: { connect: { id: item.id } }
    }
  };
}
