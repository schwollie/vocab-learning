import type { Prisma } from "@prisma/client";
import type {
  PersistedStudySession,
  StudyDirection,
  StudyQueueItem,
  StudyScopeType,
} from "../types";

export function parseSessionRow(row: {
  id: string;
  scopeType: string;
  scopeId: string;
  includeSubfolders: boolean;
  mode: string;
  direction: string;
  isLearning: boolean;
  queueJson: Prisma.JsonValue;
  cursor: number;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): PersistedStudySession {
  const queue = Array.isArray(row.queueJson)
    ? (row.queueJson as unknown as StudyQueueItem[])
    : [];

  return {
    id: row.id,
    scopeType: row.scopeType as StudyScopeType,
    scopeId: row.scopeId,
    includeSubfolders: row.includeSubfolders,
    mode: row.mode as PersistedStudySession["mode"],
    direction: row.direction as StudyDirection,
    isLearning: row.isLearning,
    queue,
    cursor: row.cursor,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
