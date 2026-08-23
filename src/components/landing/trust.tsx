import { Shield, Lock, Users, Database, Cloud, Headphones } from "lucide-react";

const trustItems = [
  {
    icon: Lock,
    title: "Données sécurisées",
    description: "Chiffrement des données, sessions sécurisées et protection de vos informations.",
  },
  {
    icon: Shield,
    title: "Accès basé sur les rôles",
    description: "Chaque utilisateur ne voit que ce qui le concerne. Contrôle total des permissions.",
  },
  {
    icon: Users,
    title: "Isolation multi-tenant",
    description: "Chaque organisation opère dans son propre espace. Aucun croisement de données.",
  },
  {
    icon: Database,
    title: "Gestion complète des données",
    description: "Import, export et gestion de toutes vos données éducatives et financières.",
  },
  {
    icon: Cloud,
    title: "SaaS cloud",
    description: "Accessible partout, à tout moment. Pas de serveur à maintenir.",
  },
  {
    icon: Headphones,
    title: "Support professionnel",
    description: "Équipe de support disponible pour vous accompagner dans votre utilisation.",
  },
];

export default function Trust() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Confiance & sécurité
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Une plateforme que vous pouvez explorer en toute confiance
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trustItems.map((item) => (
            <div key={item.title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <item.icon className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
