-- Nested folders
ALTER TABLE "Folder"
ADD COLUMN "parentId" TEXT;

ALTER TABLE "Folder"
ADD CONSTRAINT "Folder_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Folder_userId_parentId_idx" ON "Folder"("userId", "parentId");
CREATE UNIQUE INDEX "Folder_userId_name_parentId_key" ON "Folder"("userId", "name", "parentId");

-- Settings defaults for study behavior
ALTER TABLE "UserSettings"
ADD COLUMN "defaultStudyMode" TEXT NOT NULL DEFAULT 'due',
ADD COLUMN "defaultDirection" TEXT NOT NULL DEFAULT 'term_to_definition';

-- Persisted study sessions
CREATE TABLE "StudySession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scopeType" TEXT NOT NULL,
  "scopeId" TEXT NOT NULL,
  "includeSubfolders" BOOLEAN NOT NULL DEFAULT false,
  "mode" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "isLearning" BOOLEAN NOT NULL DEFAULT true,
  "queueJson" JSONB NOT NULL,
  "cursor" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StudySession"
ADD CONSTRAINT "StudySession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "StudySession_userId_scopeType_scopeId_idx"
ON "StudySession"("userId", "scopeType", "scopeId");

CREATE INDEX "StudySession_userId_updatedAt_idx"
ON "StudySession"("userId", "updatedAt");
