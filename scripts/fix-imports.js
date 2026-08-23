const fs = require('fs');
const path = require('path');
const base = 'C:/Users/3imra/Desktop/Edu Manage';

const files = [
  'src/app/(dashboard)/reports/page.tsx',
  'src/app/(dashboard)/reports/people/page.tsx',
  'src/app/(dashboard)/reports/academic/page.tsx',
  'src/app/(dashboard)/reports/attendance/page.tsx',
  'src/app/(dashboard)/reports/finance/page.tsx',
  'src/app/(dashboard)/reports/admissions/page.tsx',
  'src/app/(dashboard)/reports/scheduling/page.tsx',
];

for (const f of files) {
  const fp = path.join(base, f);
  let content = fs.readFileSync(fp, 'utf8');
  content = content.replace(
    'import PageHeader from "@/components/layout/PageHeader";',
    'import { PageHeader } from "@/components/dashboard/page-header";'
  );
  fs.writeFileSync(fp, content);
  console.log('Fixed: ' + f);
}

// Fix export route - remove dynamicImport line
const exportPath = path.join(base, 'src/app/api/reports/export/route.ts');
let exp = fs.readFileSync(exportPath, 'utf8');
exp = exp.replace("    const { dynamicImport } = await import(\"@/lib/reports\");\n", '');
fs.writeFileSync(exportPath, exp);
console.log('Fixed export route');
