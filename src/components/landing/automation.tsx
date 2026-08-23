import { ArrowRight } from "lucide-react";

const workflows = [
  {
    trigger: "Absence détectée",
    arrow: true,
    action: "Notification automatique envoyée au parent",
    color: "border-l-red-400 bg-red-50",
    textColor: "text-red-700",
  },
  {
    trigger: "Paiement en retard",
    arrow: true,
    action: "Rappel automatique envoyé au parent",
    color: "border-l-amber-400 bg-amber-50",
    textColor: "text-amber-700",
  },
  {
    trigger: "Nouvel étudiant inscrit",
    arrow: true,
    action: "Dossier créé automatiquement avec toutes les infos",
    color: "border-l-emerald-400 bg-emerald-50",
    textColor: "text-emerald-700",
  },
  {
    trigger: "Nouvelle note publiée",
    arrow: true,
    action: "Notification disponible pour le parent",
    color: "border-l-brand-400 bg-brand-50",
    textColor: "text-brand-700",
  },
];

export default function Automation() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Automatisation
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Configurez une fois. EduManage s&apos;occupe du reste.
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Mettez fin aux tâches répétitives. Votre équipe se concentre sur
            l&apos;essentiel.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl space-y-4">
          {workflows.map((w) => (
            <div
              key={w.trigger}
              className={`flex flex-col items-center gap-3 rounded-xl border border-l-4 p-5 sm:flex-row sm:gap-5 ${w.color}`}
            >
              <div className="flex-1">
                <p className={`text-sm font-bold ${w.textColor}`}>{w.trigger}</p>
              </div>
              <ArrowRight className="hidden h-4 w-4 text-zinc-400 sm:block" />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm text-zinc-700">{w.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
