'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Pencil,
  Search,
  Fish,
  Truck,
  Package,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Loader from '@/components/Utilities/Loader';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { calculateNetWeight } from '@/helpers/receptionCalculations';
import { cn } from '@/lib/utils';
import {
  useOperarioCeboForm,
  STEPS_CEBO,
  getQuickPickProductIdsCebo,
} from '@/hooks/useOperarioCeboForm';

const TARE_OPTIONS = [
  { value: '3', label: '3kg' },
  { value: '2.7', label: '2,70kg' },
  { value: '1.4', label: '1,40kg' },
  { value: '1.5', label: '1,50kg' },
];

export default function OperarioCreateCeboForm({
  onSuccess,
  onCancel,
  storeId = null,
}) {
  const form = useOperarioCeboForm({ onSuccess });
  const {
    step,
    setStep,
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    errors,
    isSubmitting,
    fields,
    remove,
    speciesOptions,
    speciesLoading,
    speciesValue,
    supplierOptions,
    suppliersLoading,
    supplierValue,
    suppliersByLetter,
    productOptionsBySpecies,
    productsBySpeciesLoading,
    editingLineIndex,
    setEditingLineIndex,
    lineDialogOpen,
    lineDialogStep,
    setLineDialogStep,
    productStepView,
    setProductStepView,
    formIndex,
    LINE_DIALOG_STEPS,
    handleCreate,
    goNext,
    goBack,
    openAddLineDialog,
    handleCloseLineDialog,
    handleOpenLineDialog,
    handleLineDialogNext,
    watchedDetails,
  } = form;

  useEffect(() => {
    if (step === 0 && speciesValue != null && !speciesLoading) {
      const id = `species-opt-${speciesValue}`;
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [step, speciesValue, speciesLoading]);

  const getProductLabel = (val) => {
    if (val == null) return '-';
    const id = typeof val === 'object' ? val?.id ?? val?.value : val;
    const opt = (productOptionsBySpecies || []).find(
      (o) => String(o.value) === String(id)
    );
    return opt?.label ?? String(id);
  };

  const getTareLabel = (val) =>
    TARE_OPTIONS.find((o) => o.value === val)?.label ?? val ?? '-';

  const confirmedLines = watchedDetails
    .map((d, i) => ({ d, i }))
    .filter(
      ({ d, i }) =>
        i !== formIndex &&
        d?.product &&
        (parseFloat(d?.grossWeight) || 0) > 0 &&
        calculateNetWeight(d?.grossWeight, d?.boxes ?? 0, d?.tare ?? '3') > 0
    );

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="shrink-0 flex flex-col items-center gap-3 pb-4">
        <h2 className="text-lg font-semibold">Nueva salida de cebo</h2>
        <div className="flex items-center gap-2 w-full max-w-[420px]">
          {STEPS_CEBO.map((s, i) => {
            const canGoToStep =
              i === 0 ||
              (i === 1 && speciesValue != null) ||
              (i >= 2 && speciesValue != null && supplierValue != null);
            return (
            <React.Fragment key={s.id}>
              <motion.button
                type="button"
                onClick={() => canGoToStep && setStep(i)}
                disabled={!canGoToStep}
                className={cn(
                  'flex items-center justify-center min-w-[2.75rem] h-11 rounded-full text-sm font-medium touch-manipulation',
                  step === i
                    ? 'bg-primary text-primary-foreground'
                    : step > i
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground',
                  !canGoToStep && 'cursor-not-allowed opacity-60'
                )}
                aria-label={`Paso ${i + 1}: ${s.title}${!canGoToStep ? ' (completa el paso anterior)' : ''}`}
                initial={false}
                animate={{
                  scale: step === i ? 1.08 : 1,
                  transition: { type: 'spring', stiffness: 400, damping: 25 },
                }}
                whileTap={{ scale: 0.96 }}
              >
                <AnimatePresence mode="wait">
                  {step > i ? (
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
                      {i + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              {i < STEPS_CEBO.length - 1 && (
                <motion.div
                  className="flex-1 h-1.5 rounded-full min-w-[1rem] overflow-hidden bg-muted"
                  initial={false}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full rounded-full bg-primary/30"
                    initial={false}
                    animate={{
                      width: step > i ? '100%' : '0%',
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </motion.div>
              )}
            </React.Fragment>
          );
          })}
        </div>
        <p className="text-sm text-muted-foreground">{STEPS_CEBO[step].description}</p>
        {step === 3 && (
          <Button
            type="button"
            variant="default"
            size="lg"
            className="w-full max-w-[420px] min-h-[48px] gap-2 touch-manipulation"
            onClick={openAddLineDialog}
          >
            <Plus className="h-5 w-5" />
            Añadir línea
          </Button>
        )}
      </div>

      <form
        onSubmit={handleSubmit(handleCreate)}
        className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto"
      >
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-6 w-full flex-1 min-h-0',
            step === 3 ? 'max-w-[min(1400px,95vw)] mx-auto' : 'max-w-[420px] mx-auto'
          )}
        >
          {step === 0 && (
            <div
              className="w-full max-w-[420px] h-[min(480px,72vh)] rounded-lg border overflow-y-auto overflow-x-hidden"
              style={{ minHeight: 0 }}
            >
              <div className="flex flex-col gap-2 p-3 pr-4">
                {speciesLoading ? (
                  <div className="flex items-center justify-center min-h-[min(400px,65vh)] w-full">
                    <Loader />
                  </div>
                ) : speciesOptions.length === 0 ? (
                  <div className="flex items-center justify-center min-h-[min(400px,65vh)] w-full py-6">
                    <EmptyState
                      icon={<Fish className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                      title="No hay especies"
                      description="No hay especies disponibles. Contacta con el administrador para dar de alta especies."
                    />
                  </div>
                ) : (
                  speciesOptions.map((opt, idx) => {
                    const isSelected =
                      speciesValue != null &&
                      String(opt.value) === String(speciesValue);
                    return (
                      <button
                        id={isSelected ? `species-opt-${opt.value}` : undefined}
                        key={opt.value ?? idx}
                        type="button"
                        onClick={() =>
                          setValue(
                            'species',
                            isSelected ? null : opt.value,
                            { shouldValidate: true }
                          )
                        }
                        className={cn(
                          'w-full text-left rounded-lg border-2 px-4 py-3 transition-colors touch-manipulation min-h-[56px] flex flex-col justify-center gap-0.5',
                          isSelected
                            ? 'border-primary border-l-4 bg-primary/5'
                            : 'border-border hover:border-primary/40 hover:bg-muted/50'
                        )}
                      >
                        <span className="font-medium text-foreground">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div
              className="w-full max-w-[420px] h-[min(480px,72vh)] rounded-lg border overflow-y-auto overflow-x-hidden"
              style={{ minHeight: 0 }}
            >
              <div className="flex flex-col gap-2 p-3 pr-4">
                {suppliersLoading ? (
                  <div className="flex items-center justify-center min-h-[min(400px,65vh)] w-full">
                    <Loader />
                  </div>
                ) : suppliersByLetter.length === 0 ? (
                  <div className="flex items-center justify-center min-h-[min(400px,65vh)] w-full py-6">
                    <EmptyState
                      icon={<Truck className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                      title="No hay proveedores"
                      description="No hay proveedores disponibles. Contacta con el administrador para dar de alta proveedores."
                    />
                  </div>
                ) : (
                  suppliersByLetter.map(({ letter, options }) => (
                    <div key={letter} className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-2 first:pt-0">
                        {letter}
                      </p>
                      {options.map((opt, idx) => {
                        const optVal = opt.value;
                        const isSelected =
                          supplierValue != null &&
                          (typeof optVal === 'object'
                            ? optVal?.id === supplierValue?.id ||
                              optVal?.value === supplierValue
                            : String(optVal) === String(supplierValue));
                        return (
                          <button
                            key={optVal?.id ?? optVal ?? idx}
                            type="button"
                            onClick={() =>
                              setValue(
                                'supplier',
                                isSelected ? null : opt.value,
                                { shouldValidate: true }
                              )
                            }
                            className={cn(
                              'w-full text-left rounded-lg border-2 px-4 py-3 transition-colors touch-manipulation min-h-[56px] flex flex-col justify-center gap-0.5',
                              isSelected
                                ? 'border-primary border-l-4 bg-primary/5'
                                : 'border-border hover:border-primary/40 hover:bg-muted/50'
                            )}
                          >
                            <span className="font-medium text-foreground">
                              {opt.label}
                            </span>
                            {opt.secondaryLabel && (
                              <span className="text-sm text-muted-foreground">
                                {opt.secondaryLabel}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="w-full max-w-[420px]">
              <Textarea
                {...register('notes')}
                placeholder="Observaciones / Lonja (opcional)..."
                className="w-full min-h-[120px] touch-manipulation text-base"
              />
            </div>
          )}

          {step === 3 && (
            <div className="w-full space-y-6">
              {confirmedLines.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          Artículo
                        </TableHead>
                        <TableHead className="w-20 text-center whitespace-nowrap">
                          Cajas
                        </TableHead>
                        <TableHead className="w-24 whitespace-nowrap">
                          Tara
                        </TableHead>
                        <TableHead className="w-28 text-right whitespace-nowrap">
                          Peso bruto (kg)
                        </TableHead>
                        <TableHead className="w-28 text-right whitespace-nowrap">
                          Peso neto (kg)
                        </TableHead>
                        <TableHead className="w-20 whitespace-nowrap" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {confirmedLines.map(({ d, i }) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            {getProductLabel(d?.product)}
                          </TableCell>
                          <TableCell className="text-center">
                            {d?.boxes != null && d?.boxes !== ''
                              ? parseInt(d.boxes, 10)
                              : 0}
                          </TableCell>
                          <TableCell>
                            {(d?.boxes != null && d?.boxes !== '' && parseInt(d.boxes, 10) > 0)
                              ? getTareLabel(d?.tare)
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {parseFloat(d?.grossWeight) > 0
                              ? parseFloat(d.grossWeight).toFixed(2)
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {(() => {
                              const net = calculateNetWeight(
                                d?.grossWeight,
                                d?.boxes ?? 0,
                                d?.tare ?? '3'
                              );
                              return net > 0 ? net.toFixed(2) : '-';
                            })()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 touch-manipulation"
                                onClick={() => handleOpenLineDialog(i)}
                                aria-label="Editar línea"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive touch-manipulation"
                                onClick={() => {
                                  remove(i);
                                  if (
                                    editingLineIndex !== null &&
                                    i < editingLineIndex
                                  ) {
                                    setEditingLineIndex(editingLineIndex - 1);
                                  }
                                }}
                                aria-label="Quitar línea"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-6 w-full min-h-[min(260px,40vh)] rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 py-10 px-6">
                  <div className="rounded-full bg-muted border border-border p-4">
                    <Package className="h-14 w-14 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Ninguna línea añadida</h3>
                    <p className="text-sm text-muted-foreground max-w-[280px]">
                      Añade artículo, cajas, tara y peso bruto para crear la salida de cebo.
                    </p>
                  </div>
                </div>
              )}

              <Dialog
                open={lineDialogOpen}
                onOpenChange={(open) => !open && handleCloseLineDialog()}
              >
                <DialogContent
                  className="sm:max-w-md flex flex-col gap-4 min-h-[420px]"
                  hideClose
                >
                  <div className="text-center space-y-1">
                    <DialogTitle className="text-xl font-semibold">
                      {LINE_DIALOG_STEPS[lineDialogStep]?.title ?? 'Línea'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      {LINE_DIALOG_STEPS[lineDialogStep]?.description ?? ''}
                    </DialogDescription>
                  </div>
                  <div className="min-h-[220px] py-4 flex flex-col items-center justify-center w-full flex-1">
                    {lineDialogStep === 0 && (
                      <Controller
                        name={`details.${formIndex}.product`}
                        control={control}
                        rules={{ required: 'Seleccione producto' }}
                        render={({ field: { onChange, value } }) => {
                          const productValue =
                            typeof value === 'object'
                              ? value?.id ?? value?.value
                              : value;
                          const quickPickIds = getQuickPickProductIdsCebo(
                            speciesValue,
                            productOptionsBySpecies
                          );
                          const quickPickOpts = quickPickIds
                            .map((id) =>
                              productOptionsBySpecies?.find(
                                (o) => String(o.value) === id
                              )
                            )
                            .filter(Boolean);

                          if (productStepView === 'search') {
                            return (
                              <div className="w-full flex flex-col gap-2 flex-1 min-h-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="self-start -ml-1 touch-manipulation"
                                  onClick={() => setProductStepView('quick')}
                                >
                                  <ArrowLeft className="h-4 w-4 mr-1" />
                                  Volver
                                </Button>
                                <div
                                  className="flex-1 min-h-[200px] max-h-[min(320px,50vh)] rounded-lg border overflow-y-auto overflow-x-hidden"
                                  style={{ minHeight: 0 }}
                                >
                                  <div className="flex flex-col gap-2 p-3 pr-4">
                                    {productsBySpeciesLoading ? (
                                      <div className="flex items-center justify-center min-h-[200px] w-full">
                                        <Loader />
                                      </div>
                                    ) : (productOptionsBySpecies || []).length ===
                                      0 ? (
                                      <div className="flex items-center justify-center min-h-[200px] w-full py-6">
                                        <EmptyState
                                          icon={<Package className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                          title="No hay productos para esta especie"
                                          description="No hay productos asociados a la especie seleccionada. Contacta con el administrador."
                                        />
                                      </div>
                                    ) : (
                                      (productOptionsBySpecies || []).map(
                                        (opt, idx) => {
                                          const isSelected =
                                            productValue != null &&
                                            String(opt.value) ===
                                              String(productValue);
                                          return (
                                            <button
                                              key={opt.value ?? idx}
                                              type="button"
                                              onClick={() => onChange(opt.value)}
                                              className={cn(
                                                'w-full text-left rounded-lg border-2 px-4 py-3 transition-colors touch-manipulation min-h-[56px] flex flex-col justify-center',
                                                isSelected
                                                  ? 'border-primary border-l-4 bg-primary/5'
                                                  : 'border-border hover:border-primary/40 hover:bg-muted/50'
                                              )}
                                            >
                                              <span className="font-medium text-foreground">
                                                {opt.label}
                                              </span>
                                            </button>
                                          );
                                        }
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="w-full space-y-3">
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full min-h-[44px] touch-manipulation"
                                onClick={() => setProductStepView('search')}
                              >
                                <Search className="h-4 w-4 mr-2" />
                                Buscar más
                              </Button>
                              <div className="flex flex-col gap-2">
                                {quickPickOpts.map((opt) => {
                                  const isSelected =
                                    productValue != null &&
                                    String(opt.value) === String(productValue);
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => onChange(opt.value)}
                                      className={cn(
                                        'w-full text-left rounded-lg border-2 px-4 py-3 transition-colors touch-manipulation min-h-[52px] flex items-center',
                                        isSelected
                                          ? 'border-primary border-l-4 bg-primary/5'
                                          : 'border-border hover:border-primary/40 hover:bg-muted/50'
                                      )}
                                    >
                                      <span className="font-medium text-foreground">
                                        {opt.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              {errors.details?.[formIndex]?.product && (
                                <p className="text-xs text-destructive text-center">
                                  {
                                    errors.details[formIndex].product.message
                                  }
                                </p>
                              )}
                            </div>
                          );
                        }}
                      />
                    )}
                    {lineDialogStep === 1 && (
                      <div className="w-full flex flex-col items-center gap-4">
                        <div className="flex items-center gap-4 justify-center">
                          <Button
                            type="button"
                            variant="default"
                            size="lg"
                            className="h-16 w-16 shrink-0 p-0 touch-manipulation text-4xl font-bold"
                            onClick={() => {
                              const v = parseInt(watch(`details.${formIndex}.boxes`), 10);
                              const current = Number.isNaN(v) ? 0 : v;
                              if (current > 0)
                                setValue(`details.${formIndex}.boxes`, current - 1);
                            }}
                          >
                            −
                          </Button>
                          <Controller
                            name={`details.${formIndex}.boxes`}
                            control={control}
                            rules={{
                              required: 'Obligatorio',
                              min: { value: 0, message: 'Mín. 0' },
                            }}
                            render={({ field }) => (
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                value={field.value ?? 0}
                                style={{ fontSize: '2.25rem' }}
                                className="w-32 min-h-[80px] text-center font-bold touch-manipulation border-2 rounded-xl"
                              />
                            )}
                          />
                          <Button
                            type="button"
                            variant="default"
                            size="lg"
                            className="h-16 w-16 shrink-0 p-0 touch-manipulation text-4xl font-bold"
                            onClick={() => {
                              const v = parseInt(watch(`details.${formIndex}.boxes`), 10);
                              const current = Number.isNaN(v) ? 0 : v;
                              setValue(`details.${formIndex}.boxes`, current + 1);
                            }}
                          >
                            +
                          </Button>
                        </div>
                        {errors.details?.[formIndex]?.boxes && (
                          <p className="text-xs text-destructive text-center">
                            {errors.details[formIndex].boxes.message}
                          </p>
                        )}
                      </div>
                    )}
                    {lineDialogStep === 2 && (
                      <div className="w-full flex flex-col items-center gap-4 max-w-[360px]">
                        <Controller
                          name={`details.${formIndex}.tare`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="min-h-[80px] touch-manipulation w-full font-bold rounded-xl border-2 px-6 pr-12 whitespace-normal [&>span]:text-[1.875rem] [&>span]:font-bold [&>span]:line-clamp-none [&>span]:whitespace-normal">
                                <SelectValue placeholder="Seleccione tara" className="text-[1.875rem] font-bold" />
                              </SelectTrigger>
                              <SelectContent>
                                {TARE_OPTIONS.map((opt) => (
                                  <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-base py-3"
                                  >
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    )}
                    {lineDialogStep === 3 && (
                      <div className="w-full flex flex-col items-center gap-4 max-w-[320px]">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          {...register(`details.${formIndex}.grossWeight`, {
                            required: 'Obligatorio',
                            min: { value: 0.01, message: 'Mín. 0.01' },
                          })}
                          style={{ fontSize: '2.25rem' }}
                          className="text-center min-h-[80px] touch-manipulation w-full font-bold rounded-xl border-2 px-4"
                        />
                        {errors.details?.[formIndex]?.grossWeight && (
                          <p className="text-xs text-destructive text-center">
                            {errors.details[formIndex].grossWeight.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 w-full pt-2">
                    {lineDialogStep > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-[40px] flex-1 touch-manipulation text-sm"
                        onClick={() => {
                          if (lineDialogStep === 1)
                            setProductStepView('quick');
                          const prevStep =
                            lineDialogStep === 3
                              ? (() => {
                                  const b = watch(`details.${formIndex}.boxes`);
                                  const n = b != null && b !== '' ? parseInt(b, 10) : 0;
                                  return Number.isNaN(n) || n === 0 ? 1 : 2;
                                })()
                              : lineDialogStep - 1;
                          setLineDialogStep(prevStep);
                        }}
                      >
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Anterior
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-[40px] flex-1 touch-manipulation text-sm"
                        onClick={handleCloseLineDialog}
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-[40px] flex-1 touch-manipulation text-sm"
                      onClick={handleLineDialogNext}
                    >
                      {lineDialogStep < LINE_DIALOG_STEPS.length - 1 ? (
                        <>
                          Siguiente
                          <ArrowRight className="h-4 w-4 ml-1.5" />
                        </>
                      ) : editingLineIndex !== null ? (
                        'Guardar'
                      ) : (
                        'Añadir'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </form>

      <div className="shrink-0 flex gap-2 pt-4 w-full justify-center">
        <div className="flex gap-2 w-full max-w-[420px]">
          {step > 0 ? (
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
            disabled={
              (step === 0 && !speciesValue) ||
              (step === 1 && !supplierValue)
            }
            className="min-h-[40px] flex-1 touch-manipulation text-sm"
          >
            {step < 3 ? (
              <>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Guardando
              </>
            ) : (
              <>
                Crear salida de cebo
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
