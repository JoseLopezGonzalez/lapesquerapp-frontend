'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, CircleCheck, Loader2, PackageOpen, Route, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import Step2QRScan from '@/components/Comercial/Autoventa/Step2QRScan';
import Step3Pricing from '@/components/Comercial/Autoventa/Step3Pricing';
import { useFieldOrder, useFieldOrderMutations } from '@/hooks/useFieldOrders';
import {
  aggregateItemsFromBoxes,
  buildInitialItems,
  buildPlannedProductsPayload,
  calculateServedItemsTotal,
  validateServedItems,
} from '@/lib/field/fieldOrderExecution';
import { getFieldProductsOptions } from '@/services/fieldOperatorService';
import { notify } from '@/lib/notifications';
import { getFieldStatusLabel } from '@/components/Field/labels';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, title: 'Pedido', description: 'Revisa el contexto del pedido operativo' },
  { id: 2, title: 'Previsión', description: 'Consulta los productos previstos del pedido' },
  { id: 3, title: 'Cajas', description: 'Escanea o pega códigos GS1-128' },
  { id: 4, title: 'Precios', description: 'Revisa o completa importes del resultado operativo' },
  { id: 5, title: 'Resumen', description: 'Comprueba el contenido final servido' },
  { id: 6, title: 'Confirmar', description: 'Revisa y guarda el pedido operativo' },
];

function formatDate(value) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function getOrderTypeLabel(orderType) {
  return orderType === 'autoventa' ? 'Autoventa' : 'Estándar';
}

