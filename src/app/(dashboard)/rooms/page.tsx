import { RoomsList } from "./rooms-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { Building2 } from "lucide-react";

export default function RoomsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Rooms"
        description="Manage classrooms, labs, and facilities."
        icon={<Building2 className="h-5 w-5" />}
        action={
          <a href="/rooms/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700">
            + New Room
          </a>
        }
      />
      <RoomsList />
    </div>
  );
}
