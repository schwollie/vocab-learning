"use client";

import { useTransition, useState } from "react";
import { updateUserSettings, UserSettingsDTO } from "@/app/settings/actions";
import LanguageSelect from "@/components/ui/LanguageSelect";

export default function SettingsForm({
  initialSettings,
}: {
  initialSettings: UserSettingsDTO;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(initialSettings);

  const setField = <K extends keyof UserSettingsDTO>(
    key: K,
    value: UserSettingsDTO[K]
  ) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      await updateUserSettings(form);
      setSaved(true);
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 p-5 border border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900"
    >
      <h2 className="text-lg font-semibold">Study Preferences</h2>

      <label className="flex items-center justify-between gap-4">
        <span className="font-medium">Autoplay pronunciation</span>
        <input
          type="checkbox"
          checked={form.autoplayAudio}
          onChange={(e) => setField("autoplayAudio", e.target.checked)}
          className="h-5 w-5 accent-blue-600"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="text-sm text-gray-500 block mb-1">
            Default Side A language (learning)
          </span>
          <LanguageSelect
            id="settings-lang-a"
            value={form.defaultSideALanguage}
            onChange={(code) => setField("defaultSideALanguage", code)}
          />
        </div>
        <div>
          <span className="text-sm text-gray-500 block mb-1">
            Default Side B language (known / translation)
          </span>
          <LanguageSelect
            id="settings-lang-b"
            value={form.defaultSideBLanguage}
            onChange={(code) => setField("defaultSideBLanguage", code)}
          />
        </div>
      </div>

      <label className="block">
        <span className="text-sm text-gray-500">Preferred voice (optional)</span>
        <input
          value={form.preferredVoice}
          onChange={(e) => setField("preferredVoice", e.target.value)}
          placeholder="Exact voice name from your browser"
          className="mt-1 w-full p-2.5 border rounded-lg dark:bg-zinc-800 dark:border-zinc-600"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-gray-500">Default study mode</span>
          <select
            value={form.defaultStudyMode}
            onChange={(e) =>
              setField(
                "defaultStudyMode",
                e.target.value as UserSettingsDTO["defaultStudyMode"]
              )
            }
            className="mt-1 w-full p-2.5 border rounded-lg dark:bg-zinc-800 dark:border-zinc-600"
          >
            <option value="due">Due only (FSRS)</option>
            <option value="ordered">Browse ordered</option>
            <option value="random">Browse random</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-gray-500">Default card direction</span>
          <select
            value={form.defaultDirection}
            onChange={(e) =>
              setField(
                "defaultDirection",
                e.target.value as UserSettingsDTO["defaultDirection"]
              )
            }
            className="mt-1 w-full p-2.5 border rounded-lg dark:bg-zinc-800 dark:border-zinc-600"
          >
            <option value="term_to_definition">Side A → Side B</option>
            <option value="definition_to_term">Side B → Side A</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
      </div>

      <div>
        <span className="text-sm text-gray-500 block mb-2">Default autoplay sides</span>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                form.defaultAutoplayMode === "A" ||
                form.defaultAutoplayMode === "both"
              }
              onChange={(e) => {
                const isB =
                  form.defaultAutoplayMode === "B" ||
                  form.defaultAutoplayMode === "both";
                const isA = e.target.checked;
                setField(
                  "defaultAutoplayMode",
                  isA && isB ? "both" : isA ? "A" : isB ? "B" : "off"
                );
              }}
              className="h-4 w-4 accent-blue-600"
            />
            <span className="text-sm">Autoplay Side A</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                form.defaultAutoplayMode === "B" ||
                form.defaultAutoplayMode === "both"
              }
              onChange={(e) => {
                const isA =
                  form.defaultAutoplayMode === "A" ||
                  form.defaultAutoplayMode === "both";
                const isB = e.target.checked;
                setField(
                  "defaultAutoplayMode",
                  isA && isB ? "both" : isA ? "A" : isB ? "B" : "off"
                );
              }}
              className="h-4 w-4 accent-blue-600"
            />
            <span className="text-sm">Autoplay Side B</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black font-medium disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save preferences"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
      </div>
    </form>
  );
}
