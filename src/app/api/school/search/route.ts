import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "STUDENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const search = { contains: query, mode: "insensitive" as const };
    const take = 10;

    const [students, parents, teachers, groups, subjects, invoices] = await Promise.all([
      db.student.findMany({
        where: { organizationId, person: { OR: [{ firstName: search }, { lastName: search }, { email: search }] } },
        include: { person: { select: { firstName: true, lastName: true, email: true } } },
        take,
      }),
      db.parent.findMany({
        where: { organizationId, person: { OR: [{ firstName: search }, { lastName: search }, { email: search }] } },
        include: { person: { select: { firstName: true, lastName: true, email: true } } },
        take,
      }),
      db.teacher.findMany({
        where: { organizationId, staff: { person: { OR: [{ firstName: search }, { lastName: search }] } } },
        include: { staff: { include: { person: { select: { firstName: true, lastName: true, email: true } } } } },
        take,
      }),
      db.group.findMany({ where: { organizationId, OR: [{ name: search }, { code: search }] }, take }),
      db.subject.findMany({ where: { organizationId, OR: [{ name: search }, { code: search }] }, take }),
      db.invoice.findMany({
        where: { organizationId, OR: [{ invoiceNumber: search }, { student: { person: { OR: [{ firstName: search }, { lastName: search }] } } }] },
        include: { student: { include: { person: { select: { firstName: true, lastName: true } } } } },
        take,
      }),
    ]);

    return NextResponse.json({
      results: [
        ...students.map((s) => ({ type: "student", id: s.id, name: `${s.person.firstName} ${s.person.lastName}`, detail: s.person.email, url: `/students/${s.id}` })),
        ...parents.map((p) => ({ type: "parent", id: p.id, name: `${p.person.firstName} ${p.person.lastName}`, detail: p.person.email, url: `/parents` })),
        ...teachers.map((t) => ({ type: "teacher", id: t.id, name: `${t.staff.person.firstName} ${t.staff.person.lastName}`, detail: t.staff.person.email, url: `/teachers` })),
        ...groups.map((g) => ({ type: "class", id: g.id, name: g.name, detail: g.code ?? "", url: `/groups` })),
        ...subjects.map((s) => ({ type: "subject", id: s.id, name: s.name, detail: s.code ?? "", url: `/subjects` })),
        ...invoices.map((i) => ({ type: "invoice", id: i.id, name: i.invoiceNumber, detail: `${i.student.person.firstName} ${i.student.person.lastName}`, url: `/invoices` })),
      ],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
