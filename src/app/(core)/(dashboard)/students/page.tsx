import { StudentsList } from "./students-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { GraduationCap } from "lucide-react";

export default function StudentsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Students"
        description="Manage student enrollment, profiles, and records."
        icon={<GraduationCap className="h-5 w-5" />}
      />
      <StudentsList />
    </div>
  );
}
