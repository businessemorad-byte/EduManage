import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function PublicGroupNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <GraduationCap className="h-12 w-12 text-brand-600" strokeWidth={2} />
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
        Page introuvable
      </h1>
      <p className="max-w-md text-zinc-500">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" className="mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
        Retourner à l&apos;accueil
      </Link>
    </div>
  );
}