import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { appName, metadataBaseUrl } from '@/configs/branding';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import Hero from '@/components/LandingPage/Hero';
import ModulesBento from '@/components/LandingPage/ModulesBento';
import HowItWorks from '@/components/LandingPage/HowItWorks';
import IntegratedLonjas from '@/components/LandingPage/IntegratedLonjas';
import TrustBadge from '@/components/LandingPage/TrustBadge';
import PricingPreview from '@/components/LandingPage/PricingPreview';
import LeadCaptureForm from '@/components/LandingPage/LeadCaptureForm';
import Footer from '@/components/LandingPage/Footer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Landing.hero' });
  const base = metadataBaseUrl.replace(/\/$/, '');
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${base}${getPathname({ locale: l, href: '/' })}`])
  );

  return {
    // `absolute` evita que el `title.template` del layout raíz duplique el appName
    title: { absolute: `${appName} | ${t('metaTitle')}` },
    description: t('subtitle'),
    alternates: { canonical: `${base}${getPathname({ locale, href: '/' })}`, languages },
  };
}

export default function LandingHomePage() {
  const softwareApplicationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: appName,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
  };

  return (
    <div className="bg-background min-h-screen">
      {/* JSON-LD SoftwareApplication — sembrado desde Server Component (landing-proposal.md §4.5) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <Hero />
      <ModulesBento />
      <HowItWorks />
      <IntegratedLonjas />
      <TrustBadge />
      <PricingPreview />
      <LeadCaptureForm />
      <Footer />
    </div>
  );
}
