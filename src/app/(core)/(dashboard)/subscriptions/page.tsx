import { SubscriptionsList } from "./subscriptions-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { CalendarDays } from "lucide-react";

export default function SubscriptionsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Subscriptions" description="Manage monthly student subscription billing." icon={<CalendarDays className="h-5 w-5" />} />
      <SubscriptionsList />
    </div>
  );
}
