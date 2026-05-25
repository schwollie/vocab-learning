"use client";

import { ReactNode, useEffect, useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import AudioPlayer from "./AudioPlayer";
import { getFsrsStateDisplay } from "@/lib/fsrs-state";

interface FlashcardProps {
  prompt: string;
  answer: string;
  promptLanguage?: string;
  answerLanguage?: string;
  preferredVoice?: string;
  autoPlayPrompt?: boolean;
  autoPlayAnswer?: boolean;
  fsrsState?: number;
  cardIndex: number;
  totalCards: number;
  isLearning: boolean;
  onRate: (rating: number) => void | Promise<void>;
  onNext: () => void;
  onPrevious: () => void;
  onEdit?: () => void;
  disableActions?: boolean;
  cardOverlay?: ReactNode;
}

const ratingStyles = {
  red: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50",
  orange:
    "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50",
  green:
    "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50",
  blue: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
} as const;

export default function Flashcard({
  prompt,
  answer,
  promptLanguage = "en-US",
  answerLanguage = "en-US",
  preferredVoice,
  autoPlayPrompt = false,
  autoPlayAnswer = false,
  fsrsState = 0,
  cardIndex,
  totalCards,
  isLearning,
  onRate,
  onNext,
  onPrevious,
  onEdit,
  disableActions = false,
  cardOverlay,
}: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  const fsrsBadge = getFsrsStateDisplay(fsrsState);

  useEffect(() => {
    setFlipped(false);
  }, [prompt, answer]);

  const handleRate = async (rating: number) => {
    if (disableActions) return;
    setFlipped(false);
    await onRate(rating);
  };

  const cardControls = (
    <>
      {flipped ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFlipped(false);
          }}
          className="absolute bottom-4 left-4 p-2 rounded-lg border border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
          aria-label="Flip back to front"
        >
          <RotateCcw size={18} />
        </button>
      ) : null}
      {onEdit ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute bottom-4 right-4 p-2 rounded-lg border border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
          aria-label="Edit vocabulary"
        >
          <Pencil size={18} />
        </button>
      ) : null}
    </>
  );

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col pt-8">
      <p className="text-center text-sm text-gray-500 mb-6">
        Card {cardIndex + 1} of {totalCards}
      </p>

      <div
        className="relative min-h-[320px] cursor-pointer [perspective:1200px]"
        onClick={() => !flipped && setFlipped(true)}
      >
        {cardOverlay}
        <div
          className={`relative w-full min-h-[320px] transition-transform duration-500 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          <div className="absolute inset-0 flex flex-col items-center p-8 bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm [backface-visibility:hidden]">
            <FsrsStateBadge label={fsrsBadge.label} className={fsrsBadge.badgeClassName} />
            <div
              className="absolute top-4 right-4"
              onClick={(e) => e.stopPropagation()}
            >
              <AudioPlayer
                text={prompt}
                language={promptLanguage}
                preferredVoice={preferredVoice}
                autoPlay={autoPlayPrompt && !flipped}
              />
            </div>
            <div className="flex-1 flex items-center justify-center w-full px-4 pt-6 pb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-center">{prompt}</h2>
            </div>
            <p className="absolute bottom-14 left-0 right-0 text-center text-sm text-gray-400 animate-pulse pointer-events-none">
              Tap to reveal
            </p>
            {cardControls}
          </div>

          <div className="absolute inset-0 flex flex-col items-center p-8 bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <FsrsStateBadge label={fsrsBadge.label} className={fsrsBadge.badgeClassName} />
            <div
              className="absolute top-4 right-4"
              onClick={(e) => e.stopPropagation()}
            >
              <AudioPlayer
                text={answer}
                language={answerLanguage}
                preferredVoice={preferredVoice}
                autoPlay={autoPlayAnswer && flipped}
              />
            </div>
            <div className="flex-1 flex items-center justify-center w-full px-4 pt-6 pb-12">
              <p className="text-2xl text-gray-600 dark:text-gray-300 text-center">
                {answer}
              </p>
            </div>
            {cardControls}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={cardIndex === 0 || disableActions}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 disabled:opacity-40"
        >
          Previous
        </button>

        {flipped ? (
          isLearning ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              <RatingButton
                label="Again"
                style={ratingStyles.red}
                onClick={() => handleRate(1)}
                disabled={disableActions}
              />
              <RatingButton
                label="Hard"
                style={ratingStyles.orange}
                onClick={() => handleRate(2)}
                disabled={disableActions}
              />
              <RatingButton
                label="Good"
                style={ratingStyles.green}
                onClick={() => handleRate(3)}
                disabled={disableActions}
              />
              <RatingButton
                label="Easy"
                style={ratingStyles.blue}
                onClick={() => handleRate(4)}
                disabled={disableActions}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setFlipped(false);
                onNext();
              }}
              disabled={disableActions}
              className="ml-auto px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
            >
              Next card
            </button>
          )
        ) : (
          <p className="text-sm text-gray-500 ml-auto">
            {isLearning ? "Reveal then rate this card" : "Reveal then continue"}
          </p>
        )}
      </div>
    </div>
  );
}

function FsrsStateBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`absolute top-4 left-4 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}

function RatingButton({
  label,
  style,
  onClick,
  disabled,
}: {
  label: string;
  style: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={`py-3 font-bold rounded-xl transition disabled:opacity-50 ${style}`}
    >
      {label}
    </button>
  );
}
