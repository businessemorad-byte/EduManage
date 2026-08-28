"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { PageHeader } from "@/components/dashboard/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { ArrowLeft, TrendingUp } from "lucide-react";

type Payment = {
  id: string;
  receiptNumber: string;
  amount: string;
  method: string;
  status: string;
  paidAt: string;
  invoice: { invoiceNumber: string; studentName: string };
};

export default function NewRefundPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPaymentId = searchParams.get("paymentId") ?? "";
  const { data, loading } = useFetch<{ payments: Payment[] }>("/api/payments");

  const [paymentId, setPaymentId] = useState(preselectedPaymentId);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedPaymentId) setPaymentId(preselectedPaymentId);
  }, [preselectedPaymentId]);

  const eligible = useMemo(
    () => (data?.payments ?? []).filter((p) => p.status === "COMPLETED"),
    [data],
  );

  const selectedPayment = eligible.find((p) => p.id === paymentId);
  const maxRefund = selectedPayment ? Number(selectedPayment.amount) : 0;

  if (loading) return <LoadingState />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!paymentId) return setError("Please select a payment.");
    if (!amount || Number(amount) <= 0) return setError("Amount must be greater than 0.");
    if (Number(amount) > maxRefund) return setError(`Refund amount cannot exceed the payment amount of ${maxRefund.toLocaleString()} DH.`);

    setSubmitting(true);
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, amount: Number(amount), reason: reason || undefined }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to create refund");
      router.push("/refunds");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader title="Process Refund" description="Refund a completed payment." icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Payment *</label>
            <select value={paymentId} onChange={(e) => setPaymentId(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
              <option value="">Select a completed payment</option>
              {eligible.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.receiptNumber} — {p.invoice.studentName} ({Number(p.amount).toLocaleString()} DH)
                </option>
              ))}
            </select>
          </div>

          {selectedPayment && (
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-zinc-500">Invoice</span><div className="font-mono">{selectedPayment.invoice.invoiceNumber}</div></div>
                <div><span className="text-zinc-500">Student</span><div className="font-medium">{selectedPayment.invoice.studentName}</div></div>
                <div><span className="text-zinc-500">Payment Amount</span><div className="font-semibold">{Number(selectedPayment.amount).toLocaleString()} DH</div></div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Refund Amount (DH) *</label>
            <input type="number" step="0.01" min="0" max={maxRefund} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100" placeholder="0.00" />
            {maxRefund > 0 && <p className="mt-1 text-xs text-zinc-400">Max refundable: {maxRefund.toLocaleString()} DH</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100" placeholder="Reason for refund (optional)" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-50">
            {submitting ? "Processing..." : "Process Refund"}
          </button>
        </div>
      </form>
    </div>
  );
}
