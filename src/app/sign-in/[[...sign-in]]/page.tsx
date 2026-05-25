import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sanitizeReturnTo } from "@/lib/return-to";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { userId } = await auth();
  const { returnTo } = await searchParams;
  const redirectUrl = sanitizeReturnTo(returnTo) ?? "/dashboard";

  if (userId) {
    redirect(redirectUrl);
  }

  return (
    <div className="flex justify-center py-16 px-4">
      <SignIn fallbackRedirectUrl={redirectUrl} />
    </div>
  );
}
