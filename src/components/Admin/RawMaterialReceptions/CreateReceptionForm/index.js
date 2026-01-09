// components/CreateReceptionForm.jsx
'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Plus, Trash2, ArrowRight, Package, List, Edit, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from 'next-auth/react';
import { useProductOptions } from '@/hooks/useProductOptions';
import { useSupplierOptions } from '@/hooks/useSupplierOptions';
import { usePriceSynchronization } from '@/hooks/usePriceSynchronization';
import Loader from '@/components/Utilities/Loader';
import { getToastTheme } from '@/customs/reactHotToast';
import toast from 'react-hot-toast';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/datePicker';
import { format } from "date-fns";
import { createRawMaterialReception } from '@/services/rawMaterialReceptionService';
import { useRouter } from 'next/navigation';
import { formatDecimal, formatDecimalWeight, formatDecimalCurrency } from '@/helpers/formats/numbers/formatNumbers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load PalletDialog for code splitting
const PalletDialog = dynamic(
    () => import('@/components/Admin/Pallets/PalletDialog'),
    { 
        loading: () => <div className="flex items-center justify-center p-4">Cargando...</div>,
        ssr: false 
    }
);
import { normalizeDate, calculateNetWeight, calculateNetWeights } from '@/helpers/receptionCalculations';
import { 
    extractGlobalPriceMap, 
    transformPalletsToApiFormat, 
    transformDetailsToApiFormat,
    buildProductLotSummary,
    createPriceKey
} from '@/helpers/receptionTransformations';
import { formatReceptionError, logReceptionError } from '@/helpers/receptionErrorHandler';
import { 
    validateSupplier, 
    validateDate, 
    validateReceptionDetails, 
    validateTemporalPallets 
} from '@/helpers/receptionValidators';
import { VirtualizedTable } from '../VirtualizedTable';
import { useAccessibilityAnnouncer } from '../AccessibilityAnnouncer';

const TARE_OPTIONS = [
    { value: '1', label: '1kg' },
    { value: '2', label: '2kg' },
    { value: '3', label: '3kg' },
    { value: '4', label: '4kg' },
    { value: '5', label: '5kg' },
];

