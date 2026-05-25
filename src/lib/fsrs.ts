import { VocabItem, Prisma } from "@prisma/client";
import { FSRS, Rating, Card } from "fsrs.js";

// Initialize FSRS
export const fsrsScheduler = new FSRS();

// Mapper from our Prisma VocabItem to FSRS Card
export function vocabItemToFsrsCard(item: VocabItem): Card {
  return {
    due: item.nextReview ?? new Date(),
    stability: item.stability,
    difficulty: item.difficulty,
    elapsed_days: item.elapsedDays,
    scheduled_days: item.scheduledDays,
    reps: item.reps,
    lapses: 0,
    state: item.state,
    last_review: item.lastReview ? item.lastReview : new Date() // Fallback to avoid breaking types
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
      due: newCard.due,
      stability: newCard.stability, // use newCard's stability since reviewLog in some versions doesnt duplicate it
      difficulty: newCard.difficulty,
      elapsedDays: newCard.elapsed_days,
      lastElapsedDays: item.elapsedDays || 0, // Fallback to our db item's previous elapsed tracking
      scheduledDays: newCard.scheduled_days,
      review: new Date(),
      item: { connect: { id: item.id } }
    }
  };
}
