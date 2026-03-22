'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Drawer } from 'vaul';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { RouteMap } from '@/components/Maps/RouteMap';
import { useFieldOrders } from '@/hooks/useFieldOrders';
import { useFieldRoute, useFieldRouteStopMutation } from '@/hooks/useFieldRoutes';
import { getRouteDirections } from '@/lib/maps/directions';
import { geocodeAddress } from '@/lib/maps/geocoding';
import { openInGoogleMaps, openInWaze } from '@/lib/maps/navigation';
import { notify } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { MOBILE_SAFE_AREAS } from '@/lib/design-tokens-mobile';
import { MapPinned, CircleOff, ShoppingCart, PackageOpen, CheckCircle2, Plus, SquareArrowOutUpRight, List, ArrowLeft } from 'lucide-react';
import { getFieldStatusLabel } from '@/components/Field/labels';

const resultTypes = [
  { value: 'delivery', label: 'Entrega realizada' },
  { value: 'autoventa', label: 'Autoventa realizada' },
  { value: 'no_contact', label: 'Sin contacto' },
  { value: 'incident', label: 'Incidencia' },
  { value: 'visit', label: 'Visita realizada' },
];

async function enrichStops(stops) {
  const enriched = await Promise.all(
    (stops ?? []).map(async (stop) => {
      if (stop?.lat != null && stop?.lng != null) return stop;
      const query = stop?.address || stop?.label;
      if (!query) return stop;
      try {
        const [feature] = await geocodeAddress(query);
        if (!feature?.center) return stop;
        return { ...stop, lng: feature.center[0], lat: feature.center[1] };
      } catch (_) {
        return stop;
      }
    })
  );
  return enriched;
}

function getNextPendingStop(stops) {
  return (stops ?? []).find((stop) => stop.status === 'pending') ?? null;
}

