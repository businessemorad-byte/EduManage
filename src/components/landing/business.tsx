import {
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  AlertTriangle,
  Target,
} from "lucide-react";

const metrics = [
  { icon: DollarSign, label: "Revenus totaux", value: "185 400 DH", change: "+12%", changeColor: "text-emerald-600" },
  { icon: AlertTriangle, label: "Impayés en cours", value: "23 100 DH", change: "14 factures", changeColor: "text-amber-600" },
  { icon: Users, label: "Taux de rétention", value: "87%", change: "+5%", changeColor: "text-emerald-600" },
  { icon: Target, label: "Taux d'occupation", value: "91%", change: "+3%", changeColor: "text-emerald-600" },
];

export default function Business() {
  return (
    <section className="bg-zinc-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
              Vision business
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Ne gérez plus votre activité à l&apos;aveugle
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600">
              Comprenez ce qui fonctionne, ce qui vous coûte du temps et où se
              trouvent vos opportunités de croissance.
            </p>
            <div className="mt-8 space-y-4">
              {[
                "Vue d'ensemble des revenus et dépenses en temps réel",
                "Suivi des paiements et des impayés",
                "Indicateurs de rétention et de progression",
                "Taux d'occupation par groupe et par programme",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span className="text-sm text-zinc-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:shadow-lg hover:shadow-zinc-200/50"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                  <m.icon className="h-4.5 w-4.5 text-zinc-600" />
                </div>
                <p className="text-2xl font-bold text-zinc-900">{m.value}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{m.label}</p>
                <p className={`mt-2 text-xs font-medium ${m.changeColor}`}>
                  {m.change}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
