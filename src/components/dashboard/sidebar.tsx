"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
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
  label: { fr: string; en: string };
  href: string;
  icon: React.ReactNode;
  showFor: string[];
};

type NavSection = {
  label: { fr: string; en: string };
  items: NavItem[];
};

const getOrganizationNavSections = (organizationType: string): NavSection[] => {
  const baseSections = [
    {
      label: { fr: "Personnes", en: "People" },
      items: [
        { label: { fr: "Élèves", en: "Students" }, href: "/students", icon: <GraduationCap className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
        { label: { fr: "Enseignants", en: "Teachers" }, href: "/teachers", icon: <UserCheck className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL"] },
        { label: { fr: "Personnel", en: "Staff" }, href: "/staff", icon: <Users className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL"] },
        { label: { fr: "Parents", en: "Parents" }, href: "/parents", icon: <Baby className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
        { label: { fr: "Prospects", en: "Leads" }, href: "/leads", icon: <Target className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
      ],
    },
    {
      label: { fr: "Apprentissage", en: "Learning" },
      items: [
        { label: { fr: "Programmes", en: "Programs" }, href: "/programs", icon: <FileText className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
        { label: { fr: "Classes", en: "Classes" }, href: "/groups", icon: <Users className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL"] },
        { label: { fr: "Niveaux", en: "Levels" }, href: "/levels", icon: <BookOpen className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL"] },
        { label: { fr: "Salles", en: "Rooms" }, href: "/rooms", icon: <Building2 className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL"] },
        { label: { fr: "Inscriptions", en: "Enrollments" }, href: "/enrollments", icon: <ClipboardCheck className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
        { label: { fr: "Devoirs", en: "Homework" }, href: "/homework", icon: <FileOutput className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL"] },
      ],
    },
    {
      label: { fr: "Présences & Évaluations", en: "Attendance & Grades" },
      items: [
        { label: { fr: "Présences", en: "Attendance" }, href: "/attendance", icon: <BarChart3 className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
        { label: { fr: "Évaluations", en: "Assessments" }, href: "/assessments", icon: <FileText className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
        { label: { fr: "Bulletins", en: "Report Cards" }, href: "/report-cards", icon: <AwardIcon className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
        { label: { fr: "Carnet", en: "Notebook" }, href: "/attendance/mark", icon: <ClipboardCheck className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
      ],
    },
    {
      label: { fr: "Finance", en: "Finance" },
      items: [
        { label: { fr: "Vue d'ensemble", en: "Overview" }, href: "/finance", icon: <BarChart3 className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
        { label: { fr: "Factures", en: "Invoices" }, href: "/invoices", icon: <FileText className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
        { label: { fr: "Paiements", en: "Payments" }, href: "/payments", icon: <CreditCard className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
        { label: { fr: "Reçus", en: "Receipts" }, href: "/receipts", icon: <FileOutput className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
        { label: { fr: "Abonnements", en: "Subscriptions" }, href: "/subscriptions", icon: <CalendarDays className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
      ],
    },
    {
      label: { fr: "Emploi du temps", en: "Schedule" },
      items: [
        { label: { fr: "Emploi du temps", en: "Timetable" }, href: "/timetable", icon: <Calendar className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
        { label: { fr: "Sessions", en: "Sessions" }, href: "/sessions", icon: <CalendarDays className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER"] },
        { label: { fr: "Disponibilité", en: "Availability" }, href: "/teacher-availability", icon: <Clock className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL"] },
      ],
    },
  ];

  const baseCommunicationSection = {
    label: { fr: "Communication", en: "Communication" },
    items: [
      { label: { fr: "Boîte de réception", en: "Inbox" }, href: "/inbox", icon: <Mail className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER", "TRAINING_CENTER"] },
      { label: { fr: "Messages", en: "Messages" }, href: "/messages", icon: <MessageSquare className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER", "TRAINING_CENTER"] },
      { label: { fr: "Annonces", en: "Announcements" }, href: "/announcements", icon: <Megaphone className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER", "TRAINING_CENTER"] },
      { label: { fr: "Campagnes", en: "Campaigns" }, href: "/campaigns", icon: <Send className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER", "TRAINING_CENTER"] },
    ],
  };

  const baseAnalyticsSection = {
    label: { fr: "Analytics", en: "Analytics" },
    items: [
      { label: { fr: "Vue d'ensemble", en: "Overview" }, href: "/reports", icon: <BarChart3 className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER", "TRAINING_CENTER"] },
      { label: { fr: "Personnes", en: "People" }, href: "/reports/people", icon: <Users className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER", "TRAINING_CENTER"] },
      { label: { fr: "Académique", en: "Academic" }, href: "/reports/academic", icon: <BookOpen className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER", "TRAINING_CENTER"] },
      { label: { fr: "Présences", en: "Attendance" }, href: "/reports/attendance", icon: <ClipboardCheck className="h-4 w-4" />, showFor: ["PRIVATE_SCHOOL", "SUPPORT_CENTER", "TRAINING_CENTER"] },
    ],
  };

  const baseAdvancedSection = {
    label: { fr: "Avancé", en: "Advanced" },
    items: [],
  };

  const organizationType = organizationType || "PRIVATE_SCHOOL";

  switch (organizationType) {
    case "PRIVATE_SCHOOL":
      return [
        baseSections[0], // Personnes
        baseSections[1], // Apprentissage
        baseSections[2], // Présences & Évaluations
        baseSections[3], // Finance
        baseSections[4], // Emploi du temps
        baseCommunicationSection,
        baseAnalyticsSection,
      ];
    case "SUPPORT_CENTER":
      return [
        baseSections[0], // Personnes
        baseSections[1], // Apprentissage
        baseSections[2], // Présences & Évaluations
        baseSections[3], // Finance
        baseSections[4], // Emploi du temps
        baseCommunicationSection,
        baseAnalyticsSection,
      ];
    case "TRAINING_CENTER":
      baseAdvancedSection.items = [
        { label: { fr: "Centre de formation", en: "Training Dashboard" }, href: "/training-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, showFor: ["TRAINING_CENTER"] },
        { label: { fr: "Programmes", en: "Programs" }, href: "/training-programs", icon: <GraduationCapIcon className="h-4 w-4" />, showFor: ["TRAINING_CENTER"] },
        { label: { fr: "Modules", en: "Modules" }, href: "/modules", icon: <BookOpen className="h-4 w-4" />, showFor: ["TRAINING_CENTER"] },
        { label: { fr: "Cohortes", en: "Cohorts" }, href: "/cohorts", icon: <UsersIcon className="h-4 w-4" />, showFor: ["TRAINING_CENTER"] },
        { label: { fr: "Formateurs", en: "Trainers" }, href: "/trainers", icon: <UserCheck className="h-4 w-4" />, showFor: ["TRAINING_CENTER"] },
        { label: { fr: "Compétences", en: "Competencies" }, href: "/competencies", icon: <Trophy className="h-4 w-4" />, showFor: ["TRAINING_CENTER"] },
        { label: { fr: "Affectations", en: "Assignments" }, href: "/training-assignments", icon: <Briefcase className="h-4 w-4" />, showFor: ["TRAINING_CENTER"] },
        { label: { fr: "Matériaux", en: "Materials" }, href: "/training-materials", icon: <FolderOpen className="h-4 w-4" />, showFor: ["TRAINING_CENTER"] },
        { label: { fr: "Certificats", en: "Certificates" }, href: "/certificates", icon: <Award className="h-4 w-4" />, showFor: ["TRAINING_CENTER"] },
        { label: { fr: "Progression", en: "Progress" }, href: "/training-progress", icon: <LineChart className="h-4 w-4" />, showFor: ["TRAINING_CENTER"] },
        { label: { fr: "Clients corporate", en: "Corporate Clients" }, href: "/corporate-clients", icon: <Building2 className="h-4 w-4" />, showFor: ["TRAINING_CENTER"] },
        { label: { fr: "Propositions", en: "Proposals" }, href: "/proposals", icon: <FileSignature className="h-4 w-4" />, showFor: ["TRAINING_CENTER"] },
      ];
      return [
        baseCommunicationSection,
        baseAnalyticsSection,
        baseAdvancedSection,
      ];
    case "PLATFORM_OWNER":
      return [
        {
          label: { fr: "Plateforme", en: "Platform" },
          items: [
            { label: { fr: "Tableau de bord", en: "Dashboard" }, href: "/platform/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, showFor: ["PLATFORM_OWNER"] },
            { label: { fr: "Facturation", en: "Billing" }, href: "/platform/billing", icon: <CreditCard className="h-4 w-4" />, showFor: ["PLATFORM_OWNER"] },
          ],
        },
      ];
    default:
      return [
        baseSections[0], // Personnes
        baseSections[1], // Apprentissage
        baseSections[2], // Présences & Évaluations
        baseSections[3], // Finance
        baseSections[4], // Emploi du temps
        baseCommunicationSection,
        baseAnalyticsSection,
      ];
  }
};

const platformNavSections: NavSection[] = [
  {
    label: { fr: "Plateforme", en: "Platform" },
    items: [
      { label: { fr: "Tableau de bord", en: "Dashboard" }, href: "/platform/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, showFor: ["PLATFORM_OWNER"] },
      { label: { fr: "Facturation", en: "Billing" }, href: "/platform/billing", icon: <CreditCard className="h-4 w-4" />, showFor: ["PLATFORM_OWNER"] },
    ],
  },
];

type SidebarProps = {
  userName: string;
  userEmail: string;
  isPlatformOwner: boolean;
  organizationType?: string;
};

export function Sidebar({ userName, userEmail, isPlatformOwner, organizationType }: SidebarProps) {
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

  const sections = isPlatformOwner ? platformNavSections : getOrganizationNavSections(organizationType || "PRIVATE_SCHOOL");

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
          const isCollapsed = collapsedSections.has(section.label.fr);
          return (
            <div key={section.label.fr} className="mt-3">
              <button
                onClick={() => toggleSection(section.label.fr)}
                className="flex w-full items-center justify-between px-3 py-1.5"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {section.label.fr}
                </span>
                <ChevronDown
                  className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${
                    isCollapsed ? "-rotate-90" : ""
                  }`}
                />
              </button>
              {!isCollapsed && (
                <div className="mt-0.5 space-y-0.5">
                  {section.items.map((item) => {
                    const filteredItems = item.showFor.includes(organizationType || "PRIVATE_SCHOOL");
                    if (!filteredItems) return null;

                    return (
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
                        {item.label.fr}
                      </Link>
                    );
                  })}
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
            {platformNavSections[0].items.map((item) => {
              const filteredItems = item.showFor.includes("PLATFORM_OWNER");
              if (!filteredItems) return null;

              return (
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
                  {item.label.fr}
                </Link>
              );
            })}
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
