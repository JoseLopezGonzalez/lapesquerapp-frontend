'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useHideBottomNav } from '@/context/BottomNavContext';
import { cn } from '@/lib/utils';
import { RouteMapSection } from '@/components/Field/RouteMapSection';
import { StopDetailDrawer } from '@/components/Field/StopDetailDrawer';
import { StopsListDrawer } from '@/components/Field/StopsListDrawer';
import { ResultDialog } from '@/components/Field/ResultDialog';
import { useFieldOrders } from '@/hooks/useFieldOrders';
import { useFieldRouteExecutionState } from '@/hooks/useFieldRouteExecutionState';
import { useRouteGeometry } from '@/hooks/useRouteGeometry';
import { useFieldRoute, useFieldRouteStopMutation } from '@/hooks/useFieldRoutes';
import { notify } from '@/lib/notifications';
import { ArrowLeft, Loader2, MapPinned } from 'lucide-react';
import { getFieldStatusLabel } from '@/components/Field/labels';

function getRouteStatusColor(status) {
  const normalized = typeof status === 'string' ? status.trim().toLowerCase() : status;
  if (normalized === 'finished' || normalized === 'completed') return 'green';
  if (normalized === 'incident' || normalized === 'cancelled' || normalized === 'canceled')
    return 'red';
  return 'orange';
}