const CreateReceptionForm = ({ onSuccess }) => {
    const { productOptions } = useProductOptions();
    const { supplierOptions, loading: suppliersLoading } = useSupplierOptions();
    const { data: session } = useSession();
    const router = useRouter();

    const [mode, setMode] = useState('automatic'); // 'automatic' or 'manual'
    // Store pallets with metadata: { pallet: temporalPallet, prices: { [productId-lot]: price }, observations: string }
    const [temporalPallets, setTemporalPallets] = useState([]); // Lista de palets temporales para modo manual
    const [isPalletDialogOpen, setIsPalletDialogOpen] = useState(false);
    const [selectedPalletId, setSelectedPalletId] = useState(null);
    const [editingPalletIndex, setEditingPalletIndex] = useState(null); // Índice del palet que se está editando
    const [palletMetadata, setPalletMetadata] = useState({ prices: {}, observations: '' }); // Metadata for the current pallet being edited
    const [isModeChangeDialogOpen, setIsModeChangeDialogOpen] = useState(false);
    const [pendingMode, setPendingMode] = useState(null); // Nuevo modo pendiente de confirmación

    // Use optimized price synchronization hook
    const { updatePrice } = usePriceSynchronization(temporalPallets, setTemporalPallets);

    // Accessibility announcer for screen readers
    const { announce, Announcer } = useAccessibilityAnnouncer();

    // Memoize pallets display data to avoid recalculating on every render
    const palletsDisplayData = useMemo(() => {
        return temporalPallets.map((item) => {
            const pallet = item.pallet;
            const productLotCombinations = buildProductLotSummary(pallet);
            return {
                item,
                pallet,
                productLotCombinations,
            };
        });
    }, [temporalPallets]);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            supplier: null,
            date: normalizeDate(new Date()),
            notes: '',
            details: [
                {
                    product: null,
                    grossWeight: '',
                    boxes: 1,
                    tare: '3',
                    netWeight: '',
                    price: '',
                    lot: '',
                }
            ],
        },
        mode: 'onChange',
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'details',
    });

    // Watch all detail fields to calculate net weight and amounts
    // Watch the entire details array to catch all changes
    const watchedDetails = watch('details');
    
    // State to force recalculation when values change
    const [recalcKey, setRecalcKey] = useState(0);
    
    // Helper function to trigger recalculation - declared early so it can be used in useEffect
    const triggerRecalc = useCallback(() => {
        // Force update by getting latest values and triggering state update
        setRecalcKey(prev => prev + 1);
    }, []);
    
    // Use watchedDetails as current details
    const currentDetails = watchedDetails || [];

    // Calculate net weights using useMemo for performance (only recalculate when relevant values change)
    const calculatedNetWeights = useMemo(() => {
        if (!currentDetails || !Array.isArray(currentDetails)) return [];
        return calculateNetWeights(currentDetails);
    }, [currentDetails, recalcKey]);

    // Update form values only when calculated weights change
    useEffect(() => {
        if (calculatedNetWeights.length > 0 && currentDetails && Array.isArray(currentDetails)) {
            calculatedNetWeights.forEach((netWeight, index) => {
                if (index < currentDetails.length) {
                    const calculatedWeight = parseFloat(netWeight.toFixed(2));
                    const currentNetWeight = parseFloat(currentDetails[index]?.netWeight) || 0;
                    // Only update if different to avoid infinite loops
                    if (Math.abs(currentNetWeight - calculatedWeight) > 0.001) {
                        setValue(`details.${index}.netWeight`, calculatedWeight.toFixed(2), { 
                            shouldValidate: false, 
                            shouldDirty: false,
                            shouldTouch: false
                        });
                        // Trigger recalculation after updating net weight
                        setTimeout(() => triggerRecalc(), 10);
                    }
                }
            });
        }
    }, [calculatedNetWeights, setValue, triggerRecalc]);

    // Calculate totals (total kg and total amount) for lines mode
    const linesTotals = useMemo(() => {
        if (!currentDetails || !Array.isArray(currentDetails)) {
            return { totalKg: 0, totalAmount: 0 };
        }
        let totalKg = 0;
        let totalAmount = 0;
        currentDetails.forEach((detail) => {
            const netWeight = parseFloat(detail?.netWeight) || 0;
            const price = parseFloat(detail?.price) || 0;
            totalKg += netWeight;
            totalAmount += netWeight * price;
        });
        return { totalKg, totalAmount };
    }, [currentDetails, recalcKey]);
    
    // Also watch for changes in watchedDetails and trigger recalculation
    // Create a serialized version to detect actual changes
    const detailsSerialized = useMemo(() => {
        if (!watchedDetails || !Array.isArray(watchedDetails)) return '';
        return JSON.stringify(watchedDetails.map(d => ({
            grossWeight: d?.grossWeight || '',
            boxes: d?.boxes || 1,
            tare: d?.tare || '3',
            netWeight: d?.netWeight || '',
            price: d?.price || ''
        })));
    }, [watchedDetails]);
    
    useEffect(() => {
        if (detailsSerialized) {
            // Small delay to ensure form state is updated
            const timer = setTimeout(() => {
                setRecalcKey(prev => prev + 1);
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [detailsSerialized]);

    // Verificar si hay datos en el modo actual
    const hasDataInCurrentMode = () => {
        if (mode === 'automatic') {
            // Verificar si hay detalles con datos ingresados
            const details = watch('details') || [];
            // Si hay más de una línea, hay datos
            if (details.length > 1) {
                return true;
            }
            // Si hay una línea con cualquier dato ingresado (producto, peso bruto, precio, lote)
            return details.some(detail => 
                detail.product || 
                (detail.grossWeight && parseFloat(detail.grossWeight) > 0) ||
                (detail.price && parseFloat(detail.price) > 0) ||
                (detail.lot && detail.lot.trim() !== '')
            );
        } else {
            // Verificar si hay palets temporales
            return temporalPallets && temporalPallets.length > 0;
        }
    };

    // Manejar el intento de cambio de modo
    const handleModeChange = (newMode) => {
        // Si no hay datos, cambiar directamente
        if (!hasDataInCurrentMode()) {
            setMode(newMode);
            return;
        }

        // Si hay datos, mostrar diálogo de confirmación
        setPendingMode(newMode);
        setIsModeChangeDialogOpen(true);
    };

    // Confirmar cambio de modo y limpiar datos
    const handleConfirmModeChange = () => {
        if (mode === 'automatic') {
            // Limpiar detalles del modo automático
            setValue('details', [{
                product: null,
                grossWeight: '',
                boxes: 1,
                tare: '3',
                netWeight: '',
                price: '',
                lot: '',
            }]);
        } else {
            // Limpiar palets temporales del modo manual
            setTemporalPallets([]);
        }

        // Cambiar al nuevo modo
        setMode(pendingMode);
        setIsModeChangeDialogOpen(false);
        setPendingMode(null);
    };

    // Cancelar cambio de modo
    const handleCancelModeChange = () => {
        setIsModeChangeDialogOpen(false);
        setPendingMode(null);
    };

    const handleCreate = useCallback(async (data) => {
        try {
            // Validate using centralized validators
            const supplierError = validateSupplier(data.supplier);
            if (supplierError) {
                toast.error(supplierError, getToastTheme());
                return;
            }

            const dateError = validateDate(data.date);
            if (dateError) {
                toast.error(dateError, getToastTheme());
                return;
            }

            let payload;

            if (mode === 'automatic') {
                // Validate details using centralized validator
                const detailsError = validateReceptionDetails(data.details);
                if (detailsError) {
                    toast.error(detailsError, getToastTheme());
                    return;
                }

                // Transform details using utility function
                const transformedDetails = transformDetailsToApiFormat(data.details);

                if (transformedDetails.length === 0) {
                    toast.error('Debe completar al menos una línea válida con producto y peso neto', getToastTheme());
                    return;
                }

                // Prepare payload for Mode Automático
                payload = {
                    supplier: {
                        id: data.supplier,
                    },
                    date: format(data.date, 'yyyy-MM-dd'),
                    notes: data.notes || '',
                    details: transformedDetails,
                };
            } else {
                // Validate pallets using centralized validator
                const palletsError = validateTemporalPallets(temporalPallets);
                if (palletsError) {
                    toast.error(palletsError, getToastTheme());
                    return;
                }

                // Extract global prices using utility function
                const globalPriceMap = extractGlobalPriceMap(temporalPallets);
                const prices = Array.from(globalPriceMap.values());

                // Transform pallets to API format using utility function
                const convertedPallets = transformPalletsToApiFormat(temporalPallets);

                if (convertedPallets.length === 0) {
                    toast.error('Debe completar al menos un palet válido con producto y cajas', getToastTheme());
                    return;
                }

                // Prepare payload for Mode Manual - prices in ROOT
                payload = {
                    supplier: {
                        id: data.supplier,
                    },
                    date: format(data.date, 'yyyy-MM-dd'),
                    notes: data.notes || '',
                    prices: prices, // ← In ROOT, shared by all pallets
                    pallets: convertedPallets,
                };
            }

            const createdReception = await createRawMaterialReception(payload);
            
            toast.success('Recepción creada exitosamente', getToastTheme());
            
            if (onSuccess) {
                onSuccess(createdReception);
            } else {
                router.push(`/admin/raw-material-receptions/${createdReception.id}/edit`);
            }
        } catch (error) {
            const errorInfo = logReceptionError(error, 'create', { mode, hasPallets: temporalPallets.length });
            toast.error(formatReceptionError(error, 'create'), getToastTheme());
        }
    }, [mode, temporalPallets, onSuccess, router]);

    // Keyboard shortcuts (moved after isSubmitting and handleCreate declarations)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+S or Cmd+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (!isSubmitting) {
                    handleSubmit(handleCreate, (errors) => {
                        if (errors && Object.keys(errors).length > 0) {
                            if (mode === 'manual' && errors.details) {
                                delete errors.details;
                            }
                            if (Object.keys(errors).length > 0) {
                                toast.error('Por favor, complete todos los campos requeridos', getToastTheme());
                            } else {
                                handleCreate(watch());
                            }
                        }
                    })();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSubmitting, mode, handleSubmit, handleCreate, watch]);

    if (suppliersLoading) {
        return (
            <div className='w-full h-full flex items-center justify-center'>
                <Loader />
            </div>
        );
    }

    return (
        <div className="w-full h-full p-6">
            {/* Accessibility announcer */}
            <Announcer />
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <h1 className="text-2xl font-semibold mb-4">Recepción de materia prima</h1>
                <Button
                    type="button"
                    onClick={() => {
                        // Solo validar campos del modo activo
                        handleSubmit(handleCreate, (errors) => {
                            if (errors && Object.keys(errors).length > 0) {
                                // Si estamos en modo manual, ignorar errores de details
                                if (mode === 'manual' && errors.details) {
                                    delete errors.details;
                                }
                                
                                // Si aún hay errores relevantes, mostrarlos
                                if (Object.keys(errors).length > 0) {
                                    toast.error('Por favor, complete todos los campos requeridos', getToastTheme());
                                } else {
                                    // Si solo había errores en details (modo no activo), ejecutar handleCreate directamente
                                    handleCreate(watch());
                                }
                            }
                        })();
                    }}
                    disabled={isSubmitting}
                    aria-label="Guardar recepción"
                    title="Guardar recepción (Ctrl+S)"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Guardando
                        </>
                    ) : (
                        <>
                            Aceptar
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>

            <form onSubmit={handleSubmit(handleCreate)} className="flex flex-col gap-8">
                {/* Supplier and Date Section */}
                <div className="w-full">
                    <h3 className="text-sm font-medium text-muted-foreground">Información General</h3>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="supplier">Proveedor</Label>
                            <Controller
                                name="supplier"
                                control={control}
                                rules={{ required: 'El proveedor es obligatorio' }}
                                render={({ field: { onChange, value } }) => (
                                    <Combobox
                                        options={supplierOptions}
                                        value={value}
                                        onChange={onChange}
                                        placeholder="Seleccionar proveedor"
                                        searchPlaceholder="Buscar proveedor..."
                                        notFoundMessage="No se encontraron proveedores"
                                        aria-label="Seleccionar proveedor"
                                        aria-required="true"
                                    />
                                )}
                            />
                            {errors.supplier && (
                                <p className="text-destructive text-sm">{errors.supplier.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Fecha</Label>
                            <Controller
                                name="date"
                                control={control}
                                rules={{ required: 'La fecha es obligatoria' }}
                                render={({ field: { onChange, value } }) => {
                                    // Ensure value is always a valid Date instance
                                    const normalizedValue = value instanceof Date && !isNaN(value.getTime()) 
                                        ? value 
                                        : normalizeDate(value || new Date());
                                    
                                    // Normalize onChange to ensure date is always valid
                                    const handleDateChange = (newDate) => {
                                        const normalized = normalizeDate(newDate);
                                        onChange(normalized);
                                    };
                                    
                                    return (
                                        <DatePicker
                                            date={normalizedValue}
                                            onChange={handleDateChange}
                                            formatStyle="short"
                                            aria-label="Seleccionar fecha de recepción"
                                            aria-required="true"
                                        />
                                    );
                                }}
                            />
                            {errors.date && (
                                <p className="text-destructive text-sm">{errors.date.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Observations Field */}
                <div className="w-full">
                    <h3 className="text-sm font-medium text-muted-foreground">Observaciones</h3>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                        <Label htmlFor="notes">Observaciones / Lonja</Label>
                        <Textarea
                            id="notes"
                            {...register('notes')}
                            placeholder="Ingrese observaciones..."
                            className="min-h-[80px]"
                        />
                    </div>
                </div>

                {/* Mode Selection Tabs */}
                <div className="w-full">
                    <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
                        <TabsList className="w-fit">
                            <TabsTrigger value="automatic">
                                <List className="h-4 w-4 mr-2" />
                                Por Líneas
                            </TabsTrigger>
                            <TabsTrigger value="manual">
                                <Package className="h-4 w-4 mr-2" />
                                Por Palets
                            </TabsTrigger>
                        </TabsList>

                        {/* Automatic Mode - Details Table */}
                        <TabsContent value="automatic" className="mt-4">
                            <div className="w-full">
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Líneas de Producto</h3>
                                <Separator className="my-2" />
                    <div className="space-y-4">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Artículo</TableHead>
                                        <TableHead>Peso Bruto</TableHead>
                                        <TableHead>Cajas</TableHead>
                                        <TableHead>Tara</TableHead>
                                        <TableHead>Peso Neto</TableHead>
                                        <TableHead>Precio (€/kg)</TableHead>
                                        <TableHead>Importe</TableHead>
                                        <TableHead>Lote</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell>
                                                <Controller
                                                    name={`details.${index}.product`}
                                                    control={control}
                                                    rules={{ 
                                                        required: mode === 'automatic' ? 'El producto es obligatorio' : false
                                                    }}
                                                    render={({ field: { onChange, value } }) => (
                                                        <Combobox
                                                            options={productOptions}
                                                            value={value}
                                                            onChange={onChange}
                                                            placeholder="Seleccionar producto"
                                                            searchPlaceholder="Buscar producto..."
                                                            notFoundMessage="No se encontraron productos"
                                                            className="min-w-[200px]"
                                                            aria-label={`Producto para línea ${index + 1}`}
                                                            aria-required={mode === 'automatic'}
                                                        />
                                                    )}
                                                />
                                                {errors.details?.[index]?.product && (
                                                    <p className="text-destructive text-xs mt-1">
                                                        {errors.details[index].product.message}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Controller
                                                    name={`details.${index}.grossWeight`}
                                                    control={control}
                                                    rules={{
                                                        required: mode === 'automatic' ? 'El peso bruto es obligatorio' : false,
                                                        min: mode === 'automatic' ? { value: 0.01, message: 'El peso debe ser mayor que 0' } : undefined
                                                    }}
                                                    render={({ field: { onChange, value, ...field } }) => (
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={value || ''}
                                                            onChange={(e) => {
                                                                onChange(e.target.value);
                                                                // Trigger recalculation of net weight and amounts
                                                                setTimeout(() => triggerRecalc(), 0);
                                                            }}
                                                            placeholder="0.00"
                                                            className="w-32"
                                                            aria-label={`Peso bruto para línea ${index + 1}`}
                                                            aria-required={mode === 'automatic'}
                                                        />
                                                    )}
                                                />
                                                {errors.details?.[index]?.grossWeight && (
                                                    <p className="text-destructive text-xs mt-1">
                                                        {errors.details[index].grossWeight.message}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const currentBoxes = parseInt(watch(`details.${index}.boxes`)) || 1;
                                                            if (currentBoxes > 1) {
                                                                setValue(`details.${index}.boxes`, currentBoxes - 1);
                                                                setTimeout(() => triggerRecalc(), 0);
                                                            }
                                                        }}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        -
                                                    </Button>
                                                    <Controller
                                                        name={`details.${index}.boxes`}
                                                        control={control}
                                                        rules={{
                                                            required: mode === 'automatic' ? 'Las cajas son obligatorias' : false,
                                                            min: mode === 'automatic' ? { value: 1, message: 'Mínimo 1 caja' } : undefined
                                                        }}
                                                        render={({ field: { onChange, value, ...field } }) => (
                                                            <Input
                                                                {...field}
                                                                type="number"
                                                                min="1"
                                                                value={value || 1}
                                                                onChange={(e) => {
                                                                    onChange(e.target.value);
                                                                }}
                                                                className="w-16 text-center"
                                                                aria-label={`Número de cajas para línea ${index + 1}`}
                                                                aria-required={mode === 'automatic'}
                                                            />
                                                        )}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const currentBoxes = parseInt(watch(`details.${index}.boxes`)) || 1;
                                                            setValue(`details.${index}.boxes`, currentBoxes + 1);
                                                            setTimeout(() => triggerRecalc(), 0);
                                                        }}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                                {errors.details?.[index]?.boxes && (
                                                    <p className="text-destructive text-xs mt-1">
                                                        {errors.details[index].boxes.message}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Controller
                                                    name={`details.${index}.tare`}
                                                    control={control}
                                                    render={({ field: { onChange, value } }) => (
                                                        <Select value={value} onValueChange={(newValue) => {
                                                            onChange(newValue);
                                                            setTimeout(() => triggerRecalc(), 0);
                                                        }}>
                                                            <SelectTrigger className="w-24">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {TARE_OPTIONS.map((option) => (
                                                                    <SelectItem key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    readOnly
                                                    className="w-32 bg-muted"
                                                    placeholder="0,00"
                                                    value={
                                                        (() => {
                                                            const detail = currentDetails?.[index];
                                                            const netWeight = detail?.netWeight;
                                                            return netWeight 
                                                                ? formatDecimal(parseFloat(netWeight) || 0) 
                                                                : '0,00';
                                                        })()
                                                    }
                                                    aria-label={`Peso neto calculado para línea ${index + 1}`}
                                                    aria-readonly="true"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Controller
                                                    name={`details.${index}.price`}
                                                    control={control}
                                                    render={({ field: { onChange, value, ...field } }) => (
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={value || ''}
                                                            onChange={(e) => {
                                                                onChange(e.target.value);
                                                                // Trigger recalculation of net weight and amounts
                                                                setTimeout(() => triggerRecalc(), 0);
                                                            }}
                                                            placeholder="0.00"
                                                            className="w-32"
                                                            aria-label={`Precio por kilogramo para línea ${index + 1}`}
                                                        />
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    readOnly
                                                    className="w-32 bg-muted"
                                                    placeholder="0,00 €"
                                                    value={
                                                        (() => {
                                                            const detail = currentDetails?.[index];
                                                            const netWeight = parseFloat(detail?.netWeight) || 0;
                                                            const price = parseFloat(detail?.price) || 0;
                                                            return formatDecimalCurrency(netWeight * price);
                                                        })()
                                                    }
                                                    aria-label={`Importe para línea ${index + 1}`}
                                                    aria-readonly="true"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    {...register(`details.${index}.lot`)}
                                                    placeholder="Lote (opcional)"
                                                    className="w-32"
                                                    aria-label={`Lote para línea ${index + 1}`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        remove(index);
                                                        announce(`Línea ${index + 1} eliminada`, 'polite');
                                                    }}
                                                    className="text-destructive hover:text-destructive"
                                                    aria-label={`Eliminar línea ${index + 1}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-right font-semibold">
                                            Total
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {formatDecimalWeight(linesTotals.totalKg)}
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell className="font-semibold">
                                            {formatDecimalCurrency(linesTotals.totalAmount)}
                                        </TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        append({
                                            product: null,
                                            grossWeight: '',
                                            boxes: 1,
                                            tare: '3',
                                            netWeight: '',
                                            price: '',
                                            lot: '',
                                        });
                                        const newIndex = fields.length;
                                        announce(`Línea ${newIndex + 1} agregada`, 'polite');
                                    }}
                                    className="w-full"
                                    aria-label="Agregar nueva línea de producto"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar línea
                                </Button>
                            </div>
                        </div>
                        </TabsContent>

                        {/* Manual Mode - Pallets List */}
                        <TabsContent value="manual" className="mt-4">
                            <div className="w-full space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-medium text-muted-foreground">Palets de la Recepción</h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedPalletId('new');
                                            setEditingPalletIndex(null);
                                            setIsPalletDialogOpen(true);
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Agregar Palet
                                    </Button>
                                </div>
                                <Separator />

                                {temporalPallets.length === 0 ? (
                                    <Card>
                                        <CardContent className="py-8">
                                            <EmptyState
                                                title="No hay palets agregados"
                                                description="Haz clic en 'Agregar Palet' para crear el primer palet de esta recepción"
                                            />
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <VirtualizedTable
                                        items={palletsDisplayData}
                                        headers={[
                                            { label: '#', className: '' },
                                            { label: 'Observaciones', className: '' },
                                            { label: 'Cajas', className: '' },
                                            { label: 'Peso Neto', className: '' },
                                            { label: 'Producto - Lote / Precio (€/kg)', className: '' },
                                            { label: 'Acciones', className: 'w-[120px]' },
                                        ]}
                                        threshold={50}
                                        rowHeight={80}
                                        renderRow={(displayItem, index) => {
                                            const { item, pallet, productLotCombinations } = displayItem;
                                            const prices = item.prices || {};
                                            
                                            return (
                                                <>
                                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                                    <TableCell className="max-w-[200px]">
                                                        <div className="text-sm">
                                                            {item.observations || (
                                                                <span className="text-muted-foreground italic">Sin observaciones</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{pallet.numberOfBoxes || pallet.boxes?.length || 0}</TableCell>
                                                    <TableCell>{formatDecimalWeight(pallet.netWeight || 0)}</TableCell>
                                                    <TableCell>
                                                        <div className="space-y-2">
                                                            {productLotCombinations.length === 0 ? (
                                                                <span className="text-sm text-muted-foreground">No hay productos</span>
                                                            ) : (
                                                                productLotCombinations.map((combo, comboIdx) => {
                                                                    const priceKey = `${combo.productId}-${combo.lot}`;
                                                                    const currentPrice = prices[priceKey] || '';
                                                                    
                                                                    return (
                                                                        <div key={comboIdx} className="flex items-center gap-3 py-1 border-b last:border-0">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-medium text-sm">{combo.productName}</span>
                                                                                    <span className="text-xs text-muted-foreground font-mono">({combo.lot})</span>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        {combo.boxesCount} cajas · {formatDecimalWeight(combo.totalNetWeight)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <Input
                                                                                type="number"
                                                                                step="0.01"
                                                                                min="0"
                                                                                value={currentPrice}
                                                                                onChange={(e) => {
                                                                                    const newPrice = e.target.value;
                                                                                    // Update price in current pallet first
                                                                                    setTemporalPallets(prev => {
                                                                                        const updated = [...prev];
                                                                                        if (!updated[index].prices) {
                                                                                            updated[index].prices = {};
                                                                                        }
                                                                                        updated[index].prices = {
                                                                                            ...updated[index].prices,
                                                                                            [priceKey]: newPrice
                                                                                        };
                                                                                        return updated;
                                                                                    });
                                                                                    // Then synchronize to other pallets using optimized hook (O(n) instead of O(n²))
                                                                                    updatePrice(priceKey, newPrice);
                                                                                    announce(`Precio actualizado para ${combo.productName}`, 'polite');
                                                                                }}
                                                                                placeholder="0.00"
                                                                                className="w-28 h-8"
                                                                                aria-label={`Precio para ${combo.productName}, lote ${combo.lot}`}
                                                                            />
                                                                        </div>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => {
                                                                    setSelectedPalletId('new');
                                                                    setEditingPalletIndex(index);
                                                                    setPalletMetadata({ prices: item.prices || {}, observations: item.observations || '' });
                                                                    setIsPalletDialogOpen(true);
                                                                }}
                                                                aria-label={`Editar palet ${index + 1}`}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                onClick={() => {
                                                                    setTemporalPallets(prev => prev.filter((_, i) => i !== index));
                                                                    announce(`Palet ${index + 1} eliminado`, 'polite');
                                                                }}
                                                                aria-label={`Eliminar palet ${index + 1}`}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </>
                                            );
                                        }}
                                    />
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </form>

            {/* PalletDialog for creating/editing palets */}
            <PalletDialog
                palletId={selectedPalletId}
                isOpen={isPalletDialogOpen}
                initialPallet={editingPalletIndex !== null ? temporalPallets[editingPalletIndex]?.pallet : null}
                onSaveTemporal={(pallet) => {
                    // When pallet is saved, add it to temporal pallets list with metadata
                    if (editingPalletIndex !== null) {
                        // Update existing pallet
                        setTemporalPallets(prev => {
                            const updated = [...prev];
                            updated[editingPalletIndex] = {
                                pallet: pallet,
                                prices: palletMetadata.prices || {},
                                observations: palletMetadata.observations || pallet.observations || '',
                            };
                            return updated;
                        });
                    } else {
                        // Add new pallet with metadata
                        setTemporalPallets(prev => [...prev, {
                            pallet: pallet,
                            prices: {},
                            observations: pallet.observations || '',
                        }]);
                    }
                    setIsPalletDialogOpen(false);
                    setSelectedPalletId(null);
                    setEditingPalletIndex(null);
                    setPalletMetadata({ prices: {}, observations: '' });
                }}
                onChange={() => {}} // We handle saving manually via onSaveTemporal
                onCloseDialog={() => {
                    setIsPalletDialogOpen(false);
                    setSelectedPalletId(null);
                    setEditingPalletIndex(null);
                }}
            />

            {/* Dialog de confirmación para cambio de modo */}
            <Dialog open={isModeChangeDialogOpen} onOpenChange={setIsModeChangeDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            Cambiar modo de recepción
                        </DialogTitle>
                        <DialogDescription>
                            {mode === 'automatic' 
                                ? 'Ya has agregado líneas de producto en el modo "Por Líneas". Si cambias a "Por Palets", se perderán todos los datos ingresados.'
                                : 'Ya has agregado palets en el modo "Por Palets". Si cambias a "Por Líneas", se perderán todos los palets ingresados.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            ¿Estás seguro de que deseas cambiar de modo? Esta acción eliminará todos los datos del modo actual y no se puede deshacer.
                        </p>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={handleCancelModeChange}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmModeChange}
                        >
                            Cambiar y eliminar datos
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CreateReceptionForm;

