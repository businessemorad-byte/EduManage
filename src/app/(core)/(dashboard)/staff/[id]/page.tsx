"use client";

import { useParams } from "next/navigation";
import { StaffDetail } from "./staff-detail";

export default function StaffDetailPage() {
  const params = useParams();
  return <StaffDetail staffId={params.id as string} />;
}
