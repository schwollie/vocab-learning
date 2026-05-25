-- Migrate legacy autoplay mode values and default side labels
UPDATE "UserSettings"
SET "defaultAutoplayMode" = 'both'
WHERE "defaultAutoplayMode" = 'learning_only';

UPDATE "VocabSet"
SET "autoplayModeOverride" = 'default'
WHERE "autoplayModeOverride" = 'learning_only';

UPDATE "VocabSet"
SET "sideALabel" = 'Side A'
WHERE "sideALabel" = 'Term';

UPDATE "VocabSet"
SET "sideBLabel" = 'Side B'
WHERE "sideBLabel" = 'Definition';

ALTER TABLE "VocabSet"
ALTER COLUMN "sideALabel" SET DEFAULT 'Side A',
ALTER COLUMN "sideBLabel" SET DEFAULT 'Side B';
