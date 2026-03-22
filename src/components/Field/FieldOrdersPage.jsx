'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { useFieldOrders } from '@/hooks/useFieldOrders';
import { getFieldStatusLabel } from '@/components/Field/labels';
import { PackageOpen, ArrowRight } from 'lucide-react';

export default function FieldOrdersPage() {
  const { data, isLoading, error } = useFieldOrders({ perPage: 20 });
  const orders = data?.items ?? [];

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center"><Loader /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<PackageOpen className="h-10 w-10 text-primary" />}
          title="No se pudieron cargar los pedidos"
          description={error.message ?? 'Inténtalo de nuevo más tarde.'}
        />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<PackageOpen className="h-10 w-10 text-primary" />}
          title="Sin pedidos operativos"
          description="Cuando tengas pedidos asignados aparecerán aquí."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Pedidos operativos</h1>
        <p className="text-sm text-muted-foreground">Abre un pedido prefijado y ajusta el contenido real servido.</p>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                  <CardDescription>{order.customer?.name || 'Sin cliente'} · {order.loadDate || 'Sin fecha'}</CardDescription>
                </div>
                <Badge variant="secondary">{getFieldStatusLabel(order.status || 'pending')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {order.totalBoxes ?? 0} cajas · {Number(order.totalNetWeight ?? 0).toFixed(2)} kg
              </div>
              <Button asChild>
                <Link href={`/field/pedidos/${order.id}`}>
                  Abrir pedido
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
