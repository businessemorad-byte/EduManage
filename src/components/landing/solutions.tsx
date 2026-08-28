import { School, BookOpen, GraduationCap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { localizedLink } from "@/lib/i18n/config";
import type { LandingProps } from "./i18n-props";

const solutionIcons = [School, BookOpen, GraduationCap];
const solutionColors = [
  { iconBg: "bg-brand-500", title: "text-brand-700", bulb: "bg-brand-500" },
  { iconBg: "bg-emerald-500", title: "text-emerald-700", bulb: "bg-emerald-500" },
  { iconBg: "bg-violet-500", title: "text-violet-700", bulb: "bg-violet-500" },
];

export default function Solutions({ lang, dict }: LandingProps) {
  const s = dict.solutionsSection;

  return (
    <section className="bg-zinc-50 py-20 sm:py-24" id="solutions">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            {s.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {s.title}
          </h2>
          <p className="mt-4 text-lg text-zinc-600">{s.subtitle}</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-3">
          {s.items.map((item, i) => {
            const Icon = solutionIcons[i] ?? School;
            const color = solutionColors[i % solutionColors.length];
            return (
              <div
                key={item.title}
                className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-7 transition-all hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/50"
              >
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${color.iconBg} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">{item.title}</h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-zinc-600">
                  {item.description}
                </p>
                <ul className="mt-5 space-y-2">
                  {item.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-700">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${color.bulb}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={localizedLink(item.href, lang)}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
                >
                  {s.learnMore}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}