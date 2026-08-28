import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Reveal } from "@/components/landing/motion";
import LandingHero from "@/components/landing/hero";
import LandingValueProps from "@/components/landing/value-props";
import LandingProblemSolution from "@/components/landing/problem-solution";
import LandingSolutions from "@/components/landing/solutions";
import LandingFeatures from "@/components/landing/features";
import LandingAiSection from "@/components/landing/ai-section";
import LandingAutomation from "@/components/landing/automation";
import LandingBusiness from "@/components/landing/business";
import LandingProductExperience from "@/components/landing/product-experience";
import LandingPricingPreview from "@/components/landing/pricing-preview";
import LandingTrust from "@/components/landing/trust";
import LandingFinalCta from "@/components/landing/final-cta";

export default async function HomePage({
  params,
}: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="min-h-screen">
      <main>
        <LandingHero lang={lang} dict={dict} />
        <Reveal><LandingValueProps lang={lang} dict={dict} /></Reveal>
        <Reveal><LandingProblemSolution lang={lang} dict={dict} /></Reveal>
        <Reveal delay={80}><LandingSolutions lang={lang} dict={dict} /></Reveal>
        <Reveal delay={80}><LandingFeatures lang={lang} dict={dict} /></Reveal>
        <Reveal delay={80}><LandingAiSection lang={lang} dict={dict} /></Reveal>
        <Reveal delay={80}><LandingAutomation lang={lang} dict={dict} /></Reveal>
        <LandingBusiness lang={lang} dict={dict} />
        <Reveal delay={80}><LandingProductExperience lang={lang} dict={dict} /></Reveal>
        <Reveal delay={80}><LandingPricingPreview lang={lang} dict={dict.pricingSection} /></Reveal>
        <Reveal delay={80}><LandingTrust lang={lang} dict={dict} /></Reveal>
        <Reveal delay={80}><LandingFinalCta lang={lang} dict={dict} /></Reveal>
      </main>
    </div>
  );
}