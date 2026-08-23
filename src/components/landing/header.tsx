"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, GraduationCap } from "lucide-react";

const navItems = [
  { label: "Produit", href: "#produit" },
  { label: "Solutions", href: "#solutions" },
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "IA", href: "#ia" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "Ressources", href: "#ressources" },
];

export default function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <GraduationCap className="h-7 w-7 text-brand-600" strokeWidth={2.2} />
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            EduManage
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-zinc-400">
            <span className="font-semibold text-zinc-700">FR</span>
            <span>/</span>
            <span className="cursor-pointer transition-colors hover:text-zinc-700">EN</span>
          </span>
          <Link
            href="/login"
            className="rounded-md px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Commencer gratuitement
          </Link>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-zinc-500 hover:bg-zinc-100 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-zinc-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4">
            <Link
              href="/login"
              className="rounded-md px-3 py-2.5 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
