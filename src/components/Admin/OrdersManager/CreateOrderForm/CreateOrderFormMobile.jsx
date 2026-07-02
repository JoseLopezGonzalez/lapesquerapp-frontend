'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  PlusCircle,
  Check,
  Search,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { pageTransition } from '@/lib/motion-presets';
import { cn } from '@/lib/utils';
import { useHideBottomNav } from '@/context/BottomNavContext';
import Loader from '@/components/Utilities/Loader';
import { useBackButton } from '@/hooks/use-back-button';

// Componente especial que muestra las opciones directamente en el layout (sin popover)
const ExpandedCombobox = ({ field, value, onChange, onBlur, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Si está cargando, no filtrar opciones aún
  const filteredOptions = useMemo(() => {
    if (loading) return [];
    if (!field.options || !Array.isArray(field.options)) return [];
    if (!searchQuery) return field.options;
    return field.options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [field.options, searchQuery, loading]);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return (field.options || []).find((option) => option.value === value);
  }, [field.options, value]);

  // Mostrar el valor seleccionado en el input cuando no se está buscando
  const displayValue = searchQuery || (selectedOption ? selectedOption.label : '');

  return (
    <div className="w-full space-y-3">
      {/* Input de búsqueda que muestra el valor seleccionado */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder={field.props?.placeholder || field.props?.searchPlaceholder || 'Buscar...'}
          value={displayValue}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // Si hay un valor seleccionado y el usuario empieza a escribir, limpiar la selección
            if (value && e.target.value !== selectedOption?.label) {
              onChange('');
            }
          }}
          onFocus={() => {
            // Al enfocar, si hay un valor seleccionado, limpiar el input para permitir búsqueda
            if (selectedOption) {
              setSearchQuery('');
            }
          }}
          className="h-12 pl-10 text-base"
        />
      </div>

      {/* Lista de opciones siempre visible */}
      <div className="bg-card overflow-hidden rounded-lg border">
        {loading || !field.options || field.options.length === 0 ? (
          <div className="flex min-h-[200px] w-full flex-col items-center justify-center gap-2 py-12">
            <Loader2 className="text-primary h-8 w-8 animate-spin stroke-2" />
            <p className="text-muted-foreground text-sm">Cargando</p>
          </div>
        ) : filteredOptions.length === 0 ? (
          <div className="text-muted-foreground py-6 text-center text-sm">
            {field.props?.notFoundMessage || 'No se encontraron resultados'}
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {filteredOptions.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(isSelected ? '' : option.value);
                    setSearchQuery('');
                    if (onBlur) onBlur();
                  }}
                  className={cn(
                    'flex w-full items-center px-4 py-3 text-left text-sm transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent text-accent-foreground font-medium'
                  )}
                >
                  <span className="flex-1">{option.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const CreateOrderFormMobile = ({
  formGroups,
  fields,
  register,
  control,
  errors,
  handleSubmit,
  handleCreate,
  isSubmitting,
  isValid,
  submitDisabled,
  renderField,
  productOptions,
  productsLoading,
  taxOptions,
  taxLoading,
  append,
  remove,
  auxiliaryFields,
  appendAuxiliary,
  removeAuxiliary,
  auxiliaryProductOptions,
  auxiliaryProductOptionsMap,
  auxiliaryProductsLoading,
  setValue,
  onClose,
  loading,
}) => {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  // Ocultar bottom navbar en esta pantalla
  useHideBottomNav(true);

  // Interceptar botón back del navegador/dispositivo
  useBackButton(() => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  }, true);

  // Descripciones breves para cada sección
  const sectionDescriptions = {
    Cliente: 'Selecciona el cliente para este pedido',
    Fechas: 'Define las fechas de entrada y carga',
    'Información Comercial': 'Datos comerciales y términos de venta',
    Transporte: 'Información de transporte y logística',
    Direcciones: 'Direcciones de facturación y envío',
    Observaciones: 'Notas para producción y contabilidad',
    Emails: 'Direcciones de correo para notificaciones',
    'Productos previstos': 'Añade los productos del pedido',
    'Otros artículos': 'Nieve, envases, palets u otros artículos (opcional)',
  };

  // Crear pasos: cada formGroup + paso de productos + paso final de otros artículos
  const steps = [
    ...formGroups.map((group) => ({ type: 'formGroup', data: group })),
    { type: 'products', label: 'Productos previstos' },
    { type: 'auxiliaryLines', label: 'Otros artículos' },
  ];

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const transition = prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' };

  const currentStepData = steps[currentStep];

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Header */}
      <div className="bg-background flex-shrink-0 px-0 pt-8 pb-3">
        <div className="relative flex items-center justify-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (onClose ? onClose() : router.back())}
            className="hover:bg-muted absolute left-4 h-12 w-12 rounded-full"
            aria-label="Volver"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h2 className="text-center text-xl font-normal dark:text-white">Crear nuevo pedido</h2>
          <div className="absolute right-4 h-12 w-12" />
        </div>
      </div>

      {/* Stepper Indicator - Mejorado según best practices mobile */}
      <div className="flex-shrink-0 px-5 py-6">
        <div className="flex flex-col items-center justify-center gap-3">
          {/* Indicador de progreso compacto circular - Centrado con motion moderno */}
          <div className="flex-shrink-0">
            <motion.div
              className="relative flex h-16 w-16 items-center justify-center"
              initial={false}
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 0.4,
                ease: 'easeOut',
              }}
              key={currentStep}
            >
              {/* Círculo de fondo */}
              <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 56 56">
                {/* Círculo de fondo (gris) */}
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted/30"
                />
                {/* Círculo de progreso (foreground) con animación de "drawing" */}
                <motion.circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  className="text-primary"
                  initial={false}
                  animate={{
                    pathLength: (currentStep + 1) / totalSteps,
                  }}
                  transition={{
                    pathLength: {
                      type: 'spring',
                      stiffness: 50,
                      damping: 25,
                      duration: 0.8,
                      ease: 'easeInOut',
                    },
                  }}
                />
              </svg>
              {/* Texto centrado con animación */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                key={currentStep}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  duration: 0.4,
                }}
              >
                <span className="text-foreground text-base font-bold">
                  {currentStep + 1}
                  <span className="text-muted-foreground text-sm font-normal">/{totalSteps}</span>
                </span>
              </motion.div>
            </motion.div>
          </div>
          {/* Título del paso actual y descripción - Centrado */}
          <div className="flex flex-col items-center justify-center text-center">
            <h3 className="text-foreground mb-1.5 text-lg leading-tight font-semibold">
              {currentStepData.type === 'formGroup'
                ? currentStepData.data.group
                : currentStepData.label}
            </h3>
            <p className="text-muted-foreground max-w-xs text-xs leading-relaxed">
              {currentStepData.type === 'formGroup'
                ? sectionDescriptions[currentStepData.data.group] ||
                  'Completa los campos de esta sección'
                : sectionDescriptions[currentStepData.label] || 'Añade los productos del pedido'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-muted-foreground">Cargando...</div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(handleCreate, (formErrors) => {
              // Si hay errores, ir al primer paso con error
              const firstErrorStep = steps.findIndex((step, index) => {
                if (step.type === 'formGroup') {
                  return step.data.fields.some((field) => formErrors[field.name]);
                }
                // Si hay errores en productos, ir al último paso
                if (step.type === 'products' && formErrors.plannedProducts) {
                  return true;
                }
                if (step.type === 'auxiliaryLines' && formErrors.auxiliaryLines) {
                  return true;
                }
                return false;
              });
              if (firstErrorStep !== -1) {
                setCurrentStep(firstErrorStep);
              }
            })}
            onKeyDown={(e) => {
              // Prevenir envío del formulario con Enter
              if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
              }
            }}
            className="flex flex-col"
          >
            <div className="flex flex-1 flex-col py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: 20 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                  transition={transition}
                  className="w-full"
                >
                  {currentStepData.type === 'formGroup' ? (
                    <div className="w-full">
                      <div className="grid w-full grid-cols-1 gap-5">
                        {currentStepData.data.fields.map((field) => {
                          // Para el primer paso, si es un Combobox, usar el componente expandido
                          const isFirstStepCombobox = isFirstStep && field.component === 'Combobox';

                          return (
                            <div key={field.name} className="grid w-full gap-2.5">
                              <Label
                                htmlFor={field.name}
                                className="text-foreground text-sm font-semibold"
                              >
                                {field.label}
                              </Label>
                              <div className="relative">
                                {isFirstStepCombobox ? (
                                  <Controller
                                    name={field.name}
                                    control={control}
                                    render={({ field: { onChange, value, onBlur } }) => (
                                      <ExpandedCombobox
                                        field={field}
                                        value={value}
                                        onChange={onChange}
                                        onBlur={onBlur}
                                        loading={loading}
                                      />
                                    )}
                                  />
                                ) : (
                                  renderField(field)
                                )}
                              </div>
                              {errors[field.name] && (
                                <motion.p
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-1 text-sm font-medium text-red-500"
                                >
                                  {errors[field.name].message}
                                </motion.p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : currentStepData.type === 'products' ? (
                    <div className="w-full">
                      <div className="flex flex-col gap-5">
                        {fields.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-border/50 bg-card/50 flex flex-col gap-4 rounded-xl border p-4"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <h4 className="text-foreground text-sm font-semibold">
                                Producto #{index + 1}
                              </h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid gap-4">
                              <div className="grid gap-2.5">
                                <Label className="text-foreground text-sm font-semibold">
                                  Producto
                                </Label>
                                <div className="[&_button]:!h-12">
                                  <Controller
                                    control={control}
                                    name={`plannedProducts.${index}.product`}
                                    render={({ field: { onChange, value } }) => (
                                      <Combobox
                                        options={productOptions}
                                        value={value}
                                        onChange={onChange}
                                        placeholder="Selecciona un producto"
                                        searchPlaceholder="Buscar producto..."
                                        notFoundMessage="No se encontraron productos"
                                        loading={productsLoading}
                                        onOpenChange={setIsComboboxOpen}
                                      />
                                    )}
                                  />
                                </div>
                                {errors.plannedProducts?.[index]?.product && (
                                  <p className="text-sm font-medium text-red-500">
                                    {errors.plannedProducts[index].product.message}
                                  </p>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2.5">
                                  <Label className="text-foreground text-sm font-semibold">
                                    Cantidad
                                  </Label>
                                  <Input
                                    type="number"
                                    step="any"
                                    {...register(`plannedProducts.${index}.quantity`, {
                                      valueAsNumber: true,
                                    })}
                                    placeholder="0.00"
                                    className="h-12 text-base"
                                  />
                                  {errors.plannedProducts?.[index]?.quantity && (
                                    <p className="text-sm font-medium text-red-500">
                                      {errors.plannedProducts[index].quantity.message}
                                    </p>
                                  )}
                                </div>

                                <div className="grid gap-2.5">
                                  <Label className="text-foreground text-sm font-semibold">
                                    Cajas
                                  </Label>
                                  <Input
                                    type="number"
                                    step="any"
                                    {...register(`plannedProducts.${index}.boxes`, {
                                      valueAsNumber: true,
                                    })}
                                    placeholder="0"
                                    className="h-12 text-base"
                                  />
                                  {errors.plannedProducts?.[index]?.boxes && (
                                    <p className="text-sm font-medium text-red-500">
                                      {errors.plannedProducts[index].boxes.message}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2.5">
                                  <Label className="text-foreground text-sm font-semibold">
                                    Precio unitario
                                  </Label>
                                  <Input
                                    type="number"
                                    step="any"
                                    {...register(`plannedProducts.${index}.unitPrice`, {
                                      valueAsNumber: true,
                                    })}
                                    placeholder="0.00"
                                    className="h-12 text-base"
                                  />
                                  {errors.plannedProducts?.[index]?.unitPrice && (
                                    <p className="text-sm font-medium text-red-500">
                                      {errors.plannedProducts[index].unitPrice.message}
                                    </p>
                                  )}
                                </div>

                                <div className="grid gap-2.5">
                                  <Label className="text-foreground text-sm font-semibold">
                                    IVA
                                  </Label>
                                  <Controller
                                    control={control}
                                    name={`plannedProducts.${index}.tax`}
                                    render={({ field }) => {
                                      const currentValue = field.value ? String(field.value) : '';

                                      const handleValueChange = (newValue) => {
                                        // Convertir a número si las opciones usan números
                                        const taxOption = taxOptions.find(
                                          (t) => String(t.value) === String(newValue)
                                        );
                                        const finalValue = taxOption ? taxOption.value : newValue;
                                        field.onChange(finalValue);
                                      };

                                      return (
                                        <Select
                                          value={currentValue}
                                          onValueChange={handleValueChange}
                                        >
                                          <SelectTrigger
                                            loading={taxLoading}
                                            className="h-12 text-base"
                                          >
                                            <SelectValue placeholder="IVA" loading={taxLoading} />
                                          </SelectTrigger>
                                          <SelectContent loading={taxLoading} className="z-[9999]">
                                            {taxOptions.map((tax) => (
                                              <SelectItem key={tax.value} value={String(tax.value)}>
                                                {tax.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      );
                                    }}
                                  />
                                  {errors.plannedProducts?.[index]?.tax && (
                                    <p className="text-sm font-medium text-red-500">
                                      {errors.plannedProducts[index].tax.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            append({ product: '', quantity: '', boxes: '', unitPrice: '', tax: '' })
                          }
                          className="h-12 w-full border-dashed text-base hover:border-solid"
                          style={{ pointerEvents: isComboboxOpen ? 'none' : 'auto' }}
                        >
                          <PlusCircle className="mr-2 h-5 w-5" />
                          Añadir producto
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="flex flex-col gap-5">
                        {auxiliaryFields.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-border/50 bg-card/50 flex flex-col gap-4 rounded-xl border p-4"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <h4 className="text-foreground text-sm font-semibold">
                                Artículo #{index + 1}
                              </h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAuxiliary(index)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid gap-4">
                              <div className="grid gap-2.5">
                                <Label className="text-foreground text-sm font-semibold">
                                  Artículo del catálogo (opcional)
                                </Label>
                                <div className="[&_button]:!h-12">
                                  <Controller
                                    control={control}
                                    name={`auxiliaryLines.${index}.auxiliaryProduct`}
                                    render={({ field: { onChange, value } }) => (
                                      <Combobox
                                        options={auxiliaryProductOptions}
                                        value={value}
                                        onChange={(newValue) => {
                                          onChange(newValue);
                                          const matched = auxiliaryProductOptionsMap.get(
                                            String(newValue)
                                          );
                                          if (matched?.unit) {
                                            setValue(`auxiliaryLines.${index}.unit`, matched.unit);
                                          }
                                          if (matched?.defaultPrice != null) {
                                            setValue(
                                              `auxiliaryLines.${index}.unitPrice`,
                                              String(matched.defaultPrice)
                                            );
                                          }
                                        }}
                                        placeholder="Selecciona un artículo"
                                        searchPlaceholder="Buscar artículo..."
                                        notFoundMessage="No se encontraron artículos"
                                        loading={auxiliaryProductsLoading}
                                        onOpenChange={setIsComboboxOpen}
                                      />
                                    )}
                                  />
                                </div>
                              </div>

                              <div className="grid gap-2.5">
                                <Label className="text-foreground text-sm font-semibold">
                                  Descripción libre
                                </Label>
                                <Input
                                  {...register(`auxiliaryLines.${index}.description`)}
                                  placeholder="Nieve, tarrina 500g, palet..."
                                  className="h-12 text-base"
                                />
                                {errors.auxiliaryLines?.[index]?.description && (
                                  <p className="text-sm font-medium text-red-500">
                                    {errors.auxiliaryLines[index].description.message}
                                  </p>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2.5">
                                  <Label className="text-foreground text-sm font-semibold">
                                    Cantidad
                                  </Label>
                                  <Input
                                    type="number"
                                    step="any"
                                    {...register(`auxiliaryLines.${index}.quantity`, {
                                      valueAsNumber: true,
                                    })}
                                    placeholder="0.00"
                                    className="h-12 text-base"
                                  />
                                  {errors.auxiliaryLines?.[index]?.quantity && (
                                    <p className="text-sm font-medium text-red-500">
                                      {errors.auxiliaryLines[index].quantity.message}
                                    </p>
                                  )}
                                </div>

                                <div className="grid gap-2.5">
                                  <Label className="text-foreground text-sm font-semibold">
                                    Unidad
                                  </Label>
                                  <Input
                                    {...register(`auxiliaryLines.${index}.unit`)}
                                    placeholder="kg, ud, palet..."
                                    className="h-12 text-base"
                                  />
                                  {errors.auxiliaryLines?.[index]?.unit && (
                                    <p className="text-sm font-medium text-red-500">
                                      {errors.auxiliaryLines[index].unit.message}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2.5">
                                  <Label className="text-foreground text-sm font-semibold">
                                    Precio unitario
                                  </Label>
                                  <Input
                                    type="number"
                                    step="any"
                                    {...register(`auxiliaryLines.${index}.unitPrice`, {
                                      valueAsNumber: true,
                                    })}
                                    placeholder="0.00"
                                    className="h-12 text-base"
                                  />
                                  {errors.auxiliaryLines?.[index]?.unitPrice && (
                                    <p className="text-sm font-medium text-red-500">
                                      {errors.auxiliaryLines[index].unitPrice.message}
                                    </p>
                                  )}
                                </div>

                                <div className="grid gap-2.5">
                                  <Label className="text-foreground text-sm font-semibold">
                                    IVA
                                  </Label>
                                  <Controller
                                    control={control}
                                    name={`auxiliaryLines.${index}.tax`}
                                    render={({ field }) => {
                                      const currentValue = field.value ? String(field.value) : '';

                                      const handleValueChange = (newValue) => {
                                        const taxOption = taxOptions.find(
                                          (t) => String(t.value) === String(newValue)
                                        );
                                        const finalValue = taxOption ? taxOption.value : newValue;
                                        field.onChange(finalValue);
                                      };

                                      return (
                                        <Select
                                          value={currentValue}
                                          onValueChange={handleValueChange}
                                        >
                                          <SelectTrigger
                                            loading={taxLoading}
                                            className="h-12 text-base"
                                          >
                                            <SelectValue placeholder="IVA" loading={taxLoading} />
                                          </SelectTrigger>
                                          <SelectContent loading={taxLoading} className="z-[9999]">
                                            {taxOptions.map((tax) => (
                                              <SelectItem key={tax.value} value={String(tax.value)}>
                                                {tax.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      );
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            appendAuxiliary({
                              auxiliaryProduct: '',
                              description: '',
                              quantity: '',
                              unit: '',
                              unitPrice: '',
                              tax: '',
                            })
                          }
                          className="h-12 w-full border-dashed text-base hover:border-solid"
                          style={{ pointerEvents: isComboboxOpen ? 'none' : 'auto' }}
                        >
                          <PlusCircle className="mr-2 h-5 w-5" />
                          Añadir artículo
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Buttons - Absolute en la parte inferior del contenedor, justo encima del BottomNav */}
            <div className="absolute right-0 bottom-0 left-0 z-40 px-5 pt-3 pb-4">
              <div className="flex items-center justify-between gap-3">
                {!isFirstStep && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    className="hover:bg-muted/80 h-11 w-11 rounded-full transition-transform active:scale-95"
                    aria-label="Paso anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                {!isLastStep ? (
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleNext}
                    className={`bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 h-11 w-11 rounded-full shadow-lg transition-transform active:scale-95 ${isFirstStep ? 'ml-auto' : ''}`}
                    aria-label="Siguiente paso"
                  >
                    <motion.div
                      whileTap={{ scale: 0.8, x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <ChevronRight className="text-primary-foreground h-5 w-5" />
                    </motion.div>
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitDisabled}
                    className={`bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 h-11 rounded-full px-6 font-semibold shadow-lg transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${isFirstStep ? 'ml-auto' : ''}`}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    {isSubmitting ? 'Creando...' : 'Crear pedido'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateOrderFormMobile;
