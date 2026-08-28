import { RefundsList } from "./refunds-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { TrendingUp } from "lucide-react";

export default function RefundsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Refunds" description="Track and manage all refund transactions." icon={<TrendingUp className="h-5 w-5" />} />
      <RefundsList />
    </div>
  );
}
