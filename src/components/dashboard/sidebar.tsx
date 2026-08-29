"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Baby,
  Target,
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
  GraduationCapIcon,
  UsersIcon,
  Trophy,
  Briefcase,
  FileSignature,
  LineChart,
  MessageSquare,
  Send,
  FileOutput,
  Settings,
  Brain,
  BookMarked,
  Crown,
  ChevronDown,
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
  id: string;
  label: { fr: string; en: string };
  icon: React.ReactNode;
  items: NavItem[];
};

const PS = "PRIVATE_SCHOOL";
const SC = "SUPPORT_CENTER";
const TC = "TRAINING_CENTER";

// ─── Route → section mapping (used to keep the current route's section open) ───
const SECTION_ROUTES: Record<string, string[]> = {
  dashboard: ["/school/dashboard", "/training-dashboard", "/platform"],
  people: ["/people", "/students", "/teachers", "/staff", "/parents", "/leads", "/trainers", "/trainees"],
  academic: ["/academics", "/academic-years", "/programs", "/groups", "/levels", "/subjects", "/rooms", "/enrollments", "/homework", "/report-cards", "/training-programs", "/modules", "/cohorts", "/competencies", "/certificates"],
  daily: ["/timetable", "/sessions", "/attendance", "/assessments", "/teacher-availability", "/training-attendance", "/training-progress"],
  finance: ["/finance", "/invoices", "/payments", "/receipts", "/subscriptions", "/refunds", "/billing", "/corporate-clients", "/proposals"],
  communication: ["/inbox", "/messages", "/announcements", "/campaigns", "/communication-dashboard", "/contact-requests", "/delivery-logs"],
  reports: ["/reports"],
  settings: ["/ai", "/automation", "/templates", "/communication-settings", "/communication-preferences", "/discounts", "/fee-plans", "/promotions", "/retention", "/student-progress", "/documents", "/notifications", "/compensation", "/training-materials", "/training-assignments", "/school/search"],
};

function sectionForPath(pathname: string): string | null {
  for (const [id, prefixes] of Object.entries(SECTION_ROUTES)) {
    if (prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return id;
    }
  }
  return null;
}

