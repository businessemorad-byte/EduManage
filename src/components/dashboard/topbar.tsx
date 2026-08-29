"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

type TopBarProps = {
  userName: string;
};

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let path = "";

  for (const seg of segments) {
    path += `/${seg}`;
    const label = seg
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, href: path });
  }

  return crumbs;
}

export function TopBar({ userName }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumbs = getBreadcrumbs(pathname);
  const isPlatform = pathname.startsWith("/platform");

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const basePath = isPlatform ? "/platform/search" : "/school/search";
    router.push(`${basePath}?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  }

  function loadNotifications() {
    if (notifOpen) { setNotifOpen(false); return; }
    setNotifOpen(true);
    setNotifLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications ?? []))
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-6 lg:px-8">
        <div className="ml-10 lg:ml-0">
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <span className="text-zinc-300">/</span>}
                {i === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-zinc-900">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div ref={searchRef} className="relative">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <Search className="h-4 w-4" />
            </button>
            {searchOpen && (
              <form
                onSubmit={handleSearch}
                className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-zinc-400" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="rounded p-1 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={loadNotifications}
              className="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-zinc-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                  <span className="text-sm font-semibold text-zinc-900">
                    Notifications
                  </span>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="rounded p-1 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifLoading ? (
                    <div className="p-4 text-center text-sm text-zinc-500">Chargement...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-zinc-500">Aucune notification</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={`border-b border-zinc-50 px-4 py-3 last:border-0 ${n.read ? "opacity-60" : ""}`}
                      >
                        <p className="text-sm font-medium text-zinc-900">
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="mt-1 text-[10px] text-zinc-400">
                          {new Date(n.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
