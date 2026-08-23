import { DiscountsList } from "./discounts-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { Coins } from "lucide-react";

export default function DiscountsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Discounts"
        description="Manage discounts and promotional pricing."
        icon={<Coins className="h-5 w-5" />}
        action={
          <a href="/discounts/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700">
            + Create Discount
          </a>
        }
      />
      <DiscountsList />
    </div>
  );
}
