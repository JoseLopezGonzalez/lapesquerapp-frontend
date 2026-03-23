'use client';

import { Button } from '@/components/ui/button';
import { RouteMap } from '@/components/Maps/RouteMap';
import { List } from 'lucide-react';

export function RouteMapSection({
  routeGeometryError,
  isCalculatingRoute,
  mapStops,
  routeGeometry,
  stopSheetOpen,
  stopsSheetOpen,
  onStopClick,
  onShowStopsList,
}) {
  return (
    <>
      {routeGeometryError ? (
        <p className="mb-3 px-1 text-sm text-muted-foreground">{routeGeometryError}</p>
      ) : null}
      {isCalculatingRoute ? (
        <p className="mb-3 px-1 text-sm text-muted-foreground">Calculando ruta por carretera...</p>
      ) : null}
      <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-[28px] border bg-background shadow-sm">
        <RouteMap
          stops={mapStops}
          routeGeometry={routeGeometry}
          disableFallbackLine
          className="h-full min-h-0 w-full rounded-[28px] border-0 shadow-none"
          onStopClick={onStopClick}
        />
        {!stopSheetOpen && !stopsSheetOpen && (
          <div className="pointer-events-none absolute right-4 top-4 z-[60] flex justify-end">
            <div className="pointer-events-auto flex items-center gap-2">
              <Button variant="outline" className="shadow-lg" onClick={onShowStopsList}>
                <List className="mr-2 h-4 w-4" />
                Ver paradas
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
