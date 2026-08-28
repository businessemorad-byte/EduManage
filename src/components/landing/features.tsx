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
import type { LandingProps } from "./i18n-props";
import type { LucideIcon } from "lucide-react";

const categoryStyles = [
  { border: "border-brand-200 bg-brand-50/50", title: "text-brand-700" },
  { border: "border-emerald-200 bg-emerald-50/50", title: "text-emerald-700" },
  { border: "border-amber-200 bg-amber-50/50", title: "text-amber-700" },
  { border: "border-violet-200 bg-violet-50/50", title: "text-violet-700" },
  { border: "border-pink-200 bg-pink-50/50", title: "text-pink-700" },
  { border: "border-cyan-200 bg-cyan-50/50", title: "text-cyan-700" },
];

const categoryIcons: LucideIcon[][] = [
  [Users, BookOpen, GraduationCap, CalendarCheck, ClipboardCheck, TrendingUp],
  [GraduationCap, UserCog, MessageCircle, Calendar, Users, CalendarCheck],
  [CreditCard, Receipt, Banknote, PieChart, BarChart3, TrendingUp],
  [Megaphone, Bell, MessageCircle, FileStack, Megaphone, Bell],
  [Workflow, RotateCcw, Zap, Bell, FileStack, Workflow],
  [Brain, BarChart3, Target, TrendingUp, FileStack, PieChart],
];

export default function Features({ dict }: LandingProps) {
  const f = dict.featuresSection;

  return (
    <section className="bg-white py-20 sm:py-24" id="fonctionnalites">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            {f.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {f.title}
          </h2>
          <p className="mt-4 text-lg text-zinc-600">{f.subtitle}</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {f.categories.map((cat, ci) => {
            const style = categoryStyles[ci % categoryStyles.length];
            const icons = categoryIcons[ci % categoryIcons.length] ?? [];
            return (
              <div
                key={cat.title}
                className={`rounded-xl border p-6 transition-all hover:shadow-md ${style.border}`}
              >
                <h3 className={`text-sm font-bold uppercase tracking-wider ${style.title}`}>
                  {cat.title}
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {cat.items.map((item, ii) => {
                    const Icon = icons[ii] ?? FileStack;
                    return (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        <span className="text-xs font-medium text-zinc-700">{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}