'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getFieldStatusLabel } from '@/components/Field/labels';
import { formatDate, getOrderTypeLabel } from './utils';

export function ReadonlyOrderStep({ order }) {
  return (
    <div className="w-full max-w-[420px]">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-lg font-semibold">Pedido #{order.id}</p>
                <p className="text-sm text-muted-foreground">{order.customer?.name || 'Sin cliente'}</p>
              </div>
              <Badge variant="secondary">{getOrderTypeLabel(order.orderType ?? order.order_type)}</Badge>
            </div>
            <Badge variant="outline">{getFieldStatusLabel(order.status || 'pending')}</Badge>
          </div>

          <div className="grid gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Fecha de entrada</p>
              <p className="font-medium">{formatDate(order.entryDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fecha de carga</p>
              <p className="font-medium">{formatDate(order.loadDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Referencia</p>
              <p className="font-medium">{order.buyerReference || 'Sin referencia'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ruta</p>
              {order.routeId ? (
                <Button asChild variant="link" className="h-auto px-0">
                  <Link href={`/field/rutas/${order.routeId}`}>
                    Ver ruta #{order.routeId}
                  </Link>
                </Button>
              ) : (
                <p className="font-medium">Sin ruta asociada</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
