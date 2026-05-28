"use client";

export default function LexiconTrigger({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-600 text-[11px] font-semibold leading-none text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
      aria-label={label}
      title={label}
    >
      ?
    </button>
  );
}
