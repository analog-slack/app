import { Faq } from './faq';
import { Features } from './features';
import { FinalCta } from './final-cta';
import { Hero } from './hero';
import { HowItWorks } from './how-it-works';
import { LandingFooter } from './landing-footer';
import { LandingHeader } from './landing-header';

export function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
