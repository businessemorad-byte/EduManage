"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Building2 } from "lucide-react";

type Room = {
  id: string;
  name: string;
  capacity: number;
  status: string;
  type: string;
  branch: { name: string } | null;
};

export function RoomsList() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { data, loading, error } = useFetch<{ rooms: Room[] }>("/api/rooms");

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<Building2 className="h-7 w-7" />}
        title="Failed to load rooms"
        description={error}
        action={<button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Retry</button>}
      />
    );
  }

  const rooms = data?.rooms ?? [];

  return (
    <div className="space-y-4">
      {rooms.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-7 w-7" />}
          title="No rooms yet"
          description="Create your first room to start scheduling sessions."
          action={<a href="/rooms/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">+ New Room</a>}
        />
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Name", render: (r: Room) => <span className="font-medium">{r.name}</span> },
            { key: "type", header: "Type", render: (r: Room) => r.type.replace("_", " ") },
            { key: "capacity", header: "Capacity", render: (r: Room) => <span>{r.capacity} seats</span> },
            { key: "branch", header: "Branch", render: (r: Room) => r.branch?.name ?? "All" },
            { key: "status", header: "Status", render: (r: Room) => <StatusBadge status={r.status} /> },
          ]}
          data={rooms}
          onRowClick={(r) => startTransition(() => router.push(`/rooms/${r.id}`))}
        />
      )}
    </div>
  );
}
