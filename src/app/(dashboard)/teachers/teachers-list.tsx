"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type Teacher = {
  id: string;
  subjects: string[] | null;
  qualification: string | null;
  yearsExperience: number | null;
  staff: {
    id: string;
    employeeId: string | null;
    department: string | null;
    person: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      status: string;
    };
  };
};

function TeachersListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/teachers?${params.toString()}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        setTeachers(data.teachers ?? []);
        setPagination(data.pagination ?? { page: 1, totalPages: 1, total: 0 });
      })
      .catch((e) => { if (e.name !== "AbortError") setError("Failed to load teachers"); })
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
        <h1 className="text-2xl font-bold tracking-tight">Teachers</h1>
        <button
          onClick={() => startTransition(() => router.push("/staff/new?roleType=teacher"))}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add Teacher
        </button>
      </div>

      <div className="w-72">
        <SearchInput placeholder="Search teachers..." />
      </div>

      {teachers.length === 0 ? (
        <EmptyState
          title="No teachers found"
          description="Get started by adding your first teacher."
        />
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: "name",
                header: "Name",
                render: (t: Teacher) => (
                  <span className="font-medium">{t.staff.person.firstName} {t.staff.person.lastName}</span>
                ),
              },
              { key: "email", header: "Email", render: (t: Teacher) => t.staff.person.email ?? "—" },
              { key: "department", header: "Department", render: (t: Teacher) => t.staff.department ?? "—" },
              {
                key: "subjects",
                header: "Subjects",
                render: (t: Teacher) => (Array.isArray(t.subjects) ? t.subjects.join(", ") : "—"),
              },
              { key: "qualification", header: "Qualification", render: (t: Teacher) => t.qualification ?? "—" },
            ]}
            data={teachers}
            onRowClick={(item) => startTransition(() => router.push(`/staff/${item.staff?.id}`))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export function TeachersList() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TeachersListInner />
    </Suspense>
  );
}
