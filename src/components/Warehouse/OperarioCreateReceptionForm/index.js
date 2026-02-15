'use client';

import React, { useEffect } from 'react';
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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Loader from '@/components/Utilities/Loader';
import { calculateNetWeight } from '@/helpers/receptionCalculations';
import { cn } from '@/lib/utils';
import {
  useOperarioReceptionForm,
  STEPS,
  getQuickPickProductIds,
} from '@/hooks/useOperarioReceptionForm';

const TARE_OPTIONS = [
  { value: '1', label: '1 kg' },
  { value: '2', label: '2 kg' },
  { value: '3', label: '3 kg' },
  { value: '4', label: '4 kg' },
  { value: '5', label: '5 kg' },
];

export default function OperarioCreateReceptionForm({
  onSuccess,
  onCancel,
  storeId = null,
}) {
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

  if (speciesLoading || suppliersLoading) {
    return (
      <div className="w-full flex justify-center py-12">
        <Loader />
      </div>
    );
  }

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
        calculateNetWeight(d?.grossWeight, d?.boxes ?? 1, d?.tare ?? '3') > 0
    );

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="shrink-0 flex flex-col items-center gap-3 pb-4">
        <h2 className="text-lg font-semibold">Nueva recepción de materia prima</h2>
        <div className="flex items-center gap-2 w-full max-w-[420px]">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  'flex items-center justify-center min-w-[2.5rem] h-10 rounded-full text-sm font-medium transition-colors touch-manipulation',
                  step === i
                    ? 'bg-primary text-primary-foreground'
                    : step > i
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                )}
                aria-label={`Paso ${i + 1}: ${s.title}`}
              >
                {step > i ? <Check className="h-4 w-4" /> : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 rounded-full min-w-[1rem]',
                    step > i ? 'bg-primary/30' : 'bg-muted'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
        {step === 3 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[44px] touch-manipulation"
            onClick={openAddLineDialog}
          >
            <Plus className="h-4 w-4 mr-2" />
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
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Cargando...
                  </p>
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
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Cargando...
                  </p>
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
              {confirmedLines.length > 0 && (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          Artículo
                        </TableHead>
                        <TableHead className="w-20 whitespace-nowrap">
                          Cajas
                        </TableHead>
                        <TableHead className="w-24 whitespace-nowrap">
                          Tara
                        </TableHead>
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
                          <TableCell>{d?.boxes ?? 1}</TableCell>
                          <TableCell>{getTareLabel(d?.tare)}</TableCell>
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
                    <h3 className="text-xl font-semibold">
                      {LINE_DIALOG_STEPS[lineDialogStep]?.title ?? 'Línea'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {LINE_DIALOG_STEPS[lineDialogStep]?.description ?? ''}
                    </p>
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
                          const quickPickIds = getQuickPickProductIds(
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
                                      <p className="py-6 text-center text-sm text-muted-foreground">
                                        Cargando...
                                      </p>
                                    ) : (productOptionsBySpecies || []).length ===
                                      0 ? (
                                      <p className="py-6 text-center text-sm text-muted-foreground">
                                        Sin productos
                                      </p>
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
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="h-14 w-14 p-0 touch-manipulation rounded-full"
                            onClick={() => {
                              const v =
                                parseInt(
                                  watch(`details.${formIndex}.boxes`),
                                  10
                                ) || 1;
                              if (v > 1)
                                setValue(
                                  `details.${formIndex}.boxes`,
                                  v - 1
                                );
                            }}
                          >
                            -
                          </Button>
                          <Controller
                            name={`details.${formIndex}.boxes`}
                            control={control}
                            rules={{
                              required: 'Obligatorio',
                              min: { value: 1, message: 'Mín. 1' },
                            }}
                            render={({ field }) => (
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                value={field.value ?? 1}
                                className="w-24 text-center min-h-[56px] text-xl touch-manipulation"
                              />
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="h-14 w-14 p-0 touch-manipulation rounded-full"
                            onClick={() => {
                              const v =
                                parseInt(
                                  watch(`details.${formIndex}.boxes`),
                                  10
                                ) || 1;
                              setValue(
                                `details.${formIndex}.boxes`,
                                v + 1
                              );
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
                      <div className="w-full max-w-[320px]">
                        <Controller
                          name={`details.${formIndex}.tare`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="min-h-[44px] touch-manipulation w-full">
                                <SelectValue placeholder="Seleccione tara" />
                              </SelectTrigger>
                              <SelectContent>
                                {TARE_OPTIONS.map((opt) => (
                                  <SelectItem
                                    key={opt.value}
                                    value={opt.value}
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
                      <div className="w-full max-w-[320px]">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Peso bruto (kg)"
                          {...register(
                            `details.${formIndex}.grossWeight`,
                            {
                              required: 'Obligatorio',
                              min: { value: 0.01, message: 'Mín. 0.01' },
                            }
                          )}
                          className="text-right min-h-[44px] touch-manipulation w-full text-lg"
                        />
                        {errors.details?.[formIndex]?.grossWeight && (
                          <p className="text-xs text-destructive mt-1">
                            {
                              errors.details[formIndex].grossWeight
                                .message
                            }
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
                          setLineDialogStep(lineDialogStep - 1);
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
                Crear recepción
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
