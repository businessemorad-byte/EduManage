import { InvoicesList } from "./invoices-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { FileText } from "lucide-react";

export default function InvoicesPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Invoices"
        description="Generate, send, and track invoices."
        icon={<FileText className="h-5 w-5" />}
        action={
          <a href="/invoices/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700">
            + Create Invoice
          </a>
        }
      />
      <InvoicesList />
    </div>
  );
}
