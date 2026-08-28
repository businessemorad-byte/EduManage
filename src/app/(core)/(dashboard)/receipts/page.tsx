import { ReceiptsList } from "./receipts-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { FileOutput } from "lucide-react";

export default function ReceiptsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Receipts"
        description="Payment receipts generated from completed transactions."
        icon={<FileOutput className="h-5 w-5" />}
      />
      <ReceiptsList />
    </div>
  );
}
