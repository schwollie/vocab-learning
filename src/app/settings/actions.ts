"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/auth";
import { AutoplayMode, StudyDirection, StudyMode } from "@/lib/study";
import { normalizeAutoplayMode } from "@/lib/autoplay";

export interface UserSettingsDTO {
  autoplayAudio: boolean;
  preferredVoice: string;
  defaultSideALanguage: string;
  defaultSideBLanguage: string;
  defaultStudyMode: StudyMode;
  defaultDirection: StudyDirection;
  defaultAutoplayMode: AutoplayMode;
}

const DEFAULTS: UserSettingsDTO = {
  autoplayAudio: true,
  preferredVoice: "",
  defaultSideALanguage: "es-ES",
  defaultSideBLanguage: "en-US",
  defaultStudyMode: "due",
  defaultDirection: "term_to_definition",
  defaultAutoplayMode: "both",
};

export async function getUserSettings(): Promise<UserSettingsDTO> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await ensureUser(userId);

  const rows = await prisma.$queryRaw<
    Array<{
      autoplayAudio: boolean;
      primaryLanguage: string | null;
      preferredVoice: string | null;
      defaultSideALanguage: string | null;
      defaultSideBLanguage: string | null;
      defaultStudyMode: string | null;
      defaultDirection: string | null;
      defaultAutoplayMode: string | null;
    }>
  >(Prisma.sql`
    SELECT
      "autoplayAudio",
      "primaryLanguage",
      "preferredVoice",
      "defaultSideALanguage",
      "defaultSideBLanguage",
      "defaultStudyMode",
      "defaultDirection",
      "defaultAutoplayMode"
    FROM "UserSettings"
    WHERE "userId" = ${userId}
    LIMIT 1
  `);

  const row = rows[0];
  if (!row) return DEFAULTS;

  const sideB =
    row.defaultSideBLanguage?.trim() ||
    row.primaryLanguage?.trim() ||
    DEFAULTS.defaultSideBLanguage;
  const sideA =
    row.defaultSideALanguage?.trim() || DEFAULTS.defaultSideALanguage;

  return {
    autoplayAudio: row.autoplayAudio,
    preferredVoice: row.preferredVoice ?? "",
    defaultSideALanguage: sideA,
    defaultSideBLanguage: sideB,
    defaultStudyMode:
      row.defaultStudyMode === "ordered" || row.defaultStudyMode === "random"
        ? row.defaultStudyMode
        : "due",
    defaultDirection:
      row.defaultDirection === "definition_to_term" ||
      row.defaultDirection === "mixed"
        ? row.defaultDirection
        : "term_to_definition",
    defaultAutoplayMode: normalizeAutoplayMode(row.defaultAutoplayMode),
  };
}

export async function updateUserSettings(input: UserSettingsDTO) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await ensureUser(userId);

  const sideA =
    input.defaultSideALanguage.trim() || DEFAULTS.defaultSideALanguage;
  const sideB =
    input.defaultSideBLanguage.trim() || DEFAULTS.defaultSideBLanguage;

  await prisma.$executeRaw(Prisma.sql`
    UPDATE "UserSettings"
    SET
      "autoplayAudio" = ${input.autoplayAudio},
      "primaryLanguage" = ${sideB},
      "preferredVoice" = ${input.preferredVoice || null},
      "defaultSideALanguage" = ${sideA},
      "defaultSideBLanguage" = ${sideB},
      "defaultStudyMode" = ${input.defaultStudyMode},
      "defaultDirection" = ${input.defaultDirection},
      "defaultAutoplayMode" = ${input.defaultAutoplayMode},
      "updatedAt" = NOW()
    WHERE "userId" = ${userId}
  `);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
