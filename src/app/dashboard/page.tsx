import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/auth";
import { listUserFolders } from "@/lib/folders";
import DashboardClient from "@/app/dashboard/DashboardClient";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?returnTo=/dashboard");
  await ensureUser(userId);

  const params = (await searchParams) || {};
  const initialFolderId = params.folder ?? null;

  const [folders, sets] = await Promise.all([
    listUserFolders(userId),
    prisma.vocabSet.findMany({
      where: { userId },
      include: { _count: { select: { items: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto w-full p-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">
          Organize folders, manage sets, and continue studying.
        </p>
      </div>

      <DashboardClient
        folders={folders.map((folder) => ({
          id: folder.id,
          name: folder.name,
          parentId: folder.parentId,
        }))}
        sets={sets.map((set) => ({
          id: set.id,
          title: set.title,
          folderId: set.folderId,
          termCount: set._count?.items ?? 0,
        }))}
        initialFolderId={initialFolderId}
      />
    </div>
  );
}
