import { getCurrentUser } from "@/lib/session";
import { getUserOrganizations } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { PlatformRole } from "@/lib/constants";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isPlatformOwner = user.role === PlatformRole.PLATFORM_OWNER;

  if (!isPlatformOwner) {
    const memberships = await getUserOrganizations(user.id);
    if (memberships.length === 0) {
      redirect("/onboarding");
    }
  }

  // Determine the effective organization type for the sidebar.
  // Mirrors the cookie-first logic in `requireOrgContext` (org-context.ts).
  let organizationType: string | undefined;
  if (!isPlatformOwner) {
    let memberships = await getUserOrganizations(user.id);
    let requestedOrgId: string | null = null;
    try {
      const cookieStore = await cookies();
      requestedOrgId = cookieStore.get("current_organization_id")?.value ?? null;
    } catch {
      // cookies() may fail outside of request context
    }

    if (requestedOrgId) {
      const selected = memberships.find((m) => m.organizationId === requestedOrgId);
      if (selected) {
        organizationType = selected.organization.type;
      }
    }

    if (!organizationType && memberships[0]) {
      organizationType = memberships[0].organization.type;
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar
        userName={user.name}
        userEmail={user.email}
        isPlatformOwner={isPlatformOwner}
        organizationType={organizationType}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar userName={user.name} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
