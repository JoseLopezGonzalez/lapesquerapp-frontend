'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDecimal, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { formatCostPerKg } from '@/helpers/production/costFormatters';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PackageSearch, SearchX } from 'lucide-react';
import { useStockByProductsStats } from '@/hooks/useStockStats';

export function StockByProductsCard() {
  const { data: stockData = [], isLoading } = useStockByProductsStats();
  const [search, setSearch] = useState('');

  const filteredData = stockData.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalKg = stockData.reduce((sum, item) => sum + item.total_kg, 0);

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Inventario por productos</CardTitle>
            <CardDescription>Resumen del inventario por producto.</CardDescription>
          </div>

          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto"
            className="3xl:flex hidden max-w-[200px] text-sm"
          />
        </div>

        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto"
          className="3xl:hidden max-w-[200px] text-sm"
        />
      </CardHeader>

      <CardContent className="min-h-0">
        {isLoading ? (
          <ScrollArea className="max-h-[200px] min-h-0 pr-2">
            <div className="flex flex-col text-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-muted flex gap-3 border-b py-2 last:border-b-0">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-[85%] max-w-xs" />
                    <Skeleton className="h-3 w-[55%] max-w-[200px]" />
                  </div>
                  <div className="hidden shrink-0 items-start gap-3 pt-0.5 sm:flex">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5 sm:hidden">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : stockData.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center py-8">
            <div className="relative">
              <div className="from-primary/20 to-secondary/20 absolute -inset-1 rounded-full bg-gradient-to-r opacity-70 blur-xl" />
              <div className="bg-background relative flex h-14 w-14 items-center justify-center rounded-full border shadow-xs">
                <PackageSearch className="text-primary h-6 w-6" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="mt-4 text-lg font-medium tracking-tight">
              No hay inventario disponible
            </h2>
            <p className="text-muted-foreground mt-2 max-w-[280px] text-center text-xs whitespace-normal">
              No se encontraron productos en el inventario. Agrega productos para ver el resumen por
              producto.
            </p>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="max-h-[200px] min-h-0 overflow-auto pr-2">
            <div className="flex flex-col text-sm">
              {filteredData.map((item, i) => (
                <div
                  key={i}
                  className="border-muted hover:bg-muted/50 flex gap-3 border-b py-2 transition-colors last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-foreground wrap-break-word">{item.name}</span>
                      <span className="text-muted-foreground text-xs">
                        Coste medio: {formatCostPerKg(item.average_cost_per_kg)}
                      </span>
                    </div>
                  </div>

                  <div className="hidden shrink-0 items-start gap-4 text-right tabular-nums sm:flex">
                    <span className="font-mono text-xs font-bold text-nowrap">
                      {formatDecimal(item.percentage)}%
                    </span>
                    <span className="text-muted-foreground font-mono text-sm text-nowrap">
                      {formatDecimalWeight(item.total_kg)}
                    </span>
                  </div>

                  <div className="shrink-0 text-right font-mono text-xs sm:hidden">
                    <div className="flex flex-col items-end gap-0.5 text-nowrap">
                      <span className="text-muted-foreground">
                        {formatDecimalWeight(item.total_kg)}
                      </span>
                      <span className="font-bold">{formatDecimal(item.percentage)}%</span>
                      <span className="text-muted-foreground text-[11px]">
                        {formatCostPerKg(item.average_cost_per_kg)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[200px] flex-col items-center justify-center py-8">
            <div className="relative">
              <div className="from-primary/20 to-secondary/20 absolute -inset-1 rounded-full bg-gradient-to-r opacity-70 blur-xl" />
              <div className="bg-background relative flex h-14 w-14 items-center justify-center rounded-full border shadow-xs">
                <SearchX className="text-primary h-6 w-6" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="mt-4 text-lg font-medium tracking-tight">
              No se encontraron resultados
            </h2>
            <p className="text-muted-foreground mt-2 max-w-[280px] text-center text-xs whitespace-normal">
              No hay productos que coincidan con tu búsqueda. Intenta con otros términos.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 flex flex-row items-center justify-between gap-2 border-t px-4 py-3 text-sm">
        <span className="text-muted-foreground">Total</span>
        <span className="text-foreground font-semibold tabular-nums">
          {formatDecimalWeight(totalKg)}
        </span>
      </CardFooter>
    </Card>
  );
}
