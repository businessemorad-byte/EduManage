import { FeePlansList } from "./fee-plans-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { Wallet } from "lucide-react";

export default function FeePlansPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Fee Plans"
        description="Configure fee structures for your programs."
        icon={<Wallet className="h-5 w-5" />}
        action={
          <a href="/fee-plans/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700">
            + Create Fee Plan
          </a>
        }
      />
      <FeePlansList />
    </div>
  );
}
