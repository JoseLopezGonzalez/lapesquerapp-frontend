'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { geocodeAddress } from '@/lib/maps/geocoding';
import { openInGoogleMaps, openInWaze } from '@/lib/maps/navigation';
import { notify } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { MapPinned, Navigation, CircleOff, ShoppingCart, PackageOpen, CheckCircle2, Plus } from 'lucide-react';
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

export default function FieldRouteExecutionPage({ routeId }) {
  const { data: route, isLoading, error } = useFieldRoute(routeId);
  const { data: ordersData } = useFieldOrders({ routeId, perPage: 100 });
  const { updateStop, isUpdatingStop } = useFieldRouteStopMutation(routeId);
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [resultType, setResultType] = useState('delivery');
  const [resultNotes, setResultNotes] = useState('');

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

  const nextStop = useMemo(() => getNextPendingStop(stops), [stops]);
  const ordersByStopId = useMemo(
    () =>
      new Map(
        (ordersData?.items ?? [])
          .filter((order) => order.routeStopId != null)
          .map((order) => [String(order.routeStopId), order])
      ),
    [ordersData]
  );
  const nextStopOrder = nextStop ? ordersByStopId.get(String(nextStop.id)) : null;
  const nextStopQuery = nextStop?.address || nextStop?.label || '';
  const mapStops = useMemo(
    () =>
      (stops ?? []).map((stop) => ({
        ...stop,
        isActive: nextStop?.id === stop.id,
      })),
    [stops, nextStop]
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
      setStops(await enrichStops(updatedRoute?.stops ?? []));
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
      setStops(await enrichStops(updatedRoute?.stops ?? []));
    } catch (_) {
      return;
    }
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background">
      <div className="min-h-[42vh] flex-1 p-4 pb-28">
        <div className="mb-4 flex items-start justify-between gap-3 px-1">
          <div>
            <h1 className="text-xl font-semibold">{route.name}</h1>
            <p className="text-sm text-muted-foreground">{route.routeDate || 'Sin fecha'} · {route.description || 'Ruta operativa'}</p>
          </div>
          <Badge variant="secondary">{getFieldStatusLabel(route.status || 'pending')}</Badge>
        </div>
        <RouteMap stops={mapStops} className="h-full min-h-[320px] rounded-2xl border shadow-sm" />
      </div>

      <div className="sticky bottom-0 z-20 rounded-t-[28px] border border-border bg-background/95 p-4 shadow-2xl backdrop-blur">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Siguiente parada</p>
                <h2 className="text-lg font-semibold">{nextStop?.label || nextStop?.address || 'Ruta completada'}</h2>
              </div>
              {nextStop && <Badge>{nextStop.stopType || 'obligatoria'}</Badge>}
            </div>
            {nextStop ? (
              <p className="text-sm text-muted-foreground">{nextStop.address || nextStop.notes || 'Sin dirección detallada'}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No quedan paradas pendientes en esta ruta.</p>
            )}
          </div>

          {nextStop && (
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => openInGoogleMaps(nextStop.lat, nextStop.lng, nextStopQuery)} className="justify-between">
                Navegar
                <Navigation className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => openInWaze(nextStop.lat, nextStop.lng, nextStopQuery)}>
                Abrir en Waze
              </Button>
              {nextStopOrder && (
                <Button asChild variant="secondary" className="justify-between">
                  <Link href={`/field/pedidos/${nextStopOrder.id}`}>
                    Abrir pedido
                    <PackageOpen className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link
                  href={{
                    pathname: '/field/autoventa',
                    query: {
                      routeId: route.id,
                      routeStopId: nextStop.id,
                      ...(nextStop.customerId ? { customerId: nextStop.customerId } : {}),
                    },
                  }}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Autoventa
                </Link>
              </Button>
              <Button variant="outline" onClick={() => handleSkipStop(nextStop)} disabled={isUpdatingStop}>
                <CircleOff className="mr-2 h-4 w-4" />
                Omitir
              </Button>
              <Button variant="outline" disabled title="Próximamente: pendiente de endpoint backend para crear paradas">
                <Plus className="mr-2 h-4 w-4" />
                Añadir parada
              </Button>
              <Button onClick={() => openStopDialog(nextStop, nextStopOrder ? 'delivery' : 'visit')}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Cerrar parada
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Todas las paradas</p>
            <div className="max-h-[34vh] space-y-2 overflow-auto pr-1">
              {stops.map((stop) => (
                <Card key={stop.id} className={cn('border-border/70', nextStop?.id === stop.id && 'border-primary shadow-sm')}>
                  <CardContent className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="font-medium">#{stop.position} · {stop.label || stop.address || 'Parada sin título'}</p>
                      <p className="truncate text-sm text-muted-foreground">{stop.address || stop.notes || 'Sin detalles adicionales'}</p>
                    </div>
                    <Badge variant={stop.status === 'completed' ? 'default' : stop.status === 'skipped' ? 'secondary' : 'outline'}>
                      {getFieldStatusLabel(stop.status)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

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
