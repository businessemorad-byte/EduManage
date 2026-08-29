"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type Parent = {
  id: string;
  occupation: string | null;
  workplace: string | null;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    status: string;
  };
};

function ParentsListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [parents, setParents] = useState<Parent[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/parents?${params.toString()}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        setParents(data.parents ?? []);
        setPagination(data.pagination ?? { page: 1, totalPages: 1, total: 0 });
      })
      .catch((e) => { if (e.name !== "AbortError") setError("Failed to load parents"); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [searchParams]);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Parents</h1>
        <button
          onClick={() => startTransition(() => router.push("/parents/new"))}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Add Parent
        </button>
      </div>

      <div className="w-72">
        <SearchInput placeholder="Search parents..." />
      </div>

      {parents.length === 0 ? (
        <EmptyState
          title="No parents found"
          description="Get started by adding your first parent."
        />
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: "name",
                header: "Name",
                render: (p: Parent) => (
                  <span className="font-medium">{p.person.firstName} {p.person.lastName}</span>
                ),
              },
              { key: "email", header: "Email", render: (p: Parent) => p.person.email ?? "—" },
              { key: "phone", header: "Phone", render: (p: Parent) => p.person.phone ?? "—" },
              { key: "occupation", header: "Occupation", render: (p: Parent) => p.occupation ?? "—" },
            ]}
            data={parents}
            onRowClick={(item) => startTransition(() => router.push(`/parents/${item.id}`))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export function ParentsList() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ParentsListInner />
    </Suspense>
  );
}
