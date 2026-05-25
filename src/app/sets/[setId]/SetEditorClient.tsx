"use client";

import { useRef, useState } from "react";
import { FileUp, Plus, Trash2 } from "lucide-react";
import ImportModal from "@/components/vocab/ImportModal";
import ConfirmDialog from "@/components/vocab/ConfirmDialog";
import {
  addTermToSet,
  addTermsToSet,
  deleteTerm,
  updateTerm,
} from "./actions";

type VocabItem = { id: string; term: string; definition: string };

export default function SetEditorClient({
  setId,
  initialItems,
  sideALabel,
  sideBLabel,
}: {
  setId: string;
  initialItems: VocabItem[];
  sideALabel: string;
  sideBLabel: string;
}) {
  const labelA = sideALabel.trim() || "Side A";
  const labelB = sideBLabel.trim() || "Side B";
  const [items, setItems] = useState<VocabItem[]>(initialItems);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [importOpen, setImportOpen] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleImport = async (
    newItems: { term: string; definition: string }[]
  ) => {
    const saved = await addTermsToSet(setId, newItems);
    setItems((prev) => [...prev, ...saved]);
  };

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = newTerm.trim();
    if (!term || isAdding) return;

    setIsAdding(true);
    try {
      const saved = await addTermToSet(setId, term, newDefinition.trim());
      setItems((prev) => [...prev, saved]);
      setNewTerm("");
      setNewDefinition("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdate = async (itemId: string) => {
    const item = itemsRef.current.find((i) => i.id === itemId);
    if (!item || !item.term.trim()) return;
    setSavingId(item.id);
    try {
      const updated = await updateTerm(item.id, setId, {
        term: item.term,
        definition: item.definition,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? updated : i))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (deletingId) return;
    setDeletingId(itemId);
    try {
      await deleteTerm(itemId, setId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const patchItem = (id: string, patch: Partial<Pick<VocabItem, "term" | "definition">>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
        >
          <FileUp size={18} />
          Import
        </button>
      </div>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />

      <form
        onSubmit={handleAddTerm}
        className="p-4 border border-dashed border-gray-300 dark:border-zinc-600 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 space-y-3"
      >
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Add entry
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-gray-500 mb-1 block">{labelA}</span>
            <input
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="e.g. der Kühlschrank"
              className="w-full p-2.5 border rounded-lg dark:bg-zinc-800 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-500 mb-1 block">{labelB}</span>
            <input
              value={newDefinition}
              onChange={(e) => setNewDefinition(e.target.value)}
              placeholder="e.g. the refrigerator"
              className="w-full p-2.5 border rounded-lg dark:bg-zinc-800 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={!newTerm.trim() || isAdding}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg font-medium hover:opacity-80 disabled:opacity-40 transition"
        >
          <Plus size={18} />
          {isAdding ? "Adding…" : "Add entry"}
        </button>
      </form>

      <div>
        <h2 className="text-lg font-bold mb-4">
          Entries <span className="text-gray-500 font-normal">({items.length})</span>
        </h2>

        {items.length === 0 ? (
          <p className="text-gray-500 py-8 text-center border border-gray-200 dark:border-zinc-800 rounded-xl">
            No entries yet. Add one above or use Import.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl"
              >
                <label className="block">
                  <span className="text-xs font-medium text-gray-500 mb-1 block">{labelA}</span>
                  <input
                    value={item.term}
                    onChange={(e) => patchItem(item.id, { term: e.target.value })}
                    onBlur={() => handleUpdate(item.id)}
                    className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-500 mb-1 block">{labelB}</span>
                  <input
                    value={item.definition}
                    onChange={(e) =>
                      patchItem(item.id, { definition: e.target.value })
                    }
                    onBlur={() => handleUpdate(item.id)}
                    className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </label>
                <div className="flex sm:flex-col items-center sm:items-end justify-end gap-1 sm:pt-5">
                  {savingId === item.id && (
                    <span className="text-xs text-gray-400">Saving…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(item.id)}
                    disabled={deletingId === item.id}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-40"
                    aria-label="Delete term"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this entry?"
        message="This permanently removes the vocabulary entry. This cannot be undone."
        confirmLabel="Yes, delete"
        cancelLabel="No"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
