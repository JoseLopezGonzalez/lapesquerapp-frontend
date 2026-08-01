import { getTranslations } from 'next-intl/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import PricingToggle, { PricingPeriodLabel } from './PricingToggle';
import ScrollReveal from './ScrollReveal';

const TIER_KEYS = ['starter', 'pro', 'enterprise'] as const;
const FEATURES_PREVIEW_COUNT = 3;
const ENTERPRISE_TIER = 'enterprise';

export default async function PricingPreview() {
  const t = await getTranslations('Landing.pricingPreview');
  const tPricing = await getTranslations('Pricing');

  return (
    <section className="bg-muted/30 py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground text-3xl tracking-tight sm:text-3xl">{t('title')}</h2>
          <p className="text-muted-foreground text-md mt-4">{t('description')}</p>
        </div>

        <div className="mt-8">
          <PricingToggle
            monthlyLabel={tPricing('periodMonthly')}
            annualLabel={tPricing('periodAnnual')}
          >
            <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
              {TIER_KEYS.map((tier, index) => {
                const isEnterprise = tier === ENTERPRISE_TIER;
                const features = (tPricing.raw(`tiers.${tier}.features`) as string[]).slice(
                  0,
                  FEATURES_PREVIEW_COUNT
                );
                return (
                  <ScrollReveal key={tier} delay={index * 0.1} className="h-full">
                    <Card className={`h-full ${tier === 'pro' ? 'border-primary' : ''}`}>
                      <CardHeader>
                        {tier === 'pro' && <Badge className="mb-2 w-fit">{t('mostPopular')}</Badge>}
                        <CardTitle className="text-xl">{t(`tiers.${tier}.name`)}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        <CardDescription className="text-base">
                          {t(`tiers.${tier}.audience`)}
                        </CardDescription>
                        {isEnterprise ? (
                          <p className="text-foreground text-lg font-semibold">
                            {tPricing('tiers.enterprise.priceLabel')}
                          </p>
                        ) : (
                          <p className="text-foreground text-lg font-semibold">
                            <PricingPeriodLabel
                              monthlyLabel={`${tPricing(`tiers.${tier}.priceMonthly`)} €`}
                              annualLabel={`${tPricing(`tiers.${tier}.priceAnnual`)} €`}
                            />{' '}
                            <span className="text-muted-foreground text-sm font-normal">
                              /
                              <PricingPeriodLabel
                                monthlyLabel={tPricing('periodMonthly').toLowerCase()}
                                annualLabel={tPricing('periodAnnual').toLowerCase()}
                              />
                            </span>
                          </p>
                        )}
                        <ul className="mt-1 flex flex-col gap-2 text-sm">
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
                          <Link href="/pricing">{t('cta')}</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </ScrollReveal>
                );
              })}
            </div>
          </PricingToggle>
        </div>

        <p className="text-muted-foreground mt-8 text-center text-sm">{t('addonsNote')}</p>
      </div>
    </section>
  );
}
