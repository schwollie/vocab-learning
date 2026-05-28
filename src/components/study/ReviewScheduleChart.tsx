"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatScheduleOffset,
  ReviewScheduleSnapshot,
} from "@/lib/study";

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { label: string; density: number; cumulative: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-gray-900 dark:text-gray-100">{row.label}</p>
      <p className="text-blue-600 dark:text-blue-400">
        Density: {row.density.toFixed(1)}
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        Due by then: {Math.round(row.cumulative)}
      </p>
    </div>
  );
}

export default function ReviewScheduleChart({
  snapshot,
}: {
  snapshot: ReviewScheduleSnapshot;
}) {
  const chartData = useMemo(() => {
    const { densityPoints, cumulativePoints } = snapshot;
    return densityPoints.map((d, i) => ({
      label: formatScheduleOffset(d.offsetMs),
      density: d.value,
      cumulative: cumulativePoints[i]?.value ?? 0,
    }));
  }, [snapshot]);

  const xTicks = useMemo(() => {
    if (chartData.length <= 5) return chartData.map((d) => d.label);
    const indices = [0, Math.floor(chartData.length / 4), Math.floor(chartData.length / 2), Math.floor((3 * chartData.length) / 4), chartData.length - 1];
    return [...new Set(indices)].map((i) => chartData[i].label);
  }, [chartData]);

  if (snapshot.total === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        No cards in this scope yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
        <span>
          <strong className="text-gray-900 dark:text-gray-100">{snapshot.total}</strong>{" "}
          total
        </span>
        <span>
          <strong className="text-gray-900 dark:text-gray-100">{snapshot.dueNow}</strong>{" "}
          due now
        </span>
        <span>
          furthest{" "}
          <strong className="text-gray-900 dark:text-gray-100">
            {formatScheduleOffset(snapshot.maxOffsetMs)}
          </strong>
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-blue-500 rounded" />
          Due density
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-0 border-t border-dashed border-gray-500" />
          Cumulative due
        </span>
      </div>

      <div className="h-[140px] sm:h-[180px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-zinc-700" vertical={false} />
            <XAxis
              dataKey="label"
              ticks={xTicks}
              tick={{ fontSize: 10, fill: "currentColor" }}
              className="text-gray-500"
              interval={0}
            />
            <YAxis yAxisId="density" hide domain={[0, "auto"]} />
            <YAxis yAxisId="cumulative" orientation="right" hide domain={[0, snapshot.total]} />
            <Tooltip content={<ChartTooltip />} />
            <Area
              yAxisId="density"
              type="monotone"
              dataKey="density"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.15}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              yAxisId="cumulative"
              type="monotone"
              dataKey="cumulative"
              stroke="#6b7280"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
