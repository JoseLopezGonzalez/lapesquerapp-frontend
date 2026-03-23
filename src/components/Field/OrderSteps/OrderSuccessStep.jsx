'use client';

import { ArrowRight, CircleCheck, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function OrderSuccessStep({ order, onBackToOrders, onBackToRoute }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-green-500/10 p-4 ring-4 ring-green-500/20">
          <CircleCheck className="h-16 w-16 text-green-600 dark:text-green-400" strokeWidth={2} />
        </div>
        <p className="text-xl font-semibold text-green-700 dark:text-green-400">
          Pedido operativo actualizado
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          El pedido #{order.id} se ha guardado con el contenido servido actualizado.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-3 p-6">
          <Button onClick={onBackToOrders} className="w-full justify-between">
            Volver a pedidos
            <ArrowRight className="h-4 w-4" />
          </Button>
          {order.routeId ? (
            <Button variant="outline" onClick={onBackToRoute} className="w-full justify-between">
              Volver a la ruta
              <Route className="h-4 w-4" />
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
