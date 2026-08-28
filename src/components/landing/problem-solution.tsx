import {
  MessageSquare,
  FileSpreadsheet,
  FileText,
  Layers,
  CheckCircle2,
} from "lucide-react";
import type { LandingProps } from "./i18n-props";

const problemIcons = [MessageSquare, FileSpreadsheet, FileText, Layers];

export default function ProblemSolution({ dict }: LandingProps) {
  const ps = dict.problemSolution;

  return (
    <section className="bg-white py-20 sm:py-24" id="produit">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            {ps.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {ps.title}
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {ps.problems.map((label, i) => {
            const Icon = problemIcons[i] ?? Layers;
            return (
              <div
                key={label}
                className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50/50 px-5 py-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
                  <Icon className="h-4.5 w-4.5 text-red-500" />
                </div>
                <span className="text-sm font-medium text-red-700">{label}</span>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-10 max-w-3xl text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">{ps.solution}</span>
          </div>
          <p className="mt-6 text-lg text-zinc-600">{ps.closing}</p>
        </div>
      </div>
    </section>
  );
}