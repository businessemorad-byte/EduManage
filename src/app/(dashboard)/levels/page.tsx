import { LevelsList } from "./levels-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { BookOpen } from "lucide-react";

export default function LevelsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Levels"
        description="Define grade levels and academic stages."
        icon={<BookOpen className="h-5 w-5" />}
      />
      <LevelsList />
    </div>
  );
}
