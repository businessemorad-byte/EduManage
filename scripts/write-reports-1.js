const fs = require('fs');
const path = require('path');

const base = 'C:/Users/3imra/Desktop/Edu Manage';

const dirs = [
  'src/app/api/reports/overview',
  'src/app/api/reports/people',
  'src/app/api/reports/academic',
  'src/app/api/reports/attendance',
  'src/app/api/reports/finance',
  'src/app/api/reports/admissions',
  'src/app/api/reports/scheduling',
  'src/app/api/reports/export',
  'src/app/(dashboard)/reports/people',
  'src/app/(dashboard)/reports/academic',
  'src/app/(dashboard)/reports/attendance',
  'src/app/(dashboard)/reports/finance',
  'src/app/(dashboard)/reports/admissions',
  'src/app/(dashboard)/reports/scheduling',
  'src/components/reports',
];

dirs.forEach(d => fs.mkdirSync(path.join(base, d), { recursive: true }));
console.log('dirs created');
