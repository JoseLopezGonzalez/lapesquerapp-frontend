'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notifications';
import { getFieldProductsOptions } from '@/services/fieldOperatorService';
import { useFieldOrderMutations } from '@/hooks/useFieldOrders';
import { useFieldCustomerOptions } from '@/hooks/useFieldOptions';
import Step2QRScan from '@/components/Comercial/Autoventa/Step2QRScan';
import Step3Pricing from '@/components/Comercial/Autoventa/Step3Pricing';
import Step5Observations from '@/components/Comercial/Autoventa/Step5Observations';
import Step6Summary from '@/components/Comercial/Autoventa/Step6Summary';
import Step7Confirmation from '@/components/Comercial/Autoventa/Step7Confirmation';
import Step8PrintTicket from '@/components/Comercial/Autoventa/Step8PrintTicket';
import Loader from '@/components/Utilities/Loader';

const STEPS = [
  { id: 1, title: 'Cliente', description: 'Selecciona cliente operativo o crea uno nuevo' },
  { id: 2, title: 'Cajas', description: 'Escanea o pega códigos GS1-128' },
  { id: 3, title: 'Precios', description: 'Indica precios por producto' },
  { id: 4, title: 'Observaciones', description: 'Observaciones opcionales' },
  { id: 5, title: 'Resumen', description: 'Revisa el resumen' },
  { id: 6, title: 'Confirmar', description: 'Confirmar y crear autoventa' },
];

function aggregateItemsFromBoxes(boxes) {
  const byProduct = new Map();
  for (const box of boxes) {
    const id = Number(box.productId);
    if (!byProduct.has(id)) {
      byProduct.set(id, {
        productId: id,
        productName: box.productName ?? '',
        boxesCount: 0,
        totalWeight: 0,
        unitPrice: 0,
        subtotal: 0,
      });
    }
    const row = byProduct.get(id);
    row.boxesCount += 1;
    row.totalWeight += Number(box.netWeight) || 0;
  }
  return Array.from(byProduct.values()).map((item) => ({
    ...item,
    subtotal: (Number(item.totalWeight) || 0) * (Number(item.unitPrice) || 0),
  }));
}

