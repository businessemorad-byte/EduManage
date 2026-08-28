import { StaffList } from "./staff-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { Users } from "lucide-react";

export default function StaffPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Staff"
        description="Manage your staff members, departments, and roles."
        icon={<Users className="h-5 w-5" />}
      />
      <StaffList />
    </div>
  );
}
