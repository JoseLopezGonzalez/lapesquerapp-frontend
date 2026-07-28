import { getTranslations } from 'next-intl/server';
import { Fish, Boxes, ShoppingCart } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const STEPS = [
  { key: 'step1', icon: Fish },
  { key: 'step2', icon: Boxes },
  { key: 'step3', icon: ShoppingCart },
] as const;

export default async function HowItWorks() {
  const t = await getTranslations('Landing.howItWorks');

  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground text-3xl tracking-tight sm:text-3xl">{t('title')}</h2>
          <p className="text-muted-foreground text-md mt-4">{t('description')}</p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {STEPS.map(({ key, icon: Icon }, index) => (
            <ScrollReveal
              key={key}
              delay={index * 0.1}
              className="flex flex-col items-center text-center"
            >
              <div className="bg-primary text-primary-foreground mb-4 flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold">
                {index + 1}
              </div>
              <Icon className="text-muted-foreground mb-3 h-6 w-6" aria-hidden="true" />
              <h3 className="text-foreground text-lg font-semibold">{t(`${key}.title`)}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{t(`${key}.description`)}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
