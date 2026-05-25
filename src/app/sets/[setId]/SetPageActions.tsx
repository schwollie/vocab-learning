"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import LanguageSelect from "@/components/ui/LanguageSelect";
import { deleteSet, moveSet, renameSet, updateSetStudyLanguageSettings } from "./actions";

export default function SetPageActions({
  setId,
  currentTitle,
  currentFolderId,
  folders,
  sideALabel,
  sideBLabel,
  sideALanguage,
  sideBLanguage,
  learningSide,
  autoplayModeOverride,
}: {
  setId: string;
  currentTitle: string;
  currentFolderId: string | null;
  folders: Array<{ id: string; name: string }>;
  sideALabel: string;
  sideBLabel: string;
  sideALanguage: string;
  sideBLanguage: string;
  learningSide: "A" | "B";
  autoplayModeOverride: "default" | "off" | "A" | "B" | "both";
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [savedTitle, setSavedTitle] = useState(currentTitle);
  const [folderId, setFolderId] = useState(currentFolderId ?? "");
  const [localSideALabel, setLocalSideALabel] = useState(sideALabel);
  const [localSideBLabel, setLocalSideBLabel] = useState(sideBLabel);
  const [localSideALanguage, setLocalSideALanguage] = useState(sideALanguage);
  const [localSideBLanguage, setLocalSideBLanguage] = useState(sideBLanguage);
  const [localLearningSide, setLocalLearningSide] = useState<"A" | "B">(learningSide);
  const [localAutoplayModeOverride, setLocalAutoplayModeOverride] = useState<
    "default" | "off" | "A" | "B" | "both"
  >(autoplayModeOverride);

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      await deleteSet(setId);
    });
  };

  return (
    <div className="w-full p-4 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 px-3 py-2 border rounded-lg dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <Pencil size={15} className="text-gray-400" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            if (title.trim() && title.trim() !== savedTitle) {
              startTransition(async () => {
                await renameSet(setId, title);
                setSavedTitle(title.trim());
              });
            }
          }}
          className="bg-transparent outline-none text-sm"
        />
        </label>

        <select
          value={folderId}
          onChange={(e) =>
            startTransition(async () => {
              const next = e.target.value;
              setFolderId(next);
              await moveSet(setId, next || null);
            })
          }
          className="px-3 py-2 border rounded-lg dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
        >
          <option value="">Uncategorized</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-gray-500 mb-1 block">Side A label</span>
          <input
            value={localSideALabel}
            onChange={(e) => setLocalSideALabel(e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-600"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-500 mb-1 block">Side B label</span>
          <input
            value={localSideBLabel}
            onChange={(e) => setLocalSideBLabel(e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-600"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-gray-500 mb-1 block">Side A language</span>
          <LanguageSelect
            id={`${setId}-lang-a`}
            value={localSideALanguage}
            onChange={setLocalSideALanguage}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-500 mb-1 block">Side B language</span>
          <LanguageSelect
            id={`${setId}-lang-b`}
            value={localSideBLanguage}
            onChange={setLocalSideBLanguage}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-gray-500 mb-1 block">Learning side</span>
          <select
            value={localLearningSide}
            onChange={(e) => setLocalLearningSide(e.target.value as "A" | "B")}
            className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-600"
          >
            <option value="A">{localSideALabel || "Side A"}</option>
            <option value="B">{localSideBLabel || "Side B"}</option>
          </select>
        </label>
        <div className="block">
          <span className="text-xs font-medium text-gray-500 mb-1 block">Autoplay overrides</span>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={localAutoplayModeOverride === "default"}
              onChange={(e) => {
                if (e.target.checked) setLocalAutoplayModeOverride("default");
                else setLocalAutoplayModeOverride("both"); // default if uncontrolled
              }}
              className="accent-blue-600"
            />
            <span className="text-sm">Use global default</span>
          </label>
          
          {localAutoplayModeOverride !== "default" && (
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localAutoplayModeOverride === "A" || localAutoplayModeOverride === "both"}
                  onChange={(e) => {
                    const isB = localAutoplayModeOverride === "B" || localAutoplayModeOverride === "both";
                    const isA = e.target.checked;
                    setLocalAutoplayModeOverride(isA && isB ? "both" : isA ? "A" : isB ? "B" : "off");
                  }}
                  className="accent-blue-600"
                />
                <span className="text-sm">Autoplay {localSideALabel || "Side A"}</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localAutoplayModeOverride === "B" || localAutoplayModeOverride === "both"}
                  onChange={(e) => {
                    const isA = localAutoplayModeOverride === "A" || localAutoplayModeOverride === "both";
                    const isB = e.target.checked;
                    setLocalAutoplayModeOverride(isA && isB ? "both" : isA ? "A" : isB ? "B" : "off");
                  }}
                  className="accent-blue-600"
                />
                <span className="text-sm">Autoplay {localSideBLabel || "Side B"}</span>
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await updateSetStudyLanguageSettings(setId, {
                sideALabel: localSideALabel,
                sideBLabel: localSideBLabel,
                sideALanguage: localSideALanguage,
                sideBLanguage: localSideBLanguage,
                learningSide: localLearningSide,
                autoplayModeOverride: localAutoplayModeOverride,
              });
            })
          }
          disabled={pending}
          className="px-3 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-sm disabled:opacity-50"
        >
          Save language settings
        </button>

        <button
          type="button"
          onClick={handleDelete}
          onBlur={() => setConfirming(false)}
          disabled={pending}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium border transition disabled:opacity-50 ${
            confirming
              ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
              : "border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
          }`}
        >
          <Trash2 size={18} />
          {pending ? "Deleting..." : confirming ? "Confirm delete" : "Delete set"}
        </button>
      </div>
    </div>
  );
}
