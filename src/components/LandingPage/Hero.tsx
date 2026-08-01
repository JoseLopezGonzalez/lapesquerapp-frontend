'use client';
// Necesita 'use client': abre demoUrl en pestaña nueva (onClick)

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Waves, Shield, Globe, ArrowUpRight } from 'lucide-react';
import { appName, demoUrl } from '@/configs/branding';
import AssetPlaceholder from './AssetPlaceholder';
import ScrollReveal from './ScrollReveal';
import LocaleSwitcher from './LocaleSwitcher';

export default function Hero() {
  const t = useTranslations('Landing.hero');

  return (
    <section className="bg-background relative overflow-hidden">
      <LocaleSwitcher className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6" />
      <div className="text-foreground pointer-events-none absolute inset-0 opacity-[0.04]">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="currentColor" />
          <path
            d="M0,60 Q25,40 50,60 T100,60 L100,100 L0,100 Z"
            fill="currentColor"
            opacity="0.5"
          />
        </svg>
      </div>
      <div className="relative container mx-auto px-4 py-24 sm:py-32 lg:py-32">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className="bg-primary rounded-xl p-3">
              <Waves className="text-primary-foreground h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-6xl">
              {appName}
            </h1>
          </div>
          <p className="text-muted-foreground mb-8 text-xl sm:text-2xl">
            {t('subtitle')}
            <br />
            <span className="text-muted-foreground text-sm">{t('modulesList')}</span>
          </p>
          <div className="flex w-full justify-center">
            <Button
              onClick={() => window.open(demoUrl, '_blank')}
              size="lg"
              className="w-full sm:w-fit"
            >
              {t('ctaDemo')}
              <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
          <ScrollReveal className="relative mt-16 w-full" delay={0.1}>
            <AssetPlaceholder
              type={2}
              label="Captura real del dashboard principal, retocada y aislada (ver landing-context.md §5)"
              className="aspect-video w-full"
            />
          </ScrollReveal>
          <div className="text-muted-foreground mt-12 flex w-full flex-col items-center justify-center gap-2 text-sm sm:flex-row sm:gap-8">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" aria-hidden="true" />
              <span>{t('trustSecure')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>{t('trustGlobal')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
