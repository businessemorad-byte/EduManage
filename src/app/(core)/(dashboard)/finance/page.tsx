import { FinanceDashboard } from "./finance-dashboard";
import { PageHeader } from "@/components/dashboard/page-header";
import { BarChart3 } from "lucide-react";

export default function FinancePage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Finance"
        description="Track revenue, payments, and financial health."
        icon={<BarChart3 className="h-5 w-5" />}
      />
      <FinanceDashboard />
    </div>
  );
}
