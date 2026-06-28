'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notifications';
import { ApiError } from '@/lib/api/apiHelpers';
import { useHideBottomNav } from '@/context/BottomNavContext';
import { getFieldProductsOptions } from '@/services/fieldOperatorService';
import { useFieldOrderMutations } from '@/hooks/useFieldOrders';
import { useFieldAutoventa } from '@/hooks/useFieldAutoventa';
import FieldStep1ClientSelection from '@/components/Field/FieldStep1ClientSelection';
import Step2QRScan from '@/components/Comercial/Autoventa/Step2QRScan';
import Step3Pricing from '@/components/Comercial/Autoventa/Step3Pricing';
import Step5Observations from '@/components/Comercial/Autoventa/Step5Observations';
import Step6Summary from '@/components/Comercial/Autoventa/Step6Summary';
import Step7Confirmation from '@/components/Comercial/Autoventa/Step7Confirmation';
import Step8PrintTicket from '@/components/Comercial/Autoventa/Step8PrintTicket';

const STEPS = [
  { id: 1, title: 'Cliente', description: 'Seleccione cliente y fechas' },
  { id: 2, title: 'Cajas', description: 'Escanea o pega códigos GS1-128' },
  { id: 3, title: 'Precios', description: 'Indique precios por producto' },
  { id: 4, title: 'Observaciones', description: 'Observaciones (opcional)' },
  { id: 5, title: 'Resumen', description: 'Revise el resumen' },
  { id: 6, title: 'Confirmar', description: 'Confirmar y crear autoventa' },
];

