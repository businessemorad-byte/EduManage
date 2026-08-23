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
    label: "People",
    items: [
      { label: "Students", href: "/students", icon: <GraduationCap className="h-4 w-4" /> },
      { label: "Teachers", href: "/teachers", icon: <UserCheck className="h-4 w-4" /> },
      { label: "Trainers", href: "/trainers", icon: <UserCheck className="h-4 w-4" /> },
      { label: "Staff", href: "/staff", icon: <Users className="h-4 w-4" /> },
      { label: "Parents", href: "/parents", icon: <Baby className="h-4 w-4" /> },
      { label: "Leads", href: "/leads", icon: <Target className="h-4 w-4" /> },
      { label: "Trials", href: "/trials", icon: <Timer className="h-4 w-4" /> },
      { label: "Admissions", href: "/admissions", icon: <ClipboardCheck className="h-4 w-4" /> },
    ],
  },
  {
    label: "Academics",
    items: [
      { label: "Overview", href: "/academics", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Academic Years", href: "/academic-years", icon: <CalendarDays className="h-4 w-4" /> },
      { label: "Levels", href: "/levels", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Subjects", href: "/subjects", icon: <Award className="h-4 w-4" /> },
      { label: "Programs", href: "/programs", icon: <FileText className="h-4 w-4" /> },
      { label: "Groups", href: "/groups", icon: <Users className="h-4 w-4" /> },
      { label: "Enrollments", href: "/enrollments", icon: <ClipboardCheck className="h-4 w-4" /> },
      { label: "Homework", href: "/homework", icon: <FileOutput className="h-4 w-4" /> },
      { label: "Progress Notes", href: "/student-progress", icon: <TrendingUp className="h-4 w-4" /> },
    ],
  },
  {
    label: "Attendance & Grades",
    items: [
      { label: "Attendance", href: "/attendance", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Assessments", href: "/assessments", icon: <FileText className="h-4 w-4" /> },
      { label: "Report Cards", href: "/report-cards", icon: <AwardIcon className="h-4 w-4" /> },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Overview", href: "/finance", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Invoices", href: "/invoices", icon: <FileText className="h-4 w-4" /> },
      { label: "Payments", href: "/payments", icon: <CreditCard className="h-4 w-4" /> },
      { label: "Receipts", href: "/receipts", icon: <FileOutput className="h-4 w-4" /> },
      { label: "Fee Plans", href: "/fee-plans", icon: <Wallet className="h-4 w-4" /> },
      { label: "Discounts", href: "/discounts", icon: <Coins className="h-4 w-4" /> },
      { label: "Refunds", href: "/refunds", icon: <TrendingUp className="h-4 w-4" /> },
      { label: "Balances", href: "/finance/balances", icon: <PieChart className="h-4 w-4" /> },
      { label: "Subscriptions", href: "/subscriptions", icon: <CalendarDays className="h-4 w-4" /> },
    ],
  },
  {
    label: "Scheduling",
    items: [
      { label: "Timetable", href: "/timetable", icon: <Calendar className="h-4 w-4" /> },
      { label: "Sessions", href: "/sessions", icon: <CalendarDays className="h-4 w-4" /> },
      { label: "Rooms", href: "/rooms", icon: <Building2 className="h-4 w-4" /> },
      { label: "Availability", href: "/teacher-availability", icon: <Clock className="h-4 w-4" /> },
    ],
  },
  {
    label: "Automation",
    items: [
      { label: "Notifications", href: "/notifications", icon: <Bell className="h-4 w-4" /> },
      { label: "Announcements", href: "/announcements", icon: <Megaphone className="h-4 w-4" /> },
      { label: "Documents", href: "/documents", icon: <FolderOpen className="h-4 w-4" /> },
      { label: "Overview", href: "/automation", icon: <Zap className="h-4 w-4" /> },
      { label: "Rules", href: "/automation/rules", icon: <Zap className="h-4 w-4" /> },
      { label: "Activity Log", href: "/automation/logs", icon: <Zap className="h-4 w-4" /> },
      { label: "Compensation", href: "/compensation", icon: <Coins className="h-4 w-4" /> },
    ],
  },
  {
    label: "Reports & Analytics",
    items: [
      { label: "Overview", href: "/reports", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "People", href: "/reports/people", icon: <Users className="h-4 w-4" /> },
      { label: "Academic", href: "/reports/academic", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Attendance", href: "/reports/attendance", icon: <ClipboardCheck className="h-4 w-4" /> },
      { label: "Finance", href: "/reports/finance", icon: <Wallet className="h-4 w-4" /> },
      { label: "Admissions", href: "/reports/admissions", icon: <Target className="h-4 w-4" /> },
      { label: "Scheduling", href: "/reports/scheduling", icon: <Calendar className="h-4 w-4" /> },
    ],
  },
  {
    label: "Legacy Reports",
    items: [
      { label: "Retention", href: "/retention", icon: <TrendingUp className="h-4 w-4" /> },
      { label: "Promotions", href: "/promotions", icon: <Award className="h-4 w-4" /> },
      { label: "Search", href: "/school/search", icon: <Search className="h-4 w-4" /> },
    ],
  },
  {
    label: "Training Center",
    items: [
      { label: "Dashboard", href: "/training-dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: "Programs", href: "/training-programs", icon: <GraduationCapIcon className="h-4 w-4" /> },
      { label: "Modules", href: "/modules", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Cohorts", href: "/cohorts", icon: <UsersIcon className="h-4 w-4" /> },
      { label: "Trainers", href: "/trainers", icon: <UserCheck className="h-4 w-4" /> },
      { label: "Competencies", href: "/competencies", icon: <Trophy className="h-4 w-4" /> },
      { label: "Assignments", href: "/training-assignments", icon: <Briefcase className="h-4 w-4" /> },
      { label: "Materials", href: "/training-materials", icon: <FolderOpen className="h-4 w-4" /> },
      { label: "Certificates", href: "/certificates", icon: <Award className="h-4 w-4" /> },
      { label: "Learner Progress", href: "/training-progress", icon: <LineChart className="h-4 w-4" /> },
      { label: "Corporate Clients", href: "/corporate-clients", icon: <Building2 className="h-4 w-4" /> },
      { label: "Proposals", href: "/proposals", icon: <FileSignature className="h-4 w-4" /> },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Dashboard", href: "/communication-dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: "Inbox", href: "/inbox", icon: <Mail className="h-4 w-4" /> },
      { label: "Messages", href: "/messages", icon: <MessageSquare className="h-4 w-4" /> },
      { label: "Announcements", href: "/announcements", icon: <Megaphone className="h-4 w-4" /> },
      { label: "Templates", href: "/templates", icon: <FileOutput className="h-4 w-4" /> },
      { label: "Campaigns", href: "/campaigns", icon: <Send className="h-4 w-4" /> },
      { label: "Contact Requests", href: "/contact-requests", icon: <Phone className="h-4 w-4" /> },
      { label: "Delivery Logs", href: "/delivery-logs", icon: <Truck className="h-4 w-4" /> },
      { label: "Preferences", href: "/communication-preferences", icon: <Sliders className="h-4 w-4" /> },
      { label: "Settings", href: "/communication-settings", icon: <Settings className="h-4 w-4" /> },
    ],
  },
  {
    label: "AI Intelligence",
    items: [
      { label: "AI Dashboard", href: "/ai", icon: <Brain className="h-4 w-4" /> },
      { label: "AI Chat", href: "/ai/chat", icon: <Bot className="h-4 w-4" /> },
      { label: "Control Center", href: "/ai/control-center", icon: <Shield className="h-4 w-4" /> },
      { label: "Action Center", href: "/ai/action-center", icon: <Crosshair className="h-4 w-4" /> },
      { label: "Knowledge Base", href: "/ai/knowledge", icon: <BookMarked className="h-4 w-4" /> },
      { label: "Recommendations", href: "/ai/recommendations", icon: <Sparkles className="h-4 w-4" /> },
      { label: "Insights", href: "/ai/insights", icon: <PieChart className="h-4 w-4" /> },
      { label: "Reports", href: "/ai/reports", icon: <FileBarChart className="h-4 w-4" /> },
    ],
  },
  {
    label: "Billing",
    items: [
      { label: "Overview", href: "/billing", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Plans", href: "/billing/plans", icon: <Wallet className="h-4 w-4" /> },
      { label: "Invoices", href: "/billing/invoices", icon: <FileText className="h-4 w-4" /> },
      { label: "Usage", href: "/billing/usage", icon: <PieChart className="h-4 w-4" /> },
      { label: "Subscription", href: "/billing/subscription", icon: <CreditCard className="h-4 w-4" /> },
    ],
  },
];

const platformNavSections: NavSection[] = [
  {
    label: "Platform",
    items: [
      { label: "Dashboard", href: "/platform/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: "Billing", href: "/platform/billing", icon: <CreditCard className="h-4 w-4" /> },
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
          Dashboard
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
            People
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
