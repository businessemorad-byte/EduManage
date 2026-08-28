import { PaymentsList } from "./payments-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Payments"
        description="Track and manage all payment transactions."
        icon={<CreditCard className="h-5 w-5" />}
        action={
          <a href="/payments/new" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700">
            + Record Payment
          </a>
        }
      />
      <PaymentsList />
    </div>
  );
}