export default function FieldAutoventaWizard() {
  useHideBottomNav(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createAutoventa } = useFieldOrderMutations();
  const {
    state,
    setStep,
    setCustomer,
    setNewCustomerName,
    addBox,
    removeBox,
    removeAllBoxes,
    setItemsFromBoxes,
    setItemPrice,
    setInvoiceRequired,
    setObservations,
    submitAutoventa,
    reset,
    totalAmount,
  } = useFieldAutoventa({
    createAutoventa,
    routeId: searchParams.get('routeId'),
    routeStopId: searchParams.get('routeStopId'),
    customerId: searchParams.get('customerId'),
  });

  const step = state.step;

  const goNext = () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setItemsFromBoxes();
      setStep(3);
      return;
    }
    if (step === 3) setStep(4);
    else if (step === 4) setStep(5);
    else if (step === 5) setStep(6);
  };

  const goBack = () => setStep(Math.max(1, step - 1));

  const canGoNext = () => {
    if (step === 1) {
      const hasExistingCustomer = state.customerId != null && state.customerName != null;
      const hasNewCustomer = Boolean(state.newCustomerName);
      return (hasExistingCustomer || hasNewCustomer) && state.entryDate && state.loadDate;
    }
    if (step === 2) return (state.boxes?.length ?? 0) >= 1;
    if (step === 3) {
      const items = state.items ?? [];
      return items.length > 0 && items.every((i) => Number(i.unitPrice) > 0);
    }
    return step >= 4 && step <= 5;
  };

  const [step7Loading, setStep7Loading] = useState(false);

  const handleCancelStep7 = () => {
    reset();
    setStep(1);
  };

  const handleStep7Submit = async () => {
    setStep7Loading(true);
    try {
      await submitAutoventa();
    } catch (err) {
      let description = err?.message ?? 'Error al crear la autoventa.';
      if (err instanceof ApiError && err.data) {
        const d = err.data;
        if (d?.userMessage) {
          description = d.userMessage;
        } else if (d?.errors && typeof d.errors === 'object') {
          const parts = Object.values(d.errors).flat().filter(Boolean);
          if (parts.length) description = parts.join(' ');
        } else if (d?.message) {
          description = d.message;
        }
      }
      notify.error({ title: 'Error al crear la autoventa', description }, { duration: 8000 });
    } finally {
      setStep7Loading(false);
    }
  };

  const contentMaxWidth = [1, 2, 4].includes(step) ? 'max-w-[420px]' : 'max-w-[min(800px,95vw)]';
  const isSuccessScreen = step === 7;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex shrink-0 flex-col items-center gap-3 px-2 pt-2 pb-6 sm:pt-0 sm:pb-4">
        <h2 className="text-lg font-semibold">
          {isSuccessScreen ? 'Autoventa creada' : 'Nueva autoventa'}
        </h2>
        {!isSuccessScreen &&
          (() => {
            const start = Math.max(1, step - 1);
            const end = Math.min(STEPS.length, step + 1);
            const visibleSteps = [];
            for (let n = start; n <= end; n++) visibleSteps.push(n);
            return (
              <div className="flex w-full max-w-[min(100%,280px)] items-center gap-2">
                {visibleSteps.map((stepNum, idx) => {
                  const s = STEPS[stepNum - 1];
                  const isCurrent = step === stepNum;
                  const isCompleted = step > stepNum;
                  const canGo = stepNum <= step;
                  const showBarAfter = idx < visibleSteps.length - 1;
                  const barFilled = step > stepNum;
                  return (
                    <React.Fragment key={stepNum}>
                      <motion.button
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
                        aria-label={`Paso ${stepNum}: ${s?.title}${!canGo ? ' (completa el paso anterior)' : ''}`}
                        initial={false}
                        animate={{
                          scale: isCurrent ? 1.05 : 1,
                          transition: { type: 'spring', stiffness: 400, damping: 25 },
                        }}
                        whileTap={{ scale: 0.96 }}
                      >
                        <AnimatePresence mode="wait">
                          {isCompleted ? (
                            <motion.span
                              key="check"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            >
                              <Check className="h-4 w-4" />
                            </motion.span>
                          ) : (
                            <motion.span
                              key="num"
                              initial={{ scale: 0.8, opacity: 0.8 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            >
                              {stepNum}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                      {showBarAfter && (
                        <motion.div
                          className="bg-muted h-1.5 min-w-[12px] flex-1 overflow-hidden rounded-full"
                          initial={false}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            className="bg-primary/30 h-full rounded-full"
                            initial={false}
                            animate={{ width: barFilled ? '100%' : '0%' }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                          />
                        </motion.div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })()}
        {!isSuccessScreen && (
          <p className="text-muted-foreground text-center text-sm">
            <span className="text-foreground/80 font-medium">
              Paso {step} de {STEPS.length}
            </span>
            {' · '}
            {STEPS[step - 1]?.description}
          </p>
        )}
      </div>

      <div
        className={cn(
          'mx-auto flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-4 pt-8 sm:pt-6',
          contentMaxWidth
        )}
      >
        {step === 1 && (
          <div className="flex min-h-0 w-full flex-1 justify-center overflow-y-auto">
            <FieldStep1ClientSelection
              state={state}
              setCustomer={setCustomer}
              setNewCustomerName={setNewCustomerName}
            />
          </div>
        )}
        {step === 2 && (
          <div className="flex min-h-0 w-full flex-1 justify-center overflow-y-auto">
            <Step2QRScan
              state={state}
              addBox={addBox}
              removeBox={removeBox}
              removeAllBoxes={removeAllBoxes}
              loadProductOptions={getFieldProductsOptions}
            />
          </div>
        )}
        {step === 3 && (
          <div className="flex min-h-0 w-full flex-1 items-start justify-center overflow-y-auto">
            <Step3Pricing state={state} setItemPrice={setItemPrice} totalAmount={totalAmount} />
          </div>
        )}
        {step === 4 && (
          <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-y-auto">
            <Step5Observations state={state} setObservations={setObservations} />
          </div>
        )}
        {step === 5 && (
          <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-y-auto">
            <Step6Summary state={state} totalAmount={totalAmount} />
          </div>
        )}
        {step === 6 && (
          <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-y-auto">
            <Step7Confirmation
              state={state}
              totalAmount={totalAmount}
              setInvoiceRequired={setInvoiceRequired}
              onCancel={handleCancelStep7}
              isSubmitting={step7Loading}
            />
          </div>
        )}
        {step === 7 && (
          <Step8PrintTicket
            state={state}
            onFinish={() => {
              reset();
              router.push('/field');
            }}
            onNew={() => {
              reset();
              setStep(1);
            }}
          />
        )}
      </div>

      {step < 7 && (
        <div className="flex w-full shrink-0 justify-center gap-2 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex w-full max-w-[420px] gap-2">
            {step === 6 ? (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="min-h-[40px] flex-1 touch-manipulation text-sm"
                  onClick={handleCancelStep7}
                  disabled={step7Loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="min-h-[40px] flex-1 touch-manipulation text-sm"
                  onClick={handleStep7Submit}
                  disabled={step7Loading}
                >
                  {step7Loading ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      Terminar
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
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
                  <div className="flex-1" />
                )}
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
