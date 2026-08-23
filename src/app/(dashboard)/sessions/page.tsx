import { SessionsList } from "./sessions-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { CalendarDays } from "lucide-react";

export default function SessionsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Sessions"
        description="View and manage all scheduled sessions."
        icon={<CalendarDays className="h-5 w-5" />}
        action={
          <a href="/sessions/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700">
            + New Session
          </a>
        }
      />
      <SessionsList />
    </div>
  );
}
