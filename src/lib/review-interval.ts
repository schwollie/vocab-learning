const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Compact label after FSRS review: "+15 min", "+4 hours", "+3 days", or "+5 weeks". */
export function formatAddedInterval(intervalMs: number): string {
  if (intervalMs <= 0) return "+now";

  if (intervalMs >= 30 * MS_PER_DAY) {
    const weeks = Math.round(intervalMs / (7 * MS_PER_DAY));
    return `+${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  }

  if (intervalMs >= MS_PER_DAY) {
    const days = Math.round(intervalMs / MS_PER_DAY);
    return `+${days} ${days === 1 ? "day" : "days"}`;
  }

  if (intervalMs >= MS_PER_HOUR) {
    const hours = Math.round(intervalMs / MS_PER_HOUR);
    return `+${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  const minutes = Math.max(1, Math.round(intervalMs / MS_PER_MINUTE));
  return `+${minutes} ${minutes === 1 ? "min" : "mins"}`;
}

export function intervalMsUntil(isoDate: string, now: Date = new Date()): number {
  return new Date(isoDate).getTime() - now.getTime();
}
