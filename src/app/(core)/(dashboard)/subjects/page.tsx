import { SubjectsList } from "./subjects-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { Award } from "lucide-react";

export default function SubjectsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Subjects"
        description="Manage subjects, courses, and course codes."
        icon={<Award className="h-5 w-5" />}
      />
      <SubjectsList />
    </div>
  );
}
