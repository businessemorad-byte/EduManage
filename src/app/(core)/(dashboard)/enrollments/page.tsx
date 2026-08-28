import { EnrollmentsList } from "./enrollments-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { ClipboardCheck } from "lucide-react";

export default function EnrollmentsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Enrollments"
        description="Manage student enrollment and registration records."
        icon={<ClipboardCheck className="h-5 w-5" />}
      />
      <EnrollmentsList />
    </div>
  );
}