function formatRouteDate(value) {
  if (!value) return 'Sin fecha';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

export default function FieldRouteExecutionPage({ routeId }) {
  const router = useRouter();
  const { data: route, isLoading, error } = useFieldRoute(routeId);
  const { data: ordersData } = useFieldOrders({ routeId, perPage: 100 });
  const { updateStop, isUpdatingStop } = useFieldRouteStopMutation(routeId);
  const [stops, setStops] = useState([]);
  const [focusedStopId, setFocusedStopId] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [resultType, setResultType] = useState('delivery');
  const [resultNotes, setResultNotes] = useState('');
  const [stopSheetOpen, setStopSheetOpen] = useState(false);
  const [stopsSheetOpen, setStopsSheetOpen] = useState(false);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeGeometryError, setRouteGeometryError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!route?.stops) return;
    enrichStops(route.stops).then((enriched) => {
      if (!cancelled) setStops(enriched);
    });
    return () => {
      cancelled = true;
    };
  }, [route]);

  useEffect(() => {
    let cancelled = false;
    setRouteGeometryError('');

    const stopsWithCoordinates = stops.filter((stop) => stop?.lat != null && stop?.lng != null);
    if (stopsWithCoordinates.length < 2) {
      setRouteGeometry(null);
      setIsCalculatingRoute(false);
      return () => {
        cancelled = true;
      };
    }

    async function loadDirections() {
      setIsCalculatingRoute(true);
      try {
        const geometry = await getRouteDirections(stops);
        if (!cancelled) {
          setRouteGeometry(geometry);
          setIsCalculatingRoute(false);
        }
      } catch (error) {
        if (!cancelled) {
          setRouteGeometry(null);
          setRouteGeometryError(error?.message ?? 'No se pudo calcular la ruta por carretera.');
          setIsCalculatingRoute(false);
        }
      }
    }

    loadDirections();

    return () => {
      cancelled = true;
    };
  }, [stops]);

  const nextStop = useMemo(() => getNextPendingStop(stops), [stops]);

  useEffect(() => {
    if (!stops.length) {
      setFocusedStopId(null);
      return;
    }

    if (focusedStopId != null) {
      const exists = stops.some((stop) => String(stop.id) === String(focusedStopId));
      if (exists) return;
    }

    setFocusedStopId((nextStop ?? stops[0] ?? null)?.id ?? null);
  }, [stops, focusedStopId, nextStop]);

  const ordersByStopId = useMemo(
    () =>
      new Map(
        (ordersData?.items ?? [])
          .filter((order) => order.routeStopId != null)
          .map((order) => [String(order.routeStopId), order])
      ),
    [ordersData]
  );

  const focusedStop = useMemo(
    () => stops.find((stop) => String(stop.id) === String(focusedStopId)) ?? nextStop ?? stops[0] ?? null,
    [stops, focusedStopId, nextStop]
  );

  const focusedStopOrder = focusedStop ? ordersByStopId.get(String(focusedStop.id)) : null;
  const focusedStopQuery = focusedStop?.address || focusedStop?.label || '';
  const routeDateLabel = useMemo(() => formatRouteDate(route?.routeDate), [route?.routeDate]);

  const mapStops = useMemo(
    () =>
      (stops ?? []).map((stop) => ({
        ...stop,
        isActive: focusedStop?.id === stop.id,
      })),
    [stops, focusedStop]
  );

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center"><Loader /></div>;
  }

  if (error || !route) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <EmptyState
          icon={<MapPinned className="h-10 w-10 text-primary" />}
          title="No se pudo abrir la ruta"
          description={error?.message ?? 'La ruta no está disponible.'}
        />
      </div>
    );
  }

  const openStopDialog = (stop, defaultResult = 'delivery') => {
    setSelectedStop(stop);
    setResultType(defaultResult);
    setResultNotes('');
  };

  const refreshStopsFromRoute = async (updatedRoute, preferredStopId = null) => {
    const enrichedStops = await enrichStops(updatedRoute?.stops ?? []);
    setStops(enrichedStops);
    const nextFocusedId =
      preferredStopId != null && enrichedStops.some((stop) => String(stop.id) === String(preferredStopId))
        ? preferredStopId
        : (getNextPendingStop(enrichedStops) ?? enrichedStops[0] ?? null)?.id ?? null;
    setFocusedStopId(nextFocusedId);
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
          loading: { title: 'Registrando resultado', description: 'Guardando el cierre de la parada.' },
          success: { title: 'Parada actualizada', description: 'El resultado se ha registrado correctamente.' },
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
          success: { title: 'Parada omitida', description: 'La parada ha quedado marcada como omitida.' },
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
    <div className="relative flex h-full min-h-0 w-full min-w-0 flex-col bg-background">
      <div className={cn('flex min-h-0 w-full min-w-0 flex-1 flex-col p-4 pb-4 md:pb-8')}>
        <div className="mb-4 flex items-start justify-between gap-3 px-1">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="-ml-2 shrink-0" onClick={() => router.push('/field/rutas')}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver a todas las rutas</span>
              </Button>
              <h1 className="truncate text-xl font-semibold">{route.name}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{routeDateLabel}</p>
            <p className="text-sm text-muted-foreground">{route.description || 'Ruta operativa'}</p>
          </div>
          <Badge variant="secondary">{getFieldStatusLabel(route.status || 'pending')}</Badge>
        </div>
        {routeGeometryError ? (
          <p className="mb-3 px-1 text-sm text-muted-foreground">
            {routeGeometryError}
          </p>
        ) : null}
        {isCalculatingRoute ? (
          <p className="mb-3 px-1 text-sm text-muted-foreground">
            Calculando ruta por carretera...
          </p>
        ) : null}
        <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-[28px] border bg-background shadow-sm">
          <RouteMap
            stops={mapStops}
            routeGeometry={routeGeometry}
            disableFallbackLine
            className="h-full min-h-0 w-full rounded-[28px] border-0 shadow-none"
            onStopClick={(stop) => {
              setFocusedStopId(stop.id);
              setStopSheetOpen(true);
            }}
          />
          {!stopSheetOpen && !stopsSheetOpen && (
            <div className="pointer-events-none absolute right-4 top-4 z-[60] flex justify-end">
              <div className="pointer-events-auto flex items-center gap-2">
                <Button variant="outline" className="shadow-lg" onClick={() => setStopsSheetOpen(true)}>
                  <List className="mr-2 h-4 w-4" />
                  Ver paradas
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Drawer.Root open={stopSheetOpen} onOpenChange={setStopSheetOpen} shouldScaleBackground>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-20 bg-black/15" />
          <Drawer.Content
            className={cn(
              'fixed bottom-0 left-0 right-0 z-30 mt-24 flex max-h-[78vh] flex-col rounded-t-[28px] border border-border bg-background shadow-2xl',
              MOBILE_SAFE_AREAS.BOTTOM
            )}
          >
            <Drawer.Title className="sr-only">Detalle operativo de la parada</Drawer.Title>
            <Drawer.Description className="sr-only">Acciones principales para la parada enfocada.</Drawer.Description>

            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b px-4 pb-3 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h2 className="truncate text-lg font-semibold">
                      {focusedStop?.label || focusedStop?.address || 'Ruta completada'}
                    </h2>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {focusedStop
                        ? focusedStop.address || focusedStop.notes || 'Sin dirección detallada'
                        : 'No quedan paradas pendientes en esta ruta.'}
                    </p>
                  </div>
                  {focusedStop && <Badge className="shrink-0">{focusedStop.stopType || 'obligatoria'}</Badge>}
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-3">
                {focusedStop && (
                  <div className="space-y-2 py-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => openInGoogleMaps(focusedStop.lat, focusedStop.lng, focusedStopQuery)} className="h-11 justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <Image src="/brands/google-maps.svg" alt="" width={20} height={20} className="shrink-0" />
                          Navegar
                        </span>
                        <SquareArrowOutUpRight className="h-4 w-4 shrink-0" />
                      </Button>
                      <Button
                        onClick={() => openInWaze(focusedStop.lat, focusedStop.lng, focusedStopQuery)}
                        className="h-11 justify-between gap-2 border-[#0099FF] bg-[#0099FF] text-white hover:bg-[#008AE6]"
                      >
                        <span className="flex items-center gap-2">
                          <Image src="/brands/waze.svg" alt="" width={20} height={20} className="shrink-0" />
                          Abrir en Waze
                        </span>
                        <SquareArrowOutUpRight className="h-4 w-4 shrink-0" />
                      </Button>
                      {focusedStopOrder && (
                        <Button asChild variant="secondary" className="h-11 justify-start gap-2">
                          <Link href={`/field/pedidos/${focusedStopOrder.id}`}>
                            <PackageOpen className="h-4 w-4 shrink-0" />
                            Abrir pedido
                          </Link>
                        </Button>
                      )}
                      <Button asChild variant="outline" className="col-span-2 h-11 justify-start gap-2">
                        <Link
                          href={{
                            pathname: '/field/autoventa',
                            query: {
                              routeId: route.id,
                              routeStopId: focusedStop.id,
                              ...(focusedStop.customerId ? { customerId: focusedStop.customerId } : {}),
                            },
                          }}
                        >
                          <ShoppingCart className="h-4 w-4 shrink-0" />
                          Crear autoventa
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                <div className="min-h-0 flex-1 py-2" />

                {focusedStop && (
                  <div className="grid grid-cols-2 gap-2 border-t pt-3">
                    <Button variant="outline" onClick={() => handleSkipStop(focusedStop)} disabled={isUpdatingStop} className="h-11 justify-start gap-2">
                      <CircleOff className="h-4 w-4 shrink-0" />
                      Omitir
                    </Button>
                    <Button onClick={() => openStopDialog(focusedStop, focusedStopOrder ? 'delivery' : 'visit')} className="h-11 justify-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Cerrar parada
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <Drawer.Root open={stopsSheetOpen} onOpenChange={setStopsSheetOpen} shouldScaleBackground={false}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/20" />
          <Drawer.Content
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 mt-24 flex max-h-[82vh] flex-col rounded-t-[28px] border border-border bg-background shadow-2xl',
              MOBILE_SAFE_AREAS.BOTTOM
            )}
          >
            <Drawer.Title className="sr-only">Listado de paradas de la ruta</Drawer.Title>
            <Drawer.Description className="sr-only">Selecciona una parada para ver su detalle operativo.</Drawer.Description>

            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Paradas de la ruta</h2>
                  <p className="text-sm text-muted-foreground">Selecciona una parada para abrir su detalle.</p>
                </div>
                <Badge variant="outline">{stops.length}</Badge>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-auto pb-3 pr-1">
                {stops.map((stop) => (
                  <button
                    key={stop.id}
                    type="button"
                    className="block w-full text-left"
                    onClick={() => {
                      setFocusedStopId(stop.id);
                      setStopsSheetOpen(false);
                      setStopSheetOpen(true);
                    }}
                  >
                    <Card
                      className={cn(
                        'border-border/70 transition-colors',
                        nextStop?.id === stop.id && 'border-primary/40 bg-primary/5 shadow-sm'
                      )}
                    >
                      <CardContent className="space-y-2 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              #{stop.position} · {stop.label || stop.address || 'Parada sin título'}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">
                              {stop.address || stop.notes || 'Sin detalles adicionales'}
                            </p>
                          </div>
                          <Badge
                            className="shrink-0"
                            variant={stop.status === 'completed' ? 'default' : stop.status === 'skipped' ? 'secondary' : 'outline'}
                          >
                            {getFieldStatusLabel(stop.status)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{stop.stopType || 'obligatoria'}</Badge>
                          {stop.customerId && <Badge variant="outline">Cliente</Badge>}
                          {nextStop?.id === stop.id && <Badge>Siguiente parada</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>

              <div className="border-t pt-3">
                <Button variant="outline" className="w-full" disabled title="Próximamente: pendiente de endpoint backend para crear paradas">
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir parada
                </Button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <Dialog open={Boolean(selectedStop)} onOpenChange={(open) => !open && setSelectedStop(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar resultado</DialogTitle>
            <DialogDescription>
              Marca el resultado de la parada con el mínimo detalle necesario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resultado</Label>
              <Select value={resultType} onValueChange={setResultType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un resultado" />
                </SelectTrigger>
                <SelectContent>
                  {resultTypes.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={resultNotes}
                onChange={(event) => setResultNotes(event.target.value.slice(0, 1000))}
                placeholder="Añade una nota breve si hace falta"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setSelectedStop(null)}>Cancelar</Button>
            <Button onClick={handleCompleteStop} disabled={isUpdatingStop}>
              Guardar resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
