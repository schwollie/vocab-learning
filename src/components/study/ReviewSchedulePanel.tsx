"use client";

import { useCallback, useEffect, useState } from "react";
import { getReviewScheduleSnapshot } from "@/app/study/schedule-actions";
import { ReviewScheduleSnapshot } from "@/lib/review-schedule";
import { StudyScopeType } from "@/lib/study";
import ReviewScheduleChart from "@/components/study/ReviewScheduleChart";

export default function ReviewSchedulePanel({
  scopeType,
  scopeId,
  includeSubfolders = false,
  refreshKey = 0,
  defaultOpen = false,
}: {
  scopeType: StudyScopeType;
  scopeId: string;
  includeSubfolders?: boolean;
  refreshKey?: number;
  defaultOpen?: boolean;
}) {
  const [snapshot, setSnapshot] = useState<ReviewScheduleSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReviewScheduleSnapshot({
        scopeType,
        scopeId,
        includeSubfolders,
      });
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedule");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [scopeType, scopeId, includeSubfolders]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <details
      className="border border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden group"
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary className="px-4 py-3 cursor-pointer select-none font-medium text-sm flex items-center justify-between gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50 list-none [&::-webkit-details-marker]:hidden">
        <span>Review schedule</span>
        <span className="text-gray-400 text-xs group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>

      <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-zinc-800">
        {loading && (
          <div className="space-y-2 py-2 animate-pulse">
            <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-2/3" />
            <div className="h-[140px] bg-gray-100 dark:bg-zinc-800 rounded-lg" />
          </div>
        )}

        {!loading && error && (
          <div className="py-3 text-center space-y-2">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={load}
              className="text-sm text-blue-500 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && snapshot && (
          <ReviewScheduleChart snapshot={snapshot} />
        )}
      </div>
    </details>
  );
}
