'use client';

import { useRouter } from 'next/navigation';
import { useAutoventa } from '@/hooks/useAutoventa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Step1ClientSelection from '../Step1ClientSelection';
import Step2QRScan from '../Step2QRScan';
import Step3Pricing from '../Step3Pricing';
import Step4Invoice from '../Step4Invoice';
import Step5Observations from '../Step5Observations';
import Step6Summary from '../Step6Summary';
import Step7Confirmation from '../Step7Confirmation';
import Step8PrintTicket from '../Step8PrintTicket';

const STEPS = 8;

export default function AutoventaWizard() {
  const router = useRouter();
  const {
    state,
    setStep,
    setCustomer,
    setDates,
    addBox,
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
    else if (step === 6) setStep(7);
  };

  const goBack = () => setStep(Math.max(1, step - 1));

  const canGoNext = () => {
    if (step === 1) return state.customerId != null && state.customerName != null && state.entryDate && state.loadDate;
    if (step === 2) return (state.boxes?.length ?? 0) >= 1;
    if (step === 3) {
      const items = state.items ?? [];
      return items.length > 0 && items.every((i) => Number(i.unitPrice) >= 0);
    }
    return step >= 4 && step <= 6;
  };

  const handleCancelStep7 = () => {
    reset();
    setStep(1);
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 gap-4">
      <h1 className="text-xl font-semibold">Autoventa</h1>

      <div className="flex gap-1 justify-center">
        {Array.from({ length: STEPS }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`h-2 w-2 rounded-full transition-colors ${
              s === step ? 'bg-primary' : s < step ? 'bg-primary/50' : 'bg-muted'
            }`}
            aria-current={s === step ? 'step' : undefined}
          />
        ))}
      </div>

      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader className="shrink-0" />
        <CardContent className="flex-1 min-h-0 overflow-auto">
          {step === 1 && (
            <Step1ClientSelection
              state={state}
              setCustomer={setCustomer}
              setDates={setDates}
            />
          )}
          {step === 2 && (
            <Step2QRScan
              state={state}
              addBox={addBox}
              removeAllBoxes={removeAllBoxes}
            />
          )}
          {step === 3 && (
            <Step3Pricing
              state={state}
              setItemPrice={setItemPrice}
              totalAmount={totalAmount}
            />
          )}
          {step === 4 && (
            <Step4Invoice
              state={state}
              setInvoiceRequired={setInvoiceRequired}
            />
          )}
          {step === 5 && (
            <Step5Observations
              state={state}
              setObservations={setObservations}
            />
          )}
          {step === 6 && (
            <Step6Summary state={state} totalAmount={totalAmount} />
          )}
          {step === 7 && (
            <Step7Confirmation
              state={state}
              totalAmount={totalAmount}
              submitAutoventa={submitAutoventa}
              setCreatedOrder={setCreatedOrder}
              onCancel={handleCancelStep7}
            />
          )}
          {step === 8 && (
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
        </CardContent>
      </Card>

      <div className="flex justify-between gap-2 shrink-0">
        {step > 1 && step < 7 && (
          <Button variant="outline" onClick={goBack}>
            Atrás
          </Button>
        )}
        {step < 7 && (
          <div className="flex-1 flex justify-end">
            <Button onClick={goNext} disabled={!canGoNext()}>
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
