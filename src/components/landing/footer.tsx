import Link from "next/link";
import { GraduationCap } from "lucide-react";

const footerLinks = {
  Produit: [
    { label: "Fonctionnalités", href: "#fonctionnalites" },
    { label: "Tarifs", href: "#tarifs" },
    { label: "IA", href: "#ia" },
    { label: "Sécurité", href: "#" },
    { label: "Roadmap", href: "#" },
  ],
  Solutions: [
    { label: "Écoles privées", href: "/solutions/ecoles" },
    { label: "Centres de soutien", href: "/solutions/centres-soutien" },
    { label: "Centres de formation", href: "/solutions/formation" },
  ],
  Ressources: [
    { label: "Documentation", href: "#" },
    { label: "Centre d'aide", href: "#" },
    { label: "Blog", href: "#" },
    { label: "FAQ", href: "#" },
  ],
  Entreprise: [
    { label: "À propos", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Partenaires", href: "#" },
  ],
  Légal: [
    { label: "Confidentialité", href: "#" },
    { label: "Conditions", href: "#" },
    { label: "Mentions légales", href: "#" },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="border-t border-zinc-100 bg-white" id="ressources">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <GraduationCap className="h-7 w-7 text-brand-600" strokeWidth={2.2} />
              <span className="text-lg font-bold tracking-tight text-zinc-900">
                EduManage
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              Le système d&apos;exploitation intelligent pour les organisations
              éducatives modernes.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-600">FR</span>
              <span>/</span>
              <span className="cursor-pointer transition-colors hover:text-zinc-600">EN</span>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
                {category}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-zinc-100 pt-8">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} EduManage. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
