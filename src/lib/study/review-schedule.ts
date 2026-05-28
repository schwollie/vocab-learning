export interface SchedulePoint {
  offsetMs: number;
  value: number;
}

export interface ReviewScheduleSnapshot {
  total: number;
  dueNow: number;
  maxOffsetMs: number;
  densityPoints: SchedulePoint[];
  cumulativePoints: SchedulePoint[];
}

const MIN_HORIZON_MS = 60 * 60 * 1000;
const DEFAULT_SAMPLES = 80;

export function offsetsFromDueDates(
  dueDates: Array<Date | null | undefined>,
  now: Date = new Date()
): number[] {
  const nowMs = now.getTime();
  return dueDates.map((d) => {
    if (!d || d.getTime() <= nowMs) return 0;
    return d.getTime() - nowMs;
  });
}

export function buildDensityLine(
  offsets: number[],
  maxOffsetMs: number,
  samples = DEFAULT_SAMPLES
): SchedulePoint[] {
  if (offsets.length === 0) {
    return [{ offsetMs: 0, value: 0 }];
  }

  const horizon = Math.max(maxOffsetMs, MIN_HORIZON_MS);
  const bandwidth = Math.max(horizon / 20, 60_000);
  const points: SchedulePoint[] = [];

  for (let i = 0; i <= samples; i++) {
    const x = (horizon * i) / samples;
    let y = 0;
    for (const o of offsets) {
      const d = (x - o) / bandwidth;
      y += Math.exp(-0.5 * d * d);
    }
    points.push({ offsetMs: x, value: y });
  }

  return points;
}

export function buildCumulativeLine(
  offsets: number[],
  maxOffsetMs: number,
  samples = DEFAULT_SAMPLES
): SchedulePoint[] {
  if (offsets.length === 0) {
    return [{ offsetMs: 0, value: 0 }];
  }

  const horizon = Math.max(maxOffsetMs, MIN_HORIZON_MS);
  const sorted = [...offsets].sort((a, b) => a - b);
  const points: SchedulePoint[] = [];

  for (let i = 0; i <= samples; i++) {
    const x = (horizon * i) / samples;
    let count = 0;
    for (const o of sorted) {
      if (o <= x) count += 1;
      else break;
    }
    points.push({ offsetMs: x, value: count });
  }

  return points;
}

export function formatScheduleOffset(ms: number): string {
  if (ms <= 0) return "now";
  const minutes = ms / 60_000;
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 48) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 14) return `${Math.round(days)}d`;
  const weeks = days / 7;
  if (weeks < 8) return `${Math.round(weeks)}w`;
  const months = days / 30;
  return `${Math.round(months)}mo`;
}

export function buildReviewScheduleSnapshot(
  dueDates: Array<Date | null | undefined>,
  now: Date = new Date()
): ReviewScheduleSnapshot {
  const offsets = offsetsFromDueDates(dueDates, now);
  const total = offsets.length;
  const dueNow = offsets.filter((o) => o === 0).length;
  const maxOffsetMs = offsets.length ? Math.max(...offsets) : 0;

  return {
    total,
    dueNow,
    maxOffsetMs,
    densityPoints: buildDensityLine(offsets, maxOffsetMs),
    cumulativePoints: buildCumulativeLine(offsets, maxOffsetMs),
  };
}
