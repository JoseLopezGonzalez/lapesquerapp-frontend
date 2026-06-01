'use client';

import { useMemo, useState } from 'react';
import { Info, Loader2, SearchX } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/dateRangePicker';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useOrdersProfitabilityProducts } from '@/hooks/useOrdersStats';
import { actualYearRange } from '@/helpers/dates';
import {
  formatDecimal,
  formatDecimalCurrency,
  formatDecimalWeight,
} from '@/helpers/formats/numbers/formatNumbers';

const initialDateRange = {
  from: actualYearRange.from,
  to: actualYearRange.to,
};

function formatNullableCurrency(value) {
  return typeof value === 'number' ? formatDecimalCurrency(value) : '—';
}

function formatNullableCurrencyPerKg(value) {
  return typeof value === 'number' ? `${formatDecimal(value)} €/kg` : '—';
}

function formatNullablePercentage(value) {
  return typeof value === 'number' ? `${formatDecimal(value)} %` : '—';
}

export function OrdersProfitabilityProductsCard() {
  const [range, setRange] = useState(initialDateRange);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useOrdersProfitabilityProducts({ range });

  const products = data?.products ?? [];
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return products;

    return products.filter((item) => item.product?.name?.toLowerCase().includes(normalizedSearch));
  }, [products, search]);

  const totalWeight = useMemo(
    () => filteredProducts.reduce((sum, item) => sum + (item.totalWeightKg || 0), 0),
    [filteredProducts]
  );

  const totalOrders = useMemo(
    () => filteredProducts.reduce((sum, item) => sum + (item.ordersCount || 0), 0),
    [filteredProducts]
  );

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-1">
          <CardTitle>Rentabilidad por producto</CardTitle>
          <CardDescription>
            Desglose tabular de importe, coste y margen por producto expedido.
          </CardDescription>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <DateRangePicker dateRange={range} onChange={setRange} />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto"
          />
        </div>
      </CardHeader>

      <CardContent className="min-h-0">
        {isLoading ? (
          <div className="space-y-3">
            <div className="rounded-md border">
              <div className="border-b px-4 py-3">
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            </div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <ScrollArea className="h-[340px] w-full rounded-md border">
            <Table>
              <TableHeader className="bg-background sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[220px] max-w-[220px]">Producto</TableHead>
                  <TableHead className="text-right">Margen/kg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...filteredProducts]
                  .sort((a, b) => {
                    const aValue =
                      typeof a?.grossMargin === 'number' ? a.grossMargin : Number.NEGATIVE_INFINITY;
                    const bValue =
                      typeof b?.grossMargin === 'number' ? b.grossMargin : Number.NEGATIVE_INFINITY;
                    return bValue - aValue;
                  })
                  .map((item) => (
                    <TableRow key={item.product?.id ?? item.product?.name}>
                      <TableCell className="w-[220px] max-w-[220px] align-top font-medium">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="flex w-full items-start justify-between gap-2 text-left"
                            >
                              <div className="flex min-w-0 flex-col gap-0.5">
                                <span className="leading-tight break-words whitespace-normal">
                                  {item.product?.name ?? 'Sin producto'}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {formatDecimalWeight(item.totalWeightKg ?? 0)}
                                </span>
                              </div>
                              <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="w-72 p-4 text-sm">
                            <div className="grid gap-2">
                              <div className="flex justify-between gap-3">
                                <span>Importe</span>
                                <span className="font-medium">
                                  {formatNullableCurrency(item.totalRevenue)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-3">
                                <span>Importe/kg</span>
                                <span className="font-medium">
                                  {formatNullableCurrencyPerKg(item.revenuePerKg)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-3">
                                <span>Coste</span>
                                <span className="font-medium">
                                  {formatNullableCurrency(item.totalCost)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-3">
                                <span>Coste/kg</span>
                                <span className="font-medium">
                                  {formatNullableCurrencyPerKg(item.costPerKg)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-3">
                                <span>Margen</span>
                                <span className="font-medium">
                                  {formatNullableCurrency(item.grossMargin)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-3">
                                <span>Margen/kg</span>
                                <span className="font-medium">
                                  {formatNullableCurrencyPerKg(item.marginPerKg)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-3">
                                <span>Margen %</span>
                                <span className="font-medium">
                                  {formatNullablePercentage(item.marginPercentage)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-3">
                                <span>Pedidos</span>
                                <span className="font-medium">{item.ordersCount ?? 0}</span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNullableCurrencyPerKg(item.marginPerKg)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="flex min-h-[280px] flex-col items-center justify-center py-8">
            <div className="relative">
              <div className="from-primary/20 to-secondary/20 absolute -inset-1 rounded-full bg-gradient-to-r opacity-70 blur-xl" />
              <div className="bg-background relative flex h-14 w-14 items-center justify-center rounded-full border shadow-xs">
                <SearchX className="text-primary h-6 w-6" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="mt-4 text-lg font-medium tracking-tight">
              {products.length === 0 ? 'Sin datos' : 'No se encontraron resultados'}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-[320px] text-center text-xs">
              {products.length === 0
                ? 'Ajusta el rango de fechas para ver el desglose de rentabilidad por producto.'
                : 'No hay productos que coincidan con tu búsqueda. Intenta con otros términos.'}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-muted/50 flex flex-col gap-2 border-t p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted-foreground">
          {filteredProducts.length > 0
            ? `${filteredProducts.length} productos · ${totalOrders} apariciones en pedidos`
            : '* Solo se incluyen productos con expediciones en el rango.'}
        </span>
        <span className="text-foreground font-semibold tabular-nums">
          {formatDecimalWeight(totalWeight)}
        </span>
      </CardFooter>
    </Card>
  );
}
