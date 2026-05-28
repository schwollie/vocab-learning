import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';
import StudyExperience from '@/app/study/StudyExperience';
import { getLatestOpenStudySession } from '@/app/study/session-actions';
import { getUserSettings } from '@/app/settings/actions';
import Link from 'next/link';

export default async function StudyPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?returnTo=${encodeURIComponent(`/study/${setId}`)}`);
  await ensureUser(userId);

  const [set, latestSession, settings] = await Promise.all([
    prisma.vocabSet.findFirst({
      where: { id: setId, userId },
      select: { id: true, title: true, sideALabel: true, sideBLabel: true },
    }),
    getLatestOpenStudySession('SET', setId),
    getUserSettings(),
  ]);

  if (!set) return <div>Set not found.</div>;

  return (
    <div className="w-full">
      <StudyExperience
        scopeType="SET"
        scopeId={set.id}
        scopeLabel={set.title}
        customSideALabel={set.sideALabel}
        customSideBLabel={set.sideBLabel}
        backHref={`/sets/${set.id}`}
        latestSession={latestSession}
        defaults={{
          autoplayAudio: settings.autoplayAudio,
          preferredVoice: settings.preferredVoice,
          defaultStudyMode: settings.defaultStudyMode,
          defaultDirection: settings.defaultDirection,
          showReviewIntervalPopup: settings.showReviewIntervalPopup,
        }}
      />
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <Link href="/settings" className="text-sm text-blue-500 hover:underline">
          Open settings
        </Link>
      </div>
    </div>
  );
}
