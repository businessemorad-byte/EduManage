"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { GraduationCap } from "lucide-react";

type Student = {
  id: string;
  studentId: string | null;
  grade: string | null;
  enrollmentDate: string | null;
  createdAt: string;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    status: string;
  };
  guardians: {
    person: { firstName: string; lastName: string };
  }[];
};

function StudentsListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/students?${params.toString()}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        setStudents(data.students ?? []);
        setPagination(data.pagination ?? { page: 1, totalPages: 1, total: 0 });
      })
      .catch((e) => { if (e.name !== "AbortError") setError("Failed to load students"); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [searchParams]);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-72">
            <SearchInput placeholder="Search students..." />
          </div>
          <FilterBar
            filters={[
              {
                key: "grade",
                label: "All Grades",
                options: [
                  { value: "K", label: "Kindergarten" },
                  { value: "1", label: "Grade 1" },
                  { value: "2", label: "Grade 2" },
                  { value: "3", label: "Grade 3" },
                  { value: "4", label: "Grade 4" },
                  { value: "5", label: "Grade 5" },
                  { value: "6", label: "Grade 6" },
                  { value: "7", label: "Grade 7" },
                  { value: "8", label: "Grade 8" },
                  { value: "9", label: "Grade 9" },
                  { value: "10", label: "Grade 10" },
                  { value: "11", label: "Grade 11" },
                  { value: "12", label: "Grade 12" },
                ],
              },
            ]}
          />
        </div>
        <button
          onClick={() => startTransition(() => router.push("/students/new"))}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
        >
          Add Student
        </button>
      </div>

      {students.length === 0 ? (
        <EmptyState
          title="No students found"
          description="Get started by adding your first student."
          icon={<GraduationCap className="h-7 w-7" />}
        />
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: "name",
                header: "Name",
                render: (s: Student) => (
                  <span className="font-medium">{s.person.firstName} {s.person.lastName}</span>
                ),
              },
              { key: "email", header: "Email", render: (s: Student) => s.person.email ?? "—" },
              { key: "grade", header: "Grade", render: (s: Student) => s.grade ?? "—" },
              { key: "studentId", header: "Student ID", render: (s: Student) => s.studentId ?? "—" },
              {
                key: "status",
                header: "Status",
                render: (s: Student) => <StatusBadge status={s.person.status} />,
              },
              {
                key: "guardians",
                header: "Guardians",
                render: (s: Student) =>
                  s.guardians.length > 0
                    ? s.guardians.map((g) => `${g.person.firstName} ${g.person.lastName}`).join(", ")
                    : "—",
              },
            ]}
            data={students}
            onRowClick={(item) => startTransition(() => router.push(`/students/${item.id}`))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export function StudentsList() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StudentsListInner />
    </Suspense>
  );
}
