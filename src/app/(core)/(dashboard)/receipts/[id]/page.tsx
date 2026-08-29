"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, FileOutput, User, Calendar, CreditCard, Hash } from "lucide-react";

type ReceiptDetail = {
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
};

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/receipts/${params.id}`);
        if (!res.ok) throw new Error("Failed to load receipt");
        const data = await res.json();
        setReceipt(data.receipt);
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
  if (!receipt) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader
          title={receipt.receiptNumber}
          description={`Paid ${new Date(receipt.paidAt).toLocaleDateString()}`}
          icon={<FileOutput className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Receipt</h3>
            <div className="mb-6 flex items-baseline justify-between rounded-xl bg-green-50 p-4">
              <span className="text-sm font-medium text-green-700">Amount Paid</span>
              <span className="text-2xl font-bold text-green-700">{Number(receipt.amount).toLocaleString()} DH</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-zinc-400" /><span className="text-zinc-600">Receipt Number:</span><span className="font-mono font-medium">{receipt.receiptNumber}</span></div>
              <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-zinc-400" /><span className="text-zinc-600">Payment Method:</span><span>{receipt.method}</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-zinc-400" /><span className="text-zinc-600">Date:</span><span>{new Date(receipt.paidAt).toLocaleString()}</span></div>
              {receipt.reference && <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-zinc-400" /><span className="text-zinc-600">Reference:</span><span className="font-mono">{receipt.reference}</span></div>}
              {receipt.notes && <div className="mt-2 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">{receipt.notes}</div>}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Related Invoice</h3>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <div className="font-mono text-sm font-medium">{receipt.invoice.invoiceNumber}</div>
                <div className="flex items-center gap-2 text-sm text-zinc-500"><User className="h-3.5 w-3.5" />{receipt.invoice.student.person.firstName} {receipt.invoice.student.person.lastName}</div>
              </div>
              <div className="text-right text-sm">
                <div><span className="text-zinc-500">Total:</span> {Number(receipt.invoice.totalAmount).toLocaleString()} DH</div>
                <div className="text-green-600"><span className="text-zinc-500">Paid:</span> {Number(receipt.invoice.paidAmount).toLocaleString()} DH</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">Status</h3>
            <StatusBadge status={receipt.status} />
          </div>

          <div className="rounded-xl border bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">Quick Actions</h3>
            <Link href={`/invoices/${receipt.invoice.id}`} className="flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-4 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50">
              <FileOutput className="h-4 w-4" />
              View Invoice
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
