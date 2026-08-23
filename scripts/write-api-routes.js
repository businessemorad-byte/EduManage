const fs = require('fs');
const path = require('path');
const base = 'C:/Users/3imra/Desktop/Edu Manage';

function w(rel, content) {
  fs.writeFileSync(path.join(base, rel), content);
  console.log('Wrote: ' + rel);
}

function apiRoute(reportFn, range = true) {
  const rangeParam = range ? `, range` : '';
  const rangeArg = range ? ', range' : '';
  const parseLine = range ? `
  const sp = new URL(request.url).searchParams;
  const range = parseDateRange(sp);` : '';
  const importLine = range ? `import { ${reportFn}, parseDateRange } from "@/lib/reports";` : `import { ${reportFn} } from "@/lib/reports";`;

  return `"use server";

import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/rbac";
${importLine}

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, PERMISSIONS.REPORTS_READ);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });${parseLine}
    const data = await ${reportFn}(organizationId${rangeArg});
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: "Unable to generate report. Please try again." }, { status });
  }
}
`;
}

w('src/app/api/reports/overview/route.ts', apiRoute('getReportsOverview', false));
w('src/app/api/reports/people/route.ts', apiRoute('getPeopleReport', true));
w('src/app/api/reports/academic/route.ts', apiRoute('getAcademicReport', true));
w('src/app/api/reports/attendance/route.ts', apiRoute('getAttendanceReport', true));
w('src/app/api/reports/finance/route.ts', apiRoute('getFinanceReport', true));
w('src/app/api/reports/admissions/route.ts', apiRoute('getAdmissionsReport', true));
w('src/app/api/reports/scheduling/route.ts', apiRoute('getSchedulingReport', true));
