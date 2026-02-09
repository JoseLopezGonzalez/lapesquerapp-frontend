'use client'

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, PlusCircle, Check, Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { pageTransition } from '@/lib/motion-presets';
import { cn } from '@/lib/utils';
import { useHideBottomNav } from '@/context/BottomNavContext';
import Loader from '@/components/Utilities/Loader';

// Componente especial que muestra las opciones directamente en el layout (sin popover)
const ExpandedCombobox = ({ field, value, onChange, onBlur, loading }) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    // Si está cargando, no filtrar opciones aún
    const filteredOptions = useMemo(() => {
        if (loading) return [];
        if (!field.options || !Array.isArray(field.options)) return [];
        if (!searchQuery) return field.options;
        return field.options.filter(option =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [field.options, searchQuery, loading]);

    const selectedOption = useMemo(() => {
        if (!value) return null;
        return (field.options || []).find((option) => option.value === value);
    }, [field.options, value]);

    // Mostrar el valor seleccionado en el input cuando no se está buscando
    const displayValue = searchQuery || (selectedOption ? selectedOption.label : "");

    return (
        <div className="w-full space-y-3">
            {/* Input de búsqueda que muestra el valor seleccionado */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder={field.props?.placeholder || field.props?.searchPlaceholder || 'Buscar...'}
                    value={displayValue}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        // Si hay un valor seleccionado y el usuario empieza a escribir, limpiar la selección
                        if (value && e.target.value !== selectedOption?.label) {
                            onChange("");
                        }
                    }}
                    onFocus={() => {
                        // Al enfocar, si hay un valor seleccionado, limpiar el input para permitir búsqueda
                        if (selectedOption) {
                            setSearchQuery("");
                        }
                    }}
                    className="h-12 text-base pl-10"
                />
            </div>
            
            {/* Lista de opciones siempre visible */}
            <div className="border rounded-lg bg-card overflow-hidden">
                {loading || (!field.options || field.options.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-12 min-h-[200px] gap-2 w-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary stroke-2" />
                        <p className="text-sm text-muted-foreground">Cargando</p>
                    </div>
                ) : filteredOptions.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
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
                                        onChange(isSelected ? "" : option.value);
                                        setSearchQuery("");
                                        if (onBlur) onBlur();
                                    }}
                                    className={cn(
                                        "w-full flex items-center px-4 py-3 text-left text-sm transition-colors",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        isSelected && "bg-accent text-accent-foreground font-medium"
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
    renderField,
    productOptions,
    productsLoading,
    taxOptions,
    taxLoading,
    append,
    remove,
    onClose,
    loading
}) => {
    const router = useRouter();
    const prefersReducedMotion = useReducedMotion();
    const [currentStep, setCurrentStep] = useState(0);
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);
    
    // Ocultar bottom navbar en esta pantalla
    useHideBottomNav(true);
    
    // Descripciones breves para cada sección
    const sectionDescriptions = {
        'Cliente': 'Selecciona el cliente para este pedido',
        'Fechas': 'Define las fechas de entrada y carga',
        'Información Comercial': 'Datos comerciales y términos de venta',
        'Transporte': 'Información de transporte y logística',
        'Direcciones': 'Direcciones de facturación y envío',
        'Observaciones': 'Notas para producción y contabilidad',
        'Emails': 'Direcciones de correo para notificaciones',
        'Productos previstos': 'Añade los productos del pedido'
    };
    
    // Crear pasos: cada formGroup + paso final de productos
    const steps = [
        ...formGroups.map(group => ({ type: 'formGroup', data: group })),
        { type: 'products', label: 'Productos previstos' }
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

    const transition = prefersReducedMotion 
        ? { duration: 0 } 
        : { duration: 0.2, ease: "easeOut" };

    const currentStepData = steps[currentStep];

    return (
        <div className="w-full h-full flex flex-col relative">
            {/* Header */}
            <div className="bg-background flex-shrink-0 px-0 pt-8 pb-3">
                <div className="relative flex items-center justify-center px-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onClose ? onClose() : router.back()}
                        className="absolute left-4 w-12 h-12 rounded-full hover:bg-muted"
                        aria-label="Volver"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h2 className="text-xl font-normal dark:text-white text-center">
                        Crear nuevo pedido
                    </h2>
                    <div className="absolute right-4 w-12 h-12" />
                </div>
            </div>

            {/* Stepper Indicator - Mejorado según best practices mobile */}
            <div className="flex-shrink-0 px-5 py-6">
                <div className="flex flex-col items-center justify-center gap-3">
                    {/* Indicador de progreso compacto circular - Centrado con motion moderno */}
                    <div className="flex-shrink-0">
                        <motion.div 
                            className="relative w-16 h-16 flex items-center justify-center"
                            initial={false}
                            animate={{ 
                                scale: [1, 1.05, 1],
                            }}
                            transition={{ 
                                duration: 0.4,
                                ease: "easeOut"
                            }}
                            key={currentStep}
                        >
                            {/* Círculo de fondo */}
                            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 56 56">
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
                                            type: "spring",
                                            stiffness: 50,
                                            damping: 25,
                                            duration: 0.8,
                                            ease: "easeInOut"
                                        }
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
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 15,
                                    duration: 0.4
                                }}
                            >
                                <span className="text-base font-bold text-foreground">
                                    {currentStep + 1}<span className="text-muted-foreground font-normal text-sm">/{totalSteps}</span>
                                </span>
                            </motion.div>
                        </motion.div>
                    </div>
                    {/* Título del paso actual y descripción - Centrado */}
                    <div className="flex flex-col items-center justify-center text-center">
                        <h3 className="text-lg font-semibold text-foreground mb-1.5 leading-tight">
                            {currentStepData.type === 'formGroup' ? currentStepData.data.group : currentStepData.label}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                            {currentStepData.type === 'formGroup' 
                                ? sectionDescriptions[currentStepData.data.group] || 'Completa los campos de esta sección'
                                : sectionDescriptions[currentStepData.label] || 'Añade los productos del pedido'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">
                {loading ? (
                    <div className='w-full h-full flex items-center justify-center'>
                        <div className="text-muted-foreground">Cargando...</div>
                    </div>
                ) : (
                <form onSubmit={handleSubmit(
                    handleCreate,
                    (formErrors) => {
                        // Si hay errores, ir al primer paso con error
                        const firstErrorStep = steps.findIndex((step, index) => {
                            if (step.type === 'formGroup') {
                                return step.data.fields.some(field => formErrors[field.name]);
                            }
                            // Si hay errores en productos, ir al último paso
                            if (step.type === 'products' && formErrors.plannedProducts) {
                                return true;
                            }
                            return false;
                        });
                        if (firstErrorStep !== -1) {
                            setCurrentStep(firstErrorStep);
                        }
                    }
                )} 
                onKeyDown={(e) => {
                    // Prevenir envío del formulario con Enter
                    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                    }
                }}
                className="flex flex-col">
                    <div className="flex-1 flex flex-col py-6">
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
                                                <div key={field.name} className="grid gap-2.5 w-full">
                                                    <Label htmlFor={field.name} className="text-sm font-semibold text-foreground">
                                                        {field.label}
                                                    </Label>
                                                    <div className="relative">
                                                        {isFirstStepCombobox ? (
                                                            <Controller
                                                                name={field.name}
                                                                control={control}
                                                                rules={field.rules}
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
                                                            className="text-red-500 text-sm font-medium mt-1"
                                                        >
                                                            {errors[field.name].message}
                                                        </motion.p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full">
                                    <div className="flex flex-col gap-5">
                                        {fields.map((item, index) => (
                                            <motion.div 
                                                key={item.id} 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex flex-col gap-4 p-4 rounded-xl border border-border/50 bg-card/50"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-sm font-semibold text-foreground">Producto #{index + 1}</h4>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => remove(index)}
                                                        className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                
                                                <div className="grid gap-4">
                                                    <div className="grid gap-2.5">
                                                        <Label className="text-sm font-semibold text-foreground">Producto</Label>
                                                        <Controller
                                                            control={control}
                                                            name={`plannedProducts.${index}.product`}
                                                            rules={{ required: 'Producto es requerido' }}
                                                            render={({ field: { onChange, value } }) => (
                                                                <Combobox
                                                                    options={productOptions}
                                                                    value={value}
                                                                    onChange={onChange}
                                                                    placeholder="Selecciona un producto"
                                                                    loading={productsLoading}
                                                                    onOpenChange={setIsComboboxOpen}
                                                                />
                                                            )}
                                                        />
                                                        {errors.plannedProducts?.[index]?.product && (
                                                            <p className="text-red-500 text-sm font-medium">
                                                                {errors.plannedProducts[index].product.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="grid gap-2.5">
                                                            <Label className="text-sm font-semibold text-foreground">Cantidad</Label>
                                                            <Input
                                                                type="number"
                                                                step="any"
                                                                {...register(`plannedProducts.${index}.quantity`, {
                                                                    required: 'Cantidad es requerida',
                                                                    valueAsNumber: true,
                                                                    min: { value: 0.01, message: 'Cantidad debe ser mayor que 0' }
                                                                })}
                                                                placeholder="0.00"
                                                                className="h-12 text-base"
                                                            />
                                                            {errors.plannedProducts?.[index]?.quantity && (
                                                                <p className="text-red-500 text-sm font-medium">
                                                                    {errors.plannedProducts[index].quantity.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="grid gap-2.5">
                                                            <Label className="text-sm font-semibold text-foreground">Cajas</Label>
                                                            <Input
                                                                type="number"
                                                                step="any"
                                                                {...register(`plannedProducts.${index}.boxes`, {
                                                                    required: 'Cajas son requeridas',
                                                                    valueAsNumber: true,
                                                                    min: { value: 1, message: 'Cajas debe ser al menos 1' }
                                                                })}
                                                                placeholder="0"
                                                                className="h-12 text-base"
                                                            />
                                                            {errors.plannedProducts?.[index]?.boxes && (
                                                                <p className="text-red-500 text-sm font-medium">
                                                                    {errors.plannedProducts[index].boxes.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="grid gap-2.5">
                                                            <Label className="text-sm font-semibold text-foreground">Precio unitario</Label>
                                                            <Input
                                                                type="number"
                                                                step="any"
                                                                {...register(`plannedProducts.${index}.unitPrice`, {
                                                                    required: 'Precio unitario es requerido',
                                                                    valueAsNumber: true,
                                                                    min: { value: 0.01, message: 'Precio debe ser mayor que 0' }
                                                                })}
                                                                placeholder="0.00"
                                                                className="h-12 text-base"
                                                            />
                                                            {errors.plannedProducts?.[index]?.unitPrice && (
                                                                <p className="text-red-500 text-sm font-medium">
                                                                    {errors.plannedProducts[index].unitPrice.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="grid gap-2.5">
                                                            <Label className="text-sm font-semibold text-foreground">IVA</Label>
                                                            <Controller
                                                                control={control}
                                                                name={`plannedProducts.${index}.tax`}
                                                                rules={{ required: 'IVA es requerido' }}
                                                                render={({ field }) => {
                                                                    const currentValue = field.value ? String(field.value) : "";
                                                                    
                                                                    const handleValueChange = (newValue) => {
                                                                        // Convertir a número si las opciones usan números
                                                                        const taxOption = taxOptions.find(t => String(t.value) === String(newValue));
                                                                        const finalValue = taxOption ? taxOption.value : newValue;
                                                                        field.onChange(finalValue);
                                                                    };
                                                                    
                                                                    return (
                                                                        <Select 
                                                                            value={currentValue}
                                                                            onValueChange={handleValueChange}
                                                                        >
                                                                            <SelectTrigger loading={taxLoading} className="h-12 text-base">
                                                                                <SelectValue placeholder="IVA" loading={taxLoading} />
                                                                            </SelectTrigger>
                                                                            <SelectContent loading={taxLoading} className="z-[9999]">
                                                                                {taxOptions.map((tax) => (
                                                                                    <SelectItem 
                                                                                        key={tax.value} 
                                                                                        value={String(tax.value)}
                                                                                    >
                                                                                        {tax.label}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    );
                                                                }}
                                                            />
                                                            {errors.plannedProducts?.[index]?.tax && (
                                                                <p className="text-red-500 text-sm font-medium">
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
                                            onClick={() => append({ product: '', quantity: '', boxes: '', unitPrice: '', tax: '' })}
                                            className="h-12 text-base w-full border-dashed hover:border-solid"
                                            style={{ pointerEvents: isComboboxOpen ? 'none' : 'auto' }}
                                        >
                                            <PlusCircle className="h-5 w-5 mr-2" />
                                            Añadir producto
                                        </Button>
                                    </div>
                                </div>
                            )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation Buttons - Absolute en la parte inferior del contenedor, justo encima del BottomNav */}
                    <div className="absolute bottom-0 left-0 right-0 z-40 pt-3 pb-4 px-5">
                        <div className="flex items-center justify-between gap-3">
                            {!isFirstStep && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handlePrevious}
                                    className="h-11 w-11 rounded-full hover:bg-muted/80 active:scale-95 transition-transform"
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
                                    className={`h-11 w-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 active:scale-95 transition-transform ${isFirstStep ? 'ml-auto' : ''}`}
                                    aria-label="Siguiente paso"
                                >
                                    <motion.div
                                        whileTap={{ scale: 0.8, x: 4 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    >
                                        <ChevronRight className="h-5 w-5 text-primary-foreground" />
                                    </motion.div>
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !isValid || fields.length === 0}
                                    className={`h-11 px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform ${isFirstStep ? 'ml-auto' : ''}`}
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    {isSubmitting ? 'Creando...' : 'Crear Pedido'}
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
