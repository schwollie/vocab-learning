"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createFolder,
  createSet,
  deleteFolder,
  deleteSetFromDashboard,
  moveFolder,
  moveSet,
  renameFolder,
  renameSet,
} from "@/app/dashboard/actions";

type FolderItem = {
  id: string;
  name: string;
  parentId: string | null;
};

type SetItem = {
  id: string;
  title: string;
  folderId: string | null;
  termCount: number;
};

function collectDescendants(
  folderId: string,
  childrenMap: Map<string | null, FolderItem[]>
): string[] {
  const result: string[] = [folderId];
  const stack = [...(childrenMap.get(folderId) ?? [])];
  while (stack.length > 0) {
    const next = stack.pop();
    if (!next) continue;
    result.push(next.id);
    const children = childrenMap.get(next.id);
    if (children) stack.push(...children);
  }
  return result;
}

export default function DashboardClient({
  folders,
  sets,
  initialFolderId = null,
}: {
  folders: FolderItem[];
  sets: SetItem[];
  initialFolderId?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedKey, setSelectedKey] = useState<string>(
    initialFolderId ?? "all"
  );

  const [newFolderName, setNewFolderName] = useState("");
  const [newSetTitle, setNewSetTitle] = useState("");
  const [createSetFolderId, setCreateSetFolderId] = useState<string | null>(
    initialFolderId
  );

  const childrenMap = useMemo(() => {
    const map = new Map<string | null, FolderItem[]>();
    for (const folder of folders) {
      const key = folder.parentId ?? null;
      const group = map.get(key) ?? [];
      group.push(folder);
      map.set(key, group);
    }
    return map;
  }, [folders]);

  const visibleSets = useMemo(() => {
    if (selectedKey === "all") return sets;
    if (selectedKey === "uncategorized") {
      return sets.filter((set) => !set.folderId);
    }

    const eligible = new Set(collectDescendants(selectedKey, childrenMap));
    return sets.filter((set) => set.folderId && eligible.has(set.folderId));
  }, [childrenMap, selectedKey, sets]);

  const runAndRefresh = (work: () => Promise<void>) => {
    startTransition(async () => {
      await work();
      router.refresh();
    });
  };

  const selectedFolderId =
    selectedKey !== "all" && selectedKey !== "uncategorized"
      ? selectedKey
      : null;

  const createSetSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const title = newSetTitle.trim();
    if (!title) return;
    runAndRefresh(async () => {
      await createSet(title, createSetFolderId);
      setNewSetTitle("");
    });
  };

  const createFolderSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    runAndRefresh(async () => {
      await createFolder(name, selectedFolderId);
      setNewFolderName("");
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
      <aside className="space-y-4">
        <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Folders</h2>
            <Link href="/settings" className="text-sm text-blue-500 hover:underline">
              Settings
            </Link>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedKey("all");
              setCreateSetFolderId(null);
            }}
            className={`w-full text-left px-2.5 py-2 rounded-lg mb-2 border ${
              selectedKey === "all"
                ? "border-blue-600 text-blue-600"
                : "border-transparent hover:bg-gray-100 dark:hover:bg-zinc-800"
            }`}
          >
            All sets
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedKey("uncategorized");
              setCreateSetFolderId(null);
            }}
            className={`w-full text-left px-2.5 py-2 rounded-lg mb-2 border ${
              selectedKey === "uncategorized"
                ? "border-blue-600 text-blue-600"
                : "border-transparent hover:bg-gray-100 dark:hover:bg-zinc-800"
            }`}
          >
            Uncategorized sets
          </button>

          <FolderTreeView
            nodes={childrenMap.get(null) ?? []}
            childrenMap={childrenMap}
            selectedFolderId={selectedFolderId}
            folders={folders}
            onSelect={(id) => {
              setSelectedKey(id);
              setCreateSetFolderId(id);
            }}
            runAndRefresh={runAndRefresh}
          />

          <form onSubmit={createFolderSubmit} className="mt-4 space-y-2">
            <label className="text-xs text-gray-500">
              New folder {selectedFolderId ? "(inside selected folder)" : "(root)"}
            </label>
            <div className="flex gap-2">
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="flex-1 p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
                placeholder="e.g. Spanish"
              />
              <button
                type="submit"
                disabled={pending || !newFolderName.trim()}
                className="px-3 rounded-lg bg-black text-white dark:bg-white dark:text-black disabled:opacity-50"
                aria-label="Create folder"
              >
                <Plus size={18} />
              </button>
            </div>
          </form>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl">
          <h2 className="font-semibold mb-3">Create set</h2>
          <form onSubmit={createSetSubmit} className="grid grid-cols-1 sm:grid-cols-[1fr_220px_auto] gap-2">
            <input
              value={newSetTitle}
              onChange={(e) => setNewSetTitle(e.target.value)}
              className="p-2.5 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
              placeholder="New vocabulary set title"
            />
            <select
              value={createSetFolderId ?? ""}
              onChange={(e) => setCreateSetFolderId(e.target.value || null)}
              className="p-2.5 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
            >
              <option value="">Uncategorized</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={pending || !newSetTitle.trim()}
              className="px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50"
            >
              Create
            </button>
          </form>
        </div>

        {selectedFolderId && (
          <div className="flex items-center justify-between p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/20">
            <span className="text-sm">
              Studying this folder includes sets in all subfolders.
            </span>
            <Link
              href={`/study/folder/${selectedFolderId}`}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm"
            >
              Study folder
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visibleSets.map((set) => (
            <SetCard
              key={set.id}
              set={set}
              folders={folders}
              pending={pending}
              runAndRefresh={runAndRefresh}
            />
          ))}
          {visibleSets.length === 0 && (
            <div className="p-8 text-center border border-dashed border-gray-300 dark:border-zinc-700 rounded-xl text-gray-500">
              No sets in this view yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FolderTreeView({
  nodes,
  childrenMap,
  selectedFolderId,
  folders,
  onSelect,
  runAndRefresh,
}: {
  nodes: FolderItem[];
  childrenMap: Map<string | null, FolderItem[]>;
  selectedFolderId: string | null;
  folders: FolderItem[];
  onSelect: (id: string) => void;
  runAndRefresh: (work: () => Promise<void>) => void;
}) {
  if (!nodes.length) return null;
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <li key={node.id}>
          <FolderRow
            node={node}
            folders={folders}
            selected={selectedFolderId === node.id}
            onSelect={() => onSelect(node.id)}
            runAndRefresh={runAndRefresh}
          />
          <div className="pl-4 border-l border-gray-200 dark:border-zinc-700 mt-1">
            <FolderTreeView
              nodes={childrenMap.get(node.id) ?? []}
              childrenMap={childrenMap}
              selectedFolderId={selectedFolderId}
              folders={folders}
              onSelect={onSelect}
              runAndRefresh={runAndRefresh}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function FolderRow({
  node,
  selected,
  folders,
  onSelect,
  runAndRefresh,
}: {
  node: FolderItem;
  selected: boolean;
  folders: FolderItem[];
  onSelect: () => void;
  runAndRefresh: (work: () => Promise<void>) => void;
}) {
  const [name, setName] = useState(node.name);
  const [editing, setEditing] = useState(false);

  return (
    <div className={`p-2 rounded-lg ${selected ? "bg-blue-50 dark:bg-zinc-800" : ""}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 text-left text-sm truncate"
        >
          <span className="inline-flex items-center gap-1">
            <FolderTree size={14} />
            {editing ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded px-1.5 py-0.5 dark:bg-zinc-900 dark:border-zinc-600"
              />
            ) : (
              <span>{node.name}</span>
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (editing) {
              runAndRefresh(async () => renameFolder(node.id, name));
            }
            setEditing((prev) => !prev);
          }}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700"
          aria-label="Rename folder"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => runAndRefresh(async () => deleteFolder(node.id))}
          className="p-1 rounded hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          aria-label="Delete folder"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-2 flex gap-2">
        <select
          value={node.parentId ?? ""}
          onChange={(e) =>
            runAndRefresh(async () => moveFolder(node.id, e.target.value || null))
          }
          className="w-full text-xs p-1.5 border rounded dark:bg-zinc-900 dark:border-zinc-700"
        >
          <option value="">Root</option>
          {folders
            .filter((folder) => folder.id !== node.id)
            .map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
        </select>
        <Link
          href={`/study/folder/${node.id}`}
          className="text-xs px-2 py-1.5 rounded border border-blue-300 text-blue-600"
        >
          Study
        </Link>
      </div>
    </div>
  );
}

function SetCard({
  set,
  folders,
  pending,
  runAndRefresh,
}: {
  set: SetItem;
  folders: FolderItem[];
  pending: boolean;
  runAndRefresh: (work: () => Promise<void>) => void;
}) {
  const [title, setTitle] = useState(set.title);

  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          if (title.trim() && title.trim() !== set.title) {
            runAndRefresh(async () => renameSet(set.id, title));
          }
        }}
        className="w-full text-lg font-semibold bg-transparent border-b border-transparent focus:border-gray-300 dark:focus:border-zinc-600 outline-none"
      />
      <p className="text-sm text-gray-500">{set.termCount} terms</p>

      <select
        value={set.folderId ?? ""}
        onChange={(e) => runAndRefresh(async () => moveSet(set.id, e.target.value || null))}
        className="w-full p-2 text-sm border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
      >
        <option value="">Uncategorized</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <Link
          href={`/sets/${set.id}`}
          className="flex-1 text-center px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-sm"
        >
          Open
        </Link>
        <Link
          href={`/study/${set.id}`}
          className="flex-1 text-center px-3 py-2 rounded-lg bg-green-600 text-white text-sm"
        >
          Study
        </Link>
        <button
          type="button"
          onClick={() => runAndRefresh(async () => deleteSetFromDashboard(set.id))}
          disabled={pending}
          className="px-3 py-2 rounded-lg border border-red-300 text-red-600 text-sm disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
