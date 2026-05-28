import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth";
import StudyExperience from "@/app/study/StudyExperience";
import { getLatestOpenStudySession } from "@/app/study/session-actions";
import { getUserSettings } from "@/app/settings/actions";

export default async function FolderStudyPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = await params;
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?returnTo=${encodeURIComponent(`/study/folder/${folderId}`)}`);
  }
  await ensureUser(userId);

  const [folderRows, latestSession, settings] = await Promise.all([
    prisma.$queryRaw<Array<{ id: string; name: string }>>(Prisma.sql`
      SELECT "id", "name"
      FROM "Folder"
      WHERE "id" = ${folderId} AND "userId" = ${userId}
      LIMIT 1
    `),
    getLatestOpenStudySession("FOLDER", folderId),
    getUserSettings(),
  ]);

  const folder = folderRows[0];
  if (!folder) return <div>Folder not found.</div>;

  return (
    <StudyExperience
      scopeType="FOLDER"
      scopeId={folder.id}
      scopeLabel={`Folder: ${folder.name}`}
      customSideALabel="Side A"
      customSideBLabel="Side B"
      backHref={`/dashboard?folder=${folder.id}`}
      latestSession={latestSession}
      defaults={{
        autoplayAudio: settings.autoplayAudio,
        preferredVoice: settings.preferredVoice,
        defaultStudyMode: settings.defaultStudyMode,
        defaultDirection: settings.defaultDirection,
        showReviewIntervalPopup: settings.showReviewIntervalPopup,
      }}
    />
  );
}
