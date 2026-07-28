import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fish, Package, ShoppingCart, Sparkle, Ticket } from 'lucide-react';
import AssetPlaceholder from './AssetPlaceholder';
import ScrollReveal from './ScrollReveal';

const MODULES_SECTION_ID = 'modulos';

export default async function ModulesBento() {
  const t = await getTranslations('Landing.modules');

  return (
    <section id={MODULES_SECTION_ID} className="bg-muted/30 py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground text-3xl tracking-tight sm:text-3xl">{t('title')}</h2>
          <p className="text-muted-foreground text-md mt-4">{t('description')}</p>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-5">
          <ScrollReveal delay={0}>
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="bg-muted mb-4 inline-flex w-fit rounded-xl p-3">
                  <Fish className="text-foreground h-6 w-6" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">{t('production.title')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <CardDescription className="text-base">
                  {t('production.description')}
                </CardDescription>
                <AssetPlaceholder
                  type={3}
                  label="Tarjeta de trazabilidad de producción: icono de pez, tag de lote y barra de progreso"
                  className="aspect-square w-full"
                />
              </CardContent>
            </Card>
          </ScrollReveal>
          <ScrollReveal delay={0.05}>
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="bg-muted mb-4 inline-flex w-fit rounded-xl p-3">
                  <Package className="text-foreground h-6 w-6" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">{t('stock.title')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <CardDescription className="text-base">{t('stock.description')}</CardDescription>
                <AssetPlaceholder
                  type={3}
                  label="Mapa isométrico simplificado de almacén con celdas destacadas y pin de ubicación"
                  className="aspect-square w-full"
                />
              </CardContent>
            </Card>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="bg-muted mb-4 inline-flex w-fit rounded-xl p-3">
                  <ShoppingCart className="text-foreground h-6 w-6" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">{t('sales.title')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <CardDescription className="text-base">{t('sales.description')}</CardDescription>
                <AssetPlaceholder
                  type={3}
                  label="Tarjeta de pedido/factura con badge de check y flecha de tendencia ascendente"
                  className="aspect-square w-full"
                />
              </CardContent>
            </Card>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="bg-muted mb-4 inline-flex w-fit rounded-xl p-3">
                  <Sparkle className="text-foreground h-6 w-6" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">{t('ai.title')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <CardDescription className="text-base">{t('ai.description')}</CardDescription>
                <AssetPlaceholder
                  type={3}
                  label="Icono de documento con líneas de escaneo transformándose en tabla de datos, con chispa de IA"
                  className="aspect-square w-full"
                />
              </CardContent>
            </Card>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="bg-muted mb-4 inline-flex w-fit rounded-xl p-3">
                  <Ticket className="text-foreground h-6 w-6" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">{t('labels.title')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <CardDescription className="text-base">{t('labels.description')}</CardDescription>
                <AssetPlaceholder
                  type={3}
                  label="Mockup de etiqueta de producto con código de barras e icono de impresora"
                  className="aspect-square w-full"
                />
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
