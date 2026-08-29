"use client";

import { useFetch } from "@/hooks/use-fetch";

type ReportCardItem = {
  id: string;
  subjectName: string;
  average: number;
  coefficient: number;
  grade1: number | null;
  grade2: number | null;
  grade3: number | null;
  remarks: string | null;
};

type ReportCard = {
  id: string;
  status: string;
  overallAverage: number | null;
  classRank: number | null;
  totalStudents: number | null;
  promotionStatus: string | null;
  teacherRemarks: string | null;
  term: string | null;
  createdAt: string;
  student: { person: { firstName: string; lastName: string } };
  group: { name: string } | null;
  academicYear: { name: string } | null;
  items: ReportCardItem[];
};

export default function ReportCardsPage() {
  const { data, loading } = useFetch<{ reportCards: ReportCard[]; pagination: { total: number } }>("/api/report-cards");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Report Cards</h1>
      </div>

      {loading ? (
        <div className="py-8 text-center text-zinc-500">Loading...</div>
      ) : !data?.reportCards.length ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-500">No report cards generated yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.reportCards.map((rc) => (
            <div key={rc.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{rc.student.person.firstName} {rc.student.person.lastName}</h3>
                  <p className="text-sm text-zinc-500">
                    {rc.group?.name ?? "—"} {rc.academicYear?.name ? `· ${rc.academicYear.name}` : ""} {rc.term ? `· ${rc.term}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rc.status === "FINALIZED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {rc.status}
                  </span>
                  {rc.overallAverage !== null && (
                    <span className="text-lg font-bold">{rc.overallAverage.toFixed(2)}</span>
                  )}
                </div>
              </div>

              {rc.items.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-zinc-500">
                      <th className="pb-1">Subject</th>
                      <th className="pb-1">Average</th>
                      <th className="pb-1">Coeff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rc.items.map((item) => (
                      <tr key={item.id} className="border-t border-zinc-100">
                        <td className="py-1">{item.subjectName}</td>
                        <td className="py-1 font-medium">{item.average.toFixed(2)}</td>
                        <td className="py-1 text-zinc-500">{item.coefficient}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {rc.promotionStatus && (
                <div className="mt-2 text-sm">
                  <span className={`font-medium ${rc.promotionStatus === "PROMOTED" ? "text-green-600" : "text-red-600"}`}>
                    {rc.promotionStatus}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
