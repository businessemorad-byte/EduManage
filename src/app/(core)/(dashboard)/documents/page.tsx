"use client";

import { useFetch } from "@/hooks/use-fetch";

type Document = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
  student: { person: { firstName: string; lastName: string } };
};

const CATEGORY_COLORS: Record<string, string> = {
  TRANSCRIPT: "bg-blue-100 text-blue-800",
  CERTIFICATE: "bg-green-100 text-green-800",
  ID: "bg-purple-100 text-purple-800",
  MEDICAL: "bg-red-100 text-red-800",
  OTHER: "bg-gray-100 text-gray-800",
};

export default function DocumentsPage() {
  const { data, loading } = useFetch<{ documents: Document[]; pagination: { total: number } }>("/api/documents");

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    window.location.reload();
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Student Documents</h1>
        <span className="text-sm text-zinc-500">{data?.pagination.total ?? 0} documents</span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-zinc-500">Loading...</div>
      ) : !data?.documents.length ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-500">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.documents.map((doc) => (
                <tr key={doc.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 text-sm font-medium">{doc.name}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {doc.student.person.firstName} {doc.student.person.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[doc.category] ?? CATEGORY_COLORS.OTHER}`}>
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      View
                    </a>
                    <button onClick={() => handleDelete(doc.id)} className="ml-3 text-sm text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
