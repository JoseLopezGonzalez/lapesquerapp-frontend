'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { Package } from 'lucide-react';
import { useStockBySpeciesStats } from '@/hooks/useStockStats';

export function StockBySpeciesCard() {
  const { data: stockData = [], isLoading } = useStockBySpeciesStats();

  if (isLoading)
    return (
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="space-y-4 pb-2">
          <div>
            <CardTitle>
              <Skeleton className="mt-2 h-6 w-40" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="mt-2 h-4 w-1/2" />
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex w-full flex-col gap-1">
              <div className="flex w-full items-center justify-between">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" /> {/* No se ve */}
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="space-y-4 pb-2">
        <div>
          <CardTitle>Stock por especie</CardTitle>
          <CardDescription>Resumen del cantidad de stock por especie.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {stockData.length > 0 ? (
          stockData.map((item) => (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-sm font-medium">{item.name}</span>
                <div className="text-muted-foreground flex items-center gap-2 font-mono text-sm">
                  <span>{formatDecimalWeight(item.totalNetWeight)}</span>
                  <span className="text-xs">({item.percentage}%)</span>
                </div>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-500 ease-out"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="flex min-h-[200px] flex-col items-center justify-center py-8">
            <div className="relative">
              <div className="from-primary/20 to-secondary/20 absolute -inset-1 rounded-full bg-gradient-to-r opacity-70 blur-xl" />
              <div className="bg-background relative flex h-14 w-14 items-center justify-center rounded-full border shadow-xs">
                <Package className="text-primary h-6 w-6" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="mt-4 text-lg font-medium tracking-tight">No hay stock disponible</h2>
            <p className="text-muted-foreground mt-2 max-w-[280px] text-center text-xs whitespace-normal">
              No se encontraron datos de stock por especie. Agrega productos al inventario para ver
              el resumen.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
