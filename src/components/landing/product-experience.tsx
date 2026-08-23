import {
  Users,
  CalendarCheck,
  DollarSign,
  Calendar,
  Brain,
  FileText,
} from "lucide-react";

const screens = [
  {
    icon: Users,
    title: "Fiche étudiant",
    description: "Profil complet avec historique, notes, présences et paiements.",
    visual: (
      <div className="rounded-lg border border-zinc-100 bg-white p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-brand-100 text-center leading-8 text-xs font-bold text-brand-700">
            AB
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-900">Amina Benali</p>
            <p className="text-[10px] text-zinc-500">Terminale S · Groupe A3</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
            Présent
          </span>
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">
            Moy: 15.2
          </span>
        </div>
      </div>
    ),
  },
  {
    icon: CalendarCheck,
    title: "Présences",
    description: "Marquez et suivez les présences en un clic.",
    visual: (
      <div className="rounded-lg border border-zinc-100 bg-white p-3">
        <p className="mb-2 text-[10px] font-semibold text-zinc-700">Terminale S — 21 Août</p>
        <div className="space-y-1">
          {[
            { name: "Amina B.", status: "Présent", color: "bg-emerald-100 text-emerald-700" },
            { name: "Youssef E.", status: "Absent", color: "bg-red-100 text-red-700" },
            { name: "Fatima Z.", status: "Présent", color: "bg-emerald-100 text-emerald-700" },
          ].map((s) => (
            <div key={s.name} className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-700">{s.name}</span>
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${s.color}`}>
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: DollarSign,
    title: "Finance",
    description: "Tableau de bord financier avec revenus, impayés et prévisions.",
    visual: (
      <div className="rounded-lg border border-zinc-100 bg-white p-3">
        <p className="mb-2 text-[10px] font-semibold text-zinc-700">Août 2026</p>
        <div className="flex items-end gap-1" style={{ height: 40 }}>
          {[30, 45, 35, 55, 40, 65, 50].map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm ${i === 6 ? "bg-brand-500" : "bg-brand-100"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[9px] text-zinc-400">
          <span>15</span>
          <span>21</span>
        </div>
      </div>
    ),
  },
  {
    icon: Calendar,
    title: "Emploi du temps",
    description: "Planning interactif avec salles et enseignants assignés.",
    visual: (
      <div className="rounded-lg border border-zinc-100 bg-white p-3">
        <div className="grid grid-cols-3 gap-1">
          {[
            { time: "08h", class: "Terminale S", color: "bg-brand-100 text-brand-700" },
            { time: "10h", class: "1ère Année", color: "bg-emerald-100 text-emerald-700" },
            { time: "14h", class: "CM2", color: "bg-violet-100 text-violet-700" },
          ].map((s) => (
            <div key={s.time} className={`rounded p-1.5 text-center ${s.color}`}>
              <p className="text-[9px] font-bold">{s.time}</p>
              <p className="text-[8px]">{s.class}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Brain,
    title: "Assistant IA",
    description: "Questions, analyses et recommandations en langage naturel.",
    visual: (
      <div className="rounded-lg border border-zinc-100 bg-white p-3">
        <div className="mb-2 space-y-1.5">
          <div className="ml-4 rounded-lg rounded-br-sm bg-zinc-100 px-2 py-1 text-[9px] text-zinc-700">
            Quels impayés ce mois ?
          </div>
          <div className="mr-4 rounded-lg rounded-bl-sm bg-brand-50 px-2 py-1 text-[9px] text-brand-800">
            14 factures en attente, total: 23 100 DH...
          </div>
        </div>
        <div className="flex gap-1">
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[8px] text-zinc-500">
            📊 Détails
          </span>
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[8px] text-zinc-500">
            📧 Relancer
          </span>
        </div>
      </div>
    ),
  },
  {
    icon: FileText,
    title: "Rapports",
    description: "Bulletins, rapports de progression et documents automatisés.",
    visual: (
      <div className="rounded-lg border border-zinc-100 bg-white p-3">
        <div className="space-y-1.5">
          {[
            { name: "Bulletin — Juin 2026", status: "Généré", color: "text-emerald-600" },
            { name: "Rapport trimestriel", status: "En cours", color: "text-amber-600" },
            { name: "Certificat — Amina B.", status: "Prêt", color: "text-emerald-600" },
          ].map((d) => (
            <div key={d.name} className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-700">{d.name}</span>
              <span className={`text-[9px] font-medium ${d.color}`}>{d.status}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function ProductExperience() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Expérience produit
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Une interface pensée pour votre quotidien
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Chaque écran est conçu pour vous faire gagner du temps.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {screens.map((s) => (
            <div
              key={s.title}
              className="group rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 transition-all hover:border-zinc-300 hover:bg-white hover:shadow-lg hover:shadow-zinc-200/50"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
                  <s.icon className="h-4 w-4 text-zinc-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">{s.title}</h3>
                </div>
              </div>
              <p className="mb-4 text-xs text-zinc-500">{s.description}</p>
              {s.visual}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
