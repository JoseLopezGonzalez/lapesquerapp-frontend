'use client';

import { Clock3, Droplets, Info, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function RouteMetricsOverlay({
  isCalculatingRoute,
  routeMetrics,
  dieselCostEstimate,
  dieselAverage,
}) {
  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="bg-background/95 rounded-2xl border px-4 py-3 shadow-sm">
        {isCalculatingRoute && (
          <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Recalculando ruta
          </div>
        )}
        <div className="flex flex-wrap items-start gap-5">
          <div className="min-w-[84px]">
            <p className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">Paradas</p>
            <p className="mt-1 text-lg font-semibold">{routeMetrics.stopCount}</p>
            <p className="text-muted-foreground text-xs">
              {routeMetrics.mappedStopCount >= 2
                ? `${routeMetrics.mappedStopCount} ubicadas`
                : 'Aun faltan puntos'}
            </p>
          </div>
          <div className="min-w-[110px]">
            <p className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
              Distancia
            </p>
            <p className="mt-1 text-lg font-semibold">{routeMetrics.distanceLabel}</p>
            <p className="text-muted-foreground text-xs">Por carretera</p>
          </div>
          <div className="min-w-[118px]">
            <p className="text-muted-foreground flex items-center gap-1 text-[11px] tracking-[0.18em] uppercase">
              <Clock3 className="h-3.5 w-3.5" />
              Tiempo
            </p>
            <p className="mt-1 text-lg font-semibold">{routeMetrics.durationLabel}</p>
            <p className="text-muted-foreground text-xs">
              {routeMetrics.ready ? 'Estimación actual' : 'Necesitas dos paradas'}
            </p>
          </div>
          <div className="min-w-[126px]">
            <div className="text-muted-foreground flex items-center gap-1 text-[11px] tracking-[0.18em] uppercase">
              <Droplets className="h-3.5 w-3.5" />
              Combustible
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground/80 hover:text-foreground inline-flex"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs space-y-1">
                    <p>Estimación orientativa para una furgoneta mediana.</p>
                    <p>Consumo usado: {dieselCostEstimate?.consumptionLabel ?? '9,5 l/100 km'}.</p>
                    <p>
                      Diésel medio:{' '}
                      {dieselAverage.isUnavailable ? 'No disponible hoy' : dieselAverage.label}.
                    </p>
                    <p>Distancia usada: {routeMetrics.distanceLabel}.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="mt-1 text-lg font-semibold">
              {dieselAverage.isLoading
                ? '-'
                : dieselAverage.isUnavailable || !dieselCostEstimate
                  ? 'No disponible'
                  : dieselCostEstimate.formattedTotalCost}
            </p>
            <p className="text-muted-foreground text-xs">
              {dieselAverage.isUnavailable || !dieselCostEstimate
                ? 'No disponible hoy'
                : `${dieselAverage.label} de media`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
