import { AttendanceList } from "./attendance-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { BarChart3 } from "lucide-react";

export default function AttendancePage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Attendance"
        description="Track student attendance and generate reports."
        icon={<BarChart3 className="h-5 w-5" />}
      />
      <AttendanceList />
    </div>
  );
}
