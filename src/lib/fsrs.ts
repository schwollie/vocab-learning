import { VocabItem, Prisma } from "@prisma/client";
import { Rating, Card, State } from "fsrs.js";
import { fsrsScheduler } from "@/lib/fsrs-scheduler";

/** First-time (New) card: Good graduates to Review in 1 day. */
export const NEW_CARD_GOOD_DAYS = 1;
/** First-time (New) card: Easy graduates to Review in 2 days. */
export const NEW_CARD_EASY_DAYS = 2;

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

/** FSRS uses minute steps for New+Good; we use +1d / +2d on first sight instead. */
export function applyNewCardScheduleOverride(
  priorState: number,
  rating: Rating,
  card: Card,
  now: Date
): Card {
  if (priorState !== State.New) return card;

  if (rating === Rating.Good) {
    return {
      ...card,
      state: State.Review,
      scheduled_days: NEW_CARD_GOOD_DAYS,
      due: addDays(now, NEW_CARD_GOOD_DAYS),
    };
  }

  if (rating === Rating.Easy) {
    return {
      ...card,
      state: State.Review,
      scheduled_days: NEW_CARD_EASY_DAYS,
      due: addDays(now, NEW_CARD_EASY_DAYS),
    };
  }

  return card;
}

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
  let newCard = schedulingInfo.card;

  newCard = applyNewCardScheduleOverride(item.state, rating, newCard, now);

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
      state: newCard.state,
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
