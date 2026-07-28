'use client';
// Necesita 'use client': maneja el scroll suave a la sección de módulos y abre demoUrl en pestaña nueva

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Fish, Package, ShoppingCart, Shield, Globe, Waves, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { appName, demoUrl } from '@/configs/branding';

const MODULES_SECTION_ID = 'modulos';

export default function Hero() {
  const t = useTranslations('Landing.hero');

  const handleScrollToModules = () => {
    document.getElementById(MODULES_SECTION_ID)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-sky-900">
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z"
            fill="currentColor"
            className="text-sky-600"
          />
          <path
            d="M0,60 Q25,40 50,60 T100,60 L100,100 L0,100 Z"
            fill="currentColor"
            className="text-sky-400 opacity-50"
          />
        </svg>
      </div>
      <div className="relative container mx-auto px-4 py-24 sm:py-32 lg:py-32">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className="rounded-xl bg-sky-500 p-3">
              <Waves className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
              {appName}
            </h1>
          </div>
          <p className="mb-8 text-xl text-gray-600 sm:text-2xl dark:text-gray-300">
            {t('subtitle')}
            <br />
            <span className="text-muted-foreground text-sm">{t('modulesList')}</span>
          </p>
          <div className="flex w-full flex-row gap-2 sm:justify-center sm:gap-4">
            <Button
              onClick={() => window.open(demoUrl, '_blank')}
              size="lg"
              className="w-full bg-sky-500 hover:bg-sky-400 sm:w-fit"
            >
              {t('ctaDemo')}
              <ArrowUpRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-fit"
              onClick={handleScrollToModules}
            >
              {t('ctaFeatures')}
            </Button>
          </div>
          <div className="relative mt-16 w-full">
            <div className="relative w-full overflow-hidden">
              <Image
                src="/images/landingPage/home-mockup.png"
                alt={t('heroImageAlt')}
                width={1920}
                height={1080}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
            <div className="absolute top-8 -right-4 hidden lg:block">
              <Card className="p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-sky-100 p-2 dark:bg-sky-900">
                    <Fish className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('floatingProductionLabel')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('floatingProductionValue')}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="absolute bottom-16 -left-4 hidden lg:block">
              <Card className="p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-sky-100 p-2 dark:bg-sky-900">
                    <Package className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('floatingStockLabel')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('floatingStockValue')}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="absolute -right-8 bottom-5 hidden lg:block">
              <Card className="p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-sky-100 p-2 dark:bg-sky-900">
                    <ShoppingCart className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('floatingSalesLabel')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('floatingSalesValue')}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          <div className="mt-12 flex w-full flex-col items-center justify-center gap-2 text-sm text-gray-500 sm:flex-row sm:gap-8">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>{t('trustSecure')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>{t('trustGlobal')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
