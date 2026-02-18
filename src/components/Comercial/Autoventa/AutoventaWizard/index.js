'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useAutoventa } from '@/hooks/useAutoventa';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Step1ClientSelection from '../Step1ClientSelection';
import Step2QRScan from '../Step2QRScan';
import Step3Pricing from '../Step3Pricing';
import Step5Observations from '../Step5Observations';
import Step6Summary from '../Step6Summary';
import Step7Confirmation from '../Step7Confirmation';
import Step8PrintTicket from '../Step8PrintTicket';

const STEPS = [
  { id: 1, title: 'Cliente', description: 'Seleccione cliente y fechas' },
  { id: 2, title: 'Cajas', description: 'Escanea o pega códigos GS1-128' },
  { id: 3, title: 'Precios', description: 'Indique precios por producto' },
  { id: 4, title: 'Observaciones', description: 'Observaciones (opcional)' },
  { id: 5, title: 'Resumen', description: 'Revise el resumen' },
  { id: 6, title: 'Confirmar', description: 'Confirmar y crear autoventa' },
];

export default function AutoventaWizard() {
  const router = useRouter();
  const {
    state,
    setStep,
    setCustomer,
    addBox,
    removeBox,
    removeAllBoxes,
    setItemsFromBoxes,
    setItemPrice,
    setInvoiceRequired,
    setObservations,
    submitAutoventa,
    setCreatedOrder,
    reset,
    totalAmount,
  } = useAutoventa();

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
    // Paso 1: obligatorio seleccionar un cliente
    if (step === 1) return state.customerId != null && state.customerName != null;
    // Paso 2: obligatorio tener al menos una caja
    if (step === 2) return (state.boxes?.length ?? 0) >= 1;
    // Paso 3: obligatorio indicar precio > 0 para todos los productos
    if (step === 3) {
      const items = state.items ?? [];
      return items.length > 0 && items.every((i) => Number(i.unitPrice) > 0);
    }
    return step >= 4 && step <= 5;
  };

  const canGoToStep = (stepIndex) => {
    const s = stepIndex + 1;
    return s <= step;
  };

  const [step7Error, setStep7Error] = useState(null);
  const [step7Loading, setStep7Loading] = useState(false);

  const handleCancelStep7 = () => {
    setStep7Error(null);
    reset();
    setStep(1);
  };

  const handleStep7Submit = async () => {
    setStep7Error(null);
    setStep7Loading(true);
    try {
      await submitAutoventa();
    } catch (err) {
      setStep7Error(err?.message ?? 'Error al crear la autoventa.');
    } finally {
      setStep7Loading(false);
    }
  };

  const contentMaxWidth = [1, 2, 4].includes(step) ? 'max-w-[420px]' : 'max-w-[min(800px,95vw)]';

  const isSuccessScreen = step === 7;

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="shrink-0 flex flex-col items-center gap-3 pb-6 pt-2 sm:pb-4 sm:pt-0 px-2">
        <h2 className="text-lg font-semibold">
          {isSuccessScreen ? 'Autoventa creada' : 'Nueva autoventa'}
        </h2>
        {/* Stepper: solo en pasos 1-6; en pantalla de éxito no se muestra */}
        {!isSuccessScreen && (() => {
          const start = Math.max(1, step - 1);
          const end = Math.min(STEPS.length, step + 1);
          const visibleSteps = [];
          for (let n = start; n <= end; n++) visibleSteps.push(n);
          return (
            <div className="flex items-center gap-2 w-full max-w-[min(100%,280px)]">
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
                        'flex items-center justify-center min-w-10 h-10 shrink-0 rounded-full text-sm font-medium touch-manipulation transition-colors',
                        isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background',
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
                        className="flex-1 h-1.5 rounded-full min-w-[12px] overflow-hidden bg-muted"
                        initial={false}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="h-full rounded-full bg-primary/30"
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
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-medium text-foreground/80">Paso {step} de {STEPS.length}</span>
            {' · '}
            {STEPS[step - 1]?.description}
          </p>
        )}
      </div>

      <div className={cn('flex flex-col flex-1 min-h-0 overflow-y-auto w-full mx-auto px-4 pt-8 sm:pt-6', contentMaxWidth)}>
        {step === 1 && (
          <div className="flex flex-1 min-h-0 w-full justify-center overflow-y-auto">
            <Step1ClientSelection
              state={state}
              setCustomer={setCustomer}
            />
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-1 min-h-0 w-full justify-center overflow-y-auto">
            <Step2QRScan
              state={state}
              addBox={addBox}
              removeBox={removeBox}
              removeAllBoxes={removeAllBoxes}
            />
          </div>
        )}
        {step === 3 && (
          <div className="flex flex-1 min-h-0 w-full items-center justify-center overflow-y-auto">
            <Step3Pricing
              state={state}
              setItemPrice={setItemPrice}
              totalAmount={totalAmount}
            />
          </div>
        )}
        {step === 4 && (
          <div className="flex flex-1 min-h-0 w-full items-center justify-center overflow-y-auto">
            <Step5Observations
              state={state}
              setObservations={setObservations}
            />
          </div>
        )}
        {step === 5 && (
          <div className="flex flex-1 min-h-0 w-full items-center justify-center overflow-y-auto">
            <Step6Summary state={state} totalAmount={totalAmount} />
          </div>
        )}
        {step === 6 && (
          <div className="flex flex-1 min-h-0 w-full items-center justify-center overflow-y-auto">
            <Step7Confirmation
              state={state}
              totalAmount={totalAmount}
              setInvoiceRequired={setInvoiceRequired}
              onCancel={handleCancelStep7}
              error={step7Error}
              isSubmitting={step7Loading}
            />
          </div>
        )}
        {step === 7 && (
          <Step8PrintTicket
            state={state}
            onFinish={() => {
              reset();
              router.push('/comercial');
            }}
            onNew={() => {
              reset();
              setStep(1);
            }}
          />
        )}
      </div>

      {step < 7 && (
        <div className="shrink-0 flex gap-2 pt-4 pb-4 w-full justify-center px-4">
          <div className="flex gap-2 w-full max-w-[420px]">
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
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      Terminar
                      <ArrowRight className="h-4 w-4 ml-1.5" />
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
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
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
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
