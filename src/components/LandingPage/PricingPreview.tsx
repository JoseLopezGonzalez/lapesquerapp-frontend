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
import ScrollReveal from './ScrollReveal';

const TIER_KEYS = ['starter', 'pro', 'enterprise'] as const;

export default async function PricingPreview() {
  const t = await getTranslations('Landing.pricingPreview');

  return (
    <section className="bg-muted/30 py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground text-3xl tracking-tight sm:text-3xl">{t('title')}</h2>
          <p className="text-muted-foreground text-md mt-4">{t('description')}</p>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {TIER_KEYS.map((tier, index) => (
            <ScrollReveal key={tier} delay={index * 0.1} className="h-full">
              <Card className={`h-full ${tier === 'pro' ? 'border-primary' : ''}`}>
                <CardHeader>
                  {tier === 'pro' && <Badge className="mb-2 w-fit">{t('mostPopular')}</Badge>}
                  <CardTitle className="text-xl">{t(`tiers.${tier}.name`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {t(`tiers.${tier}.audience`)}
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={tier === 'pro' ? 'default' : 'outline'}
                    className="w-full"
                    asChild
                  >
                    {/* TODO Fase C: apuntar a /pricing cuando exista la página real */}
                    <a href="#lead-form">{t('cta')}</a>
                  </Button>
                </CardFooter>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
