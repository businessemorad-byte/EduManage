import { AssessmentsList } from "./assessments-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { FileText } from "lucide-react";

export default function AssessmentsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Assessments"
        description="Create and manage quizzes, exams, and evaluations."
        icon={<FileText className="h-5 w-5" />}
      />
      <AssessmentsList />
    </div>
  );
}
