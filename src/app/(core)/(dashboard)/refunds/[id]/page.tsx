"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, TrendingUp, FileText, Calendar } from "lucide-react";

type RefundDetail = {
  id: string;
  amount: string;
  reason: string | null;
  refundedAt: string;
  payment: { receiptNumber: string; amount: string; method: string };
  invoice: { id: string; invoiceNumber: string; student: { person: { firstName: string; lastName: string } } };
};

export default function RefundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [refund, setRefund] = useState<RefundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/refunds/${params.id}`);
        if (!res.ok) throw new Error("Failed to load refund");
        const data = await res.json();
        setRefund(data.refund);
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
  if (!refund) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader title="Refund Details" icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Refund Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Amount</span><span className="text-lg font-semibold text-rose-600">{Number(refund.amount).toLocaleString()} DH</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Date</span><span>{new Date(refund.refundedAt).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Original Payment</span><span className="font-mono">{refund.payment.receiptNumber}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Payment Method</span><span>{refund.payment.method.replace("_", " ")}</span></div>
              {refund.reason && <div className="mt-2 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600"><span className="font-medium">Reason:</span> {refund.reason}</div>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">Related Invoice</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-zinc-400" /><span className="font-mono">{refund.invoice.invoiceNumber}</span></div>
              <div className="text-zinc-600">{refund.invoice.student.person.firstName} {refund.invoice.student.person.lastName}</div>
            </div>
            <button onClick={() => router.push(`/invoices/${refund.invoice.id}`)} className="mt-4 w-full rounded-lg border border-zinc-200 py-2 text-sm font-medium transition-colors hover:bg-zinc-50">
              View Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
