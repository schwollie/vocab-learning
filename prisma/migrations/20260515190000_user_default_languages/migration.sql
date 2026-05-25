ALTER TABLE "UserSettings"
ADD COLUMN "defaultSideALanguage" TEXT NOT NULL DEFAULT 'es-ES',
ADD COLUMN "defaultSideBLanguage" TEXT NOT NULL DEFAULT 'en-US';

UPDATE "UserSettings"
SET "defaultSideBLanguage" = COALESCE(NULLIF(TRIM("primaryLanguage"), ''), "defaultSideBLanguage")
WHERE "primaryLanguage" IS NOT NULL AND TRIM("primaryLanguage") <> '';

ALTER TABLE "UserSettings"
ALTER COLUMN "defaultAutoplayMode" SET DEFAULT 'both';
