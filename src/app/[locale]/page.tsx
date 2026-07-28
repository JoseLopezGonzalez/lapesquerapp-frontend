import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { appName, metadataBaseUrl } from '@/configs/branding';
import Hero from '@/components/LandingPage/Hero';
import ModulesBento from '@/components/LandingPage/ModulesBento';
import IntegratedLonjas from '@/components/LandingPage/IntegratedLonjas';
import ProductShowcase from '@/components/LandingPage/ProductShowcase';
import TrustBadge from '@/components/LandingPage/TrustBadge';
import LeadCaptureForm from '@/components/LandingPage/LeadCaptureForm';
import Footer from '@/components/LandingPage/Footer';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Landing.hero');

  return {
    // `absolute` evita que el `title.template` del layout raíz duplique el appName
    title: { absolute: `${appName} | ERP para la industria pesquera` },
    description: t('subtitle'),
    alternates: { canonical: metadataBaseUrl },
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
      <IntegratedLonjas />
      <ProductShowcase />
      <TrustBadge />
      <LeadCaptureForm />
      <Footer />
    </div>
  );
}
