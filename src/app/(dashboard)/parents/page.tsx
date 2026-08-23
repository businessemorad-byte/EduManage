import { ParentsList } from "./parents-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { Baby } from "lucide-react";

export default function ParentsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Parents"
        description="Manage parent profiles and student guardianship records."
        icon={<Baby className="h-5 w-5" />}
      />
      <ParentsList />
    </div>
  );
}
