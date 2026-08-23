const fs = require('fs');
const path = require('path');
const base = 'C:/Users/3imra/Desktop/Edu Manage';

// Fix reports.ts enum values
const reportsPath = path.join(base, 'src/lib/reports.ts');
let reports = fs.readFileSync(reportsPath, 'utf8');
reports = reports.replace('l.status === "CONVERTED"', 'l.status === "ENROLLED"');
reports = reports.replace('t.status === "ENROLLED"', 't.status === "ATTENDED"');
fs.writeFileSync(reportsPath, reports);
console.log('Fixed enum values in reports.ts');

// Fix PageHeader icon props in all pages - need <Icon /> not Icon
const pageFiles = [
  'src/app/(dashboard)/reports/page.tsx',
  'src/app/(dashboard)/reports/people/page.tsx',
  'src/app/(dashboard)/reports/academic/page.tsx',
  'src/app/(dashboard)/reports/attendance/page.tsx',
  'src/app/(dashboard)/reports/finance/page.tsx',
  'src/app/(dashboard)/reports/admissions/page.tsx',
  'src/app/(dashboard)/reports/scheduling/page.tsx',
];

for (const f of pageFiles) {
  const fp = path.join(base, f);
  let content = fs.readFileSync(fp, 'utf8');
  // Fix: icon={Users} -> icon={<Users />} etc.
  content = content.replace(/icon=\{(\w+)\}/g, 'icon={<$1 />}');
  fs.writeFileSync(fp, content);
  console.log('Fixed icon prop: ' + f);
}

// Fix export route null values
const exportPath = path.join(base, 'src/app/api/reports/export/route.ts');
let exp = fs.readFileSync(exportPath, 'utf8');
exp = exp.replace(
  'const escape = (v: string | number) => {',
  'const escape = (v: string | number | null) => {'
);
fs.writeFileSync(exportPath, exp);
console.log('Fixed export route null handling');
