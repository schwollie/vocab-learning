import { prisma } from "@/lib/db";
import { State } from "fsrs.js";
import { normalizeAutoplayMode, resolveAutoplayMode } from "../autoplay";
import { directionToPromptSide, shuffle } from "../queue";
import type { StudyQueueItem } from "../types";
import type { StartSessionInput } from "./types";
import { fetchVocabSnapshots } from "./vocab-snapshots";

export async function loadCardsForSession(
  userId: string,
  input: StartSessionInput
): Promise<StudyQueueItem[]> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const defaultAutoplayMode = normalizeAutoplayMode(settings?.defaultAutoplayMode);

  let items = await fetchVocabSnapshots(userId, input);

  const newItems = items.filter(
    (i) => i.state === State.New || i.state === State.Learning
  );
  const reviewItems = items.filter(
    (i) => i.state === State.Review || i.state === State.Relearning
  );
  reviewItems.sort(
    (a, b) => (a.nextReview?.getTime() ?? 0) - (b.nextReview?.getTime() ?? 0)
  );

  if (input.mode === "random") {
    items = [...shuffle(newItems), ...shuffle(reviewItems)];
  } else {
    items = [...newItems, ...reviewItems];
  }

  return items.map((item, index) => {
    const learningSide = item.set.learningSide === "B" ? "B" : "A";
    const promptSide = directionToPromptSide(input.direction, index);
    const resolvedMode = resolveAutoplayMode(
      item.set.autoplayModeOverride,
      defaultAutoplayMode
    );

    return {
      itemId: item.id,
      setId: item.setId,
      sideAText: item.term,
      sideBText: item.definition,
      sideALabel: item.set.sideALabel,
      sideBLabel: item.set.sideBLabel,
      sideALanguage: item.set.sideALanguage,
      sideBLanguage: item.set.sideBLanguage,
      learningSide,
      autoplayMode: resolvedMode,
      promptSide: promptSide === "term" ? "A" : "B",
      fsrsState: item.state,
      startedAsNew: item.state === State.New,
      nextReview: item.nextReview?.toISOString() ?? null,
      stability: item.stability,
      difficulty: item.difficulty,
      elapsedDays: item.elapsedDays,
      scheduledDays: item.scheduledDays,
      reps: item.reps,
      lastReview: item.lastReview?.toISOString() ?? null,
      correctCount: 0,
      firstAttemptCompleted: false,
    };
  });
}
