import { TimetableGrid } from "./timetable-grid";
import { PageHeader } from "@/components/dashboard/page-header";
import { Calendar } from "lucide-react";

export default function TimetablePage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Timetable"
        description="Plan and manage class schedules and timetables."
        icon={<Calendar className="h-5 w-5" />}
      />
      <TimetableGrid />
    </div>
  );
}
