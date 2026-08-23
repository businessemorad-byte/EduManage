const fs = require('fs');
const path = require('path');
const base = 'C:/Users/3imra/Desktop/Edu Manage';

const partA = [
'import { db } from "@/lib/prisma";',
'import { Decimal } from "@prisma/client/runtime/client";',
'',
'export type DateRange = { startDate?: string; endDate?: string };',
'',
'export function parseDateRange(sp: URLSearchParams): DateRange {',
'  return { startDate: sp.get("startDate") ?? undefined, endDate: sp.get("endDate") ?? undefined };',
'}',
'',
'function createdAtFilter(range: DateRange) {',
'  if (!range.startDate && !range.endDate) return undefined;',
'  return {',
'    createdAt: {',
'      ...(range.startDate ? { gte: new Date(range.startDate) } : {}),',
'      ...(range.endDate ? { lte: new Date(range.endDate + "T23:59:59.999Z") } : {}),',
'    },',
'  };',
'}',
'',
'function dateBetween(field: string, range: DateRange) {',
'  if (!range.startDate && !range.endDate) return undefined;',
'  return {',
'    [field]: {',
'      ...(range.startDate ? { gte: new Date(range.startDate) } : {}),',
'      ...(range.endDate ? { lte: new Date(range.endDate + "T23:59:59.999Z") } : {}),',
'    },',
'  };',
'}',
'',
'function archivedFilter() {',
'  return { person: { status: { not: "ARCHIVED" as const } } };',
'}',
'',
].join('\n');

fs.writeFileSync(path.join(base, 'src/lib/reports.ts'), partA);
console.log('Part A done');
