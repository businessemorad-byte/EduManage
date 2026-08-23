"use client";

import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  issuedAt: string;
  paidAt: string | null;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    const url = filter ? `/api/billing/invoices?status=${filter}` : "/api/billing/invoices";
    fetch(url)
      .then((r) => r.json())
      .then(setInvoices)
      .catch(() => {});
  }, [filter]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded px-3 py-1 text-sm">
          <option value="">All</option>
          <option value="PAID">Paid</option>
          <option value="OPEN">Open</option>
          <option value="DRAFT">Draft</option>
          <option value="VOID">Void</option>
        </select>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-zinc-50 dark:bg-zinc-800 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">Invoice #</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Issued</th>
              <th className="px-4 py-3 font-medium">Paid</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No invoices found</td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id} className="border-b last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                <td className="px-4 py-3">{inv.totalAmount}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    inv.status === "PAID" ? "bg-green-100 text-green-800" :
                    inv.status === "OPEN" ? "bg-yellow-100 text-yellow-800" :
                    inv.status === "VOID" ? "bg-zinc-100 text-zinc-600" :
                    "bg-zinc-100 text-zinc-800"
                  }`}>{inv.status}</span>
                </td>
                <td className="px-4 py-3">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
