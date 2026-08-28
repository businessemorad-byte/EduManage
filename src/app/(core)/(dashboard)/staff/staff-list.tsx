"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type StaffMember = {
  id: string;
  employeeId: string | null;
  department: string | null;
  position: string | null;
  hireDate: string | null;
  teacher: { id: string; subjects: string[] | null } | null;
  trainer: { id: string; specialization: string | null } | null;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    status: string;
  };
};

function StaffListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/staff?${params.toString()}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        setStaff(data.staff ?? []);
        setPagination(data.pagination ?? { page: 1, totalPages: 1, total: 0 });
      })
      .catch((e) => { if (e.name !== "AbortError") setError("Failed to load staff"); })
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
            <SearchInput placeholder="Search staff..." />
          </div>
          <FilterBar
            filters={[
              {
                key: "department",
                label: "All Departments",
                options: [
                  { value: "Administration", label: "Administration" },
                  { value: "Academic", label: "Academic" },
                  { value: "Finance", label: "Finance" },
                  { value: "Operations", label: "Operations" },
                  { value: "IT", label: "IT" },
                ],
              },
            ]}
          />
        </div>
        <button
          onClick={() => startTransition(() => router.push("/staff/new"))}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
        >
          Add Staff
        </button>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          title="No staff found"
          description="Get started by adding your first staff member."
        />
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: "name",
                header: "Name",
                render: (s: StaffMember) => (
                  <span className="font-medium">{s.person.firstName} {s.person.lastName}</span>
                ),
              },
              { key: "email", header: "Email", render: (s: StaffMember) => s.person.email ?? "—" },
              { key: "position", header: "Position", render: (s: StaffMember) => s.position ?? "—" },
              { key: "department", header: "Department", render: (s: StaffMember) => s.department ?? "—" },
              { key: "employeeId", header: "Employee ID", render: (s: StaffMember) => s.employeeId ?? "—" },
              {
                key: "type",
                header: "Type",
                render: (s: StaffMember) => s.teacher ? "Teacher" : s.trainer ? "Trainer" : "Staff",
              },
            ]}
            data={staff}
            onRowClick={(item) => startTransition(() => router.push(`/staff/${item.id}`))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export function StaffList() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StaffListInner />
    </Suspense>
  );
}
