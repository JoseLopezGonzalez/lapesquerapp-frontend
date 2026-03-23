'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Drawer } from 'vaul';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MOBILE_SAFE_AREAS } from '@/lib/design-tokens-mobile';
import { openInGoogleMaps, openInWaze } from '@/lib/maps/navigation';
import { CircleOff, ShoppingCart, PackageOpen, CheckCircle2, SquareArrowOutUpRight } from 'lucide-react';

export function StopDetailDrawer({
  open,
  onOpenChange,
  focusedStop,
  focusedStopQuery,
  focusedStopOrder,
  route,
  isUpdatingStop,
  onSkipStop,
  onOpenResultDialog,
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
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
                    <Button
                      onClick={() => openInGoogleMaps(focusedStop.lat, focusedStop.lng, focusedStopQuery)}
                      className="h-11 justify-between gap-2"
                    >
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
                  <Button
                    variant="outline"
                    onClick={() => onSkipStop(focusedStop)}
                    disabled={isUpdatingStop}
                    className="h-11 justify-start gap-2"
                  >
                    <CircleOff className="h-4 w-4 shrink-0" />
                    Omitir
                  </Button>
                  <Button
                    onClick={() => onOpenResultDialog(focusedStop, focusedStopOrder ? 'delivery' : 'visit')}
                    className="h-11 justify-start gap-2"
                  >
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
  );
}
