import { GroupsList } from "./groups-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { Users } from "lucide-react";

export default function GroupsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Groups"
        description="Organize students into classes and groups."
        icon={<Users className="h-5 w-5" />}
      />
      <GroupsList />
    </div>
  );
}
