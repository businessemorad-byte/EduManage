import type { Metadata } from "next";
import { fontVariables } from "@/fonts";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "EduManage — Le système d'exploitation intelligent pour l'éducation",
  description:
    "Pilotez toute votre organisation éducative depuis une seule plateforme. Écoles privées, centres de soutien et centres de formation.",
};

export default function CoreRootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}