import { Clock, LayoutDashboard, BarChart3, Rocket } from "lucide-react";

const values = [
  {
    icon: Clock,
    title: "Gagnez du temps",
    description:
      "Automatisez les tâches administratives qui vous prennent des heures : présences, paiements, communications, rapports.",
    color: "text-brand-600 bg-brand-50",
  },
  {
    icon: LayoutDashboard,
    title: "Gardez le contrôle",
    description:
      "Centralisez vos opérations et suivez votre activité en temps réel depuis un seul espace unifié.",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: BarChart3,
    title: "Décidez avec vos données",
    description:
      "Visualisez vos performances, vos finances et vos indicateurs clés pour prendre des décisions éclairées.",
    color: "text-violet-600 bg-violet-50",
  },
  {
    icon: Rocket,
    title: "Développez votre activité",
    description:
      "Identifiez les opportunités de croissance, améliorez votre organisation et préparez l'expansion.",
    color: "text-amber-600 bg-amber-50",
  },
];

export default function ValueProps() {
  return (
    <section className="bg-zinc-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Pourquoi EduManage
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Ce qui compte vraiment pour votre organisation
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Des résultats concrets, pas juste des fonctionnalités.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div
              key={v.title}
              className="group rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/50"
            >
              <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${v.color}`}
              >
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {v.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
