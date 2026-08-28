"use client";

import { useParams } from "next/navigation";
import { ParentDetail } from "./parent-detail";

export default function ParentDetailPage() {
  const params = useParams();
  return <ParentDetail parentId={params.id as string} />;
}
