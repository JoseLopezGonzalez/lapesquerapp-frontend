import { getTranslations } from 'next-intl/server';
import AssetPlaceholder from './AssetPlaceholder';
import ScrollReveal from './ScrollReveal';

const STEPS = [
  {
    key: 'step1',
    assetLabel: 'Ficha/creación de pedido con previsión de productos — captura real, desktop',
  },
  {
    key: 'step2',
    assetLabel:
      'Diagrama de árbol de producción o mapa de almacén con palets asignados — captura real, desktop',
  },
  {
    key: 'step3',
    assetLabel:
      'Documento generado (packing list/CMR) o panel de rentabilidad por pedido — captura real, desktop',
  },
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
        <div className="relative isolate mt-16">
          {/* Línea conectora — horizontal en desktop, vertical en mobile */}
          <div
            className="border-border absolute inset-x-[16.67%] top-6 -z-10 hidden border-t sm:block"
            aria-hidden="true"
          />
          <div
            className="border-border absolute top-6 bottom-6 left-1/2 -z-10 block w-px -translate-x-1/2 border-l sm:hidden"
            aria-hidden="true"
          />
          <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
            {STEPS.map(({ key, assetLabel }, index) => (
              <ScrollReveal
                key={key}
                delay={index * 0.1}
                className="flex flex-col items-center text-center"
              >
                <div className="bg-primary text-primary-foreground mb-4 flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold">
                  {index + 1}
                </div>
                <h3 className="text-foreground text-lg font-semibold">{t(`${key}.title`)}</h3>
                <p className="text-muted-foreground mt-2 text-sm">{t(`${key}.description`)}</p>
                <AssetPlaceholder
                  type={1}
                  label={assetLabel}
                  className="mt-4 aspect-video w-full"
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
