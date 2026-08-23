"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Search } from "lucide-react";

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
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-100 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex h-14 items-center justify-between px-6 lg:px-8">
        <div className="ml-10 lg:ml-0">
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <span className="text-zinc-300 dark:text-zinc-600">/</span>}
                {i === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
            <Search className="h-4 w-4" />
          </button>
          <button className="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
