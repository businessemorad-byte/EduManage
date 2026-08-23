"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, FileText, User, Calendar, DollarSign, Package } from "lucide-react";

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: string;
  discountAmount: string;
  totalAmount: string;
  paidAmount: string;
  currency: string;
  dueDate: string | null;
  issuedAt: string;
  notes: string | null;
  student: { person: { firstName: string; lastName: string } };
  feePlan: { name: string } | null;
  items: { id: string; description: string; quantity: number; unitPrice: string; amount: string }[];
  payments: { id: string; amount: string; method: string; status: string; paidAt: string }[];
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/invoices/${params.id}`);
        if (!res.ok) throw new Error("Failed to load invoice");
        const data = await res.json();
        setInvoice(data.invoice);
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
  if (!invoice) return null;

  const outstanding = Number(invoice.totalAmount) - Number(invoice.paidAmount);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader
          title={`Invoice ${invoice.invoiceNumber}`}
          description={`Issued ${new Date(invoice.issuedAt).toLocaleDateString()}`}
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Invoice Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-zinc-700">
                    <th className="pb-2 text-left font-medium text-zinc-600 dark:text-zinc-400">Description</th>
                    <th className="pb-2 text-right font-medium text-zinc-600 dark:text-zinc-400">Qty</th>
                    <th className="pb-2 text-right font-medium text-zinc-600 dark:text-zinc-400">Unit Price</th>
                    <th className="pb-2 text-right font-medium text-zinc-600 dark:text-zinc-400">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b dark:border-zinc-800">
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">{Number(item.unitPrice).toLocaleString()} DH</td>
                      <td className="py-3 text-right font-medium">{Number(item.amount).toLocaleString()} DH</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-2 border-t pt-4 dark:border-zinc-700">
              <div className="flex justify-between text-sm"><span className="text-zinc-600 dark:text-zinc-400">Subtotal</span><span>{Number(invoice.subtotal).toLocaleString()} DH</span></div>
              {Number(invoice.discountAmount) > 0 && (
                <div className="flex justify-between text-sm"><span className="text-zinc-600 dark:text-zinc-400">Discount</span><span className="text-red-600">-{Number(invoice.discountAmount).toLocaleString()} DH</span></div>
              )}
              <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{Number(invoice.totalAmount).toLocaleString()} DH</span></div>
              <div className="flex justify-between text-sm"><span className="text-zinc-600 dark:text-zinc-400">Paid</span><span className="text-green-600">{Number(invoice.paidAmount).toLocaleString()} DH</span></div>
              {outstanding > 0 && <div className="flex justify-between text-sm font-semibold"><span className="text-amber-600">Outstanding</span><span className="text-amber-600">{outstanding.toLocaleString()} DH</span></div>}
            </div>
          </div>

          {invoice.payments.length > 0 && (
            <div className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Payment History</h3>
              <div className="space-y-3">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-3 dark:border-zinc-700">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={p.status} />
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{p.method}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{Number(p.amount).toLocaleString()} DH</div>
                      <div className="text-xs text-zinc-500">{new Date(p.paidAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-zinc-400" /><span>{invoice.student.person.firstName} {invoice.student.person.lastName}</span></div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-zinc-400" /><StatusBadge status={invoice.status} /></div>
              {invoice.dueDate && <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-zinc-400" /><span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span></div>}
              {invoice.feePlan && <div className="flex items-center gap-2"><Package className="h-4 w-4 text-zinc-400" /><span>{invoice.feePlan.name}</span></div>}
              {invoice.notes && <div className="mt-2 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">{invoice.notes}</div>}
            </div>
          </div>

          {outstanding > 0 && (
            <a href={`/payments/new?invoiceId=${invoice.id}`} className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700">
              <DollarSign className="h-4 w-4" />
              Record Payment ({outstanding.toLocaleString()} DH)
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
