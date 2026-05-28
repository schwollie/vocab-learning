import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sanitizeReturnTo } from "@/lib/auth";

export default async function SignUpPage({
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
      <SignUp fallbackRedirectUrl={redirectUrl} />
    </div>
  );
}
