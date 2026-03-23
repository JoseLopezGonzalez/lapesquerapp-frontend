'use client';

import { Drawer } from 'vaul';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MOBILE_SAFE_AREAS } from '@/lib/design-tokens-mobile';
import { Plus } from 'lucide-react';
import { getFieldStatusLabel } from '@/components/Field/labels';

export function StopsListDrawer({ open, onOpenChange, stops, nextStop, onSelectStop }) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
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
                  onClick={() => onSelectStop(stop)}
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
  );
}
