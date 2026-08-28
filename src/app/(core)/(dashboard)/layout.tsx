import { getCurrentUser } from "@/lib/session";
import { getUserOrganizations } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { PlatformRole } from "@/lib/constants";
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

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar
        userName={user.name}
        userEmail={user.email}
        isPlatformOwner={isPlatformOwner}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar userName={user.name} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
