"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { PageHeader } from "@/components/dashboard/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { ArrowLeft, CreditCard } from "lucide-react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: string;
  paidAmount: string;
  student: { person: { firstName: string; lastName: string } };
};

export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedInvoiceId = searchParams.get("invoiceId") ?? "";
  const { data, loading } = useFetch<{ invoices: Invoice[] }>("/api/invoices");

  const [invoiceId, setInvoiceId] = useState(preselectedInvoiceId);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedInvoiceId) setInvoiceId(preselectedInvoiceId);
  }, [preselectedInvoiceId]);

  const eligible = useMemo(
    () => (data?.invoices ?? []).filter((i) => ["PENDING", "PARTIAL"].includes(i.status)),
    [data],
  );

  const selectedInvoice = eligible.find((i) => i.id === invoiceId);
  const outstanding = selectedInvoice
    ? Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount)
    : 0;

  if (loading) return <LoadingState />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!invoiceId) return setError("Please select an invoice.");
    if (!amount || Number(amount) <= 0) return setError("Amount must be greater than 0.");
    if (Number(amount) > outstanding) return setError(`Amount exceeds outstanding balance of ${outstanding.toLocaleString()} DH.`);

    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          amount: Number(amount),
          method,
          reference: reference || undefined,
          notes: notes || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to record payment");
      router.push("/payments");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader title="Record Payment" description="Record a payment against an invoice." icon={<CreditCard className="h-5 w-5" />} />
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6">
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Invoice *</label>
            <select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
              <option value="">Select an invoice</option>
              {eligible.map((inv) => {
                const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount);
                return (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — {inv.student.person.firstName} {inv.student.person.lastName} ({outstanding.toLocaleString()} DH outstanding)
                  </option>
                );
              })}
            </select>
          </div>

          {selectedInvoice && (
            <div className="rounded-lg bg-zinc-50 p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-zinc-500">Total</span><div className="font-medium">{Number(selectedInvoice.totalAmount).toLocaleString()} DH</div></div>
                <div><span className="text-zinc-500">Paid</span><div className="font-medium text-green-600">{Number(selectedInvoice.paidAmount).toLocaleString()} DH</div></div>
                <div><span className="text-zinc-500">Outstanding</span><div className="font-medium text-amber-600">{outstanding.toLocaleString()} DH</div></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Amount (DH) *</label>
              <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" placeholder="0.00" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Method *</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Card</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CHECK">Check</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Reference</label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" placeholder="Transaction reference (optional)" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" placeholder="Optional notes" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-50">
            {submitting ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}
