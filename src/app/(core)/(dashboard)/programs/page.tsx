import { ProgramsList } from "./programs-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { BookOpen } from "lucide-react";

export default function ProgramsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Programs"
        description="Define and manage academic programs and curricula."
        icon={<BookOpen className="h-5 w-5" />}
      />
      <ProgramsList />
    </div>
  );
}
