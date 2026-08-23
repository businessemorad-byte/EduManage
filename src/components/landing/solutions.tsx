import { School, BookOpen, GraduationCap, ArrowRight } from "lucide-react";
import Link from "next/link";

const solutions = [
  {
    icon: School,
    title: "Écoles privées",
    description:
      "Gérez vos élèves, parents, enseignants et opérations académiques. Suivez les présences, notes, bulletin, finances et communications — tout en un seul endroit.",
    features: [
      "Suivi élèves & parents",
      "Notes et bulletins",
      "Présences quotidiennes",
      "Gestion financière",
      "Communication famille",
    ],
    href: "/solutions/ecoles",
    color: "text-brand-600 bg-brand-50 border-brand-100",
    iconBg: "bg-brand-500",
  },
  {
    icon: BookOpen,
    title: "Centres de soutien",
    description:
      "Organisez vos groupes, emplois du temps, enseignants et paiements. Suivez la progression de chaque apprenant et simplifiez votre administration.",
    features: [
      "Groupes & emplois du temps",
      "Suivi des présences",
      "Facturation automatique",
      "Progression apprenants",
      "Communication parents",
    ],
    href: "/solutions/centres-soutien",
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    iconBg: "bg-emerald-500",
  },
  {
    icon: GraduationCap,
    title: "Centres de formation",
    description:
      "Pilotez vos programmes, formateurs, apprenants et corporate clients. Gérez les inscriptions, la progression, les certificats et la facturation.",
    features: [
      "Programmes & cohortes",
      "Formateurs & disponibilités",
      "Suivi de progression",
      "Certificats",
      "Clients corporate",
    ],
    href: "/solutions/formation",
    color: "text-violet-600 bg-violet-50 border-violet-100",
    iconBg: "bg-violet-500",
  },
];

export default function Solutions() {
  return (
    <section className="bg-zinc-50 py-20 sm:py-24" id="solutions">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Solutions
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Conçu pour votre type d&apos;organisation
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Quelle que soit votre structure, EduManage s&apos;adapte à vos besoins.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-3">
          {solutions.map((s) => (
            <div
              key={s.title}
              className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-7 transition-all hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/50"
            >
              <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${s.iconBg} text-white`}>
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">{s.title}</h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-zinc-600">
                {s.description}
              </p>
              <ul className="mt-5 space-y-2">
                {s.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-700">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={s.href}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
              >
                En savoir plus
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
