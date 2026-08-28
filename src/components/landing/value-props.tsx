import { Clock, LayoutDashboard, BarChart3, Rocket } from "lucide-react";
import type { LandingProps } from "./i18n-props";

const valueIcons = [Clock, LayoutDashboard, BarChart3, Rocket];
const valueColors = [
  "text-brand-600 bg-brand-50",
  "text-emerald-600 bg-emerald-50",
  "text-violet-600 bg-violet-50",
  "text-amber-600 bg-amber-50",
];

export default function ValueProps({ dict }: LandingProps) {
  const vp = dict.valueProps;

  return (
    <section className="bg-zinc-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            {vp.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {vp.title}
          </h2>
          <p className="mt-4 text-lg text-zinc-600">{vp.subtitle}</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {vp.items.map((v, i) => {
            const Icon = valueIcons[i] ?? Clock;
            return (
              <div
                key={v.title}
                className="group rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/50"
              >
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${valueColors[i % valueColors.length]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{v.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}