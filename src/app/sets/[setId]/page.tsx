import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ensureUser } from '@/lib/auth';
import SetEditorClient from './SetEditorClient';
import SetPageActions from './SetPageActions';
import ReviewSchedulePanel from '@/components/study/ReviewSchedulePanel';
import Link from 'next/link';

export default async function SetPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?returnTo=${encodeURIComponent(`/sets/${setId}`)}`);
  await ensureUser(userId);
  
  const [set, folders] = await Promise.all([
    prisma.vocabSet.findFirst({
      where: { id: setId, userId },
      include: { items: { orderBy: { createdAt: 'asc' } } }
    }),
    prisma.folder.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  if (!set) return <div>Set not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8">
        <div>
           <Link href="/dashboard" className="text-sm text-blue-500 hover:underline mb-2 inline-block">&larr; Back to Dashboard</Link>
           <h1 className="text-2xl font-bold">Set settings</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SetPageActions
            setId={set.id}
            currentTitle={set.title}
            currentFolderId={set.folderId}
            folders={folders}
            sideALabel={set.sideALabel}
            sideBLabel={set.sideBLabel}
            sideALanguage={set.sideALanguage}
            sideBLanguage={set.sideBLanguage}
            learningSide={set.learningSide as "A" | "B"}
            autoplayModeOverride={
              set.autoplayModeOverride as "default" | "off" | "A" | "B" | "both"
            }
          />
          <a href={`/study/${set.id}`} className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600 transition">
            Study Now
          </a>
        </div>
      </div>

      <SetEditorClient
        setId={set.id}
        initialItems={set.items}
        sideALabel={set.sideALabel}
        sideBLabel={set.sideBLabel}
      />

      <div className="mt-8">
        <ReviewSchedulePanel scopeType="SET" scopeId={set.id} />
      </div>
    </div>
  );
}
