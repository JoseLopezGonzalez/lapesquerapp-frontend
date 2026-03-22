'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import Step2QRScan from '@/components/Comercial/Autoventa/Step2QRScan';
import Step3Pricing from '@/components/Comercial/Autoventa/Step3Pricing';
import { useFieldOrder, useFieldOrderMutations } from '@/hooks/useFieldOrders';
import { getFieldProductsOptions } from '@/services/fieldOperatorService';
import { notify } from '@/lib/notifications';
import { getFieldStatusLabel } from '@/components/Field/labels';
import { PackageOpen, Save } from 'lucide-react';

function aggregateItemsFromBoxes(boxes, order) {
  const byProduct = new Map();
  const existingByProductId = new Map(
    (order?.plannedProductDetails ?? []).map((detail) => [
      Number(detail?.product?.id),
      detail,
    ])
  );

  for (const box of boxes) {
    const id = Number(box.productId);
    if (!byProduct.has(id)) {
      const detail = existingByProductId.get(id);
      byProduct.set(id, {
        productId: id,
        productName: box.productName ?? detail?.product?.name ?? '',
        boxesCount: 0,
        totalWeight: 0,
        unitPrice: Number(detail?.unitPrice) || 0,
        subtotal: 0,
        tax: detail?.tax?.id != null ? Number(detail.tax.id) : undefined,
      });
    }
    const row = byProduct.get(id);
    row.boxesCount += 1;
    row.totalWeight += Number(box.netWeight) || 0;
  }

  return Array.from(byProduct.values()).map((item) => ({
    ...item,
    subtotal: Number(item.totalWeight || 0) * Number(item.unitPrice || 0),
  }));
}

export default function FieldOrderExecutionPage({ orderId }) {
  const { data: order, isLoading, error } = useFieldOrder(orderId);
  const { updateOrder, isUpdating } = useFieldOrderMutations();
  const [boxes, setBoxes] = useState([]);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('finished');

  useEffect(() => {
    if (!order) return;
    setItems(
      (order.plannedProductDetails ?? []).map((detail) => ({
        productId: Number(detail?.product?.id),
        productName: detail?.product?.name ?? '',
        boxesCount: Number(detail?.boxes) || 0,
        totalWeight: Number(detail?.quantity) || 0,
        unitPrice: Number(detail?.unitPrice) || 0,
        subtotal: (Number(detail?.quantity) || 0) * (Number(detail?.unitPrice) || 0),
        tax: detail?.tax?.id != null ? Number(detail.tax.id) : undefined,
      }))
    );
    setStatus(order.status || 'finished');
  }, [order]);

  const state = useMemo(() => ({ boxes, items }), [boxes, items]);
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0),
    [items]
  );

  const addBox = (box) => setBoxes((current) => [...current, box]);
  const removeBox = (index) => setBoxes((current) => current.filter((_, idx) => idx !== index));
  const removeAllBoxes = () => {
    setBoxes([]);
    setItems([]);
  };
  const setItemPrice = (productId, unitPrice) => {
    const numeric = Number(unitPrice) || 0;
    setItems((current) =>
      current.map((item) =>
        Number(item.productId) === Number(productId)
          ? { ...item, unitPrice: numeric, subtotal: (Number(item.totalWeight) || 0) * numeric }
          : item
      )
    );
  };

  useEffect(() => {
    if (!order) return;
    if (boxes.length === 0) return;
    setItems(aggregateItemsFromBoxes(boxes, order));
  }, [boxes, order]);

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center"><Loader /></div>;
  }

  if (error || !order) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<PackageOpen className="h-10 w-10 text-primary" />}
          title="No se pudo abrir el pedido"
          description={error?.message ?? 'El pedido no está disponible.'}
        />
      </div>
    );
  }

  const handleSubmit = async () => {
    const plannedProducts = items.map((item) => ({
      product: Number(item.productId),
      quantity: Number(item.totalWeight) || 0,
      boxes: Number(item.boxesCount) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      tax: item.tax != null ? Number(item.tax) : undefined,
    }));

    try {
      await notify.promise(
        updateOrder({
          orderId,
          payload: {
            status,
            plannedProducts,
          },
        }),
        {
          loading: { title: 'Guardando pedido', description: 'Actualizando el contenido operativo servido.' },
          success: { title: 'Pedido operativo actualizado', description: 'Los cambios se han guardado correctamente.' },
          error: (err) => ({
            title: 'No se pudo guardar el pedido',
            description: err?.message ?? 'Inténtalo de nuevo.',
          }),
        }
      );
    } catch (err) {
      return;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Pedido #{order.id}</h1>
            <p className="text-sm text-muted-foreground">{order.customer?.name || 'Sin cliente'} · {order.loadDate || 'Sin fecha'}</p>
          </div>
          <Badge variant="secondary">{getFieldStatusLabel(order.status || 'pending')}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Usa el mismo patrón de autoventa para leer cajas y ajustar el contenido real servido.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lectura de cajas</CardTitle>
              <CardDescription>Escanea las cajas reales servidas para construir el contenido operativo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Step2QRScan
                state={state}
                addBox={addBox}
                removeBox={removeBox}
                removeAllBoxes={removeAllBoxes}
                loadProductOptions={getFieldProductsOptions}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contenido servido</CardTitle>
              <CardDescription>Previsión inicial adaptada con el contenido real leído.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Step3Pricing state={state} setItemPrice={setItemPrice} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cierre operativo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Estado final</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finished">Finalizado</SelectItem>
                    <SelectItem value="incident">Incidencia</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Total previsto tras ajuste</p>
                <p className="text-2xl font-semibold">{Number(totalAmount).toFixed(2)} €</p>
              </div>

              <Button onClick={handleSubmit} disabled={isUpdating || items.length === 0} className="w-full justify-between">
                Guardar pedido operativo
                <Save className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
