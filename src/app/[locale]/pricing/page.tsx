import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { metadataBaseUrl } from '@/configs/branding';
import PricingToggle, { PricingPeriodLabel } from '@/components/LandingPage/PricingToggle';

const TIER_KEYS = ['starter', 'pro', 'enterprise'] as const;
const CAPABILITY_KEYS = ['capability1', 'capability2', 'capability3', 'capability4', 'capability5'];
const FAQ_KEYS = ['faqQ1', 'faqQ2', 'faqQ3', 'faqQ4'];
// El nivel enterprise no muestra un número de precio (ver product-catalog.md: incluye
// Producción/Maquila e IA/Extracción, ambos "bajo consulta" por su coste de onboarding
// real) — mismo patrón de mercado ya documentado en landing-proposal.md §4.3.
const ENTERPRISE_TIER = 'enterprise';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Pricing' });
  const base = metadataBaseUrl.replace(/\/$/, '');
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${base}${getPathname({ locale: l, href: '/pricing' })}`])
  );

  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: `${base}${getPathname({ locale, href: '/pricing' })}`, languages },
  };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Requerido con generateStaticParams (next-intl): sin esto, getTranslations() ambiental
  // puede caer al locale por defecto en algunas requests (bug descubierto en GAP-123).
  setRequestLocale(locale);
  const t = await getTranslations('Pricing');
  const tPreview = await getTranslations('Landing.pricingPreview');
  // /pricing no tiene su propio formulario — el CTA redirige al ancla de leads de la home,
  // con la ruta correcta prefijada por locale (getPathname resuelve '/' → '/es'/'/pt'/'/en').
  const leadFormHref = `${getPathname({ locale, href: '/' })}#lead-form`;

  return (
    <div className="bg-background min-h-screen py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">{t('description')}</p>
        </div>

        <div className="mt-6 flex justify-center">
          <p className="text-muted-foreground text-sm">{t('annualNote')}</p>
        </div>

        <div className="mt-6">
          <PricingToggle monthlyLabel={t('periodMonthly')} annualLabel={t('periodAnnual')}>
            <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-6">
              {TIER_KEYS.map((tier) => {
                const isEnterprise = tier === ENTERPRISE_TIER;
                const features = t.raw(`tiers.${tier}.features`) as string[];
                return (
                  <Card key={tier} className={`h-full ${tier === 'pro' ? 'border-primary' : ''}`}>
                    <CardHeader>
                      {tier === 'pro' && (
                        <Badge className="mb-2 w-fit">{tPreview('mostPopular')}</Badge>
                      )}
                      <CardTitle className="text-xl">{tPreview(`tiers.${tier}.name`)}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <CardDescription className="text-base">
                        {tPreview(`tiers.${tier}.audience`)}
                      </CardDescription>

                      {isEnterprise ? (
                        <p className="text-foreground text-2xl font-semibold">
                          {t('tiers.enterprise.priceLabel')}
                        </p>
                      ) : (
                        <p className="text-foreground text-2xl font-semibold">
                          <PricingPeriodLabel
                            monthlyLabel={`${t(`tiers.${tier}.priceMonthly`)} €`}
                            annualLabel={`${t(`tiers.${tier}.priceAnnual`)} €`}
                          />{' '}
                          <span className="text-muted-foreground text-sm font-normal">
                            /
                            <PricingPeriodLabel
                              monthlyLabel={t('periodMonthly').toLowerCase()}
                              annualLabel={t('periodAnnual').toLowerCase()}
                            />
                          </span>
                        </p>
                      )}

                      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {t(`tiers.${tier}.limitsNote`)}
                      </p>

                      <ul className="mt-2 flex flex-col gap-2 text-sm">
                        {features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check
                              className="text-primary mt-0.5 h-4 w-4 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant={tier === 'pro' ? 'default' : 'outline'}
                        className="w-full"
                        asChild
                      >
                        <a href={leadFormHref}>{isEnterprise ? t('ctaEnterprise') : t('ctaTier')}</a>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </PricingToggle>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-foreground text-center text-xl font-semibold">
            {t('addonsTitle')}
          </h2>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            {t('addonsDescription')}
          </p>
          <ul className="text-muted-foreground mt-6 grid gap-3 sm:grid-cols-2">
            {(t.raw('addons') as string[]).map((addon) => (
              <li key={addon} className="flex items-center gap-2 text-sm">
                <span className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" aria-hidden="true" />
                {addon}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-foreground text-center text-xl font-semibold">
            {t('capabilitiesTitle')}
          </h2>
          <ul className="text-muted-foreground mt-6 grid gap-3 sm:grid-cols-2">
            {CAPABILITY_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-2 text-sm">
                <span className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" aria-hidden="true" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <h2 className="text-foreground text-center text-xl font-semibold">{t('faqTitle')}</h2>
          <Accordion type="single" collapsible className="mt-6">
            {FAQ_KEYS.map((key) => (
              <AccordionItem key={key} value={key} className="">
                <AccordionTrigger className="">{t(`${key}.question`)}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {t(`${key}.answer`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
