import { ArrowRight } from "lucide-react";
import type { LandingProps } from "./i18n-props";

const workflowColors = [
  { card: "border-l-red-400 bg-red-50", text: "text-red-700" },
  { card: "border-l-amber-400 bg-amber-50", text: "text-amber-700" },
  { card: "border-l-emerald-400 bg-emerald-50", text: "text-emerald-700" },
  { card: "border-l-brand-400 bg-brand-50", text: "text-brand-700" },
];

export default function Automation({ dict }: LandingProps) {
  const a = dict.automation;

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            {a.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {a.title}
          </h2>
          <p className="mt-4 text-lg text-zinc-600">{a.subtitle}</p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl space-y-4">
          {a.workflows.map((w, i) => {
            const color = workflowColors[i % workflowColors.length];
            return (
              <div
                key={w.trigger}
                className={`flex flex-col items-center gap-3 rounded-xl border border-l-4 p-5 sm:flex-row sm:gap-5 ${color.card}`}
              >
                <div className="flex-1">
                  <p className={`text-sm font-bold ${color.text}`}>{w.trigger}</p>
                </div>
                <ArrowRight className="hidden h-4 w-4 text-zinc-400 sm:block" />
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm text-zinc-700">{w.action}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}