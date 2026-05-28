import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { sanitizeReturnTo } from "@/lib/return-to";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { userId } = await auth();
  const params = await searchParams;

  if (userId) {
    redirect(sanitizeReturnTo(params.returnTo) ?? "/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950 p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <Image
          src="/icon.png"
          alt="Vocab Learning"
          width={72}
          height={72}
          className="mx-auto rounded-2xl shadow-sm"
          priority
        />
        <h1 className="text-4xl font-extrabold tracking-tight">
          Vocabulary Spaced Repetition
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Learn any language efficiently using scientifically proven spaced
          repetition algorithms.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/sign-in"
            className="px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-lg font-medium hover:opacity-80 transition"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-6 py-2.5 bg-gray-200 text-black dark:bg-zinc-800 dark:text-white rounded-lg font-medium hover:opacity-80 transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
