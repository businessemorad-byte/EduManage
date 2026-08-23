import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  TrendingUp,
  UserCog,
  Calendar,
  CreditCard,
  Receipt,
  Banknote,
  PieChart,
  Megaphone,
  Bell,
  MessageCircle,
  FileStack,
  Workflow,
  RotateCcw,
  Zap,
  BarChart3,
  Brain,
  Target,
} from "lucide-react";

const categories = [
  {
    title: "Gestion académique",
    color: "border-brand-200 bg-brand-50/50",
    titleColor: "text-brand-700",
    items: [
      { icon: Users, label: "Étudiants" },
      { icon: BookOpen, label: "Groupes" },
      { icon: GraduationCap, label: "Matières" },
      { icon: CalendarCheck, label: "Présences" },
      { icon: ClipboardCheck, label: "Évaluations" },
      { icon: TrendingUp, label: "Notes & progression" },
    ],
  },
  {
    title: "Personnel & opérations",
    color: "border-emerald-200 bg-emerald-50/50",
    titleColor: "text-emerald-700",
    items: [
      { icon: GraduationCap, label: "Enseignants" },
      { icon: UserCog, label: "Personnel" },
      { icon: MessageCircle, label: "Parents" },
      { icon: Calendar, label: "Emplois du temps" },
      { icon: Users, label: "Salles" },
      { icon: CalendarCheck, label: "Disponibilités" },
    ],
  },
  {
    title: "Finance",
    color: "border-amber-200 bg-amber-50/50",
    titleColor: "text-amber-700",
    items: [
      { icon: CreditCard, label: "Paiements" },
      { icon: Receipt, label: "Factures" },
      { icon: Banknote, label: "Reçus" },
      { icon: PieChart, label: "Remises" },
      { icon: BarChart3, label: "Abonnements" },
      { icon: TrendingUp, label: "Analytics financiers" },
    ],
  },
  {
    title: "Communication",
    color: "border-violet-200 bg-violet-50/50",
    titleColor: "text-violet-700",
    items: [
      { icon: Megaphone, label: "Annonces" },
      { icon: Bell, label: "Notifications" },
      { icon: MessageCircle, label: "Messagerie parents" },
      { icon: FileStack, label: "Documents" },
      { icon: Megaphone, label: "Campagnes" },
      { icon: Bell, label: "Rappels automatiques" },
    ],
  },
  {
    title: "Automatisation",
    color: "border-pink-200 bg-pink-50/50",
    titleColor: "text-pink-700",
    items: [
      { icon: Workflow, label: "Workflows configurables" },
      { icon: RotateCcw, label: "Rappels récurrents" },
      { icon: Zap, label: "Déclencheurs automatiques" },
      { icon: Bell, label: "Notifications intelligentes" },
      { icon: FileStack, label: "Génération de documents" },
      { icon: Workflow, label: "Automatisation administrative" },
    ],
  },
  {
    title: "Intelligence artificielle",
    color: "border-cyan-200 bg-cyan-50/50",
    titleColor: "text-cyan-700",
    items: [
      { icon: Brain, label: "Assistant IA intégré" },
      { icon: BarChart3, label: "Analytics prédictifs" },
      { icon: Target, label: "Alertes de performance" },
      { icon: TrendingUp, label: "Tendances & insights" },
      { icon: FileStack, label: "Rapports automatisés" },
      { icon: PieChart, label: "Analyse financière IA" },
    ],
  },
];

export default function Features() {
  return (
    <section className="bg-white py-20 sm:py-24" id="fonctionnalites">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Fonctionnalités
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Tout ce dont vous avez besoin. Rien de superflu.
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Une suite complète de fonctionnalités conçues pour les organisations éducatives.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className={`rounded-xl border p-6 transition-all hover:shadow-md ${cat.color}`}
            >
              <h3 className={`text-sm font-bold uppercase tracking-wider ${cat.titleColor}`}>
                {cat.title}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {cat.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2"
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
