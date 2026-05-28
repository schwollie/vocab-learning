import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function AppHeader() {
  const { userId } = await auth();

  return (
    <header className="border-b border-gray-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Image
              src="/icon.png"
              alt=""
              width={28}
              height={28}
              className="rounded-md"
              priority
            />
            Vocab Learning
          </Link>
          {userId && (
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                Settings
              </Link>
            </nav>
          )}
        </div>

        {userId ? <UserButton afterSignOutUrl="/" /> : null}
      </div>
    </header>
  );
}
