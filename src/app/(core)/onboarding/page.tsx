"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ORG_TYPES = [
  { value: "PRIVATE_SCHOOL", label: "École Privée", description: "Gestion complète des élèves, cours, notes et présences" },
  { value: "TRAINING_CENTER", label: "Centre de Formation", description: "Programmes, cohortes, apprenants et certificats" },
  { value: "SUPPORT_CENTER", label: "Centre de Soutien", description: "Suivi des progrès et sessions de soutien scolaire" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create organization");
        return;
      }

      router.push("/school/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Bienvenue sur EduManage</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Créez votre première organisation pour commencer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
              Nom de l&apos;organisation
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: École Al Andalus"
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Type d&apos;organisation
            </label>
            <div className="mt-2 space-y-2">
              {ORG_TYPES.map((orgType) => (
                <label
                  key={orgType.value}
                  className={`flex cursor-pointer items-start rounded-md border p-3 transition-colors ${
                    type === orgType.value
                      ? "border-black bg-zinc-100"
                      : "border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={orgType.value}
                    checked={type === orgType.value}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-0.5"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-zinc-900">
                      {orgType.label}
                    </p>
                    <p className="text-xs text-zinc-500">{orgType.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name || !type}
            className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Création en cours..." : "Créer l'organisation"}
          </button>
        </form>
      </div>
    </div>
  );
}
