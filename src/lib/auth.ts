import { prisma } from "@/lib/prisma";

/** Ensures a Prisma User row exists for the signed-in Clerk user (FK for vocab sets). */
export async function ensureUser(userId: string, email?: string | null) {
  try {
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: email ?? null,
      },
      update: email ? { email } : {},
    });

    await prisma.userSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  } catch (err) {
    console.error("[ensureUser] Database unavailable:", err);
    throw new Error("Database unavailable. Please try again in a moment.");
  }
}