function formatRouteDate(value) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function FieldRouteExecutionSkeleton() {
  return (
    <div className="bg-background relative flex h-full min-h-0 w-full min-w-0 flex-col">
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col p-4 pb-4 md:pb-8">
        <div className="mb-4 flex items-start justify-between gap-3 px-1">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex flex-1 items-center justify-center rounded-xl bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

export default function FieldRouteExecutionPage({ routeId }) {
  useHideBottomNav(true);
  const router = useRouter();
  const [selectedStop, setSelectedStop] = useState(null);
  const [resultType, setResultType] = useState('delivery');
  const [resultNotes, setResultNotes] = useState('');
  const [stopSheetOpen, setStopSheetOpen] = useState(false);
  const [stopsSheetOpen, setStopsSheetOpen] = useState(false);
  const { data: route, isLoading, errorMessage } = useFieldRoute(routeId);
  const { data: ordersData } = useFieldOrders(
    { routeId, perPage: 25 },
    { enabled: stopSheetOpen || Boolean(selectedStop) }
  );
  const { updateStop, isUpdatingStop } = useFieldRouteStopMutation(routeId);
  const { stops, setFocusedStopId, nextStop, focusedStop, mapStops, refreshStopsFromRoute } =
    useFieldRouteExecutionState(route);
  const {
    routeGeometry,
    isCalculatingRoute,
    directionsError: routeGeometryError,
  } = useRouteGeometry(stops);

  const ordersByStopId = useMemo(
    () =>
      new Map(
        (ordersData?.items ?? [])
          .filter((order) => order.routeStopId != null)
          .map((order) => [String(order.routeStopId), order])
      ),
    [ordersData]
  );

  const focusedStopOrder = focusedStop ? ordersByStopId.get(String(focusedStop.id)) : null;
  const focusedStopQuery = focusedStop?.address || focusedStop?.label || '';
  const routeDateLabel = useMemo(() => formatRouteDate(route?.routeDate), [route?.routeDate]);
  const handleMapStopClick = useCallback(
    (stop) => {
      setFocusedStopId(stop.id);
      setStopSheetOpen(true);
    },
    [setFocusedStopId]
  );

  if (isLoading) {
    return <FieldRouteExecutionSkeleton />;
  }

  if (errorMessage || !route) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <EmptyState
          icon={<MapPinned className="text-primary h-10 w-10" />}
          title="No se pudo abrir la ruta"
          description={errorMessage ?? 'La ruta no está disponible.'}
        />
      </div>
    );
  }

  const openStopDialog = (stop, defaultResult = 'delivery') => {
    setSelectedStop(stop);
    setResultType(defaultResult);
    setResultNotes('');
  };

  const handleCompleteStop = async () => {
    if (!selectedStop) return;
    try {
      const response = await notify.promise(
        updateStop({
          stopId: selectedStop.id,
          payload: {
            status: 'completed',
            result_type: resultType,
            result_notes: resultNotes.trim() || undefined,
          },
        }),
        {
          loading: {
            title: 'Registrando resultado',
            description: 'Guardando el cierre de la parada.',
          },
          success: {
            title: 'Parada actualizada',
            description: 'El resultado se ha registrado correctamente.',
          },
          error: (err) => ({
            title: 'No se pudo cerrar la parada',
            description: err?.message ?? 'Inténtalo de nuevo.',
          }),
        }
      );
      const updatedRoute = response?.data ?? response;
      await refreshStopsFromRoute(updatedRoute, selectedStop.id);
      setSelectedStop(null);
    } catch (_) {
      return;
    }
  };

  const handleSkipStop = async (stop) => {
    try {
      const response = await notify.promise(
        updateStop({
          stopId: stop.id,
          payload: { status: 'skipped' },
        }),
        {
          loading: { title: 'Omitiendo parada', description: 'Guardando el estado operativo.' },
          success: {
            title: 'Parada omitida',
            description: 'La parada ha quedado marcada como omitida.',
          },
          error: (err) => ({
            title: 'No se pudo omitir la parada',
            description: err?.message ?? 'Inténtalo de nuevo.',
          }),
        }
      );
      const updatedRoute = response?.data ?? response;
      await refreshStopsFromRoute(updatedRoute, stop.id);
    } catch (_) {
      return;
    }
  };

  return (
    <div className="bg-background relative flex h-full min-h-0 w-full min-w-0 flex-col">
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col p-4 pb-4 md:pb-8">
        <div className="mb-4 flex items-start justify-between gap-3 px-1">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="-ml-2 shrink-0"
                onClick={() => router.push('/field/rutas')}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver a todas las rutas</span>
              </Button>
              <h1 className="truncate text-xl font-semibold">{route.name}</h1>
            </div>
            <p className="text-muted-foreground text-sm">{routeDateLabel}</p>
            <p className="text-muted-foreground text-sm">{route.description || 'Ruta operativa'}</p>
          </div>
          {(() => {
            const routeStatusColor = getRouteStatusColor(route.status);
            return (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                  routeStatusColor === 'orange' &&
                    'bg-orange-500/15 text-orange-700 dark:text-orange-300',
                  routeStatusColor === 'green' &&
                    'bg-green-500/15 text-green-700 dark:text-green-300',
                  routeStatusColor === 'red' && 'bg-red-500/15 text-red-700 dark:text-red-300'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    routeStatusColor === 'orange' && 'bg-orange-500',
                    routeStatusColor === 'green' && 'bg-green-500',
                    routeStatusColor === 'red' && 'bg-red-500'
                  )}
                />
                {getFieldStatusLabel(route.status || 'pending')}
              </span>
            );
          })()}
        </div>
        <RouteMapSection
          routeGeometryError={routeGeometryError}
          isCalculatingRoute={isCalculatingRoute}
          mapStops={mapStops}
          routeGeometry={routeGeometry}
          stopSheetOpen={stopSheetOpen}
          stopsSheetOpen={stopsSheetOpen}
          onStopClick={handleMapStopClick}
          onShowStopsList={() => setStopsSheetOpen(true)}
        />
      </div>

      <StopDetailDrawer
        open={stopSheetOpen}
        onOpenChange={setStopSheetOpen}
        focusedStop={focusedStop}
        focusedStopQuery={focusedStopQuery}
        focusedStopOrder={focusedStopOrder}
        route={route}
        isUpdatingStop={isUpdatingStop}
        onSkipStop={handleSkipStop}
        onOpenResultDialog={openStopDialog}
      />

      <StopsListDrawer
        open={stopsSheetOpen}
        onOpenChange={setStopsSheetOpen}
        stops={stops}
        nextStop={nextStop}
        onSelectStop={(stop) => {
          setFocusedStopId(stop.id);
          setStopsSheetOpen(false);
          setStopSheetOpen(true);
        }}
      />

      <ResultDialog
        open={Boolean(selectedStop)}
        onOpenChange={(open) => !open && setSelectedStop(null)}
        resultType={resultType}
        onResultTypeChange={setResultType}
        resultNotes={resultNotes}
        onResultNotesChange={(event) => setResultNotes(event.target.value.slice(0, 1000))}
        isUpdating={isUpdatingStop}
        onSubmit={handleCompleteStop}
      />
    </div>
  );
}
