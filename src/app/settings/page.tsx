import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserSettings } from "@/app/settings/actions";
import SettingsForm from "@/app/settings/SettingsForm";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?returnTo=/settings");

  const settings = await getUserSettings();

  return (
    <div className="max-w-4xl mx-auto w-full p-4 py-8 space-y-6">
      <div className="space-y-1">
        <Link
          href="/dashboard"
          className="text-sm text-blue-500 hover:underline inline-block"
        >
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
