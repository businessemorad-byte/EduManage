const fs = require('fs');
const path = require('path');
const base = 'C:/Users/3imra/Desktop/Edu Manage';

// Fix reports/page.tsx - restore CARDS icon to component refs
const reportsPage = path.join(base, 'src/app/(dashboard)/reports/page.tsx');
let rp = fs.readFileSync(reportsPage, 'utf8');
// The CARDS array had icon: Users changed to icon: <Users /> but it should be component references
// Restore them for the CARDS const only (not PageHeader calls)
const cardsSection = `const CARDS = [
  { title: "People Report", desc: "Students, staff, groups & levels", icon: <Users />, href: "/reports/people", color: "from-blue-500 to-blue-600" },
  { title: "Academic Report", desc: "Grades, scores & performance", icon: <BookOpen />, href: "/reports/academic", color: "from-emerald-500 to-emerald-600" },
  { title: "Attendance Report", desc: "Rates, trends & anomalies", icon: <CalendarCheck />, href: "/reports/attendance", color: "from-violet-500 to-violet-600" },
  { title: "Finance Report", desc: "Revenue, payments & collection", icon: <Wallet />, href: "/reports/finance", color: "from-amber-500 to-amber-600" },
  { title: "Admissions Report", desc: "Leads, trials & conversions", icon: <UserPlus />, href: "/reports/admissions", color: "from-rose-500 to-rose-600" },
  { title: "Scheduling Report", desc: "Sessions, rooms & teacher load", icon: <Clock />, href: "/reports/scheduling", color: "from-cyan-500 to-cyan-600" },
];`;

const cardsReplacement = `const CARDS = [
  { title: "People Report", desc: "Students, staff, groups & levels", icon: Users, href: "/reports/people", color: "from-blue-500 to-blue-600" },
  { title: "Academic Report", desc: "Grades, scores & performance", icon: BookOpen, href: "/reports/academic", color: "from-emerald-500 to-emerald-600" },
  { title: "Attendance Report", desc: "Rates, trends & anomalies", icon: CalendarCheck, href: "/reports/attendance", color: "from-violet-500 to-violet-600" },
  { title: "Finance Report", desc: "Revenue, payments & collection", icon: Wallet, href: "/reports/finance", color: "from-amber-500 to-amber-600" },
  { title: "Admissions Report", desc: "Leads, trials & conversions", icon: UserPlus, href: "/reports/admissions", color: "from-rose-500 to-rose-600" },
  { title: "Scheduling Report", desc: "Sessions, rooms & teacher load", icon: Clock, href: "/reports/scheduling", color: "from-cyan-500 to-cyan-600" },
];`;

rp = rp.replace(cardsSection, cardsReplacement);
fs.writeFileSync(reportsPage, rp);
console.log('Fixed CARDS array in reports page');

// Fix export route - widen csv type
const exportPath = path.join(base, 'src/app/api/reports/export/route.ts');
let exp = fs.readFileSync(exportPath, 'utf8');
exp = exp.replace(
  'function toCsv(headers: string[], rows: (string | number)[][])',
  'function toCsv(headers: string[], rows: (string | number | null)[][])'
);
exp = exp.replace(
  'const escape = (v: string | number | null) => {',
  'const escape = (v: string | number | null) => {'
);
fs.writeFileSync(exportPath, exp);
console.log('Fixed export route');
