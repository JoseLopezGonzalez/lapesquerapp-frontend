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
import { useOperarioReceptionForm, STEPS } from '@/hooks/useOperarioReceptionForm';

const TARE_OPTIONS = [
  { value: '3', label: '3kg' },
  { value: '2.7', label: '2,70kg' },
  { value: '1.4', label: '1,40kg' },
  { value: '1.5', label: '1,50kg' },
];

export default function OperarioCreateReceptionForm({ onSuccess, onCancel, storeId = null }) {
  const form = useOperarioReceptionForm({ onSuccess });
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
    productsBySpeciesLoadingMore,
    productsBySpeciesPage,
    productsBySpeciesLastPage,
    productsBySpeciesTotal,
    canLoadMoreProductsBySpecies,
    loadMoreProductsBySpecies,
    quickPickOptionsBySpecies,
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
    const id = typeof val === 'object' ? (val?.id ?? val?.value) : val;
    const opt = (productOptionsBySpecies || []).find((o) => String(o.value) === String(id));
    return opt?.label ?? String(id);
  };

  const getTareLabel = (val) => TARE_OPTIONS.find((o) => o.value === val)?.label ?? val ?? '-';

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
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex shrink-0 flex-col items-center gap-3 pb-4">
        <h2 className="text-lg font-semibold">Nueva recepción de materia prima</h2>
        <div className="flex w-full max-w-[420px] items-center gap-2">
          {STEPS.map((s, i) => {
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
                    'flex h-11 min-w-[2.75rem] touch-manipulation items-center justify-center rounded-full text-sm font-medium',
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
                {i < STEPS.length - 1 && (
                  <motion.div
                    className="bg-muted h-1.5 min-w-[1rem] flex-1 overflow-hidden rounded-full"
                    initial={false}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="bg-primary/30 h-full rounded-full"
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
        <p className="text-muted-foreground text-sm">{STEPS[step].description}</p>
        {step === 3 && (
          <Button
            type="button"
            variant="default"
            size="lg"
            className="min-h-[48px] w-full max-w-[420px] touch-manipulation gap-2"
            onClick={openAddLineDialog}
          >
            <Plus className="h-5 w-5" />
            Añadir línea
          </Button>
        )}
      </div>

      <form
        onSubmit={handleSubmit(handleCreate)}
        className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto"
      >
        <div
          className={cn(
            'flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-6',
            step === 3 ? 'mx-auto max-w-[min(1400px,95vw)]' : 'mx-auto max-w-[420px]'
          )}
        >
          {step === 0 && (
            <div
              className="h-[min(480px,72vh)] w-full max-w-[420px] overflow-x-hidden overflow-y-auto rounded-lg border"
              style={{ minHeight: 0 }}
            >
              <div className="flex flex-col gap-2 p-3 pr-4">
                {speciesLoading ? (
                  <div className="flex min-h-[min(400px,65vh)] w-full items-center justify-center">
                    <Loader />
                  </div>
                ) : speciesOptions.length === 0 ? (
                  <div className="flex min-h-[min(400px,65vh)] w-full items-center justify-center py-6">
                    <EmptyState
                      icon={<Fish className="text-primary h-12 w-12" strokeWidth={1.5} />}
                      title="No hay especies"
                      description="No hay especies disponibles. Contacta con el administrador para dar de alta especies."
                    />
                  </div>
                ) : (
                  speciesOptions.map((opt, idx) => {
                    const isSelected =
                      speciesValue != null && String(opt.value) === String(speciesValue);
                    return (
                      <button
                        id={isSelected ? `species-opt-${opt.value}` : undefined}
                        key={opt.value ?? idx}
                        type="button"
                        onClick={() =>
                          setValue('species', isSelected ? null : opt.value, {
                            shouldValidate: true,
                          })
                        }
                        className={cn(
                          'flex min-h-[56px] w-full touch-manipulation flex-col justify-center gap-0.5 rounded-lg border-2 px-4 py-3 text-left transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/5 border-l-4'
                            : 'border-border hover:border-primary/40 hover:bg-muted/50'
                        )}
                      >
                        <span className="text-foreground font-medium">{opt.label}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div
              className="h-[min(480px,72vh)] w-full max-w-[420px] overflow-x-hidden overflow-y-auto rounded-lg border"
              style={{ minHeight: 0 }}
            >
              <div className="flex flex-col gap-2 p-3 pr-4">
                {suppliersLoading ? (
                  <div className="flex min-h-[min(400px,65vh)] w-full items-center justify-center">
                    <Loader />
                  </div>
                ) : suppliersByLetter.length === 0 ? (
                  <div className="flex min-h-[min(400px,65vh)] w-full items-center justify-center py-6">
                    <EmptyState
                      icon={<Truck className="text-primary h-12 w-12" strokeWidth={1.5} />}
                      title="No hay proveedores"
                      description="No hay proveedores disponibles. Contacta con el administrador para dar de alta proveedores."
                    />
                  </div>
                ) : (
                  suppliersByLetter.map(({ letter, options }) => (
                    <div key={letter} className="space-y-2">
                      <p className="text-muted-foreground px-1 pt-2 text-xs font-semibold tracking-wider uppercase first:pt-0">
                        {letter}
                      </p>
                      {options.map((opt, idx) => {
                        const optVal = opt.value;
                        const isSelected =
                          supplierValue != null &&
                          (typeof optVal === 'object'
                            ? optVal?.id === supplierValue?.id || optVal?.value === supplierValue
                            : String(optVal) === String(supplierValue));
                        return (
                          <button
                            key={optVal?.id ?? optVal ?? idx}
                            type="button"
                            onClick={() =>
                              setValue('supplier', isSelected ? null : opt.value, {
                                shouldValidate: true,
                              })
                            }
                            className={cn(
                              'flex min-h-[56px] w-full touch-manipulation flex-col justify-center gap-0.5 rounded-lg border-2 px-4 py-3 text-left transition-colors',
                              isSelected
                                ? 'border-primary bg-primary/5 border-l-4'
                                : 'border-border hover:border-primary/40 hover:bg-muted/50'
                            )}
                          >
                            <span className="text-foreground font-medium">{opt.label}</span>
                            {opt.secondaryLabel && (
                              <span className="text-muted-foreground text-sm">
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
                className="min-h-[120px] w-full touch-manipulation text-base"
              />
            </div>
          )}

          {step === 3 && (
            <div className="w-full space-y-6">
              {confirmedLines.length > 0 ? (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Artículo</TableHead>
                        <TableHead className="w-20 whitespace-nowrap">Cajas</TableHead>
                        <TableHead className="w-24 whitespace-nowrap">Tara</TableHead>
                        <TableHead className="w-28 text-right whitespace-nowrap">
                          Peso bruto (kg)
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
                          <TableCell>{d?.boxes ?? 0}</TableCell>
                          <TableCell>
                            {d?.boxes != null && d?.boxes !== '' && parseInt(d.boxes, 10) > 0
                              ? getTareLabel(d?.tare)
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {parseFloat(d?.grossWeight) > 0
                              ? parseFloat(d.grossWeight).toFixed(2)
                              : '-'}
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
                                className="text-destructive h-9 w-9 touch-manipulation"
                                onClick={() => {
                                  remove(i);
                                  if (editingLineIndex !== null && i < editingLineIndex) {
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
                <div className="border-muted-foreground/25 bg-muted/20 flex min-h-[min(260px,40vh)] w-full flex-col items-center justify-center gap-6 rounded-lg border border-dashed px-6 py-10">
                  <div className="bg-muted border-border rounded-full border p-4">
                    <Package className="text-muted-foreground h-14 w-14" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2 text-center">
                    <h3 className="text-lg font-semibold">Ninguna línea añadida</h3>
                    <p className="text-muted-foreground max-w-[280px] text-sm">
                      Añade artículo, cajas, tara y peso bruto para crear la recepción.
                    </p>
                  </div>
                </div>
              )}

              <Dialog
                open={lineDialogOpen}
                onOpenChange={(open) => !open && handleCloseLineDialog()}
              >
                <DialogContent size="md" className="flex min-h-[420px] flex-col gap-4" hideClose>
                  <div className="space-y-1 text-center">
                    <DialogTitle className="text-xl font-semibold">
                      {LINE_DIALOG_STEPS[lineDialogStep]?.title ?? 'Línea'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                      {LINE_DIALOG_STEPS[lineDialogStep]?.description ?? ''}
                    </DialogDescription>
                  </div>
                  <div className="flex min-h-[220px] w-full flex-1 flex-col items-center justify-center py-4">
                    {lineDialogStep === 0 && (
                      <Controller
                        name={`details.${formIndex}.product`}
                        control={control}
                        rules={{ required: 'Seleccione producto' }}
                        render={({ field: { onChange, value } }) => {
                          const productValue =
                            typeof value === 'object' ? (value?.id ?? value?.value) : value;

                          // Evitar seleccionar el mismo producto en más de una línea
                          const usedProductIds = new Set(
                            (watchedDetails || [])
                              .map((d, i) => {
                                if (i === formIndex) return null;
                                const v = d?.product;
                                if (v == null) return null;
                                const id = typeof v === 'object' ? (v?.id ?? v?.value) : v;
                                return id != null && id !== '' ? String(id) : null;
                              })
                              .filter(Boolean)
                          );

                          if (productValue != null && productValue !== '') {
                            usedProductIds.delete(String(productValue));
                          }

                          const filteredProductOptionsBySpecies = (
                            productOptionsBySpecies || []
                          ).filter((o) => !usedProductIds.has(String(o.value)));

                          const quickPickOpts = (quickPickOptionsBySpecies || []).filter(
                            (o) => !usedProductIds.has(String(o.value))
                          );

                          if (productStepView === 'search') {
                            return (
                              <div className="flex min-h-0 w-full flex-1 flex-col gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="-ml-1 touch-manipulation self-start"
                                  onClick={() => setProductStepView('quick')}
                                >
                                  <ArrowLeft className="mr-1 h-4 w-4" />
                                  Volver
                                </Button>
                                <div
                                  className="max-h-[min(320px,50vh)] min-h-[200px] flex-1 overflow-x-hidden overflow-y-auto rounded-lg border"
                                  style={{ minHeight: 0 }}
                                  onScroll={(e) => {
                                    const el = e.currentTarget;
                                    const remaining =
                                      el.scrollHeight - el.scrollTop - el.clientHeight;
                                    if (remaining < 180 && canLoadMoreProductsBySpecies) {
                                      loadMoreProductsBySpecies();
                                    }
                                  }}
                                >
                                  <div className="flex flex-col gap-2 p-3 pr-4">
                                    {productsBySpeciesLoading ? (
                                      <div className="flex min-h-[200px] w-full items-center justify-center">
                                        <Loader />
                                      </div>
                                    ) : filteredProductOptionsBySpecies.length === 0 ? (
                                      <div className="flex min-h-[200px] w-full items-center justify-center py-6">
                                        <EmptyState
                                          icon={
                                            <Package
                                              className="text-primary h-12 w-12"
                                              strokeWidth={1.5}
                                            />
                                          }
                                          title="No hay productos para esta especie"
                                          description="No hay productos asociados a la especie seleccionada. Contacta con el administrador."
                                        />
                                      </div>
                                    ) : (
                                      filteredProductOptionsBySpecies.map((opt, idx) => {
                                        const isSelected =
                                          productValue != null &&
                                          String(opt.value) === String(productValue);
                                        return (
                                          <button
                                            key={opt.value ?? idx}
                                            type="button"
                                            onClick={() => onChange(opt.value)}
                                            className={cn(
                                              'flex min-h-[56px] w-full touch-manipulation flex-col justify-center rounded-lg border-2 px-4 py-3 text-left transition-colors',
                                              isSelected
                                                ? 'border-primary bg-primary/5 border-l-4'
                                                : 'border-border hover:border-primary/40 hover:bg-muted/50'
                                            )}
                                          >
                                            <span className="text-foreground font-medium">
                                              {opt.label}
                                            </span>
                                          </button>
                                        );
                                      })
                                    )}

                                    {!productsBySpeciesLoading &&
                                      (productsBySpeciesLoadingMore ||
                                        canLoadMoreProductsBySpecies) && (
                                        <div className="pt-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            className="min-h-[48px] w-full touch-manipulation"
                                            disabled={productsBySpeciesLoadingMore}
                                            onClick={() => loadMoreProductsBySpecies()}
                                          >
                                            {productsBySpeciesLoadingMore ? (
                                              <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Cargando...
                                              </>
                                            ) : (
                                              'Cargar más'
                                            )}
                                          </Button>
                                        </div>
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
                                className="min-h-[44px] w-full touch-manipulation"
                                onClick={() => setProductStepView('search')}
                              >
                                <Search className="mr-2 h-4 w-4" />
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
                                        'flex min-h-[52px] w-full touch-manipulation items-center rounded-lg border-2 px-4 py-3 text-left transition-colors',
                                        isSelected
                                          ? 'border-primary bg-primary/5 border-l-4'
                                          : 'border-border hover:border-primary/40 hover:bg-muted/50'
                                      )}
                                    >
                                      <span className="text-foreground font-medium">
                                        {opt.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              {errors.details?.[formIndex]?.product && (
                                <p className="text-destructive text-center text-xs">
                                  {errors.details[formIndex].product.message}
                                </p>
                              )}
                            </div>
                          );
                        }}
                      />
                    )}
                    {lineDialogStep === 1 && (
                      <div className="flex w-full flex-col items-center gap-4">
                        <div className="flex items-center justify-center gap-4">
                          <Button
                            type="button"
                            variant="default"
                            size="lg"
                            className="h-16 w-16 shrink-0 touch-manipulation p-0 text-4xl font-bold"
                            onClick={() => {
                              const v = parseInt(watch(`details.${formIndex}.boxes`), 10);
                              const current = Number.isNaN(v) ? 0 : v;
                              if (current > 0) setValue(`details.${formIndex}.boxes`, current - 1);
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
                                className="min-h-[80px] w-32 touch-manipulation rounded-xl border-2 text-center font-bold"
                              />
                            )}
                          />
                          <Button
                            type="button"
                            variant="default"
                            size="lg"
                            className="h-16 w-16 shrink-0 touch-manipulation p-0 text-4xl font-bold"
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
                          <p className="text-destructive text-center text-xs">
                            {errors.details[formIndex].boxes.message}
                          </p>
                        )}
                      </div>
                    )}
                    {lineDialogStep === 2 && (
                      <div className="flex w-full max-w-[360px] flex-col items-center gap-4">
                        <Controller
                          name={`details.${formIndex}.tare`}
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="min-h-[80px] w-full touch-manipulation rounded-xl border-2 px-6 pr-12 font-bold whitespace-normal [&>span]:line-clamp-none [&>span]:text-[1.875rem] [&>span]:font-bold [&>span]:whitespace-normal">
                                <SelectValue
                                  placeholder="Seleccione tara"
                                  className="text-[1.875rem] font-bold"
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {TARE_OPTIONS.map((opt) => (
                                  <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="py-3 text-base"
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
                      <div className="flex w-full max-w-[320px] flex-col items-center gap-4">
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
                          className="min-h-[80px] w-full touch-manipulation rounded-xl border-2 px-4 text-center font-bold"
                        />
                        {errors.details?.[formIndex]?.grossWeight && (
                          <p className="text-destructive text-center text-xs">
                            {errors.details[formIndex].grossWeight.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex w-full gap-2 pt-2">
                    {lineDialogStep > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-[40px] flex-1 touch-manipulation text-sm"
                        onClick={() => {
                          if (lineDialogStep === 1) setProductStepView('quick');
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
                        <ArrowLeft className="mr-1.5 h-4 w-4" />
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
                          <ArrowRight className="ml-1.5 h-4 w-4" />
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

      <div className="flex w-full shrink-0 justify-center gap-2 pt-4">
        <div className="flex w-full max-w-[420px] gap-2">
          {step > 0 ? (
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
            disabled={(step === 0 && !speciesValue) || (step === 1 && !supplierValue)}
            className="min-h-[40px] flex-1 touch-manipulation text-sm"
          >
            {step < 3 ? (
              <>
                Siguiente
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Guardando
              </>
            ) : (
              <>
                Crear recepción
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
