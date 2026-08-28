export function getPostLoginRedirect(
  from: string | null | undefined,
  role?: string | null,
  orgType?: string | null
): string {
  // Prevent open redirect: only allow relative paths starting with /
  // Reject protocol-relative (//evil.com), absolute (https://evil.com), and javascript: URIs
  if (from && from.startsWith("/") && !from.startsWith("//") && !from.includes("://")) {
    return from;
  }
  if (role === "PLATFORM_OWNER") return "/platform/dashboard";
  if (orgType === "TRAINING_CENTER") return "/training-dashboard";
  return "/school/dashboard";
}