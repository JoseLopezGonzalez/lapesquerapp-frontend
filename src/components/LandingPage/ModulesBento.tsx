import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AssetPlaceholder from './AssetPlaceholder';
import ScrollReveal from './ScrollReveal';

const MODULES_SECTION_ID = 'modulos';
const CLOSING_ITEM_KEYS = ['crm', 'suppliers', 'delivery'] as const;

export default async function ModulesBento() {
  const t = await getTranslations('Landing.modules');

  return (
    <section id={MODULES_SECTION_ID} className="bg-muted/30 py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground text-3xl tracking-tight sm:text-3xl">{t('title')}</h2>
          <p className="text-muted-foreground text-md mt-4">{t('description')}</p>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:auto-rows-[280px] lg:grid-cols-4 lg:gap-6">
          {/* Tile hero — Compras y Ventas (módulo Pedidos, núcleo real del producto) */}
          <ScrollReveal delay={0} className="lg:col-span-2 lg:row-span-2">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">{t('sales.title')}</CardTitle>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
                <CardDescription className="text-base">{t('sales.description')}</CardDescription>
                <AssetPlaceholder
                  type={3}
                  label="Tarjeta de pedido/factura con badge de check y flecha de tendencia ascendente"
                  className="w-full flex-1"
                />
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Producción — tile mediano */}
          <ScrollReveal delay={0.05} className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{t('production.title')}</CardTitle>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
                <CardDescription className="text-base">
                  {t('production.description')}
                </CardDescription>
                <AssetPlaceholder
                  type={3}
                  label="Tarjeta de trazabilidad de producción: icono de pez, tag de lote y barra de progreso"
                  className="w-full flex-1"
                />
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Stock — tile pequeño */}
          <ScrollReveal delay={0.1}>
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{t('stock.title')}</CardTitle>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
                <CardDescription className="text-base">{t('stock.description')}</CardDescription>
                <AssetPlaceholder
                  type={3}
                  label="Mapa isométrico simplificado de almacén con celdas destacadas y pin de ubicación"
                  className="w-full flex-1"
                />
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* IA — tile pequeño */}
          <ScrollReveal delay={0.15}>
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{t('ai.title')}</CardTitle>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
                <CardDescription className="text-base">{t('ai.description')}</CardDescription>
                <AssetPlaceholder
                  type={3}
                  label="Icono de documento con líneas de escaneo transformándose en tabla de datos, con chispa de IA"
                  className="w-full flex-1"
                />
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Etiquetas — tile mediano */}
          <ScrollReveal delay={0.2} className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{t('labels.title')}</CardTitle>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
                <CardDescription className="text-base">{t('labels.description')}</CardDescription>
                <AssetPlaceholder
                  type={3}
                  label="Mockup de etiqueta de producto con código de barras e icono de impresora"
                  className="w-full flex-1"
                />
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Tile de cierre — solo texto, módulos hoy invisibles en el resto de la landing */}
          <ScrollReveal delay={0.25} className="lg:col-span-2">
            <Card className="bg-muted/50 h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{t('closing.title')}</CardTitle>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col justify-center gap-3">
                {CLOSING_ITEM_KEYS.map((key) => (
                  <div key={key} className="flex items-start gap-2">
                    <span
                      className="bg-primary mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground text-sm">
                      {t(`closing.items.${key}`)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