function ReadonlyOrderStep({ order }) {
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

function ForecastStep({ items }) {
  const totalBoxes = items.reduce((sum, item) => sum + (Number(item.boxesCount) || 0), 0);
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.totalWeight) || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);

  return (
    <div className="w-full max-w-[min(800px,95vw)] space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          {items.map((item, idx) => (
            <div key={`${item.productId}-${idx}`} className="grid gap-1 border-b pb-3 last:border-b-0 last:pb-0">
              <p className="font-medium">{item.productName ?? item.productId}</p>
              <p className="text-sm text-muted-foreground">
                {item.boxesCount ?? 0} cajas · {Number(item.totalWeight ?? 0).toFixed(2)} kg · {Number(item.unitPrice ?? 0).toFixed(2)} €/kg
              </p>
              <p className="text-sm font-medium">{Number(item.subtotal ?? 0).toFixed(2)} €</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Cajas previstas</p>
            <p className="text-lg font-semibold">{totalBoxes}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Peso previsto</p>
            <p className="text-lg font-semibold">{totalWeight.toFixed(2)} kg</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total previsto</p>
            <p className="text-lg font-semibold">{Number(totalAmount ?? 0).toFixed(2)} €</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WizardEmptyStep({ title, description }) {
  return (
    <div className="w-full max-w-[420px]">
      <Card>
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-5 p-6 text-center">
          <div className="rounded-full border bg-muted/30 p-4">
            <PackageOpen className="h-12 w-12 text-primary" strokeWidth={1.6} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrderSummaryStep({ order, items, totalAmount }) {
  if (items.length === 0) {
    return (
      <WizardEmptyStep
        title="Sin contenido real todavía"
        description="Cuando registres cajas en el lector verás aquí el resumen del contenido real del pedido."
      />
    );
  }

  const totalBoxes = items.reduce((sum, item) => sum + (Number(item.boxesCount) || 0), 0);
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.totalWeight) || 0), 0);

  return (
    <div className="w-full max-w-[min(800px,95vw)] space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-2 text-sm">
            <p><strong>Cliente:</strong> {order.customer?.name || 'Sin cliente'}</p>
            <p><strong>Fecha de carga:</strong> {formatDate(order.loadDate)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          {items.map((item, idx) => (
            <div key={`${item.productId}-${idx}`} className="grid gap-1 border-b pb-3 last:border-b-0 last:pb-0">
              <p className="font-medium">{item.productName ?? item.productId}</p>
              <p className="text-sm text-muted-foreground">
                {item.boxesCount ?? 0} cajas · {Number(item.totalWeight ?? 0).toFixed(2)} kg · {Number(item.unitPrice ?? 0).toFixed(2)} €/kg
              </p>
              <p className="text-sm font-medium">{Number(item.subtotal ?? 0).toFixed(2)} €</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Cajas</p>
            <p className="text-lg font-semibold">{totalBoxes}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Peso neto</p>
            <p className="text-lg font-semibold">{totalWeight.toFixed(2)} kg</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total estimado</p>
            <p className="text-lg font-semibold">{Number(totalAmount ?? 0).toFixed(2)} €</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrderConfirmationStep({ totalAmount }) {
  const canSave = Number(totalAmount) > 0;

  return (
    <div className="w-full max-w-[420px] space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          {canSave ? (
            <>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Total estimado a guardar</p>
                <p className="text-2xl font-semibold">{Number(totalAmount ?? 0).toFixed(2)} €</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Se guardará el conjunto completo de líneas servidas del pedido, sin modificar su estado.
              </p>
            </>
          ) : (
            <WizardEmptyStep
              title="Nada que confirmar todavía"
              description="Antes de guardar tienes que registrar cajas para construir el contenido real del pedido."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OrderSuccessStep({ order, onBackToOrders, onBackToRoute }) {
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

export default function FieldOrderExecutionPage({ orderId }) {
  const router = useRouter();
  const { data: order, isLoading, errorMessage } = useFieldOrder(orderId);
  const { updateOrder, isUpdating } = useFieldOrderMutations();
  const [step, setStep] = useState(1);
  const [boxes, setBoxes] = useState([]);
  const [forecastItems, setForecastItems] = useState([]);
  const [servedItems, setServedItems] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!order) return;
    const initialItems = buildInitialItems(order);
    setForecastItems(initialItems);
    setServedItems([]);
    setBoxes([]);
    setStep(1);
    setIsSuccess(false);
  }, [order]);

  const state = useMemo(
    () => ({
      boxes,
      items: servedItems,
      customerName: order?.customer?.name ?? '',
      entryDate: order?.entryDate ?? '',
      loadDate: order?.loadDate ?? '',
    }),
    [boxes, servedItems, order]
  );

  const totalAmount = useMemo(
    () => calculateServedItemsTotal(servedItems),
    [servedItems]
  );

  const addBox = (box) => setBoxes((current) => [...current, box]);
  const removeBox = (index) => {
    setBoxes((current) => {
      const next = current.filter((_, idx) => idx !== index);
      if (next.length === 0) {
        setServedItems([]);
      } else if (order) {
        setServedItems(aggregateItemsFromBoxes(next, order));
      }
      return next;
    });
  };
  const removeAllBoxes = () => {
    setBoxes([]);
    setServedItems([]);
  };
  const setItemPrice = (productId, unitPrice) => {
    const numeric = Number(unitPrice) || 0;
    setServedItems((current) =>
      current.map((item) =>
        Number(item.productId) === Number(productId)
          ? { ...item, unitPrice: numeric, subtotal: (Number(item.totalWeight) || 0) * numeric }
          : item
      )
    );
  };

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center"><Loader /></div>;
  }

  if (errorMessage || !order) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<PackageOpen className="h-10 w-10 text-primary" />}
          title="No se pudo abrir el pedido"
          description={errorMessage ?? 'El pedido no está disponible.'}
        />
      </div>
    );
  }

  const canGoNext = () => {
    if (step === 1) return true;
    if (step === 2) return forecastItems.length > 0;
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) return true;
    return false;
  };

  const goBack = () => setStep((current) => Math.max(1, current - 1));

  const goNext = () => {
    if (step === 3 && boxes.length > 0) {
      setServedItems(aggregateItemsFromBoxes(boxes, order));
    }
    setStep((current) => Math.min(STEPS.length, current + 1));
  };

  const handleSubmit = async () => {
    const validationError = validateServedItems(servedItems);

    if (validationError) {
      notify.error({ title: 'No se puede guardar el pedido', description: validationError });
      return;
    }

    const plannedProducts = buildPlannedProductsPayload(servedItems);

    try {
      await notify.promise(
        updateOrder({
          orderId,
          payload: {
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
      setIsSuccess(true);
    } catch {
      return;
    }
  };

  const contentMaxWidth = [1, 3, 6].includes(step) ? 'max-w-[420px]' : 'max-w-[min(800px,95vw)]';
  const showSuccess = isSuccess;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 flex flex-col items-center gap-3 px-2 pb-6 pt-2 sm:pb-4 sm:pt-0">
        <h2 className="text-lg font-semibold">
          {showSuccess ? 'Pedido actualizado' : 'Ejecución de pedido'}
        </h2>
        {!showSuccess ? (
          <>
            {(() => {
              const start = Math.max(1, step - 1);
              const end = Math.min(STEPS.length, step + 1);
              const visibleSteps = [];
              for (let n = start; n <= end; n++) visibleSteps.push(n);
              return (
                <div className="flex items-center gap-2 w-full max-w-[min(100%,280px)]">
                  {visibleSteps.map((stepNum, idx) => {
                    const currentStep = STEPS[stepNum - 1];
                    const isCurrent = step === stepNum;
                    const isCompleted = step > stepNum;
                    const canGo = stepNum <= step;
                    const showBarAfter = idx < visibleSteps.length - 1;
                    const barFilled = step > stepNum;

                    return (
                      <React.Fragment key={stepNum}>
                        <button
                          type="button"
                          onClick={() => canGo && setStep(stepNum)}
                          disabled={!canGo}
                          className={cn(
                            'flex items-center justify-center min-w-10 h-10 shrink-0 rounded-full text-sm font-medium touch-manipulation transition-colors',
                            isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background',
                            isCompleted && !isCurrent && 'bg-primary/20 text-primary',
                            !isCurrent && !isCompleted && 'bg-muted text-muted-foreground',
                            !canGo && 'cursor-not-allowed opacity-60'
                          )}
                          aria-label={`Paso ${stepNum}: ${currentStep?.title}${!canGo ? ' (completa el paso anterior)' : ''}`}
                        >
                          {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                        </button>
                        {showBarAfter ? (
                          <div className="flex-1 h-1.5 rounded-full min-w-[12px] overflow-hidden bg-muted">
                            <div
                              className="h-full rounded-full bg-primary/30 transition-[width] duration-300 ease-out"
                              style={{ width: barFilled ? '100%' : '0%' }}
                            />
                          </div>
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })()}
            <p className="text-center text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">Paso {step} de {STEPS.length}</span>
              {' · '}
              {STEPS[step - 1]?.description}
            </p>
          </>
        ) : null}
      </div>

      <div className={cn('flex flex-1 min-h-0 w-full mx-auto flex-col overflow-y-auto px-4 pt-8 sm:pt-6', contentMaxWidth)}>
        {!showSuccess && step === 1 ? (
          <div className="flex flex-1 min-h-0 w-full justify-center overflow-y-auto">
            <ReadonlyOrderStep order={order} />
          </div>
        ) : null}
        {!showSuccess && step === 2 ? (
          <div className="flex flex-1 min-h-0 w-full items-center justify-center overflow-y-auto">
            <ForecastStep items={forecastItems} />
          </div>
        ) : null}
        {!showSuccess && step === 3 ? (
          <div className="flex flex-1 min-h-0 w-full justify-center overflow-y-auto">
            <Step2QRScan
              state={state}
              addBox={addBox}
              removeBox={removeBox}
              removeAllBoxes={removeAllBoxes}
              loadProductOptions={getFieldProductsOptions}
            />
          </div>
        ) : null}
        {!showSuccess && step === 4 ? (
          <div className="flex flex-1 min-h-0 w-full items-center justify-center overflow-y-auto">
            {servedItems.length > 0 ? (
              <Step3Pricing state={state} setItemPrice={setItemPrice} />
            ) : (
              <WizardEmptyStep
                title="Sin productos registrados todavía"
                description="Cuando registres cajas en el lector podrás revisar aquí los precios del contenido real del pedido."
              />
            )}
          </div>
        ) : null}
        {!showSuccess && step === 5 ? (
          <div className="flex flex-1 min-h-0 w-full items-center justify-center overflow-y-auto">
            <OrderSummaryStep
              order={order}
              items={servedItems}
              totalAmount={totalAmount}
            />
          </div>
        ) : null}
        {!showSuccess && step === 6 ? (
          <div className="flex flex-1 min-h-0 w-full items-center justify-center overflow-y-auto">
            <OrderConfirmationStep totalAmount={totalAmount} />
          </div>
        ) : null}
        {showSuccess ? (
          <OrderSuccessStep
            order={order}
            onBackToOrders={() => router.push('/field/pedidos')}
            onBackToRoute={() => router.push(`/field/rutas/${order.routeId}`)}
          />
        ) : null}
      </div>

      {!showSuccess ? (
        <div className="shrink-0 flex w-full justify-center gap-2 px-4 pb-4 pt-4">
          <div className="flex w-full max-w-[420px] gap-2">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={goBack}
                className="min-h-[40px] flex-1 touch-manipulation text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Anterior
              </Button>
            ) : (
              <Button asChild type="button" variant="outline" size="sm" className="min-h-[40px] flex-1 touch-manipulation text-sm">
                <Link href="/field/pedidos">
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Volver
                </Link>
              </Button>
            )}

            {step === STEPS.length ? (
              <Button
                type="button"
                size="sm"
                className="min-h-[40px] flex-1 touch-manipulation text-sm"
                onClick={handleSubmit}
                disabled={isUpdating || servedItems.length === 0}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    Guardar pedido
                    <Save className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={goNext}
                disabled={!canGoNext()}
                className="min-h-[40px] flex-1 touch-manipulation text-sm"
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
