"use client";

import { useState, useEffect } from "react";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  category: string | null;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function fetchNotifications() {
    setLoading(true);
    const params = filter === "unread" ? "?unread=true" : "";
    const [notifRes, countRes] = await Promise.all([
      fetch(`/api/notifications${params}`),
      fetch("/api/notifications?count=true"),
    ]);
    const notifData = await notifRes.json();
    const countData = await countRes.json();
    setNotifications(notifData.notifications ?? []);
    setUnreadCount(countData.count ?? 0);
    setLoading(false);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    fetchNotifications();
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    });
    fetchNotifications();
  }

  async function removeNotification(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    fetchNotifications();
  }

  const typeColors: Record<string, string> = {
    INFO: "bg-blue-100 text-blue-800",
    WARNING: "bg-yellow-100 text-yellow-800",
    SUCCESS: "bg-green-100 text-green-800",
    ERROR: "bg-red-100 text-red-800",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-zinc-500">{unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter(filter === "all" ? "unread" : "all")}
            className="px-3 py-1 text-sm border rounded hover:bg-zinc-50"
          >
            {filter === "all" ? "Show Unread" : "Show All"}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-3 py-1 text-sm bg-zinc-900 text-white rounded hover:bg-zinc-800"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-zinc-500">No notifications.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-lg border ${n.read ? "bg-white" : "bg-blue-50 border-blue-200"}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${typeColors[n.type] ?? "bg-zinc-100"}`}>
                      {n.type}
                    </span>
                    {n.category && (
                      <span className="text-xs text-zinc-500">{n.category}</span>
                    )}
                  </div>
                  <h3 className="font-medium">{n.title}</h3>
                  <p className="text-sm text-zinc-600 mt-1">{n.body}</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1 ml-4">
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => removeNotification(n.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
