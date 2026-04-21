'use client'

import { useMemo } from 'react';
import { AlertCircle, ChartColumn, Package2, RefreshCw, Wallet } from 'lucide-react';
import { useOrderContext } from '@/context/OrderContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import Loader from '@/components/Utilities/Loader';
import { formatDecimal, formatDecimalCurrency, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';

const getNullableCurrency = (value) => (value == null ? '—' : formatDecimalCurrency(value));
const getNullableWeight = (value) => (value == null ? '—' : formatDecimalWeight(value));
const getNullableDecimal = (value) => (value == null ? '—' : formatDecimal(value));
const getNullablePercentage = (value) => (value == null ? '—' : `${formatDecimal(value)}%`);

function MarginBadge({ value }) {
  if (value == null) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Sin coste
      </Badge>
    );
  }

  if (value > 0) {
    return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
        Positivo
      </Badge>
    );
  }

  if (value < 0) {
    return (
      <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
        Negativo
      </Badge>
    );
  }

  return <Badge variant="outline">Neutro</Badge>;
}

function AnalysisMetricCard({ title, value, description, icon: Icon, emphasize = false }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription className="flex items-center justify-between gap-2">
          <span>{title}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className={emphasize ? 'text-2xl font-semibold tracking-tight' : 'text-xl font-semibold tracking-tight'}>
          {value}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
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
            <p className="truncate text-sm font-semibold">{line.product.name}</p>
            <p className="text-xs text-muted-foreground">
              {getNullableWeight(line.lineWeightKg)} · {getNullableCurrency(line.lineRevenue)}
            </p>
          </div>
          <MarginBadge value={line.lineMargin} />
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/20 p-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Precio/kg</p>
            <p className="text-sm font-medium">{getNullableCurrency(line.unitPrice)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">IVA</p>
            <p className="text-sm font-medium">{getNullablePercentage(line.taxRate)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Revenue</p>
            <p className="text-sm font-medium">{getNullableCurrency(line.lineRevenue)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Revenue + IVA</p>
            <p className="text-sm font-medium">{getNullableCurrency(line.lineRevenueWithTax)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Coste</p>
            <p className="text-sm font-medium">{getNullableCurrency(line.lineCost)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Margen</p>
            <p className="text-sm font-medium">{getNullableCurrency(line.lineMargin)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Margen %</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm font-medium">{getNullablePercentage(line.lineMarginPct)}</p>
              <MarginBadge value={line.lineMargin} />
            </div>
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
            <p className="truncate text-sm font-semibold">Palet #{pallet.palletId}</p>
            <p className="text-xs text-muted-foreground">
              {getNullableWeight(pallet.totalWeightKg)} · {getNullableCurrency(pallet.totalCost)}
            </p>
          </div>
          <Badge variant="outline">{getNullableDecimal(pallet.costPerKg)} €/kg</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-3 rounded-md border bg-muted/20 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Peso neto</p>
              <p className="text-sm font-medium">{getNullableWeight(pallet.totalWeightKg)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Coste total</p>
              <p className="text-sm font-medium">{getNullableCurrency(pallet.totalCost)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Coste/kg</p>
              <p className="text-sm font-medium">{getNullableDecimal(pallet.costPerKg)} €/kg</p>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Productos</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(pallet.products || []).length > 0 ? (
                pallet.products.map((product) => (
                  <Badge key={`${pallet.palletId}-${product}`} variant="outline">
                    {product}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sin productos disponibles</p>
              )}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function OrderCostAnalysis() {
  const isMobile = useIsMobile();
  const {
    order,
    costAnalysis,
    costAnalysisLoading,
    costAnalysisError,
    loadCostAnalysis,
  } = useOrderContext();

  const productLines = useMemo(
    () => costAnalysis?.byProductLine ?? [],
    [costAnalysis?.byProductLine]
  );
  const palletLines = useMemo(
    () => costAnalysis?.byPallet ?? [],
    [costAnalysis?.byPallet]
  );

  const summary = costAnalysis?.summary ?? null;

  if (costAnalysisLoading && !costAnalysis) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (costAnalysisError && !costAnalysis) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          title="No se pudo cargar el análisis"
          description={costAnalysisError?.message || 'Ha ocurrido un error obteniendo el análisis económico del pedido.'}
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
      <div className="flex items-center justify-between gap-3">
        <TabsList className="w-fit">
          <TabsTrigger value="product-lines">Por producto</TabsTrigger>
          <TabsTrigger value="pallets">Por palet</TabsTrigger>
        </TabsList>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => loadCostAnalysis({ force: true })}
          disabled={costAnalysisLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${costAnalysisLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <TabsContent value="product-lines" className="mt-4 min-h-0 flex-1">
        {productLines.length === 0 ? (
          <EmptyState
            title="Sin líneas analíticas"
            description="Todavía no hay líneas de producto con datos económicos para este pedido."
            icon={<Package2 />}
            className="h-full bg-transparent"
          />
        ) : isMobile ? (
          <ScrollArea className="h-full pr-1">
            <Accordion type="single" collapsible className="rounded-md border">
              {productLines.map((line) => (
                <ProductLineMobileCard key={line.product.id} line={line} />
              ))}
            </Accordion>
          </ScrollArea>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Precio/kg</TableHead>
                  <TableHead className="text-right">IVA</TableHead>
                  <TableHead className="text-right">Kg</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Revenue + IVA</TableHead>
                  <TableHead className="text-right">Coste</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                  <TableHead className="text-right">Margen %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productLines.map((line) => (
                  <TableRow key={line.product.id}>
                    <TableCell className="font-medium">{line.product.name}</TableCell>
                    <TableCell className="text-right">{getNullableCurrency(line.unitPrice)}</TableCell>
                    <TableCell className="text-right">{getNullablePercentage(line.taxRate)}</TableCell>
                    <TableCell className="text-right">{getNullableWeight(line.lineWeightKg)}</TableCell>
                    <TableCell className="text-right">{getNullableCurrency(line.lineRevenue)}</TableCell>
                    <TableCell className="text-right">{getNullableCurrency(line.lineRevenueWithTax)}</TableCell>
                    <TableCell className="text-right">{getNullableCurrency(line.lineCost)}</TableCell>
                    <TableCell className="text-right">{getNullableCurrency(line.lineMargin)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{getNullablePercentage(line.lineMarginPct)}</span>
                        <MarginBadge value={line.lineMargin} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="pallets" className="mt-4 min-h-0 flex-1">
        {palletLines.length === 0 ? (
          <EmptyState
            title="Sin palets analíticos"
            description="Todavía no hay palets con datos económicos disponibles para este pedido."
            icon={<Wallet />}
            className="h-full bg-transparent"
          />
        ) : isMobile ? (
          <ScrollArea className="h-full pr-1">
            <Accordion type="single" collapsible className="rounded-md border">
              {palletLines.map((pallet) => (
                <PalletMobileCard key={pallet.palletId} pallet={pallet} />
              ))}
            </Accordion>
          </ScrollArea>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Palet</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead className="text-right">Kg</TableHead>
                  <TableHead className="text-right">Coste total</TableHead>
                  <TableHead className="text-right">Coste/kg</TableHead>
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
                          <span className="text-sm text-muted-foreground">Sin productos</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{getNullableWeight(pallet.totalWeightKg)}</TableCell>
                    <TableCell className="text-right">{getNullableCurrency(pallet.totalCost)}</TableCell>
                    <TableCell className="text-right">{getNullableDecimal(pallet.costPerKg)} €/kg</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );

  return (
    <div className={isMobile ? 'flex min-h-0 flex-1 flex-col' : 'flex h-full min-h-0 flex-col pb-2'}>
      <Card className="flex min-h-0 flex-1 flex-col bg-transparent">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-medium">Análisis económico</CardTitle>
              <CardDescription>
                Lectura global y por detalle del coste, revenue y margen del pedido #{order?.id}.
              </CardDescription>
            </div>
            {costAnalysisError ? (
              <Badge variant="outline" className="text-amber-700 dark:text-amber-300">
                Última recarga con incidencias
              </Badge>
            ) : null}
          </div>
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-4'}`}>
            <AnalysisMetricCard
              title="Revenue"
              value={getNullableCurrency(summary.totalRevenue)}
              description="Base imponible total del pedido"
              icon={Wallet}
            />
            <AnalysisMetricCard
              title="Coste total"
              value={getNullableCurrency(summary.totalCost)}
              description={summary.totalCost == null ? 'Sin coste calculable' : 'Coste acumulado de cajas disponibles'}
              icon={Package2}
            />
            <AnalysisMetricCard
              title="Margen bruto"
              value={getNullableCurrency(summary.grossMargin)}
              description={summary.grossMargin == null ? 'Sin coste calculable' : 'Revenue menos coste total'}
              icon={ChartColumn}
              emphasize
            />
            <AnalysisMetricCard
              title="Margen %"
              value={getNullablePercentage(summary.marginPercentage)}
              description={summary.marginPercentage == null ? 'No calculable con los datos actuales' : 'Porcentaje de margen sobre revenue'}
              icon={ChartColumn}
            />
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
          {content}
        </CardContent>
      </Card>
    </div>
  );
}
