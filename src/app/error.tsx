"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message =
    error.message === "Database unavailable. Please try again in a moment."
      ? "The database is temporarily unavailable. Please wait a moment and try again."
      : "Something went wrong loading this page.";

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center gap-4">
      <h1 className="text-xl font-semibold">This page couldn&apos;t load</h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-md">{message}</p>
      {error.digest ? (
        <p className="text-xs text-gray-400">Error {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black"
      >
        Reload
      </button>
    </div>
  );
}
