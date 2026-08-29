"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, CalendarDays, User, Package, DollarSign } from "lucide-react";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type SubscriptionDetail = {
  id: string;
  month: number;
  year: number;
  amount: string;
  discountAmount: string;
  status: string;
  dueDate: string | null;
  student: { person: { firstName: string; lastName: string } };
  feePlan: { name: string; amount: string };
  enrollment: { id: string } | null;
};

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/monthly-subscriptions/${params.id}`);
        if (!res.ok) throw new Error("Failed to load subscription");
        const data = await res.json();
        setSubscription(data.subscription);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) return <LoadingState />;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">{error}</div>;
  if (!subscription) return null;

  const studentName = `${subscription.student.person.firstName} ${subscription.student.person.lastName}`;
  const netAmount = Number(subscription.amount) - Number(subscription.discountAmount);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader title={`Subscription: ${studentName}`} description={`${MONTHS[subscription.month - 1]} ${subscription.year}`} icon={<CalendarDays className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Subscription Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Student</span><span className="font-medium">{studentName}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Fee Plan</span><span>{subscription.feePlan.name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Period</span><span>{MONTHS[subscription.month - 1]} {subscription.year}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Amount</span><span>{Number(subscription.amount).toLocaleString()} DH</span></div>
              {Number(subscription.discountAmount) > 0 && (
                <div className="flex justify-between"><span className="text-zinc-500">Discount</span><span className="text-rose-600">-{Number(subscription.discountAmount).toLocaleString()} DH</span></div>
              )}
              <div className="border-t pt-2"><div className="flex justify-between font-semibold"><span>Net Amount</span><span>{netAmount.toLocaleString()} DH</span></div></div>
              {subscription.dueDate && <div className="flex justify-between"><span className="text-zinc-500">Due Date</span><span>{new Date(subscription.dueDate).toLocaleDateString()}</span></div>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">Status</h3>
            <StatusBadge status={subscription.status} />
          </div>

          {subscription.status !== "PAID" && (
            <button onClick={() => router.push(`/payments/new?studentId=${subscription.student.person.firstName}`)} className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700">
              <DollarSign className="mr-1 inline h-4 w-4" />
              Record Payment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
