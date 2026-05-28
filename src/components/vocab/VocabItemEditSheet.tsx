"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import { updateVocabItem, deleteVocabItem } from "@/lib/vocab";
import ConfirmDialog from "@/components/vocab/ConfirmDialog";
import type { VocabItemDTO } from "@/lib/vocab";

export default function VocabItemEditSheet({
  open,
  itemId,
  sideALabel,
  sideBLabel,
  term,
  definition,
  onClose,
  onUpdated,
  onDeleted,
}: {
  open: boolean;
  itemId: string;
  sideALabel: string;
  sideBLabel: string;
  term: string;
  definition: string;
  onClose: () => void;
  onUpdated: (item: VocabItemDTO) => void;
  onDeleted: () => void;
}) {
  const [termValue, setTermValue] = useState(term);
  const [definitionValue, setDefinitionValue] = useState(definition);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const lastSaved = useRef({ term, definition });

  useEffect(() => {
    if (open) {
      setTermValue(term);
      setDefinitionValue(definition);
      lastSaved.current = { term, definition };
    }
  }, [open, term, definition]);

  const saveIfChanged = async () => {
    const trimmedTerm = termValue.trim();
    const trimmedDef = definitionValue.trim();
    if (!trimmedTerm) {
      setTermValue(lastSaved.current.term);
      return;
    }
    if (
      trimmedTerm === lastSaved.current.term &&
      trimmedDef === lastSaved.current.definition
    ) {
      return;
    }

    setSaving(true);
    try {
      const updated = await updateVocabItem(itemId, {
        term: trimmedTerm,
        definition: trimmedDef,
      });
      lastSaved.current = { term: updated.term, definition: updated.definition };
      setTermValue(updated.term);
      setDefinitionValue(updated.definition);
      onUpdated(updated);
    } catch (err) {
      console.error(err);
      setTermValue(lastSaved.current.term);
      setDefinitionValue(lastSaved.current.definition);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    try {
      await deleteVocabItem(itemId);
      onDeleted();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
        onClick={onClose}
      >
        <div
          className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="font-semibold">Edit vocabulary</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                aria-label="Delete card"
              >
                <Trash2 size={18} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-500 mb-1 block">
                {sideALabel}
              </span>
              <input
                value={termValue}
                onChange={(e) => setTermValue(e.target.value)}
                onBlur={saveIfChanged}
                className="w-full p-2.5 border rounded-lg dark:bg-zinc-800 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500 mb-1 block">
                {sideBLabel}
              </span>
              <input
                value={definitionValue}
                onChange={(e) => setDefinitionValue(e.target.value)}
                onBlur={saveIfChanged}
                className="w-full p-2.5 border rounded-lg dark:bg-zinc-800 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </label>
            {saving && (
              <p className="text-xs text-gray-400">Saving…</p>
            )}
            <p className="text-xs text-gray-500">
              Changes save when you leave a field. No save button needed.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this card?"
        message="This permanently removes the vocabulary entry. This cannot be undone."
        confirmLabel="Yes, delete"
        cancelLabel="No"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
