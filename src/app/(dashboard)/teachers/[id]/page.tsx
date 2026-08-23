"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "@/components/ui/loading-state";

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/staff/${params.id}`);
  }, [params.id, router]);

  return <div className="p-6"><LoadingState message="Redirecting..." /></div>;
}
