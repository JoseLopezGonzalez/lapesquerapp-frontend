'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Loader2, PackageOpen, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useHideBottomNav } from '@/context/BottomNavContext';
import Step2QRScan from '@/components/Comercial/Autoventa/Step2QRScan';
import Step3Pricing from '@/components/Comercial/Autoventa/Step3Pricing';
import { useFieldOrder, useFieldOrderMutations } from '@/hooks/useFieldOrders';
import { useFieldProductsOptions } from '@/hooks/useFieldProductsOptions';
import { useFieldTaxesOptions } from '@/hooks/useFieldTaxesOptions';
import {
  aggregateItemsFromBoxes,
  buildInitialItems,
  buildBoxesSyncPayload,
  buildPlannedAdjustmentsPayload,
  buildPlannedExtrasPayload,
  calculateServedItemsTotal,
  detectExtraProductIds,
  validateServedItems,
} from '@/lib/field/fieldOrderExecution';
import { notify } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { ReadonlyOrderStep } from './OrderSteps/ReadonlyOrderStep';
import { ForecastStep } from './OrderSteps/ForecastStep';
import { WizardEmptyStep } from './OrderSteps/WizardEmptyStep';
import { OrderSummaryStep } from './OrderSteps/OrderSummaryStep';
import { OrderConfirmationStep } from './OrderSteps/OrderConfirmationStep';
import { OrderSuccessStep } from './OrderSteps/OrderSuccessStep';

const STEPS = [
  { id: 1, title: 'Pedido', description: 'Revisa el contexto del pedido operativo' },
  { id: 2, title: 'Previsión', description: 'Consulta los productos previstos del pedido' },
  { id: 3, title: 'Cajas', description: 'Escanea o pega códigos GS1-128' },
  { id: 4, title: 'Precios', description: 'Revisa o completa importes del resultado operativo' },
  { id: 5, title: 'Resumen', description: 'Comprueba el contenido final servido' },
  { id: 6, title: 'Confirmar', description: 'Revisa y guarda el pedido operativo' },
];

function FieldOrderExecutionSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex shrink-0 flex-col items-center gap-3 px-2 pt-2 pb-6 sm:pt-0 sm:pb-4">
        <Skeleton className="h-6 w-40" />
        <div className="flex w-full max-w-[280px] items-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <React.Fragment key={i}>
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              {i < 2 && <Skeleton className="h-1.5 flex-1 rounded-full" />}
            </React.Fragment>
          ))}
        </div>
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="mx-auto flex min-h-0 w-full max-w-[420px] flex-1 flex-col overflow-y-auto px-4 pt-8 sm:pt-6">
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
      <div className="flex w-full shrink-0 justify-center gap-2 px-4 pt-4 pb-4">
        <div className="flex w-full max-w-[420px] gap-2">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 flex-1 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export default function FieldOrderExecutionPage({ orderId }) {
  useHideBottomNav(true);
  const router = useRouter();
  const { data: order, isLoading, errorMessage } = useFieldOrder(orderId);
  const { updateOrder, isUpdating } = useFieldOrderMutations();
  const { data: productsOptionsData } = useFieldProductsOptions();
  const { data: taxOptionsData } = useFieldTaxesOptions();
  const loadProductOptions = useCallback(
    () => Promise.resolve(productsOptionsData ?? []),
    [productsOptionsData]
  );
  const [step, setStep] = useState(1);
  const [boxes, setBoxes] = useState([]);
  const [forecastItems, setForecastItems] = useState([]);
  const [servedItems, setServedItems] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [savedOrder, setSavedOrder] = useState(null);

  useEffect(() => {
    if (!order) return;
    const initialItems = buildInitialItems(order);
    const initialBoxes = (order?.pallets ?? [])
      .flatMap((pallet) => pallet?.boxes ?? [])
      .map((box) => ({
        id: box?.id ?? null,
        palletId: box?.palletId ?? null,
        productId: box?.product?.id ?? box?.productId ?? null,
        productName: box?.product?.name ?? box?.productName ?? '',
        lot: box?.lot ?? '',
        gs1128: box?.gs1128 ?? '',
        netWeight: box?.netWeight ?? 0,
        grossWeight: box?.grossWeight ?? null,
      }))
      .filter((box) => box.productId != null);
    setForecastItems(initialItems);
    setBoxes(initialBoxes);
    setServedItems(initialBoxes.length ? aggregateItemsFromBoxes(initialBoxes, order) : []);
    setStep(1);
    setIsSuccess(false);
    setSavedOrder(null);
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

  const totalAmount = useMemo(() => calculateServedItemsTotal(servedItems), [servedItems]);

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

  const setItemTax = (productId, taxId) => {
    setServedItems((current) =>
      current.map((item) =>
        Number(item.productId) === Number(productId)
          ? { ...item, taxId: taxId == null ? undefined : Number(taxId) }
          : item
      )
    );
  };

  if (isLoading) {
    return <FieldOrderExecutionSkeleton />;
  }

  if (errorMessage || !order) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<PackageOpen className="text-primary h-10 w-10" />}
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

    const extraProductIds = detectExtraProductIds(boxes, order);
    const plannedExtras = buildPlannedExtrasPayload(servedItems, extraProductIds);
    const plannedAdjustments = buildPlannedAdjustmentsPayload(servedItems, order);
    const boxesPayload = buildBoxesSyncPayload(boxes);

    try {
      const response = await notify.promise(
        updateOrder({
          orderId,
          payload: {
            boxes: boxesPayload,
            plannedExtras: plannedExtras.length ? plannedExtras : undefined,
            plannedAdjustments: plannedAdjustments.length ? plannedAdjustments : undefined,
            // items is optional; backend syncs execution from boxes
            items: servedItems,
          },
        }),
        {
          loading: {
            title: 'Guardando pedido',
            description: 'Actualizando el contenido operativo servido.',
          },
          success: {
            title: 'Pedido operativo actualizado',
            description: 'Los cambios se han guardado correctamente.',
          },
          error: (err) => ({
            title: 'No se pudo guardar el pedido',
            description: err?.message ?? 'Inténtalo de nuevo.',
          }),
        }
      );
      const updated = response?.data ?? response;
      setSavedOrder(updated ?? null);
      setIsSuccess(true);
    } catch {
      return;
    }
  };

  const contentMaxWidth = [1, 3, 6].includes(step) ? 'max-w-[420px]' : 'max-w-[min(800px,95vw)]';
  const showSuccess = isSuccess;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex shrink-0 flex-col items-center gap-3 px-2 pt-2 pb-6 sm:pt-0 sm:pb-4">
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
                <div className="flex w-full max-w-[min(100%,280px)] items-center gap-2">
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
                            'flex h-10 min-w-10 shrink-0 touch-manipulation items-center justify-center rounded-full text-sm font-medium transition-colors',
                            isCurrent &&
                              'bg-primary text-primary-foreground ring-primary/30 ring-offset-background ring-2 ring-offset-2',
                            isCompleted && !isCurrent && 'bg-primary/20 text-primary',
                            !isCurrent && !isCompleted && 'bg-muted text-muted-foreground',
                            !canGo && 'cursor-not-allowed opacity-60'
                          )}
                          aria-label={`Paso ${stepNum}: ${currentStep?.title}${!canGo ? ' (completa el paso anterior)' : ''}`}
                        >
                          {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                        </button>
                        {showBarAfter ? (
                          <div className="bg-muted h-1.5 min-w-[12px] flex-1 overflow-hidden rounded-full">
                            <div
                              className="bg-primary/30 h-full rounded-full transition-[width] duration-300 ease-out"
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
            <p className="text-muted-foreground text-center text-sm">
              <span className="text-foreground/80 font-medium">
                Paso {step} de {STEPS.length}
              </span>
              {' · '}
              {STEPS[step - 1]?.description}
            </p>
          </>
        ) : null}
      </div>

      <div
        className={cn(
          'mx-auto flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-4 pt-8 sm:pt-6',
          contentMaxWidth
        )}
      >
        {!showSuccess && step === 1 ? (
          <div className="flex min-h-0 w-full flex-1 justify-center overflow-y-auto">
            <ReadonlyOrderStep order={order} />
          </div>
        ) : null}
        {!showSuccess && step === 2 ? (
          <div className="flex min-h-0 w-full flex-1 items-start justify-center overflow-y-auto">
            <ForecastStep items={forecastItems} />
          </div>
        ) : null}
        {!showSuccess && step === 3 ? (
          <div className="flex min-h-0 w-full flex-1 justify-center overflow-y-auto">
            <Step2QRScan
              state={state}
              addBox={addBox}
              removeBox={removeBox}
              removeAllBoxes={removeAllBoxes}
              loadProductOptions={loadProductOptions}
            />
          </div>
        ) : null}
        {!showSuccess && step === 4 ? (
          <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-y-auto">
            {servedItems.length > 0 ? (
              <Step3Pricing
                state={state}
                setItemPrice={setItemPrice}
                taxOptions={taxOptionsData ?? []}
                setItemTax={setItemTax}
              />
            ) : (
              <WizardEmptyStep
                title="Sin productos registrados todavía"
                description="Cuando registres cajas en el lector podrás revisar aquí los precios del contenido real del pedido."
              />
            )}
          </div>
        ) : null}
        {!showSuccess && step === 5 ? (
          <div className="flex min-h-0 w-full flex-1 items-start justify-center overflow-y-auto">
            <OrderSummaryStep order={order} items={servedItems} totalAmount={totalAmount} />
          </div>
        ) : null}
        {!showSuccess && step === 6 ? (
          <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-y-auto">
            <OrderConfirmationStep totalAmount={totalAmount} />
          </div>
        ) : null}
        {showSuccess ? (
          <OrderSuccessStep
            order={savedOrder ?? order}
            onBackToOrders={() => router.push('/field/pedidos')}
            onBackToRoute={() => router.push(`/field/rutas/${order.routeId}`)}
          />
        ) : null}
      </div>

      {!showSuccess ? (
        <div className="flex w-full shrink-0 justify-center gap-2 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex w-full max-w-[420px] gap-2">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={goBack}
                className="min-h-[40px] flex-1 touch-manipulation text-sm"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Anterior
              </Button>
            ) : (
              <Button
                asChild
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[40px] flex-1 touch-manipulation text-sm"
              >
                <Link href="/field/pedidos">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
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
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    Guardar pedido
                    <Save className="ml-1.5 h-4 w-4" />
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
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
