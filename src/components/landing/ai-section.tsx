import { Brain, Sparkles, ArrowRight } from "lucide-react";

const queries = [
  {
    question: "Quels étudiants présentent une baisse de performance ?",
    icon: "📉",
  },
  {
    question: "Quels paiements sont en retard ce mois-ci ?",
    icon: "💳",
  },
  {
    question: "Résume les performances de la classe Terminale S.",
    icon: "📊",
  },
  {
    question: "Analyse mes revenus et dépenses de juillet.",
    icon: "💰",
  },
  {
    question: "Génère un rapport de progression pour les parents.",
    icon: "📋",
  },
  {
    question: "Quelles sont les principales absences cette semaine ?",
    icon: "📅",
  },
];

export default function AiSection() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-20 sm:py-24" id="ia">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(37,99,235,0.15),transparent)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5">
            <Brain className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-300">Intelligence artificielle</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Plus qu&apos;un logiciel de gestion.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Un assistant intelligent.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
            L&apos;IA d&apos;EduManage analyse vos données en temps réel et vous
            fournit des insights actionnables pour améliorer votre organisation.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {queries.map((q) => (
            <div
              key={q.question}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="mb-3 text-2xl">{q.icon}</div>
              <p className="text-sm font-medium leading-relaxed text-zinc-300">
                &ldquo;{q.question}&rdquo;
              </p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-sm text-zinc-500">
            L&apos;IA est intégrée à toutes les modules d&apos;EduManage —
            Présences, Notes, Finance, Communication et plus encore.
          </p>
        </div>
      </div>
    </section>
  );
}
