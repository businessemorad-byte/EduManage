import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-20 sm:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(37,99,235,0.12),transparent)]" />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Prêt à reprendre le contrôle de votre organisation ?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-400">
          Centralisez vos opérations, gagnez du temps et pilotez votre activité
          avec une plateforme conçue pour l&apos;éducation moderne.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-zinc-900 shadow-lg shadow-white/10 transition-all hover:bg-zinc-100 hover:shadow-xl"
          >
            <Sparkles className="h-4 w-4 text-brand-600" />
            Commencer gratuitement
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-7 py-3.5 text-sm font-semibold text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-900 hover:text-white"
          >
            Découvrir EduManage
          </Link>
        </div>

        <p className="mt-6 text-sm text-zinc-500">
          -50% sur le 1er mois · Sans engagement
        </p>
      </div>
    </section>
  );
}