// ─── Organization-aware sections (grouped to reduce overwhelm) ───
const getOrganizationNavSections = (): NavSection[] => [
  {
    id: "dashboard",
    label: { fr: "Tableau de bord", en: "Dashboard" },
    icon: <LayoutDashboard className="h-4 w-4" />,
    items: [
      { label: { fr: "Tableau de bord", en: "Dashboard" }, href: "/school/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Tableau de bord", en: "Dashboard" }, href: "/training-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, showFor: [TC] },
    ],
  },
  {
    id: "people",
    label: { fr: "Personnes", en: "People" },
    icon: <Users className="h-4 w-4" />,
    items: [
      { label: { fr: "Élèves", en: "Students" }, href: "/students", icon: <GraduationCap className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Enseignants", en: "Teachers" }, href: "/teachers", icon: <UserCheck className="h-4 w-4" />, showFor: [PS] },
      { label: { fr: "Personnel", en: "Staff" }, href: "/staff", icon: <Users className="h-4 w-4" />, showFor: [PS] },
      { label: { fr: "Parents", en: "Parents" }, href: "/parents", icon: <Baby className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Prospects", en: "Leads" }, href: "/leads", icon: <Target className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Formateurs", en: "Trainers" }, href: "/trainers", icon: <UserCheck className="h-4 w-4" />, showFor: [TC] },
      { label: { fr: "Apprenants", en: "Trainees" }, href: "/trainees", icon: <GraduationCap className="h-4 w-4" />, showFor: [TC] },
    ],
  },
  {
    id: "academic",
    label: { fr: "Académique", en: "Academic" },
    icon: <BookOpen className="h-4 w-4" />,
    items: [
      { label: { fr: "Programmes", en: "Programs" }, href: "/programs", icon: <FileText className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Classes", en: "Classes" }, href: "/groups", icon: <UsersIcon className="h-4 w-4" />, showFor: [PS] },
      { label: { fr: "Niveaux", en: "Levels" }, href: "/levels", icon: <BookOpen className="h-4 w-4" />, showFor: [PS] },
      { label: { fr: "Matières", en: "Subjects" }, href: "/subjects", icon: <BookMarked className="h-4 w-4" />, showFor: [PS] },
      { label: { fr: "Salles", en: "Rooms" }, href: "/rooms", icon: <Building2 className="h-4 w-4" />, showFor: [PS] },
      { label: { fr: "Inscriptions", en: "Enrollments" }, href: "/enrollments", icon: <ClipboardCheck className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Bulletins", en: "Report Cards" }, href: "/report-cards", icon: <AwardIcon className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Devoirs", en: "Homework" }, href: "/homework", icon: <FileOutput className="h-4 w-4" />, showFor: [PS] },
      { label: { fr: "Programmes", en: "Programs" }, href: "/training-programs", icon: <GraduationCapIcon className="h-4 w-4" />, showFor: [TC] },
      { label: { fr: "Modules", en: "Modules" }, href: "/modules", icon: <BookOpen className="h-4 w-4" />, showFor: [TC] },
      { label: { fr: "Cohortes", en: "Cohorts" }, href: "/cohorts", icon: <UsersIcon className="h-4 w-4" />, showFor: [TC] },
      { label: { fr: "Compétences", en: "Competencies" }, href: "/competencies", icon: <Trophy className="h-4 w-4" />, showFor: [TC] },
      { label: { fr: "Certificats", en: "Certificates" }, href: "/certificates", icon: <Award className="h-4 w-4" />, showFor: [TC] },
    ],
  },
  {
    id: "daily",
    label: { fr: "Gestion quotidienne", en: "Everyday" },
    icon: <ClipboardCheck className="h-4 w-4" />,
    items: [
      { label: { fr: "Emploi du temps", en: "Timetable" }, href: "/timetable", icon: <Calendar className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Sessions", en: "Sessions" }, href: "/sessions", icon: <CalendarDays className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Présences", en: "Attendance" }, href: "/attendance", icon: <BarChart3 className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Carnet", en: "Notebook" }, href: "/attendance/mark", icon: <ClipboardCheck className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Évaluations", en: "Assessments" }, href: "/assessments", icon: <FileText className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Disponibilité", en: "Availability" }, href: "/teacher-availability", icon: <Clock className="h-4 w-4" />, showFor: [PS] },
      { label: { fr: "Présences", en: "Attendance" }, href: "/training-attendance", icon: <ClipboardCheck className="h-4 w-4" />, showFor: [TC] },
      { label: { fr: "Progression", en: "Progress" }, href: "/training-progress", icon: <LineChart className="h-4 w-4" />, showFor: [TC] },
    ],
  },
  {
    id: "finance",
    label: { fr: "Finance", en: "Finance" },
    icon: <Wallet className="h-4 w-4" />,
    items: [
      { label: { fr: "Vue d'ensemble", en: "Overview" }, href: "/finance", icon: <BarChart3 className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Factures", en: "Invoices" }, href: "/invoices", icon: <FileText className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Paiements", en: "Payments" }, href: "/payments", icon: <CreditCard className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Abonnements", en: "Subscriptions" }, href: "/subscriptions", icon: <CalendarDays className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Clients corporate", en: "Corporate Clients" }, href: "/corporate-clients", icon: <Building2 className="h-4 w-4" />, showFor: [TC] },
      { label: { fr: "Propositions", en: "Proposals" }, href: "/proposals", icon: <FileSignature className="h-4 w-4" />, showFor: [TC] },
    ],
  },
  {
    id: "communication",
    label: { fr: "Communication", en: "Communication" },
    icon: <MessageSquare className="h-4 w-4" />,
    items: [
      { label: { fr: "Messages", en: "Messages" }, href: "/messages", icon: <MessageSquare className="h-4 w-4" />, showFor: [PS, SC, TC] },
      { label: { fr: "Annonces", en: "Announcements" }, href: "/announcements", icon: <Megaphone className="h-4 w-4" />, showFor: [PS, SC, TC] },
      { label: { fr: "Campagnes", en: "Campaigns" }, href: "/campaigns", icon: <Send className="h-4 w-4" />, showFor: [PS, SC, TC] },
    ],
  },
  {
    id: "reports",
    label: { fr: "Rapports", en: "Reports" },
    icon: <BarChart3 className="h-4 w-4" />,
    items: [
      { label: { fr: "Vue d'ensemble", en: "Overview" }, href: "/reports", icon: <BarChart3 className="h-4 w-4" />, showFor: [PS, SC, TC] },
    ],
  },
  {
    id: "settings",
    label: { fr: "Paramètres", en: "Settings" },
    icon: <Settings className="h-4 w-4" />,
    items: [
      { label: { fr: "Centre IA", en: "AI Center" }, href: "/ai", icon: <Brain className="h-4 w-4" />, showFor: [PS, SC, TC] },
      { label: { fr: "Automatisation", en: "Automation" }, href: "/automation", icon: <Zap className="h-4 w-4" />, showFor: [PS, SC, TC] },
      { label: { fr: "Modèles", en: "Templates" }, href: "/templates", icon: <FileText className="h-4 w-4" />, showFor: [PS, SC, TC] },
      { label: { fr: "Documents", en: "Documents" }, href: "/documents", icon: <FolderOpen className="h-4 w-4" />, showFor: [PS, SC, TC] },
      { label: { fr: "Notifications", en: "Notifications" }, href: "/notifications", icon: <Bell className="h-4 w-4" />, showFor: [PS, SC, TC] },
      { label: { fr: "Réglages comm.", en: "Comm. settings" }, href: "/communication-settings", icon: <Sliders className="h-4 w-4" />, showFor: [PS, SC, TC] },
      { label: { fr: "Préférences comm.", en: "Comm. preferences" }, href: "/communication-preferences", icon: <Sliders className="h-4 w-4" />, showFor: [PS, SC, TC] },
      { label: { fr: "Avantages", en: "Discounts" }, href: "/discounts", icon: <Coins className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Plans tarifaires", en: "Fee Plans" }, href: "/fee-plans", icon: <CreditCard className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Promotions", en: "Promotions" }, href: "/promotions", icon: <Megaphone className="h-4 w-4" />, showFor: [PS, SC] },
      { label: { fr: "Rétention", en: "Retention" }, href: "/retention", icon: <TrendingUp className="h-4 w-4" />, showFor: [PS] },
      { label: { fr: "Suivi élèves", en: "Student progress" }, href: "/student-progress", icon: <TrendingUp className="h-4 w-4" />, showFor: [PS] },
      { label: { fr: "Rémunération", en: "Compensation" }, href: "/compensation", icon: <Wallet className="h-4 w-4" />, showFor: [PS] },
      { label: { fr: "Matériaux", en: "Materials" }, href: "/training-materials", icon: <FolderOpen className="h-4 w-4" />, showFor: [TC] },
      { label: { fr: "Affectations", en: "Assignments" }, href: "/training-assignments", icon: <Briefcase className="h-4 w-4" />, showFor: [TC] },
    ],
  },
];

