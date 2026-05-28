import type {
  StudyDirection,
  StudyMode,
  StudyScopeType,
} from "../types";

export interface StartSessionInput {
  scopeType: StudyScopeType;
  scopeId: string;
  includeSubfolders: boolean;
  mode: StudyMode;
  direction: StudyDirection;
  isLearning: boolean;
}

export type SessionRow = {
  id: string;
  scopeType: string;
  scopeId: string;
  includeSubfolders: boolean;
  mode: string;
  direction: string;
  isLearning: boolean;
  queueJson: import("@prisma/client").Prisma.JsonValue;
  cursor: number;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
