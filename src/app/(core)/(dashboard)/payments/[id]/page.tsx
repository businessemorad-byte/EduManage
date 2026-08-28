"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, CreditCard, FileText, User, Calendar, Hash } from "lucide-react";

type PaymentDetail = {
  id: string;
  receiptNumber: string;
  amount: string;
  method: string;
  status: string;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: string;
    paidAmount: string;
    student: { person: { firstName: string; lastName: string } };
  };
  refund: { id: string; amount: string } | null;
};

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/payments/${params.id}`);
        if (!res.ok) throw new Error("Failed to load payment");
        const data = await res.json();
        setPayment(data.payment);
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
  if (!payment) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader title="Payment Details" description={`Receipt ${payment.receiptNumber}`} icon={<CreditCard className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Payment Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Receipt Number</span><span className="font-mono font-medium">{payment.receiptNumber}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Amount</span><span className="text-lg font-semibold">{Number(payment.amount).toLocaleString()} DH</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Method</span><span className="font-medium">{payment.method.replace("_", " ")}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Date</span><span>{new Date(payment.paidAt).toLocaleDateString()}</span></div>
              {payment.reference && <div className="flex justify-between"><span className="text-zinc-500">Reference</span><span className="font-mono">{payment.reference}</span></div>}
              {payment.notes && <div className="mt-2 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">{payment.notes}</div>}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Related Invoice</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Invoice #</span><span className="font-mono font-medium">{payment.invoice.invoiceNumber}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Student</span><span>{payment.invoice.student.person.firstName} {payment.invoice.student.person.lastName}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Total</span><span>{Number(payment.invoice.totalAmount).toLocaleString()} DH</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Paid</span><span className="text-green-600">{Number(payment.invoice.paidAmount).toLocaleString()} DH</span></div>
            </div>
            <button onClick={() => router.push(`/invoices/${payment.invoice.id}`)} className="mt-4 w-full rounded-lg border border-zinc-200 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
              View Invoice
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Status</h3>
            <StatusBadge status={payment.status} />
            {payment.refund && (
              <div className="mt-4 rounded-lg bg-rose-50 p-3 dark:bg-rose-950">
                <div className="text-xs font-medium text-rose-700 dark:text-rose-300">Refunded</div>
                <div className="text-sm font-semibold text-rose-600">{Number(payment.refund.amount).toLocaleString()} DH</div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button onClick={() => router.push(`/invoices/${payment.invoice.id}`)} className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
              View Invoice
            </button>
            {payment.status === "COMPLETED" && !payment.refund && (
              <button onClick={() => router.push(`/refunds/new?paymentId=${payment.id}`)} className="w-full rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950">
                Process Refund
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
