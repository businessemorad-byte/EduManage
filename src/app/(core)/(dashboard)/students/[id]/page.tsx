"use client";

import { useParams } from "next/navigation";
import { StudentProfile } from "./student-profile";

export default function StudentDetailPage() {
  const params = useParams();
  return (
    <div className="p-8">
      <StudentProfile studentId={params.id as string} />
    </div>
  );
}
