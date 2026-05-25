"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Volume2, VolumeX } from "lucide-react";
import Flashcard from "@/components/vocab/Flashcard";
import ReviewSchedulePanel from "@/components/study/ReviewSchedulePanel";
import VocabItemEditSheet from "@/components/vocab/VocabItemEditSheet";
import {
  getLatestOpenStudySession,
  startStudySession,
  submitSessionReview,
  updateSessionQueueState,
} from "@/app/study/session-actions";
import {
  PersistedStudySession,
  StudyDirection,
  StudyMode,
  StudyScopeType,
} from "@/lib/study";
import { shouldAutoplaySide } from "@/lib/autoplay";
import {
  buildActiveWindowIndices,
  isDueNow,
  isSessionItemComplete,
  nextCorrectCount,
  sessionPassTarget,
} from "@/lib/study-chunk";

interface StudyDefaults {
  autoplayAudio: boolean;
  preferredVoice: string;
  defaultStudyMode: StudyMode;
  defaultDirection: StudyDirection;
}

export default function StudyExperience({
  scopeType,
  scopeId,
  scopeLabel,
  customSideALabel = "Side A",
  customSideBLabel = "Side B",
  backHref,
  latestSession,
  defaults,
}: {
  scopeType: StudyScopeType;
  scopeId: string;
  scopeLabel: string;
  customSideALabel?: string;
  customSideBLabel?: string;
  backHref: string;
  latestSession: PersistedStudySession | null;
  defaults: StudyDefaults;
}) {
  const [session, setSession] = useState<PersistedStudySession | null>(null);
  const [pending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mode, setMode] = useState<StudyMode>(defaults.defaultStudyMode);
  const [direction, setDirection] = useState<StudyDirection>(
    defaults.defaultDirection
  );
  const [isLearning, setIsLearning] = useState(true);
  const [includeSubfolders, setIncludeSubfolders] = useState(true);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [localIndex, setLocalIndex] = useState(0);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const sideALabel = customSideALabel.trim() || "Side A";
  const sideBLabel = customSideBLabel.trim() || "Side B";

  const active = session;
  const queue = active?.queue ?? [];

  const chunkIndices = useMemo(() => buildActiveWindowIndices(queue), [queue]);

  const currentIndex =
    chunkIndices.length > 0 ? chunkIndices[localIndex % chunkIndices.length] : -1;
  const current = currentIndex !== -1 ? queue[currentIndex] : null;

  const completedCount = queue.filter((item) => isSessionItemComplete(item)).length;
  const progress = queue.length ? Math.min((completedCount / queue.length) * 100, 100) : 0;

  const promptAndAnswer = useMemo(() => {
    if (!current) return null;
    if (current.promptSide === "B") {
      return {
        prompt: current.sideBText,
        answer: current.sideAText,
        promptLanguage: current.sideBLanguage,
        answerLanguage: current.sideALanguage,
      };
    }
    return {
      prompt: current.sideAText,
      answer: current.sideBText,
      promptLanguage: current.sideALanguage,
      answerLanguage: current.sideBLanguage,
    };
  }, [current]);

  const autoplaySides = useMemo(() => {
    if (!current || !autoplayEnabled || !defaults.autoplayAudio) {
      return { prompt: false, answer: false };
    }
    const answerSide = current.promptSide === "A" ? "B" : "A";
    return {
      prompt: shouldAutoplaySide(current.autoplayMode, current.promptSide),
      answer: shouldAutoplaySide(current.autoplayMode, answerSide),
    };
  }, [autoplayEnabled, current, defaults.autoplayAudio]);

  const advanceIndex = (indices: number[]) => {
    const poolSize = indices.length;
    setLocalIndex((prev) => (poolSize > 0 ? (prev + 1) % poolSize : 0));
  };

  const refreshResume = () => {
    startTransition(async () => {
      const fresh = await getLatestOpenStudySession(scopeType, scopeId);
      if (fresh) setSession(fresh);
    });
  };

  const beginSession = () => {
    startTransition(async () => {
      const created = await startStudySession({
        scopeType,
        scopeId,
        includeSubfolders: scopeType === "FOLDER" ? includeSubfolders : false,
        mode,
        direction,
        isLearning,
      });
      setSession(created);
      setLocalIndex(0);
      setAutoplayEnabled(created.queue[0]?.autoplayMode !== "off");
    });
  };

  const continueSession = () => {
    if (!latestSession) return;
    setSession(latestSession);
    setLocalIndex(0);
    setAutoplayEnabled(latestSession.queue[0]?.autoplayMode !== "off");
  };

  const moveActivePool = (newQueue: typeof queue, complete = false) => {
    if (!active) return;
    const nextSession = { ...active, queue: newQueue };
    setSession(nextSession);
    startTransition(async () => {
      await updateSessionQueueState(active.id, newQueue, complete);
    });
  };

  const onRate = async (rating: number) => {
    if (!active || !current || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const newQueue = [...queue];
      let fsrsState = current.fsrsState ?? 0;
      let nextReview = current.nextReview;

      if (isLearning && isDueNow(current)) {
        const result = await submitSessionReview(
          active.id,
          current.itemId,
          rating
        );
        if (result !== null) {
          fsrsState = result.state;
          nextReview = result.nextReview;
          setScheduleRefreshKey((k) => k + 1);
        }
      }

      newQueue[currentIndex] = {
        ...current,
        correctCount: nextCorrectCount(current, rating),
        firstAttemptCompleted: true,
        fsrsState,
        nextReview,
      };

      const nextIndices = buildActiveWindowIndices(newQueue);
      const isDone = newQueue.every((item) => isSessionItemComplete(item));
      advanceIndex(nextIndices);
      moveActivePool(newQueue, isDone);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onBrowseNext = () => {
    if (!active || !current) return;
    const newQueue = [...queue];
    newQueue[currentIndex] = {
      ...current,
      correctCount: sessionPassTarget(current),
      firstAttemptCompleted: true,
    };
    const nextIndices = buildActiveWindowIndices(newQueue);
    const isDone = newQueue.every((item) => isSessionItemComplete(item));
    advanceIndex(nextIndices);
    moveActivePool(newQueue, isDone);
  };

  const onPrevious = () => {
    if (chunkIndices.length > 0) {
      setLocalIndex((prev) => (prev - 1 + chunkIndices.length) % chunkIndices.length);
    }
  };

  const handleItemUpdated = (updated: { id: string; term: string; definition: string }) => {
    if (!active || !current) return;
    const newQueue = queue.map((item) =>
      item.itemId === updated.id
        ? { ...item, sideAText: updated.term, sideBText: updated.definition }
        : item
    );
    moveActivePool(newQueue);
  };

  const handleItemDeleted = () => {
    if (!active || !current) return;
    const newQueue = queue.filter((item) => item.itemId !== current.itemId);
    const nextIndices = buildActiveWindowIndices(newQueue);
    const isDone =
      newQueue.length === 0 ||
      newQueue.every((item) => isSessionItemComplete(item));
    if (nextIndices.length > 0) {
      advanceIndex(nextIndices);
    } else {
      setLocalIndex(0);
    }
    moveActivePool(newQueue, isDone);
    setEditOpen(false);
    setScheduleRefreshKey((k) => k + 1);
  };

  const folderIncludeSubfolders =
    scopeType === "FOLDER"
      ? (active?.includeSubfolders ?? includeSubfolders)
      : false;

  const schedulePanel = (
    <ReviewSchedulePanel
      scopeType={scopeType}
      scopeId={scopeId}
      includeSubfolders={folderIncludeSubfolders}
      refreshKey={scheduleRefreshKey}
    />
  );

  if (!active) {
    return (
      <div className="max-w-4xl mx-auto w-full p-4 py-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Link href={backHref} className="text-sm text-blue-500 hover:underline">
              &larr; Back
            </Link>
            <h1 className="text-3xl font-bold mt-1">Study setup</h1>
            <p className="text-gray-500">{scopeLabel}</p>
          </div>
          <Link href="/settings" className="text-sm text-blue-500 hover:underline">
            Settings
          </Link>
        </div>

        {latestSession && (
          <div className="p-4 border border-blue-200 dark:border-blue-900 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 space-y-2">
            <p className="font-medium">Continue where you left off?</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {latestSession.queue.filter((item) => isSessionItemComplete(item)).length} /{" "}
              {latestSession.queue.length} cards completed.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={continueSession}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white"
              >
                Resume session
              </button>
              <button
                type="button"
                onClick={refreshResume}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700"
              >
                Refresh resume
              </button>
            </div>
          </div>
        )}

        <div className="p-5 border border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 space-y-4">
          <h2 className="text-lg font-semibold">Start new session</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-gray-500">Mode</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as StudyMode)}
                className="mt-1 w-full p-2.5 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
              >
                <option value="due">FSRS due-only</option>
                <option value="ordered">Browse default order</option>
                <option value="random">Browse random order</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-gray-500">Direction</span>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as StudyDirection)}
                className="mt-1 w-full p-2.5 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
              >
                <option value="term_to_definition">
                  {sideALabel} → {sideBLabel}
                </option>
                <option value="definition_to_term">
                  {sideBLabel} → {sideALabel}
                </option>
                <option value="mixed">Mixed</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isLearning}
                onChange={(e) => setIsLearning(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              <span className="text-sm">Learning mode (save FSRS ratings)</span>
            </label>
            {scopeType === "FOLDER" && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeSubfolders}
                  onChange={(e) => setIncludeSubfolders(e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-sm">Include subfolders</span>
              </label>
            )}
          </div>

          <button
            type="button"
            onClick={beginSession}
            disabled={pending}
            className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black"
          >
            {pending ? "Preparing..." : "Start session"}
          </button>
        </div>

        {schedulePanel}
      </div>
    );
  }

  if (!current || !promptAndAnswer) {
    return (
      <div className="max-w-4xl mx-auto w-full p-4 py-10 space-y-4">
        <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Session complete</h2>
        <p className="text-gray-500">
          Great work. You completed {queue.length} cards in this session.
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setSession(null)}
            className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black"
          >
            Start another session
          </button>
          <Link
            href={backHref}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700"
          >
            Back
          </Link>
        </div>
        </div>

        {schedulePanel}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-4 py-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="text-sm text-blue-500 hover:underline">
          &larr; Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {isLearning ? "Learning mode" : "Browse mode"} · {mode} · {direction}
          </div>
          <button
            type="button"
            onClick={() => setAutoplayEnabled((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-300 dark:border-zinc-700 text-sm"
            title="Toggle autoplay for this session"
          >
            {autoplayEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {autoplayEnabled ? "Autoplay on" : "Autoplay off"}
          </button>
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <Flashcard
        key={`${active.id}-${currentIndex}-${current.correctCount}-${current.itemId}`}
        prompt={promptAndAnswer.prompt}
        answer={promptAndAnswer.answer}
        promptLanguage={promptAndAnswer.promptLanguage}
        answerLanguage={promptAndAnswer.answerLanguage}
        preferredVoice={defaults.preferredVoice}
        autoPlayPrompt={autoplaySides.prompt}
        autoPlayAnswer={autoplaySides.answer}
        fsrsState={current.fsrsState ?? 0}
        cardIndex={completedCount}
        totalCards={queue.length}
        isLearning={isLearning}
        onRate={onRate}
        onNext={onBrowseNext}
        onPrevious={onPrevious}
        onEdit={() => setEditOpen(true)}
        disableActions={isSubmitting}
      />

      {current && (
        <VocabItemEditSheet
          open={editOpen}
          itemId={current.itemId}
          sideALabel={current.sideALabel || sideALabel}
          sideBLabel={current.sideBLabel || sideBLabel}
          term={current.sideAText}
          definition={current.sideBText}
          onClose={() => setEditOpen(false)}
          onUpdated={handleItemUpdated}
          onDeleted={handleItemDeleted}
        />
      )}

      {schedulePanel}
    </div>
  );
}
