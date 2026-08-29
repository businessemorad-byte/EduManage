"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, Building2, Users, Trash2 } from "lucide-react";

type RoomDetail = {
  id: string;
  name: string;
  capacity: number;
  status: string;
  type: string;
  isActive: boolean;
  branch: { name: string } | null;
};

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/rooms/${params.id}`);
        if (!res.ok) throw new Error("Failed to load room");
        const data = await res.json();
        setRoom(data.room);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this room? This may affect scheduled sessions.")) return;
    try {
      const res = await fetch(`/api/rooms/${params.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/rooms");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">{error}</div>;
  if (!room) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader title={room.name} description={`${room.type.replace("_", " ")} — ${room.branch?.name ?? "All branches"}`} icon={<Building2 className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Room Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Name</span><span className="font-medium">{room.name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Type</span><span>{room.type.replace("_", " ")}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Capacity</span><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-zinc-400" />{room.capacity} seats</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Branch</span><span>{room.branch?.name ?? "All"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Status</span><StatusBadge status={room.status} /></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">Status</h3>
            {room.isActive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" /> Inactive
              </span>
            )}
          </div>

          <div className="space-y-2">
            <button onClick={handleDelete} className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
              <Trash2 className="mr-1 inline h-4 w-4" />
              Delete Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
