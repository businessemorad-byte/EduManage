import type { Dictionary } from "./fr";

export const en: Dictionary = {
  meta: {
    title: "EduManage — The intelligent operating system for education",
    description:
      "Run your entire education organization from a single platform. Private schools, tutoring centers and training centers.",
    ogTitle: "EduManage — Run your education organization",
    ogDescription:
      "Centralize your operations, automate repetitive tasks and make better decisions with AI.",
  },
  common: {
    getStarted: "Get started free",
    login: "Log in",
    learnMore: "Learn more",
    language: "Language",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    backHome: "Back to home",
    readMore: "Read more",
    contactSales: "Contact the team",
  },
  nav: {
    features: {
      label: "Features",
      href: "/features",
    },
    ai: {
      label: "AI",
      href: "/ai",
    },
    pricing: {
      label: "Pricing",
      href: "/pricing",
    },
    solutions: {
      label: "Solutions",
      items: [
        {
          label: "Private schools",
          desc: "Students, parents, grades, attendance and finance",
          href: "/solutions/private-schools",
        },
        {
          label: "Tutoring centers",
          desc: "Groups, schedules and payments",
          href: "/solutions/tutoring-centers",
        },
        {
          label: "Training centers",
          desc: "Programs, learners and corporate clients",
          href: "/solutions/training-centers",
        },
      ],
    },
    resources: {
      label: "Resources",
      items: [
        {
          label: "Documentation",
          desc: "Guides, tutorials and API reference",
          href: "/resources/docs",
        },
        {
          label: "Help center",
          desc: "Answers to common questions",
          href: "/resources/help",
        },
        {
          label: "Blog",
          desc: "News and best practices",
          href: "/resources/blog",
        },
        {
          label: "FAQ",
          desc: "Frequently asked questions",
          href: "/resources/faq",
        },
      ],
    },
  },
  hero: {
    badge: "50% off your first month · No commitment",
    titleA: "Run your entire education organization",
    titleHighlight: "from a single platform",
    subtitle:
      "EduManage centralizes your operations, automates repetitive tasks and gives you a clear view of your activity, your teams, your learners and your revenue.",
    ctaPrimary: "Get started free",
    ctaSecondary: "Discover EduManage",
    mockup: {
      searchPlaceholder: "Search a student, a course...",
      sidebar: [
        "Dashboard",
        "Students",
        "Teachers",
        "Groups",
        "Attendance",
        "Finance",
        "Notifications",
      ],
      overview: "Overview — August 2026",
      period: "This month",
      stats: [
        { label: "Students", value: "342", change: "+12%" },
        { label: "Revenue", value: "45,200", change: "+8%", prefix: "DH" },
        { label: "Attendance", value: "94%", change: "+2%" },
        { label: "Active groups", value: "18", change: "+3" },
      ],
      revenueLabel: "Monthly revenue",
      lastSixMonths: "Last 6 months",
      months: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      activityLabel: "Recent activity",
      activities: [
        { text: "New student enrolled", time: "2h ago" },
        { text: "Payment received — 1,500 DH", time: "4h ago" },
        { text: "Absence reported — Group A3", time: "6h ago" },
      ],
      studentsLabel: "Recent students",
      viewAll: "View all",
      tableHeaders: ["Name", "Group", "Attendance", "Last payment"],
      rows: [
        { name: "Amina Benali", group: "Grade 12", presence: "98%", payment: "Jul 20" },
        { name: "Youssef El Amrani", group: "Grade 10", presence: "92%", payment: "Jul 18" },
        { name: "Fatima Zahra", group: "Grade 6", presence: "96%", payment: "Jul 22" },
      ],
    },
  },
  valueProps: {
    eyebrow: "Why EduManage",
    title: "What really matters for your organization",
    subtitle: "Concrete results, not just features.",
    items: [
      {
        title: "Save time",
        description:
          "Automate the admin tasks that cost you hours: attendance, payments, communication, reports.",
      },
      {
        title: "Stay in control",
        description:
          "Centralize your operations and track your activity in real time from one unified workspace.",
      },
      {
        title: "Decide with your data",
        description:
          "Visualize your performance, your finances and your key metrics to make informed decisions.",
      },
      {
        title: "Grow your business",
        description:
          "Spot growth opportunities, improve your organization and prepare for expansion.",
      },
    ],
  },
  problemSolution: {
    eyebrow: "The problem",
    title: "Your organization deserves better than scattered tools",
    problems: [
      "WhatsApp for every communication",
      "Excel to track payments",
      "Paper for attendance",
      "Disconnected, scattered tools",
    ],
    solution: "EduManage brings everything together in one place",
    closing:
      "A single platform for your students, teachers, attendance, payments, communication and finances. Zero data duplication, zero wasted time.",
  },
  solutionsSection: {
    eyebrow: "Solutions",
    title: "Built for your type of organization",
    subtitle: "Whatever your structure, EduManage adapts to your needs.",
    learnMore: "Learn more",
    items: [
      {
        title: "Private schools",
        description:
          "Manage your students, parents, teachers and academic operations. Track attendance, grades, report cards, finances and communication — all in one place.",
        features: [
          "Students & parents tracking",
          "Grades and report cards",
          "Daily attendance",
          "Financial management",
          "Family communication",
        ],
        href: "/solutions/private-schools",
      },
      {
        title: "Tutoring centers",
        description:
          "Organize your groups, schedules, teachers and payments. Track every learner's progress and streamline your administration.",
        features: [
          "Groups & schedules",
          "Attendance tracking",
          "Automatic billing",
          "Learner progress",
          "Parent communication",
        ],
        href: "/solutions/tutoring-centers",
      },
      {
        title: "Training centers",
        description:
          "Run your programs, trainers, learners and corporate clients. Manage enrollment, progress, certificates and billing.",
        features: [
          "Programs & cohorts",
          "Trainers & availability",
          "Progress tracking",
          "Certificates",
          "Corporate clients",
        ],
        href: "/solutions/training-centers",
      },
    ],
  },
  featuresSection: {
    eyebrow: "Features",
    title: "Everything you need. Nothing superfluous.",
    subtitle: "A complete suite of features designed for education organizations.",
    categories: [
      {
        title: "Academic management",
        items: ["Students", "Groups", "Subjects", "Attendance", "Assessments", "Grades & progress"],
      },
      {
        title: "Staff & operations",
        items: ["Teachers", "Staff", "Parents", "Timetables", "Rooms", "Availability"],
      },
      {
        title: "Finance",
        items: ["Payments", "Invoices", "Receipts", "Discounts", "Subscriptions", "Financial analytics"],
      },
      {
        title: "Communication",
        items: ["Announcements", "Notifications", "Parent messaging", "Documents", "Campaigns", "Automatic reminders"],
      },
      {
        title: "Automation",
        items: ["Configurable workflows", "Recurring reminders", "Automatic triggers", "Smart notifications", "Document generation", "Admin automation"],
      },
      {
        title: "Artificial intelligence",
        items: ["Built-in AI assistant", "Predictive analytics", "Performance alerts", "Trends & insights", "Automated reports", "AI financial analysis"],
      },
    ],
  },
  aiSection: {
    badge: "Artificial intelligence",
    titleA: "More than a management tool.",
    titleHighlight: "An intelligent assistant.",
    subtitle:
      "EduManage's AI analyzes your data in real time and delivers actionable insights to improve your organization.",
    queries: [
      "Which students are showing a drop in performance?",
      "Which payments are overdue this month?",
      "Summarize the performance of Grade 12.",
      "Analyze my revenue and expenses for July.",
      "Generate a progress report for parents.",
      "What are the main absences this week?",
    ],
    footer:
      "AI is built into every EduManage module — Attendance, Grades, Finance, Communication and more.",
  },
  automation: {
    eyebrow: "Automation",
    title: "Configure once. EduManage handles the rest.",
    subtitle: "Put an end to repetitive tasks. Your team focuses on what matters.",
    workflows: [
      { trigger: "Absence detected", action: "Automatic notification sent to the parent" },
      { trigger: "Overdue payment", action: "Automatic reminder sent to the parent" },
      { trigger: "New student enrolled", action: "File created automatically with all the details" },
      { trigger: "New grade published", action: "Notification available for the parent" },
    ],
  },
  business: {
    eyebrow: "Business view",
    title: "Stop running your business blind",
    subtitle:
      "Understand what works, what costs you time and where your growth opportunities lie.",
    bullets: [
      "Real-time overview of revenue and expenses",
      "Payment and overdue tracking",
      "Retention and progress indicators",
      "Occupancy rate by group and by program",
    ],
    metrics: [
      { label: "Time saved every week", value: "12", unit: "hours", change: "+40%" },
      { label: "Invoices collected", value: "4,200", unit: "", change: "+18%" },
      { label: "Retention rate", value: "87", unit: "%", change: "+5%" },
      { label: "Occupancy rate", value: "91", unit: "%", change: "+3%" },
    ],
  },
  productExperience: {
    eyebrow: "Product experience",
    title: "An interface designed for your daily life",
    subtitle: "Every screen is designed to save you time.",
    items: [
      { title: "Student profile", description: "Complete profile with history, grades, attendance and payments." },
      { title: "Attendance", description: "Mark and track attendance in one click." },
      { title: "Finance", description: "Financial dashboard with revenue, overdue payments and forecasts." },
      { title: "Timetable", description: "Interactive schedule with assigned rooms and teachers." },
      { title: "AI assistant", description: "Questions, analyses and recommendations in natural language." },
      { title: "Reports", description: "Report cards, progress reports and automated documents." },
    ],
    mini: {
      present: "Present",
      absent: "Absent",
      average: "Avg",
      attendanceTitle: "Grade 12 — Aug 21",
      financeTitle: "August 2026",
      scheduleTitle: "Timetable",
      scheduleClasses: ["Grade 12", "Grade 10", "Grade 6"],
      aiQuestion: "Which payments are overdue this month?",
      aiAnswer: "14 pending invoices, total: MAD 23,100",
      aiChips: ["Details", "Remind"],
      reports: [
        { name: "Report card — Jun 2026", status: "Generated" },
        { name: "Quarterly report", status: "Processing" },
        { name: "Certificate — Amina B.", status: "Ready" },
      ],
    },
  },
  pricingSection: {
    eyebrow: "Pricing",
    title: "Which type of organization do you run?",
    subtitle: "Choose your type to discover the plans that fit.",
    monthly: "Monthly",
    yearly: "Yearly",
    promo: { badge: "50% off the first month", note: "on all plans · No commitment" },
    perMonth: "DH/month",
    perYear: "DH/year",
    surDevis: "Custom quote",
    saveYearly: "Save {value} DH vs monthly",
    showMore: "+{count} more features",
    compareLink: "Compare features",
    ai: {
      included: "AI included",
      custom: "Custom AI",
      credits: "{count} credits / month",
    },
    orgTypes: {
      private_school: { label: "Private school", description: "Complete school management" },
      support_center: { label: "Tutoring center", description: "Groups, students and payments" },
      training_center: { label: "Training center", description: "Programs, learners and trainers" },
    },
    plans: {
      private_school: {
        starter: {
          tagline: "For small schools",
          limits: ["Students", "Groups", "Teachers", "Sites"],
          features: [
            "Students & parents",
            "Teachers & groups",
            "Attendance & grades",
            "Timetable",
            "Payments & invoices",
            "Documents",
          ],
          cta: "Get started",
        },
        standard: {
          tagline: "For growing schools",
          limits: ["Students", "Groups", "Teachers", "Sites"],
          features: [
            "Everything in Starter",
            "Report cards & assessments",
            "Student progress",
            "Homework",
            "Communication & announcements",
            "Financial reports",
            "School years",
          ],
          cta: "Get started",
        },
        pro: {
          tagline: "For established schools",
          badge: "Popular",
          limits: ["Students", "Groups", "Teachers", "Sites"],
          features: [
            "Everything in Standard",
            "Admissions & CRM",
            "Automation",
            "Advanced notifications",
            "AI analytics",
            "Advanced analytics",
            "Priority support",
          ],
          cta: "Try for free",
        },
        ultimate: {
          tagline: "The complete platform",
          limits: ["Students", "Groups", "Teachers", "Sites"],
          features: [
            "Everything in Pro",
            "Advanced AI (reports, insights)",
            "Full multi-site",
            "Teacher compensation",
            "Promotions & retention",
            "Advanced financial analytics",
            "Dedicated support",
          ],
          cta: "Try for free",
        },
        custom: {
          tagline: "For large institutions",
          limits: ["Students", "Sites", "AI", "Deployment"],
          features: [
            "Everything in Ultimate",
            "Custom deployment",
            "Custom AI",
            "Guaranteed SLA",
            "Custom integrations",
            "Dedicated training",
            "Account manager",
          ],
          cta: "Contact the team",
        },
      },
      support_center: {
        starter: {
          tagline: "For small centers",
          limits: ["Students", "Groups", "Teachers", "Rooms"],
          features: [
            "Students & parents",
            "Groups & levels",
            "Attendance",
            "Timetable",
            "Payments & receipts",
            "Documents",
          ],
          cta: "Get started",
        },
        standard: {
          tagline: "For growing centers",
          limits: ["Students", "Groups", "Teachers", "Rooms"],
          features: [
            "Everything in Starter",
            "Sessions & scheduling",
            "Discounts & rebates",
            "Communication & announcements",
            "Leads & trials",
            "Basic reports",
            "Student progress tracking",
          ],
          cta: "Get started",
        },
        pro: {
          tagline: "For established centers",
          badge: "Popular",
          limits: ["Students", "Groups", "Teachers", "Rooms"],
          features: [
            "Everything in Standard",
            "Automation",
            "Advanced notifications",
            "AI analytics",
            "Profitability by group",
            "Advanced analytics",
            "Priority support",
          ],
          cta: "Try for free",
        },
        ultimate: {
          tagline: "The complete platform",
          limits: ["Students", "Groups", "Teachers", "Rooms"],
          features: [
            "Everything in Pro",
            "Advanced AI (reports, insights)",
            "Full multi-site",
            "Advanced financial analytics",
            "Teacher workload management",
            "Student portal",
            "Dedicated support",
          ],
          cta: "Try for free",
        },
        custom: {
          tagline: "For large networks",
          limits: ["Students", "Sites", "AI", "Deployment"],
          features: [
            "Everything in Ultimate",
            "Custom deployment",
            "Custom AI",
            "Guaranteed SLA",
            "Custom integrations",
            "Dedicated training",
            "Account manager",
          ],
          cta: "Contact the team",
        },
      },
      training_center: {
        starter: {
          tagline: "For small centers",
          limits: ["Learners", "Programs", "Trainers", "Sessions"],
          features: [
            "Learners & trainers",
            "Programs & courses",
            "Sessions & attendance",
            "Enrollments",
            "Payments & invoices",
            "Documents",
          ],
          cta: "Get started",
        },
        standard: {
          tagline: "For growing centers",
          limits: ["Learners", "Programs", "Trainers", "Sessions"],
          features: [
            "Everything in Starter",
            "Cohorts & groups",
            "Progress tracking",
            "Assessments",
            "Communication & announcements",
            "Financial reports",
            "Shared documents",
          ],
          cta: "Get started",
        },
        pro: {
          tagline: "For established centers",
          badge: "Popular",
          limits: ["Learners", "Programs", "Trainers", "Corporate clients"],
          features: [
            "Everything in Standard",
            "Corporate clients & contracts",
            "Automation",
            "Advanced notifications",
            "AI analytics",
            "Advanced analytics",
            "Priority support",
          ],
          cta: "Try for free",
        },
        ultimate: {
          tagline: "The complete platform",
          limits: ["Learners", "Programs", "Trainers", "Sites"],
          features: [
            "Everything in Pro",
            "Advanced AI (reports, insights)",
            "Certificates & verification",
            "Skills & tracking",
            "Full multi-site",
            "Advanced financial analytics",
            "Dedicated support",
          ],
          cta: "Try for free",
        },
        custom: {
          tagline: "For large networks",
          limits: ["Learners", "Sites", "AI", "Deployment"],
          features: [
            "Everything in Ultimate",
            "Custom deployment",
            "Custom AI",
            "Guaranteed SLA",
            "Custom integrations",
            "Dedicated training",
            "Account manager",
          ],
          cta: "Contact the team",
        },
      },
    },
  },
  trust: {
    eyebrow: "Trust & security",
    title: "A platform you can use with confidence",
    items: [
      {
        title: "Secure data",
        description: "Data encryption, secure sessions and protection of your information.",
      },
      {
        title: "Role-based access",
        description: "Each user only sees what concerns them. Total control over permissions.",
      },
      {
        title: "Multi-tenant isolation",
        description: "Each organization operates in its own space. No data crossover.",
      },
      {
        title: "Complete data management",
        description: "Import, export and manage all your educational and financial data.",
      },
      {
        title: "Cloud SaaS",
        description: "Accessible anywhere, anytime. No server to maintain.",
      },
      {
        title: "Professional support",
        description: "A support team available to help you make the most of the platform.",
      },
    ],
  },
  finalCta: {
    title: "Ready to take back control of your organization?",
    subtitle:
      "Centralize your operations, save time and run your business with a platform built for modern education.",
    ctaPrimary: "Get started free",
    ctaSecondary: "Discover EduManage",
    promo: "50% off your first month · No commitment",
  },
  footer: {
    description:
      "The intelligent operating system for education. Private schools, tutoring centers and training centers.",
    tagline: "Run your entire education organization from a single platform.",
    columns: [
      {
        title: "Product",
        links: [
          { label: "Features", href: "/features" },
          { label: "Pricing", href: "/pricing" },
          { label: "AI", href: "/ai" },
          { label: "Security", href: "/security" },
          { label: "Roadmap", href: "/roadmap" },
        ],
      },
      {
        title: "Solutions",
        links: [
          { label: "Private schools", href: "/solutions/private-schools" },
          { label: "Tutoring centers", href: "/solutions/tutoring-centers" },
          { label: "Training centers", href: "/solutions/training-centers" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Documentation", href: "/resources/docs" },
          { label: "Help center", href: "/resources/help" },
          { label: "Blog", href: "/resources/blog" },
          { label: "FAQ", href: "/resources/faq" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "/company/about" },
          { label: "Contact", href: "/company/contact" },
          { label: "Partners", href: "/company/partners" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
          { label: "Legal notice", href: "/legal" },
        ],
      },
    ],
    bottom: "All rights reserved.",
    madeWith: "Built for modern education.",
  },
  pages: {
    features: {
      title: "Features — EduManage",
      description:
        "Discover all of EduManage's features: academic management, finance, communication, automation and AI.",
      hero: {
        eyebrow: "Features",
        title: "A complete suite for your organization",
        subtitle:
          "Every feature is designed to save you time, reduce errors and improve learner tracking.",
      },
      sections: [
        {
          heading: "Academic management",
          text: "Track your students, groups, subjects and attendance every day. Grade assessments, monitor progress and generate report cards automatically.",
          items: ["Students & files", "Groups & levels", "One-click attendance", "Assessments & report cards", "Homework & progress"],
        },
        {
          heading: "Staff & operations",
          text: "Organize your teachers, teams, rooms and timetables. Manage availability and replacements without friction.",
          items: ["Teachers & staff", "Timetables", "Rooms & resources", "Availability & replacements"],
        },
        {
          heading: "Finance",
          text: "Simplify billing, get paid faster and manage your cash flow with clear dashboards.",
          items: ["Payments & invoices", "Receipts & discounts", "Subscriptions & plans", "Financial analytics", "Overdue tracking"],
        },
        {
          heading: "Communication",
          text: "Reach parents, students and teams at the right time on the right channel: announcements, notifications, messaging and campaigns.",
          items: ["Announcements", "Targeted notifications", "Parent messaging", "Campaigns", "Automatic reminders"],
        },
        {
          heading: "Automation & AI",
          text: "Eliminate repetitive manual data entry. EduManage automatically triggers the right reminders, documents and alerts, and analyzes your data.",
          items: ["Configurable workflows", "AI analytics", "Performance alerts", "Automated reports", "AI financial analysis"],
        },
      ],
      cta: { heading: "All these features, without building the forms yourself.", text: "Create your account and explore the platform." },
    },
    pricing: {
      title: "Pricing — EduManage",
      description:
        "Simple, transparent plans for private schools, tutoring centers and training centers. 50% off your first month.",
      hero: { eyebrow: "Pricing", title: "Simple, transparent pricing", subtitle: "Choose your organization type, activate the plan that fits and cancel whenever you want." },
      faq: {
        heading: "Frequently asked questions",
        items: [
          { q: "Can I change plans at any time?", a: "Yes. Upgrade or downgrade your plan at any time from your billing workspace. The new rate applies from the next cycle." },
          { q: "How does the launch offer work?", a: "Your first subscription month is billed at 50% off, with no commitment. You can cancel at any time." },
          { q: "Is annual billing a good deal?", a: "Yes: an annual subscription equals 10 billing months, meaning two months free per year." },
          { q: "What do the AI credits include?", a: "Every plan includes a monthly volume of AI credits for analyses, reports and assistants. You can top up at any time." },
        ],
      },
    },
    ai: {
      title: "Artificial intelligence — EduManage",
      description:
        "A built-in AI assistant that analyzes your data in real time, detects weak signals and generates reports and recommendations.",
      hero: { eyebrow: "Artificial intelligence", title: "An AI assistant at the heart of your organization", subtitle: "Ask a question, get an answer. Analyze, predict, recommend, generate — without touching a spreadsheet." },
      sections: [
        {
          heading: "Real-time analysis",
          text: "The AI cross-references attendance, grades, payments and communication to show you what you should be seeing — as soon as it's relevant.",
          items: ["Performance drop detection", "Absenteeism alerts", "Overdue payment tracking", "Retention trends"],
        },
        {
          heading: "Automated reports",
          text: "Report cards, progress reports, month-end summaries: generate share-ready documents in seconds.",
          items: ["Progress reports", "Monthly summaries", "Personalized report cards", "AI financial analysis"],
        },
      ],
      capabilities: {
        heading: "What the AI can do for you",
        items: [
          { title: "Predict", text: "Anticipate risks of dropout, delays or underperformance." },
          { title: "Recommend", text: "Suggest the next actions at every level of the organization." },
          { title: "Generate", text: "Create reports, messages and documents from natural language." },
          { title: "Explain", text: "Answer questions about your data, confidentially." },
        ],
      },
    },
    security: {
      title: "Security — EduManage",
      description:
        "Encryption, role-based access control, multi-tenant isolation and backups: the security of your data is our priority.",
      hero: { eyebrow: "Security", title: "Your data deserves the highest level of protection", subtitle: "We apply strict security standards so you can focus on what matters." },
      sections: [
        {
          heading: "Data protection",
          text: "Your data is encrypted in transit and at rest. Sessions are secure and access is continuously monitored.",
          items: ["TLS encryption in transit", "Encryption at rest", "Session management", "Access auditing"],
        },
        {
          heading: "Isolation & permissions",
          text: "Each organization operates in an isolated space. Roles and permissions precisely control who sees what.",
          items: ["Multi-tenant isolation", "Roles & permissions", "Role-based access", "Secure reset"],
        },
      ],
    },
    roadmap: {
      title: "Roadmap — EduManage",
      description:
        "Follow the platform's upcoming developments: new features, improvements and optimizations to come.",
      hero: { eyebrow: "Roadmap", title: "What we're building for you", subtitle: "Full transparency on the platform's evolution." },
      sections: [
        {
          heading: "Coming soon",
          text: "These features are in development and will arrive in the coming weeks.",
          items: ["Mobile parent portal", "Additional payment integrations", "Customizable report card templates", "Multilingual AI assistant"],
        },
        {
          heading: "Under consideration",
          text: "We are exploring these areas based on your feedback and sector trends.",
          items: ["Full public API", "Native mobile app", "E-learning modules", "Template marketplace"],
        },
      ],
    },
    privateSchools: {
      title: "Private schools — EduManage",
      description:
        "The complete management platform for private schools: students, parents, teachers, attendance, grades, finance and communication.",
      hero: { eyebrow: "Solution", title: "Your entire school, run from a single platform", subtitle: "From enrollment to report card, everything is centralized, automated and visible in real time." },
      benefits: {
        heading: "Why choose EduManage for your school?",
        conds: [
          { title: "Save hours every week", text: "Attendance, payment reminders and communication are automated." },
          { title: "No risk of forgetting", text: "Every file, payment and report card is tracked and reminded automatically." },
          { title: "Parents informed in real time", text: "Direct messaging, announcements and targeted notifications." },
        ],
      },
      features: {
        heading: "Key features",
        items: ["Students & parents management", "Grades, assessments & report cards", "Daily attendance", "Timetables", "Payments & invoices", "Family communication", "Academic & financial reports"],
      },
    },
    tutoringCenters: {
      title: "Tutoring centers — EduManage",
      description:
        "Simplify your tutoring center's management: groups, schedules, attendance, payments and learner progress.",
      hero: { eyebrow: "Solution", title: "Your tutoring center, organized like a well-oiled machine", subtitle: "Manage your groups, your teachers and your payments in one place." },
      benefits: {
        heading: "Why choose EduManage for your center?",
        conds: [
          { title: "Boost your fill rate", text: "Track occupancy by group and by room to optimize your schedules." },
          { title: "Get paid faster", text: "Automatic billing, reminders and receipts in a few clicks." },
          { title: "Follow every learner", text: "Progress, attendance and real-time alerts for parents." },
        ],
      },
      features: {
        heading: "Key features",
        items: ["Groups & levels", "Timetables & rooms", "Automatic billing", "Attendance tracking", "Learner progress", "Parent communication", "Profitability by group"],
      },
    },
    trainingCenters: {
      title: "Training centers — EduManage",
      description:
        "Run your programs, trainers, learners and corporate clients: enrollment, progress, certificates and billing.",
      hero: { eyebrow: "Solution", title: "Your entire training center, from enrollment to certificate", subtitle: "Manage programs, cohorts, trainers and corporate clients in one space." },
      benefits: {
        heading: "Why choose EduManage for your training center?",
        conds: [
          { title: "Structured programs", text: "Cohorts, sessions, skills and progress organized end to end." },
          { title: "Simplified corporate clients", text: "Contracts, billing and dedicated corporate training tracking." },
          { title: "Automated certificates", text: "Generate and verify certificates for every learner." },
        ],
      },
      features: {
        heading: "Key features",
        items: ["Programs & cohorts", "Trainers & availability", "Progress tracking", "Assessments & skills", "Certificates & verification", "Corporate clients", "Financial reports"],
      },
    },
    docs: {
      title: "Documentation — EduManage",
      description:
        "Guides, getting-started tutorials and the complete reference for using EduManage every day.",
      hero: { eyebrow: "Resources", title: "Documentation & guides", subtitle: "Everything you need to get started quickly and get the most out of the platform." },
      sections: [
        {
          heading: "Getting started",
          text: "Set up your organization, invite your teams and import your existing data.",
          items: ["Create your account", "Set up your organization", "Invite your teams", "Import your data"],
        },
        {
          heading: "Module guides",
          text: "Practical guides for every module of the platform.",
          items: ["Students & admissions", "Attendance & assessments", "Payments & billing", "Communication & notifications", "Automation & AI"],
        },
      ],
    },
    help: {
      title: "Help center — EduManage",
      description:
        "Find answers to your EduManage questions: getting started, accounts, billing and troubleshooting.",
      hero: { eyebrow: "Resources", title: "How can we help you?", subtitle: "Browse the guides or contact our support team." },
      sections: [
        {
          heading: "Account & login",
          text: "Manage your account, credentials and security.",
          items: ["Create an account", "Reset my password", "Manage my access", "Switch organization"],
        },
        {
          heading: "Billing & subscriptions",
          text: "Plans, payments, promotions and AI credits.",
          items: ["Change my plan", "Understand my invoice", "Use my promotion", "Buy AI credits"],
        },
        {
          heading: "Troubleshooting",
          text: "Common issues and their solutions.",
          items: ["Slow connections", "Notifications not received", "Data import", "Payment issues"],
        },
      ],
    },
    blog: {
      title: "Blog — EduManage",
      description:
        "News, advice and best practices for education organizations. Education management, decoded.",
      hero: { eyebrow: "Resources", title: "The EduManage blog", subtitle: "Advice, news and trends for education organizations." },
      featured: {
        label: "Featured",
        title: "5 automations that save your school 10 hours a week",
        excerpt:
          "Attendance, payments, communication: review the most profitable automations to set up today.",
        date: "August 12, 2026",
        readTime: "6 min read",
      },
      posts: [
        { title: "How to improve your school's invoice collection rate", date: "August 5, 2026", readTime: "4 min" },
        { title: "Tutoring centers: structure your groups to boost profitability", date: "July 28, 2026", readTime: "5 min" },
        { title: "AI for training centers: practical use cases", date: "July 18, 2026", readTime: "7 min" },
        { title: "Admissions: digitalize your enrollment journey", date: "July 9, 2026", readTime: "5 min" },
        { title: "Measuring learner retention with the right metrics", date: "June 30, 2026", readTime: "4 min" },
      ],
      cta: { heading: "Get our upcoming publications", text: "Subscribe to the EduManage newsletter." },
    },
    faq: {
      title: "FAQ — EduManage",
      description:
        "Answers to the most common questions about EduManage: product, accounts, billing, security and support.",
      hero: { eyebrow: "Resources", title: "Frequently asked questions", subtitle: "Everything you need to know about EduManage." },
      items: [
        {
          q: "What is EduManage?",
          a: "EduManage is an all-in-one platform for private schools, tutoring centers and training centers. It centralizes students, teachers, attendance, payments, communication and analytics.",
        },
        {
          q: "Do I need to install software?",
          a: "No. EduManage is a SaaS solution accessible from your browser, on computer, tablet or phone.",
        },
        {
          q: "Can I import my existing data?",
          a: "Yes. You can import your students, groups, payments and history from Excel or CSV.",
        },
        {
          q: "How long does it take to get started?",
          a: "Most organizations are up and running in under a day: account creation, setup, team invitations and data import.",
        },
        {
          q: "What data is collected?",
          a: "Only the data needed to run your organization: profiles, attendance, grades, payments. You remain the owner of your data and can export it at any time.",
        },
        {
          q: "How can I contact support?",
          a: "Through the contact form in the app, or by email. Our team usually responds within 24 hours.",
        },
      ],
    },
    about: {
      title: "About — EduManage",
      description:
        "EduManage was born from a simple observation: education organizations lose precious time with scattered tools. We bring them a single solution.",
      hero: { eyebrow: "Company", title: "Give education organizations the technology they deserve", subtitle: "We believe technology should free up time for education teams — not add to the burden." },
      story: {
        heading: "Our story",
        conds: [
          "EduManage was born from conversations with private school principals, tutoring center managers and training center leaders.",
          "They all shared the same observation: too many tools, too much manual data entry, no global view.",
          "We built a single platform that centralizes all operations and automates them, so teams can focus on what matters: learning.",
        ],
      },
      values: {
        heading: "Our values",
        items: [
          { title: "Simplicity", text: "A clear interface, designed to be used every day by the whole team." },
          { title: "Reliability", text: "A stable, fast and secure platform, available everywhere and at all times." },
          { title: "Excellence", text: "We continuously improve the product based on customer feedback." },
        ],
      },
    },
    contact: {
      title: "Contact — EduManage",
      description:
        "Contact the EduManage team: sales, support, press or partnerships. Our teams respond quickly.",
      hero: { eyebrow: "Company", title: "Let's talk about your project", subtitle: "A question, a project, a demo: we'll get back to you quickly." },
      channels: [
        { title: "Sales", desc: "Discover EduManage and request a demo", value: "sales@" },
        { title: "Support", desc: "Help with your account", value: "support@" },
        { title: "Press & partnerships", desc: "Media, institutions and partners", value: "partners@" },
      ],
      note: "You can also write to us directly from the app once you're signed up.",
      formLabels: { name: "Full name", email: "Email address", subject: "Subject", message: "Message", submit: "Send" },
    },
    partners: {
      title: "Partners — EduManage",
      description:
        "EduManage works with partners who support education organizations: integrators, consultants and associations.",
      hero: { eyebrow: "Company", title: "Let's build the education of tomorrow, together", subtitle: "Integrators, consultants, institutions: join our ecosystem." },
      programs: [
        { title: "Integrator program", text: "Support your education clients with a complete platform and run the implementations." },
        { title: "Consultant network", text: "Advise your clients on the digital transformation of their education organization." },
        { title: "Institutions & associations", text: "Bring EduManage to the education organizations in your network and support their digitalization." },
      ],
      cta: { heading: "Become a partner", text: "Write to us and discover collaboration opportunities." },
    },
    privacy: {
      title: "Privacy — EduManage",
      description:
        "EduManage's privacy policy: what data we collect, why, and your rights as a user.",
      hero: { eyebrow: "Legal", title: "Privacy policy", subtitle: "Last updated: August 1, 2026." },
      sections: [
        {
          heading: "Data collected",
          text: "We collect the data required to run the platform: account information, student profiles, attendance, grades and payments.",
        },
        {
          heading: "Use of data",
          text: "Your data is used only to provide the service: management, analytics, billing and customer support. We never sell your data.",
        },
        {
          heading: "Storage & security",
          text: "Data is encrypted in transit and at rest, hosted in secure data centers, with regular backups.",
        },
        {
          heading: "Your rights",
          text: "You can access, correct or export your data at any time, and request its deletion within the legal timeframes.",
        },
      ],
    },
    terms: {
      title: "Terms of use — EduManage",
      description:
        "EduManage's terms of use: your obligations, our commitments and the rules for using the platform.",
      hero: { eyebrow: "Legal", title: "Terms of use", subtitle: "Last updated: August 1, 2026." },
      sections: [
        {
          heading: "Use of the service",
          text: "The service is reserved for professional use. You are responsible for the use of your account and the confidentiality of your credentials.",
        },
        {
          heading: "Subscriptions & billing",
          text: "Subscriptions are billed according to the chosen plan, monthly or annually. You can change plans or cancel at any time.",
        },
        {
          heading: "Data ownership",
          text: "You retain ownership of the data you enter in the platform. EduManage claims no ownership over your content.",
        },
        {
          heading: "Liabilities",
          text: "EduManage commits to providing an available and reliable service, without implied guarantee of continuous availability. EduManage's liability is limited as provided by law.",
        },
      ],
    },
    legal: {
      title: "Legal notice — EduManage",
      description: "EduManage website legal notice: publisher, hosting and contact.",
      hero: { eyebrow: "Legal", title: "Legal notice", subtitle: "Publisher, hosting and contact information." },
      sections: [
        {
          heading: "Publisher",
          text: "EduManage is a product published by a company incorporated under Moroccan law, registered under the applicable legal regime.",
        },
        {
          heading: "Hosting",
          text: "The website and platform are hosted in secure data centers, with high-availability infrastructure.",
        },
        {
          heading: "Contact",
          text: "For any question regarding the legal notice, you can contact us via the contact page.",
        },
        {
          heading: "Intellectual property",
          text: "All website content (texts, images, logos, design) is the property of EduManage. Any reproduction without authorization is prohibited.",
        },
      ],
    },
  },
  notFound: {
    title: "Page not found",
    text: "The page you're looking for doesn't exist or has been moved.",
    backHome: "Back to home",
  },
};