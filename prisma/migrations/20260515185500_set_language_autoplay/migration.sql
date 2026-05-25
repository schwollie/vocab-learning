ALTER TABLE "UserSettings"
ADD COLUMN "defaultAutoplayMode" TEXT NOT NULL DEFAULT 'learning_only';

ALTER TABLE "VocabSet"
ADD COLUMN "sideALabel" TEXT NOT NULL DEFAULT 'Term',
ADD COLUMN "sideBLabel" TEXT NOT NULL DEFAULT 'Definition',
ADD COLUMN "sideALanguage" TEXT NOT NULL DEFAULT 'es-ES',
ADD COLUMN "sideBLanguage" TEXT NOT NULL DEFAULT 'en-US',
ADD COLUMN "learningSide" TEXT NOT NULL DEFAULT 'A',
ADD COLUMN "autoplayModeOverride" TEXT NOT NULL DEFAULT 'default';