function FieldClientSelection({ state, setCustomer, setNewCustomerName }) {
  const { options: customerOptions, isLoading: loadingCustomers } = useFieldCustomerOptions();
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [draftCustomerName, setDraftCustomerName] = useState(state.newCustomerName ?? '');

  const selectedId = state.customerId != null ? String(state.customerId) : null;

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-4">
      <Button type="button" variant="outline" className="w-full" size="lg" onClick={() => setNewCustomerOpen(true)}>
        <Plus className="mr-2 h-5 w-5" />
        Cliente nuevo para esta autoventa
      </Button>

      <div className="rounded-xl border">
        {loadingCustomers ? (
          <div className="flex min-h-[220px] items-center justify-center"><Loader /></div>
        ) : (
          <div className="max-h-[360px] space-y-2 overflow-auto p-3">
            {customerOptions.map((option) => {
              const isSelected = selectedId === String(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setNewCustomerName('');
                    setCustomer(isSelected ? null : option.value, isSelected ? null : option.label);
                  }}
                  className={cn(
                    'w-full rounded-xl border-2 px-4 py-3 text-left transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40'
                  )}
                >
                  <span className="font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cliente nuevo</DialogTitle>
            <DialogDescription>
              Este cliente se creará al confirmar la autoventa y quedará operativo para ti.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-customer-name">Nombre</Label>
            <Input
              id="new-customer-name"
              value={draftCustomerName}
              onChange={(event) => setDraftCustomerName(event.target.value)}
              placeholder="Nombre del cliente"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCustomerOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                const trimmed = draftCustomerName.trim();
                if (!trimmed) return;
                setCustomer(null, trimmed);
                setNewCustomerName(trimmed);
                setNewCustomerOpen(false);
              }}
            >
              Usar este cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FieldAutoventaWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createAutoventa, isCreatingAutoventa } = useFieldOrderMutations();
  const [state, setState] = useState({
    step: 1,
    customerId: searchParams.get('customerId'),
    customerName: null,
    newCustomerName: '',
    entryDate: new Date().toISOString().slice(0, 10),
    loadDate: new Date().toISOString().slice(0, 10),
    boxes: [],
    items: [],
    invoiceRequired: false,
    observations: '',
    createdOrderId: null,
    createdOrder: null,
    routeId: searchParams.get('routeId'),
    routeStopId: searchParams.get('routeStopId'),
  });

  const step = state.step;
  const totalAmount = useMemo(
    () => (state.items ?? []).reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0),
    [state.items]
  );

  const setStep = (nextStep) => setState((current) => ({ ...current, step: nextStep }));
  const setCustomer = (customerId, customerName) => setState((current) => ({
    ...current,
    customerId: customerId ?? null,
    customerName: customerName ?? null,
  }));
  const setNewCustomerName = (value) => setState((current) => ({
    ...current,
    newCustomerName: value,
    customerId: value ? null : current.customerId,
  }));
  const addBox = (box) => setState((current) => ({ ...current, boxes: [...current.boxes, box] }));
  const removeBox = (index) => setState((current) => {
    const boxes = current.boxes.filter((_, idx) => idx !== index);
    return { ...current, boxes, items: aggregateItemsFromBoxes(boxes) };
  });
  const removeAllBoxes = () => setState((current) => ({ ...current, boxes: [], items: [] }));
  const setItemsFromBoxes = () => setState((current) => ({ ...current, items: aggregateItemsFromBoxes(current.boxes) }));
  const setItemPrice = (productId, unitPrice) => setState((current) => ({
    ...current,
    items: current.items.map((item) =>
      Number(item.productId) === Number(productId)
        ? { ...item, unitPrice: Number(unitPrice) || 0, subtotal: (Number(item.totalWeight) || 0) * (Number(unitPrice) || 0) }
        : item
    ),
  }));
  const setInvoiceRequired = (value) => setState((current) => ({ ...current, invoiceRequired: Boolean(value) }));
  const setObservations = (value) => setState((current) => ({ ...current, observations: value ?? '' }));
  const reset = () => setState((current) => ({
    ...current,
    step: 1,
    customerId: null,
    customerName: null,
    newCustomerName: '',
    boxes: [],
    items: [],
    invoiceRequired: false,
    observations: '',
    createdOrderId: null,
    createdOrder: null,
  }));

  const canGoNext = () => {
    if (step === 1) return Boolean(state.customerId || state.newCustomerName);
    if (step === 2) return (state.boxes?.length ?? 0) >= 1;
    if (step === 3) return (state.items ?? []).length > 0 && state.items.every((item) => Number(item.unitPrice) > 0);
    return step >= 4 && step <= 5;
  };

  const goNext = () => {
    if (step === 1) return setStep(2);
    if (step === 2) {
      setItemsFromBoxes();
      return setStep(3);
    }
    if (step === 3) return setStep(4);
    if (step === 4) return setStep(5);
    if (step === 5) return setStep(6);
  };

  const goBack = () => setStep(Math.max(1, step - 1));

  const handleSubmit = async () => {
    try {
      const payload = {
        customer: state.customerId ? Number(state.customerId) : undefined,
        newCustomerName: state.newCustomerName || undefined,
        entryDate: state.entryDate,
        loadDate: state.loadDate,
        invoiceRequired: Boolean(state.invoiceRequired),
        observations: state.observations || undefined,
        routeId: state.routeId ? Number(state.routeId) : undefined,
        routeStopId: state.routeStopId ? Number(state.routeStopId) : undefined,
        items: (state.items ?? []).map((item) => ({
          productId: Number(item.productId),
          boxesCount: Number(item.boxesCount) || 0,
          totalWeight: Number(item.totalWeight) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          subtotal: Number(item.subtotal) || 0,
          tax: item.tax != null ? Number(item.tax) : undefined,
        })),
        boxes: (state.boxes ?? []).map((box) => ({
          productId: Number(box.productId),
          lot: box.lot || undefined,
          netWeight: Number(box.netWeight) || 0,
          grossWeight: box.grossWeight != null ? Number(box.grossWeight) : undefined,
          gs1128: box.gs1128 || undefined,
        })),
      };

      const response = await notify.promise(createAutoventa(payload), {
        loading: { title: 'Creando autoventa', description: 'Registrando el pedido operativo y sus cajas.' },
        success: { title: 'Autoventa creada', description: 'La operación se ha registrado correctamente.' },
        error: (err) => ({
          title: 'Error al crear la autoventa',
          description: err?.message ?? 'Inténtalo de nuevo.',
        }),
      });
      const order = response?.data ?? response;
      setState((current) => ({
        ...current,
        createdOrderId: order?.id ?? null,
        createdOrder: order ?? null,
        step: 7,
      }));
    } catch (err) {
      return;
    }
  };

  const contentMaxWidth = [1, 2, 4].includes(step) ? 'max-w-[420px]' : 'max-w-[min(800px,95vw)]';

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex shrink-0 flex-col items-center gap-3 px-2 pb-6 pt-2 sm:pb-4 sm:pt-0">
        <h2 className="text-lg font-semibold">{step === 7 ? 'Autoventa creada' : 'Nueva autoventa operativa'}</h2>
        {step < 7 && (
          <>
            <div className="flex items-center gap-2 w-full max-w-[min(100%,280px)]">
              {STEPS.map((stepDef) => {
                const isCurrent = step === stepDef.id;
                const isCompleted = step > stepDef.id;
                return (
                  <motion.div
                    key={stepDef.id}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium',
                      isCurrent && 'bg-primary text-primary-foreground',
                      isCompleted && !isCurrent && 'bg-primary/20 text-primary',
                      !isCurrent && !isCompleted && 'bg-muted text-muted-foreground'
                    )}
                    animate={{ scale: isCurrent ? 1.05 : 1 }}
                  >
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.span key="check"><Check className="h-4 w-4" /></motion.span>
                      ) : (
                        <motion.span key="num">{stepDef.id}</motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">Paso {step} de {STEPS.length}</span> · {STEPS[step - 1]?.description}
            </p>
          </>
        )}
      </div>

      <div className={cn('mx-auto flex w-full flex-1 min-h-0 flex-col overflow-y-auto px-4 pt-8 sm:pt-6', contentMaxWidth)}>
        {step === 1 && <FieldClientSelection state={state} setCustomer={setCustomer} setNewCustomerName={setNewCustomerName} />}
        {step === 2 && (
          <Step2QRScan
            state={state}
            addBox={addBox}
            removeBox={removeBox}
            removeAllBoxes={removeAllBoxes}
            loadProductOptions={getFieldProductsOptions}
          />
        )}
        {step === 3 && <Step3Pricing state={state} setItemPrice={setItemPrice} />}
        {step === 4 && <Step5Observations state={state} setObservations={setObservations} />}
        {step === 5 && <Step6Summary state={state} totalAmount={totalAmount} />}
        {step === 6 && (
          <Step7Confirmation
            state={state}
            totalAmount={totalAmount}
            setInvoiceRequired={setInvoiceRequired}
          />
        )}
        {step === 7 && (
          <Step8PrintTicket
            state={state}
            onFinish={() => {
              reset();
              router.push('/field');
            }}
            onNew={() => reset()}
          />
        )}
      </div>

      {step < 7 && (
        <div className="shrink-0 flex gap-2 px-4 pb-4 pt-4 w-full justify-center">
          <div className="flex w-full max-w-[420px] gap-2">
            {step === 6 ? (
              <>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(5)}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Atrás
                </Button>
                <Button type="button" className="flex-1" onClick={handleSubmit} disabled={isCreatingAutoventa}>
                  {isCreatingAutoventa ? (
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
                  <Button type="button" variant="outline" className="flex-1" onClick={goBack}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Anterior
                  </Button>
                ) : (
                  <div className="flex-1" />
                )}
                <Button type="button" className="flex-1" onClick={goNext} disabled={!canGoNext()}>
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
