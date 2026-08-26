"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Baby,
  Target,
  Timer,
  ClipboardCheck,
  BookOpen,
  Award,
  CalendarDays,
  BarChart3,
  FileText,
  CreditCard,
  Wallet,
  Building2,
  Calendar,
  Bell,
  Megaphone,
  FolderOpen,
  Zap,
  Coins,
  TrendingUp,
  AwardIcon,
  Search,
  GraduationCapIcon,
  UsersIcon,
  Trophy,
  Briefcase,
  FileSignature,
  LineChart,
  MessageSquare,
  Mail,
  Send,
  FileOutput,
  Phone,
  Truck,
  Settings,
  Brain,
  Bot,
  Shield,
  Crosshair,
  BookMarked,
  Sparkles,
  PieChart,
  FileBarChart,
  Crown,
  ChevronDown,
  ChevronRight,
  X,
  Menu,
  LogOut,
  Clock,
  Sliders,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const schoolNavSections: NavSection[] = [
  {
    label: "Personnes",
    items: [
      { label: "Élèves", href: "/students", icon: <GraduationCap className="h-4 w-4" /> },
      { label: "Enseignants", href: "/teachers", icon: <UserCheck className="h-4 w-4" /> },
      { label: "Formateurs", href: "/trainers", icon: <UserCheck className="h-4 w-4" /> },
      { label: "Personnel", href: "/staff", icon: <Users className="h-4 w-4" /> },
      { label: "Parents", href: "/parents", icon: <Baby className="h-4 w-4" /> },
      { label: "Prospects", href: "/leads", icon: <Target className="h-4 w-4" /> },
      { label: "Essais", href: "/trials", icon: <Timer className="h-4 w-4" /> },
      { label: "Admissions", href: "/admissions", icon: <ClipboardCheck className="h-4 w-4" /> },
    ],
  },
  {
    label: "Académique",
    items: [
      { label: "Vue d'ensemble", href: "/academics", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Années scolaires", href: "/academic-years", icon: <CalendarDays className="h-4 w-4" /> },
      { label: "Niveaux", href: "/levels", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Matières", href: "/subjects", icon: <Award className="h-4 w-4" /> },
      { label: "Programmes", href: "/programs", icon: <FileText className="h-4 w-4" /> },
      { label: "Classes", href: "/groups", icon: <Users className="h-4 w-4" /> },
      { label: "Inscriptions", href: "/enrollments", icon: <ClipboardCheck className="h-4 w-4" /> },
      { label: "Devoirs", href: "/homework", icon: <FileOutput className="h-4 w-4" /> },
      { label: "Notes de suivi", href: "/student-progress", icon: <TrendingUp className="h-4 w-4" /> },
    ],
  },
  {
    label: "Présences & Notes",
    items: [
      { label: "Présences", href: "/attendance", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Évaluations", href: "/assessments", icon: <FileText className="h-4 w-4" /> },
      { label: "Bulletins", href: "/report-cards", icon: <AwardIcon className="h-4 w-4" /> },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Vue d'ensemble", href: "/finance", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Factures", href: "/invoices", icon: <FileText className="h-4 w-4" /> },
      { label: "Paiements", href: "/payments", icon: <CreditCard className="h-4 w-4" /> },
      { label: "Reçus", href: "/receipts", icon: <FileOutput className="h-4 w-4" /> },
      { label: "Plans de frais", href: "/fee-plans", icon: <Wallet className="h-4 w-4" /> },
      { label: "Remises", href: "/discounts", icon: <Coins className="h-4 w-4" /> },
      { label: "Remboursements", href: "/refunds", icon: <TrendingUp className="h-4 w-4" /> },
      { label: "Soldes", href: "/finance/balances", icon: <PieChart className="h-4 w-4" /> },
      { label: "Abonnements", href: "/subscriptions", icon: <CalendarDays className="h-4 w-4" /> },
    ],
  },
  {
    label: "Emploi du temps",
    items: [
      { label: "Emploi du temps", href: "/timetable", icon: <Calendar className="h-4 w-4" /> },
      { label: "Sessions", href: "/sessions", icon: <CalendarDays className="h-4 w-4" /> },
      { label: "Salles", href: "/rooms", icon: <Building2 className="h-4 w-4" /> },
      { label: "Disponibilité", href: "/teacher-availability", icon: <Clock className="h-4 w-4" /> },
    ],
  },
  {
    label: "Automatisation",
    items: [
      { label: "Notifications", href: "/notifications", icon: <Bell className="h-4 w-4" /> },
      { label: "Annonces", href: "/announcements", icon: <Megaphone className="h-4 w-4" /> },
      { label: "Documents", href: "/documents", icon: <FolderOpen className="h-4 w-4" /> },
      { label: "Vue d'ensemble", href: "/automation", icon: <Zap className="h-4 w-4" /> },
      { label: "Règles", href: "/automation/rules", icon: <Zap className="h-4 w-4" /> },
      { label: "Journal d'activité", href: "/automation/logs", icon: <Zap className="h-4 w-4" /> },
      { label: "Rémunération", href: "/compensation", icon: <Coins className="h-4 w-4" /> },
    ],
  },
  {
    label: "Rapports & Analyses",
    items: [
      { label: "Vue d'ensemble", href: "/reports", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Personnes", href: "/reports/people", icon: <Users className="h-4 w-4" /> },
      { label: "Académique", href: "/reports/academic", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Présences", href: "/reports/attendance", icon: <ClipboardCheck className="h-4 w-4" /> },
      { label: "Finance", href: "/reports/finance", icon: <Wallet className="h-4 w-4" /> },
      { label: "Admissions", href: "/reports/admissions", icon: <Target className="h-4 w-4" /> },
      { label: "Emploi du temps", href: "/reports/scheduling", icon: <Calendar className="h-4 w-4" /> },
    ],
  },
  {
    label: "Rapports hérités",
    items: [
      { label: "Rétention", href: "/retention", icon: <TrendingUp className="h-4 w-4" /> },
      { label: "Promotions", href: "/promotions", icon: <Award className="h-4 w-4" /> },
      { label: "Recherche", href: "/school/search", icon: <Search className="h-4 w-4" /> },
    ],
  },
  {
    label: "Centre de formation",
    items: [
      { label: "Tableau de bord", href: "/training-dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: "Programmes", href: "/training-programs", icon: <GraduationCapIcon className="h-4 w-4" /> },
      { label: "Modules", href: "/modules", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Cohortes", href: "/cohorts", icon: <UsersIcon className="h-4 w-4" /> },
      { label: "Formateurs", href: "/trainers", icon: <UserCheck className="h-4 w-4" /> },
      { label: "Compétences", href: "/competencies", icon: <Trophy className="h-4 w-4" /> },
      { label: "Affectations", href: "/training-assignments", icon: <Briefcase className="h-4 w-4" /> },
      { label: "Matériaux", href: "/training-materials", icon: <FolderOpen className="h-4 w-4" /> },
      { label: "Certificats", href: "/certificates", icon: <Award className="h-4 w-4" /> },
      { label: "Progression", href: "/training-progress", icon: <LineChart className="h-4 w-4" /> },
      { label: "Clients corporate", href: "/corporate-clients", icon: <Building2 className="h-4 w-4" /> },
      { label: "Propositions", href: "/proposals", icon: <FileSignature className="h-4 w-4" /> },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Tableau de bord", href: "/communication-dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: "Boîte de réception", href: "/inbox", icon: <Mail className="h-4 w-4" /> },
      { label: "Messages", href: "/messages", icon: <MessageSquare className="h-4 w-4" /> },
      { label: "Annonces", href: "/announcements", icon: <Megaphone className="h-4 w-4" /> },
      { label: "Modèles", href: "/templates", icon: <FileOutput className="h-4 w-4" /> },
      { label: "Campagnes", href: "/campaigns", icon: <Send className="h-4 w-4" /> },
      { label: "Demandes de contact", href: "/contact-requests", icon: <Phone className="h-4 w-4" /> },
      { label: "Journal de livraison", href: "/delivery-logs", icon: <Truck className="h-4 w-4" /> },
      { label: "Préférences", href: "/communication-preferences", icon: <Sliders className="h-4 w-4" /> },
      { label: "Paramètres", href: "/communication-settings", icon: <Settings className="h-4 w-4" /> },
    ],
  },
  {
    label: "Intelligence IA",
    items: [
      { label: "Tableau de bord IA", href: "/ai", icon: <Brain className="h-4 w-4" /> },
      { label: "Chat IA", href: "/ai/chat", icon: <Bot className="h-4 w-4" /> },
      { label: "Centre de contrôle", href: "/ai/control-center", icon: <Shield className="h-4 w-4" /> },
      { label: "Centre d'action", href: "/ai/action-center", icon: <Crosshair className="h-4 w-4" /> },
      { label: "Base de connaissances", href: "/ai/knowledge", icon: <BookMarked className="h-4 w-4" /> },
      { label: "Recommandations", href: "/ai/recommendations", icon: <Sparkles className="h-4 w-4" /> },
      { label: "Analyses", href: "/ai/insights", icon: <PieChart className="h-4 w-4" /> },
      { label: "Rapports", href: "/ai/reports", icon: <FileBarChart className="h-4 w-4" /> },
    ],
  },
  {
    label: "Facturation",
    items: [
      { label: "Vue d'ensemble", href: "/billing", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Plans", href: "/billing/plans", icon: <Wallet className="h-4 w-4" /> },
      { label: "Factures", href: "/billing/invoices", icon: <FileText className="h-4 w-4" /> },
      { label: "Utilisation", href: "/billing/usage", icon: <PieChart className="h-4 w-4" /> },
      { label: "Abonnement", href: "/billing/subscription", icon: <CreditCard className="h-4 w-4" /> },
    ],
  },
];

const platformNavSections: NavSection[] = [
  {
    label: "Plateforme",
    items: [
      { label: "Tableau de bord", href: "/platform/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: "Facturation", href: "/platform/billing", icon: <CreditCard className="h-4 w-4" /> },
    ],
  },
];

type SidebarProps = {
  userName: string;
  userEmail: string;
  isPlatformOwner: boolean;
};

export function Sidebar({ userName, userEmail, isPlatformOwner }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((label: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }, []);

  const isActive = (href: string) => {
    if (href === "/platform/dashboard" || href === "/school/dashboard" || href === "/academics" || href === "/finance") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const sections = isPlatformOwner ? platformNavSections : schoolNavSections;

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <span className="text-sm font-bold text-white">E</span>
          </div>
          <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
            EduManage
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 lg:hidden dark:hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <Link
          href={isPlatformOwner ? "/platform/dashboard" : "/school/dashboard"}
          onClick={() => setMobileOpen(false)}
          className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            (isPlatformOwner ? pathname === "/platform/dashboard" : pathname === "/school/dashboard")
              ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Tableau de bord
        </Link>

        {!isPlatformOwner && (
          <Link
            href="/people"
            onClick={() => setMobileOpen(false)}
            className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname === "/people" || pathname.startsWith("/people/")
                ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
            }`}
          >
            <Users className="h-4 w-4" />
            Personnes
          </Link>
        )}

        {sections.map((section) => {
          const isCollapsed = collapsedSections.has(section.label);
          return (
            <div key={section.label} className="mt-3">
              <button
                onClick={() => toggleSection(section.label)}
                className="flex w-full items-center justify-between px-3 py-1.5"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {section.label}
                </span>
                <ChevronDown
                  className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${
                    isCollapsed ? "-rotate-90" : ""
                  }`}
                />
              </button>
              {!isCollapsed && (
                <div className="mt-0.5 space-y-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive(item.href)
                          ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                      }`}
                    >
                      <span className={isActive(item.href) ? "text-brand-600 dark:text-brand-400" : "text-zinc-400 dark:text-zinc-500"}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isPlatformOwner && (
          <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Admin
              </span>
            </div>
            {platformNavSections[0].items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`mt-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-amber-50 font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                }`}
              >
                <span className={isActive(item.href) ? "text-amber-600 dark:text-amber-400" : "text-zinc-400 dark:text-zinc-500"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="border-t border-zinc-100 px-4 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{userName}</p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{userEmail}</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-3.5 z-50 rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm lg:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-zinc-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 dark:border-zinc-800 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
