import LandingHeader from "@/components/landing/header";
import Hero from "@/components/landing/hero";
import ValueProps from "@/components/landing/value-props";
import ProblemSolution from "@/components/landing/problem-solution";
import Solutions from "@/components/landing/solutions";
import Features from "@/components/landing/features";
import AiSection from "@/components/landing/ai-section";
import Automation from "@/components/landing/automation";
import Business from "@/components/landing/business";
import ProductExperience from "@/components/landing/product-experience";
import PricingPreview from "@/components/landing/pricing-preview";
import Trust from "@/components/landing/trust";
import FinalCta from "@/components/landing/final-cta";
import LandingFooter from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main>
        <Hero />
        <ValueProps />
        <ProblemSolution />
        <Solutions />
        <Features />
        <AiSection />
        <Automation />
        <Business />
        <ProductExperience />
        <PricingPreview />
        <Trust />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
