'use client';

import { useMemo } from 'react';
import { AlertCircle, ChartColumn, Package2, Wallet } from 'lucide-react';
import { useOrderContext } from '@/context/OrderContext';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/Admin/OrdersManager/StatusBadge';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatDecimal,
  formatDecimalCurrency,
  formatDecimalWeight,
} from '@/helpers/formats/numbers/formatNumbers';

const getNullableCurrency = (value) => (value == null ? '—' : formatDecimalCurrency(value));
const getNullableWeight = (value) => (value == null ? '—' : formatDecimalWeight(value));
const getNullablePercentage = (value) => (value == null ? '—' : `${formatDecimal(value)}%`);
const getNullableCurrencyPerKg = (value) => (value == null ? '—' : `${formatDecimal(value)} €/kg`);

function AnalysisMetricCard({
  title,
  value,
  description,
  detail,
  emphasize = false,
  isMobile = false,
}) {
  // Mobile: mismo lenguaje visual que las cards del grid principal de pedidos,
  // sin chip de icono (ver PL-029) — solo texto apilado.
  if (isMobile) {
    return (
      <div className="border-border bg-card rounded-2xl border p-3">
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-[11px] leading-tight">{title}</p>
          <div
            className={
              emphasize
                ? 'text-lg leading-tight font-semibold'
                : 'text-base leading-tight font-semibold'
            }
          >
            {value}
          </div>
          {detail ? (
            <p className="text-muted-foreground line-clamp-1 text-[11px] leading-tight">{detail}</p>
          ) : null}
          <p className="text-muted-foreground line-clamp-1 text-[11px] leading-tight">
            {description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <div
          className={
            emphasize ? 'text-2xl font-medium tracking-tight' : 'text-xl font-medium tracking-tight'
          }
        >
          {value}
        </div>
        {detail ? <p className="text-muted-foreground text-xs">{detail}</p> : null}
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

// Silueta de AnalysisMetricCard: título, valor, detalle y descripción (4 alturas distintas)
function AnalysisMetricCardSkeleton({ isMobile = false }) {
  if (isMobile) {
    return (
      <div className="border-border bg-card rounded-2xl border p-3">
        <div className="space-y-1">
          <Skeleton className="h-2.5 w-10" />
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-2.5 w-10" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent className="space-y-1.5">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3.5 w-32" />
      </CardContent>
    </Card>
  );
}

function ProductLineMobileCard({ line }) {
  return (
    <AccordionItem value={`product-${line.product.id}`}>
      <AccordionTrigger className="px-4 text-left hover:no-underline">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-3">
          <div className="min-w-0">
            <p className="truncate text-base font-medium" title={line.product.name}>
              {line.product.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {getNullableWeight(line.lineWeightKg)} · {getNullableCurrency(line.lineRevenue)}
            </p>
          </div>
          <p className="text-sm font-medium">{getNullableCurrency(line.lineMargin)}</p>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="bg-muted/20 grid grid-cols-2 gap-3 rounded-md border p-3">
          <div>
            <p className="text-muted-foreground text-xs">Importe/kg</p>
            <p className="text-sm font-medium">
              {getNullableCurrencyPerKg(line.revenuePerKg ?? line.unitPrice)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Cantidad</p>
            <p className="text-sm font-medium">{getNullableWeight(line.lineWeightKg)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Importe</p>
            <p className="text-sm font-medium">{getNullableCurrency(line.lineRevenue)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Coste</p>
            <p className="text-sm font-medium">{getNullableCurrency(line.lineCost)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Margen</p>
            <p className="text-sm font-medium">{getNullableCurrency(line.lineMargin)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Coste/kg</p>
            <p className="text-sm font-medium">{getNullableCurrencyPerKg(line.costPerKg)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Margen/kg</p>
            <p className="text-sm font-medium">{getNullableCurrencyPerKg(line.marginPerKg)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs">Margen %</p>
            <p className="mt-1 text-sm font-medium">{getNullablePercentage(line.lineMarginPct)}</p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function PalletMobileCard({ pallet }) {
  return (
    <AccordionItem value={`pallet-${pallet.palletId}`}>
      <AccordionTrigger className="px-4 text-left hover:no-underline">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-3">
          <div className="min-w-0">
            <p className="truncate text-base font-medium">Palet #{pallet.palletId}</p>
            <p className="text-muted-foreground text-xs">
              {getNullableWeight(pallet.totalWeightKg)}
            </p>
          </div>
          <p className="text-sm font-medium">{getNullableCurrency(pallet.totalMargin)}</p>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="bg-muted/20 space-y-3 rounded-md border p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground text-xs">Cantidad</p>
              <p className="text-sm font-medium">{getNullableWeight(pallet.totalWeightKg)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Importe</p>
              <p className="text-sm font-medium">{getNullableCurrency(pallet.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Importe/kg</p>
              <p className="text-sm font-medium">{getNullableCurrencyPerKg(pallet.revenuePerKg)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Coste total</p>
              <p className="text-sm font-medium">{getNullableCurrency(pallet.totalCost)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Coste/kg</p>
              <p className="text-sm font-medium">{getNullableCurrencyPerKg(pallet.costPerKg)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Margen</p>
              <p className="text-sm font-medium">{getNullableCurrency(pallet.totalMargin)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Margen/kg</p>
              <p className="text-sm font-medium">{getNullableCurrencyPerKg(pallet.marginPerKg)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Margen %</p>
              <p className="text-sm font-medium">
                {getNullablePercentage(pallet.marginPercentage)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Productos</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(pallet.products || []).length > 0 ? (
                pallet.products.map((product) => (
                  <Badge key={`${pallet.palletId}-${product}`} variant="outline">
                    {product}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">—</p>
              )}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function OrderCostAnalysis({ canViewCostData = true }) {
  const { isMobile, mounted } = useIsMobileSafe();
  const { order, costAnalysis, costAnalysisLoading, costAnalysisError, loadCostAnalysis } =
    useOrderContext();

  const productLines = useMemo(
    () => costAnalysis?.byProductLine ?? [],
    [costAnalysis?.byProductLine]
  );
  const palletLines = useMemo(() => costAnalysis?.byPallet ?? [], [costAnalysis?.byPallet]);

  const summary = costAnalysis?.summary ?? null;
  const productLinesWeightTotal = useMemo(
    () => productLines.reduce((total, line) => total + (Number(line.lineWeightKg) || 0), 0),
    [productLines]
  );
  const palletLinesWeightTotal = useMemo(
    () => palletLines.reduce((total, pallet) => total + (Number(pallet.totalWeightKg) || 0), 0),
    [palletLines]
  );

  if (!mounted || !canViewCostData) return null;

  if (costAnalysisLoading && !costAnalysis) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <AnalysisMetricCardSkeleton key={i} isMobile={isMobile} />
          ))}
        </div>
        <Skeleton className="h-8 w-48 rounded-md" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (costAnalysisError && !costAnalysis) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          title="No se pudo cargar el análisis"
          description={
            costAnalysisError?.message ||
            'Ha ocurrido un error obteniendo el análisis económico del pedido.'
          }
          icon={<AlertCircle />}
          button={{ name: 'Reintentar', onClick: () => loadCostAnalysis({ force: true }) }}
          className="h-auto bg-transparent"
        />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          title="Análisis no disponible"
          description="Abre este apartado cuando el backend tenga datos de costes y márgenes calculables para el pedido."
          icon={<ChartColumn />}
          button={{ name: 'Cargar análisis', onClick: () => loadCostAnalysis({ force: true }) }}
          className="h-auto bg-transparent"
        />
      </div>
    );
  }

  const content = (
    <Tabs defaultValue="product-lines" className="flex min-h-0 flex-1 flex-col">
      <TabsList className="w-fit">
        <TabsTrigger value="product-lines">Por producto</TabsTrigger>
        <TabsTrigger value="pallets">Por palet</TabsTrigger>
      </TabsList>

      <TabsContent
        value="product-lines"
        className={isMobile ? 'mt-4' : 'mt-4 min-h-0 flex-1 overflow-hidden'}
      >
        {productLines.length === 0 ? (
          <EmptyState
            title="No existen líneas analíticas"
            description="Todavía no hay líneas de producto con datos económicos para este pedido."
            icon={<Package2 />}
            className={isMobile ? 'bg-transparent' : 'h-full bg-transparent'}
          />
        ) : isMobile ? (
          <Accordion type="single" collapsible className="rounded-md border">
            {productLines.map((line) => (
              <ProductLineMobileCard key={line.product.id} line={line} />
            ))}
          </Accordion>
        ) : (
          <ScrollArea className="h-full">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Importe/kg</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead className="text-right">Coste/kg</TableHead>
                    <TableHead className="text-right">Coste</TableHead>
                    <TableHead className="text-right">Margen/kg</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                    <TableHead className="text-right">Margen %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productLines.map((line) => (
                    <TableRow key={line.product.id}>
                      <TableCell className="font-medium">{line.product.name}</TableCell>
                      <TableCell className="text-right">
                        {getNullableCurrencyPerKg(line.revenuePerKg ?? line.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullableWeight(line.lineWeightKg)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullableCurrency(line.lineRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullableCurrencyPerKg(line.costPerKg)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullableCurrency(line.lineCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullableCurrencyPerKg(line.marginPerKg)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullableCurrency(line.lineMargin)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullablePercentage(line.lineMarginPct)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-medium">Totales</TableCell>
                    <TableCell className="text-right">
                      {getNullableCurrencyPerKg(order?.revenuePerKg)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullableWeight(productLinesWeightTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullableCurrency(summary.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullableCurrencyPerKg(order?.costPerKg)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullableCurrency(summary.totalCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullableCurrencyPerKg(order?.marginPerKg)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullableCurrency(summary.grossMargin)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullablePercentage(summary.marginPercentage)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </ScrollArea>
        )}
      </TabsContent>

      <TabsContent
        value="pallets"
        className={isMobile ? 'mt-4' : 'mt-4 min-h-0 flex-1 overflow-hidden'}
      >
        {palletLines.length === 0 ? (
          <EmptyState
            title="No existen palets analíticos"
            description="Todavía no hay palets con datos económicos disponibles para este pedido."
            icon={<Wallet />}
            className={isMobile ? 'bg-transparent' : 'h-full bg-transparent'}
          />
        ) : isMobile ? (
          <Accordion type="single" collapsible className="rounded-md border">
            {palletLines.map((pallet) => (
              <PalletMobileCard key={pallet.palletId} pallet={pallet} />
            ))}
          </Accordion>
        ) : (
          <ScrollArea className="h-full">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Palet</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Importe/kg</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead className="text-right">Coste/kg</TableHead>
                    <TableHead className="text-right">Coste total</TableHead>
                    <TableHead className="text-right">Margen/kg</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                    <TableHead className="text-right">Margen %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {palletLines.map((pallet) => (
                    <TableRow key={pallet.palletId}>
                      <TableCell className="font-medium">#{pallet.palletId}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {(pallet.products || []).length > 0 ? (
                            pallet.products.map((product) => (
                              <Badge key={`${pallet.palletId}-${product}`} variant="outline">
                                {product}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullableWeight(pallet.totalWeightKg)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullableCurrencyPerKg(pallet.revenuePerKg)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullableCurrency(pallet.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullableCurrencyPerKg(pallet.costPerKg)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullableCurrency(pallet.totalCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullableCurrencyPerKg(pallet.marginPerKg)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullableCurrency(pallet.totalMargin)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getNullablePercentage(pallet.marginPercentage)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-medium">
                      Totales
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullableWeight(palletLinesWeightTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullableCurrencyPerKg(order?.revenuePerKg)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullableCurrency(summary.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullableCurrencyPerKg(order?.costPerKg)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullableCurrency(summary.totalCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullableCurrencyPerKg(order?.marginPerKg)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullableCurrency(summary.grossMargin)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getNullablePercentage(summary.marginPercentage)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </ScrollArea>
        )}
      </TabsContent>
    </Tabs>
  );

  const metricCards = (
    <>
      <AnalysisMetricCard
        title="Importe"
        value={getNullableCurrency(summary.totalRevenue)}
        detail={getNullableCurrencyPerKg(order?.revenuePerKg)}
        description="Importe total del pedido"
        isMobile={isMobile}
      />
      <AnalysisMetricCard
        title="Coste total"
        value={getNullableCurrency(summary.totalCost)}
        detail={getNullableCurrencyPerKg(order?.costPerKg)}
        description="Coste acumulado de cajas disponibles"
        isMobile={isMobile}
      />
      <AnalysisMetricCard
        title="Margen bruto"
        value={getNullableCurrency(summary.grossMargin)}
        detail={getNullableCurrencyPerKg(order?.marginPerKg)}
        description="Importe menos coste total"
        emphasize
        isMobile={isMobile}
      />
      <AnalysisMetricCard
        title="Margen %"
        value={getNullablePercentage(summary.marginPercentage)}
        description="Porcentaje de margen sobre importe"
        isMobile={isMobile}
      />
    </>
  );

  if (isMobile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-3 px-4 pt-4">
            {costAnalysisError ? (
              <StatusBadge color="amber" label="Última recarga con incidencias" />
            ) : null}
            <div className="grid grid-cols-2 gap-3">{metricCards}</div>
          </div>
          <div className="px-4 pt-4 pb-8">{content}</div>
        </ScrollArea>
      </div>
    );
  }

  const header = (
    <CardHeader className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {/* text-lg: sub-escala intencional para CardTitle de tarjeta dentro de un tab, alineada con GAP-084. */}
          <CardTitle className="text-lg font-medium">Análisis económico</CardTitle>
          <CardDescription>
            Lectura global y por detalle del coste, importe y margen del pedido #{order?.id}.
          </CardDescription>
        </div>
        {costAnalysisError ? (
          <StatusBadge color="amber" label="Última recarga con incidencias" />
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{metricCards}</div>
    </CardHeader>
  );

  return (
    <div className="flex h-full min-h-0 flex-col pb-2">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
        {header}
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {content}
        </CardContent>
      </Card>
    </div>
  );
}
