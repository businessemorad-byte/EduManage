"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, GraduationCap, ChevronDown } from "lucide-react";
import { localizedLink, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import LocaleSwitcher from "./locale-switcher";

type HeaderProps = {
  lang: Locale;
  nav: Dictionary["nav"];
  common: Dictionary["common"];
};

type DropdownKey = "solutions" | "resources";

export default function LandingHeader({ lang, nav, common }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);

  const link = (href: string) => localizedLink(href, lang);

  const dropdowns: { key: DropdownKey; label: string; items: { label: string; desc: string; href: string }[] }[] = [
    { key: "solutions", label: nav.solutions.label, items: nav.solutions.items },
    { key: "resources", label: nav.resources.label, items: nav.resources.items },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={link("/")}
          className="flex items-center gap-2.5"
          onClick={() => setMobileOpen(false)}
        >
          <GraduationCap className="h-7 w-7 text-brand-600" strokeWidth={2.2} />
          <span className="text-lg font-bold tracking-tight text-zinc-900">EduManage</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <Link
            href={link(nav.features.href)}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            {nav.features.label}
          </Link>

          {dropdowns.map((dd) => (
            <div key={dd.key} className="relative">
              <button
                type="button"
                aria-expanded={openDropdown === dd.key}
                aria-haspopup="true"
                onClick={() => setOpenDropdown(openDropdown === dd.key ? null : dd.key)}
                className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              >
                {dd.label}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${openDropdown === dd.key ? "rotate-180" : ""}`}
                />
              </button>
              {openDropdown === dd.key && (
                <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-zinc-100 bg-white p-2 shadow-xl shadow-zinc-200/50">
                  {dd.items.map((item) => (
                    <Link
                      key={item.href}
                      href={link(item.href)}
                      onClick={() => {
                        setOpenDropdown(null);
                        setMobileOpen(false);
                      }}
                      className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-brand-50"
                    >
                      <span className="text-sm font-semibold text-zinc-900">{item.label}</span>
                      <span className="text-xs text-zinc-500">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Link
            href={link(nav.ai.href)}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            {nav.ai.label}
          </Link>

          <Link
            href={link(nav.pricing.href)}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            {nav.pricing.label}
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher lang={lang} label={common.language} />
          <Link
            href="/login"
            className="rounded-md px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            {common.login}
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            {common.getStarted}
          </Link>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-zinc-500 hover:bg-zinc-100 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? common.closeMenu : common.openMenu}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-zinc-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {[
              { label: nav.features.label, href: link(nav.features.href) },
              { label: nav.ai.label, href: link(nav.ai.href) },
              { label: nav.pricing.label, href: link(nav.pricing.href) },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {dropdowns.map((dd) => (
              <div key={dd.key}>
                <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {dd.label}
                </p>
                <div className="flex flex-col gap-1">
                  {dd.items.map((item) => (
                    <Link
                      key={item.href}
                      href={link(item.href)}
                      className="rounded-md px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="block">{item.label}</span>
                      <span className="block text-xs font-normal text-zinc-400">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4">
            <LocaleSwitcher lang={lang} label={common.language} />
            <Link
              href="/login"
              className="rounded-md px-3 py-2.5 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              onClick={() => setMobileOpen(false)}
            >
              {common.login}
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              onClick={() => setMobileOpen(false)}
            >
              {common.getStarted}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}