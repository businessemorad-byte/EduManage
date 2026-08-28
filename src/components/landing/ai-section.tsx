import { Brain } from "lucide-react";
import type { LandingProps } from "./i18n-props";

const queryEmojis = ["📉", "💳", "📊", "💰", "📋", "📅"];

export default function AiSection({ dict }: LandingProps) {
  const ai = dict.aiSection;

  return (
    <section className="relative overflow-hidden bg-zinc-950 py-20 sm:py-24" id="ia">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(37,99,235,0.15),transparent)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5">
            <Brain className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-300">{ai.badge}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {ai.titleA}{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {ai.titleHighlight}
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">{ai.subtitle}</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ai.queries.map((question, i) => (
            <div
              key={i}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="mb-3 text-2xl">{queryEmojis[i % queryEmojis.length]}</div>
              <p className="text-sm font-medium leading-relaxed text-zinc-300">
                &ldquo;{question}&rdquo;
              </p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-sm text-zinc-500">{ai.footer}</p>
        </div>
      </div>
    </section>
  );
}