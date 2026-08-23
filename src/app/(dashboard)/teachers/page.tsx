import { TeachersList } from "./teachers-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { UserCheck } from "lucide-react";

export default function TeachersPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Teachers"
        description="Manage teacher profiles, qualifications, and assignments."
        icon={<UserCheck className="h-5 w-5" />}
      />
      <TeachersList />
    </div>
  );
}
