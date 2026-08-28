import { AcademicYearsList } from "./academic-years-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { CalendarDays } from "lucide-react";

export default function AcademicYearsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Academic Years"
        description="Configure academic years, terms, and semesters."
        icon={<CalendarDays className="h-5 w-5" />}
      />
      <AcademicYearsList />
    </div>
  );
}