const platformNavSections: NavSection[] = [
  {
    id: "platform",
    label: { fr: "Plateforme", en: "Platform" },
    icon: <LayoutDashboard className="h-4 w-4" />,
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
  const [openId, setOpenId] = useState<string | null>(null);

  // All sections collapsed by default; open the section of the current route.
  useEffect(() => {
    setOpenId(sectionForPath(pathname));
  }, [pathname]);

  const toggleSection = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);

  const isActive = (href: string) => {
    if (href === "/platform/dashboard" || href === "/school/dashboard" || href === "/training-dashboard" || href === "/academics" || href === "/finance") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const sections = isPlatformOwner
    ? platformNavSections
    : getOrganizationNavSections()
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.showFor.includes(organizationType || PS)),
        }))
        .filter((section) => section.items.length > 0);

  const renderLink = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          active
            ? "bg-brand-50 font-medium text-brand-700"
            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
        }`}
      >
        <span className={active ? "text-brand-600" : "text-zinc-400"}>{item.icon}</span>
        {item.label.fr}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <span className="text-sm font-bold text-white">E</span>
          </div>
          <span className="text-base font-bold tracking-tight text-zinc-900">EduManage</span>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {sections.map((section) => {
          const open = openId === section.id;
          return (
            <div key={section.id} className="mt-1">
              <button
                onClick={() => toggleSection(section.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  open ? "bg-brand-50 text-brand-700" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
                aria-expanded={open}
              >
                <span className={open ? "text-brand-600" : "text-zinc-400"}>{section.icon}</span>
                <span className="flex-1 text-left">{section.label.fr}</span>
                <ChevronDown
                  className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
                />
              </button>
              {open && (
                <div className="mt-0.5 space-y-0.5 border-l border-zinc-100 pl-2 ml-3.5">
                  {section.items.map(renderLink)}
                </div>
              )}
            </div>
          );
        })}

        {isPlatformOwner && (
          <div className="mt-4 border-t border-zinc-100 pt-3">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Admin</span>
            </div>
            <div className="mt-0.5 space-y-0.5">
              {platformNavSections[0].items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active ? "bg-amber-50 font-medium text-amber-700" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    <span className={active ? "text-amber-600" : "text-zinc-400"}>{item.icon}</span>
                    {item.label.fr}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-zinc-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">{userName}</p>
            <p className="truncate text-xs text-zinc-500">{userEmail}</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
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
        className="fixed left-4 top-3.5 z-50 rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm lg:hidden"
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
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-zinc-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
