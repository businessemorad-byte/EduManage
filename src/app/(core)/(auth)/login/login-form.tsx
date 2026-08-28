"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPostLoginRedirect } from "@/lib/post-login-redirect";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes("Invalid email or password")) {
          setError("Adresse e-mail ou mot de passe incorrect.");
        } else if (data.error?.includes("deactivated")) {
          setError("Votre compte a été désactivé. Contactez le support.");
        } else {
          setError(data.error || "Une erreur est survenue. Veuillez réessayer.");
        }
        return;
      }

      const redirect = getPostLoginRedirect(from, data.user?.role, data.organization?.type);
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Visual Side */}
      <div className="hidden relative w-[45%] overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 lg:flex lg:flex-col lg:justify-center lg:items-center">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        {/* Floating orbs */}
        <div className="absolute top-20 left-16 w-64 h-64 rounded-full bg-white/5 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-24 right-12 w-80 h-80 rounded-full bg-brand-400/10 blur-3xl animate-pulse-slow animation-delay-400" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-brand-300/10 blur-2xl animate-float" />

        {/* Content */}
        <div className="relative z-10 max-w-md px-8 animate-slide-in-left">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Pilotez votre organisation éducative
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white leading-tight tracking-tight mb-4">
            La plateforme intelligente pour l&apos;éducation
          </h2>
          <p className="text-lg text-white/70 leading-relaxed mb-10">
            Gérez vos élèves, enseignants, finances et opérations depuis un seul espace.
          </p>

          {/* Floating dashboard mockup cards */}
          <div className="space-y-3">
            <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm animate-float" style={{ animationDelay: "0s" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-white text-sm">📊</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Tableau de bord</div>
                <div className="text-xs text-white/50">Vue d&apos;ensemble en temps réel</div>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm animate-float" style={{ animationDelay: "1s" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-white text-sm">🤖</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">IA intégrée</div>
                <div className="text-xs text-white/50">Automatisation intelligente</div>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm animate-float" style={{ animationDelay: "2s" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-white text-sm">📈</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Analytics avancés</div>
                <div className="text-xs text-white/50">Rapports et insights détaillés</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-20 animate-slide-in-right">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile brand header */}
          <div className="mb-8 text-center lg:hidden">
            <h1 className="text-2xl font-bold tracking-tight">EduManage</h1>
          </div>

          {/* Desktop brand */}
          <div className="mb-8 hidden lg:block">
            <a href="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">E</span>
              EduManage
            </a>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Bienvenue sur EduManage
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Pilotez votre organisation éducative depuis un seul espace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-scale-in">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                Mot de passe
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 pr-12 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Connexion en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-zinc-500">ou</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-500">
                Vous n&apos;avez pas encore de compte ?{" "}
                <a href="/register" className="font-medium text-brand-600 hover:text-brand-700 transition-colors">
                  Créer un compte
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
