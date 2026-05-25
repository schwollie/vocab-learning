export function register(): void | Promise<void> {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const allowDev =
    process.env.ALLOW_CLERK_DEV_KEYS === "true" ||
    process.env.ALLOW_CLERK_DEV_KEYS === "1";

  if (
    process.env.NODE_ENV === "production" &&
    pk.startsWith("pk_test_") &&
    !allowDev
  ) {
    console.warn(
      [
        "",
        "[vocab-learning] Clerk is configured with development keys (pk_test_*).",
        "Deployments reachable on the Internet need production Clerk keys (pk_live_ / sk_live_) and HTTPS.",
        "Staging override: set ALLOW_CLERK_DEV_KEYS=true in the environment.",
        "",
      ].join("\n"),
    );
  }
}
