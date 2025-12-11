// components/CreateReceptionForm.jsx
'use client'

import React, { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Plus, Trash2, ArrowRight, Package, List, Edit, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from 'next-auth/react';
import { useProductOptions } from '@/hooks/useProductOptions';
import { useSupplierOptions } from '@/hooks/useSupplierOptions';
import Loader from '@/components/Utilities/Loader';
import { getToastTheme } from '@/customs/reactHotToast';
import toast from 'react-hot-toast';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/datePicker';
import { format } from "date-fns";
import { createRawMaterialReception } from '@/services/rawMaterialReceptionService';
import { useRouter } from 'next/navigation';
import { formatDecimal, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import PalletDialog from '@/components/Admin/Pallets/PalletDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

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

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            supplier: null,
            date: new Date(),
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

    // Watch all detail fields to calculate net weight
    const watchedDetails = watch('details');

    // Calculate net weight for each line
    useEffect(() => {
        watchedDetails?.forEach((detail, index) => {
            const grossWeight = parseFloat(detail.grossWeight) || 0;
            const boxes = parseInt(detail.boxes) || 1;
            const tare = parseFloat(detail.tare) || 0;
            const netWeight = Math.max(0, grossWeight - (tare * boxes));
            setValue(`details.${index}.netWeight`, netWeight.toFixed(2));
        });
    }, [watchedDetails, setValue]);

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

    const handleCreate = async (data) => {
        console.log('handleCreate called with data:', data);
        console.log('Current mode:', mode);
        console.log('Temporal pallets:', temporalPallets);
        try {
            // Validate supplier
            if (!data.supplier) {
                toast.error('Debe seleccionar un proveedor', getToastTheme());
                return;
            }

            // Validate date
            if (!data.date) {
                toast.error('Debe seleccionar una fecha', getToastTheme());
                return;
            }

            let payload;

            if (mode === 'automatic') {
                // Validate details
                if (!data.details || data.details.length === 0) {
                    toast.error('Debe agregar al menos una línea de producto', getToastTheme());
                    return;
                }

                // Prepare payload for Mode Automático
                payload = {
                    supplier: {
                        id: data.supplier,
                    },
                    date: format(data.date, 'yyyy-MM-dd'),
                    notes: data.notes || '',
                    details: data.details
                        .filter(detail => detail.product && detail.netWeight && parseFloat(detail.netWeight) > 0)
                        .map(detail => ({
                            product: {
                                id: parseInt(detail.product),
                            },
                            netWeight: parseFloat(detail.netWeight),
                            price: detail.price ? parseFloat(detail.price) : undefined,
                            lot: detail.lot || undefined,
                            boxes: detail.boxes ? parseInt(detail.boxes) : undefined,
                        })),
                };

                if (payload.details.length === 0) {
                    toast.error('Debe completar al menos una línea válida con producto y peso neto', getToastTheme());
                    return;
                }
            } else {
                // Validate pallets
                if (!temporalPallets || temporalPallets.length === 0) {
                    toast.error('Debe agregar al menos un palet', getToastTheme());
                    return;
                }

                // Convert temporal pallets to API format
                // NEW STRUCTURE: boxes have product.id and lot, prices are in ROOT (not in each pallet)
                // temporalPallets is an array of { pallet: temporalPallet, prices: object, observations: string }
                
                // First, collect all valid pallets with their boxes
                const validPallets = temporalPallets
                    .filter(item => item.pallet && item.pallet.boxes && item.pallet.boxes.length > 0)
                    .map(item => {
                        const pallet = item.pallet;
                        
                        // Filter boxes that have product and netWeight
                        const validBoxes = pallet.boxes
                            .filter(box => box.product?.id && box.netWeight);
                        
                        if (validBoxes.length === 0) {
                            return null;
                        }

                        return {
                            item: item,
                            pallet: pallet,
                            validBoxes: validBoxes,
                        };
                    })
                    .filter(p => p !== null);

                if (validPallets.length === 0) {
                    toast.error('Debe completar al menos un palet válido con producto y cajas', getToastTheme());
                    return;
                }

                // Extract ALL unique product+lot combinations from ALL pallets
                // Important: Always take the price from the last pallet processed to ensure we get the latest value
                const globalPriceMap = new Map();
                validPallets.forEach(({ item, validBoxes }) => {
                    const pricesObj = item.prices || {};
                    validBoxes.forEach(box => {
                        if (box.product?.id && box.lot) {
                            const lot = box.lot || ''; // Use empty string for consistency
                            const key = `${box.product.id}-${lot}`;
                            const priceKey = `${box.product.id}-${lot}`;
                            const priceValue = pricesObj[priceKey];
                            
                            // Always update (or set) the price - this ensures we get the latest value
                            // Since prices are synchronized, all pallets should have the same price for the same combination
                            if (priceValue !== undefined && priceValue !== null && priceValue !== '') {
                                globalPriceMap.set(key, {
                                    product: { id: box.product.id },
                                    lot: lot || undefined, // Use undefined for empty string (backend expects undefined, not empty string)
                                    price: parseFloat(priceValue),
                                });
                            } else if (!globalPriceMap.has(key)) {
                                // Only set undefined price if we haven't seen this combination before
                                globalPriceMap.set(key, {
                                    product: { id: box.product.id },
                                    lot: lot || undefined,
                                    price: undefined,
                                });
                            }
                        }
                    });
                });

                // Build prices array in ROOT (unique combinations from all pallets)
                const prices = Array.from(globalPriceMap.values());

                // Build pallets WITHOUT prices (prices are now in root)
                const convertedPallets = validPallets.map(({ item, pallet, validBoxes }) => {
                    const boxes = validBoxes.map(box => ({
                        product: {
                            id: box.product.id,
                        },
                        lot: box.lot || undefined,
                        gs1128: box.gs1128 || undefined,
                        grossWeight: box.grossWeight ? parseFloat(box.grossWeight) : undefined,
                        netWeight: box.netWeight ? parseFloat(box.netWeight) : undefined,
                    }));

                    return {
                        observations: item.observations || pallet.observations || undefined,
                        boxes: boxes,
                    };
                });

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
            console.error('Error al crear recepción:', error);
            toast.error(error.message || 'Error al crear la recepción', getToastTheme());
        }
    };


    if (suppliersLoading) {
        return (
            <div className='w-full h-full flex items-center justify-center'>
                <Loader />
            </div>
        );
    }

    return (
        <div className="w-full h-full p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <h1 className="text-2xl font-semibold mb-4">Recepción de materia prima</h1>
                <Button
                    type="button"
                    onClick={() => {
                        console.log('Button clicked');
                        console.log('Form errors:', errors);
                        console.log('Current mode:', mode);
                        // Solo validar campos del modo activo
                        handleSubmit(handleCreate, (errors) => {
                            console.log('Validation errors:', errors);
                            if (errors && Object.keys(errors).length > 0) {
                                // Si estamos en modo manual, ignorar errores de details
                                if (mode === 'manual' && errors.details) {
                                    delete errors.details;
                                }
                                
                                // Si aún hay errores relevantes, mostrarlos
                                if (Object.keys(errors).length > 0) {
                                    console.log('Relevant errors:', errors);
                                    toast.error('Por favor, complete todos los campos requeridos', getToastTheme());
                                } else {
                                    // Si solo había errores en details (modo no activo), ejecutar handleCreate directamente
                                    console.log('No relevant errors, calling handleCreate directly');
                                    handleCreate(watch());
                                }
                            }
                        })();
                    }}
                    disabled={isSubmitting}
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
                                render={({ field: { onChange, value } }) => (
                                    <DatePicker
                                        date={value}
                                        onChange={onChange}
                                        formatStyle="short"
                                    />
                                )}
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
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    {...register(`details.${index}.grossWeight`, {
                                                        required: mode === 'automatic' ? 'El peso bruto es obligatorio' : false,
                                                        valueAsNumber: true,
                                                        min: mode === 'automatic' ? { value: 0.01, message: 'El peso debe ser mayor que 0' } : undefined
                                                    })}
                                                    placeholder="0.00"
                                                    className="w-32"
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
                                                            }
                                                        }}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        -
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        {...register(`details.${index}.boxes`, {
                                                            required: mode === 'automatic' ? 'Las cajas son obligatorias' : false,
                                                            valueAsNumber: true,
                                                            min: mode === 'automatic' ? { value: 1, message: 'Mínimo 1 caja' } : undefined
                                                        })}
                                                        className="w-16 text-center"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const currentBoxes = parseInt(watch(`details.${index}.boxes`)) || 1;
                                                            setValue(`details.${index}.boxes`, currentBoxes + 1);
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
                                                        <Select value={value} onValueChange={onChange}>
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
                                                        watchedDetails?.[index]?.netWeight 
                                                            ? formatDecimal(parseFloat(watchedDetails[index].netWeight) || 0) 
                                                            : '0,00'
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    {...register(`details.${index}.price`, {
                                                        valueAsNumber: true,
                                                    })}
                                                    placeholder="0.00"
                                                    className="w-32"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    {...register(`details.${index}.lot`)}
                                                    placeholder="Lote (opcional)"
                                                    className="w-32"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => remove(index)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => append({
                                        product: null,
                                        grossWeight: '',
                                        boxes: 1,
                                        tare: '3',
                                        netWeight: '',
                                        price: '',
                                        lot: '',
                                    })}
                                    className="w-full"
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
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>#</TableHead>
                                                <TableHead>Observaciones</TableHead>
                                                <TableHead>Cajas</TableHead>
                                                <TableHead>Peso Neto</TableHead>
                                                <TableHead>Producto - Lote / Precio (€/kg)</TableHead>
                                                <TableHead className="w-[120px]">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {temporalPallets.map((item, index) => {
                                                const pallet = item.pallet;
                                                
                                                // Get unique product+lot combinations from boxes
                                                const productLotMap = new Map();
                                                (pallet.boxes || []).forEach(box => {
                                                    if (box.product?.id) {
                                                        // Use empty string for undefined/null lots to maintain consistency
                                                        const lot = box.lot || '';
                                                        const key = `${box.product.id}-${lot}`;
                                                        if (!productLotMap.has(key)) {
                                                            productLotMap.set(key, {
                                                                productId: box.product.id,
                                                                productName: box.product.name || box.product.alias || 'Producto sin nombre',
                                                                lot: lot, // Use empty string, not '(sin lote)'
                                                                boxesCount: 0,
                                                                totalNetWeight: 0,
                                                            });
                                                        }
                                                        const entry = productLotMap.get(key);
                                                        entry.boxesCount += 1;
                                                        entry.totalNetWeight += parseFloat(box.netWeight || 0);
                                                    }
                                                });
                                                
                                                const productLotCombinations = Array.from(productLotMap.values());
                                                const prices = item.prices || {};

                                                return (
                                                    <TableRow key={index}>
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
                                                                                        setTemporalPallets(prev => {
                                                                                            const updated = [...prev];
                                                                                            
                                                                                            // Actualizar precio en el pallet actual
                                                                                            if (!updated[index].prices) {
                                                                                                updated[index].prices = {};
                                                                                            }
                                                                                            updated[index].prices = {
                                                                                                ...updated[index].prices,
                                                                                                [priceKey]: newPrice
                                                                                            };
                                                                                            
                                                                                            // Sincronizar precio en todos los otros pallets que tengan la misma combinación producto+lote
                                                                                            updated.forEach((palletItem, palletIdx) => {
                                                                                                if (palletIdx === index) return; // Ya actualizado arriba
                                                                                                
                                                                                                // Verificar si este pallet tiene cajas con la misma combinación producto+lote
                                                                                                const hasMatchingCombination = palletItem.pallet?.boxes?.some(box => {
                                                                                                    const boxKey = `${box.product?.id}-${box.lot || ''}`;
                                                                                                    return boxKey === priceKey;
                                                                                                });
                                                                                                
                                                                                                if (hasMatchingCombination) {
                                                                                                    if (!palletItem.prices) {
                                                                                                        updated[palletIdx].prices = {};
                                                                                                    }
                                                                                                    updated[palletIdx].prices = {
                                                                                                        ...updated[palletIdx].prices,
                                                                                                        [priceKey]: newPrice
                                                                                                    };
                                                                                                }
                                                                                            });
                                                                                            
                                                                                            return updated;
                                                                                        });
                                                                                    }}
                                                                                    placeholder="0.00"
                                                                                    className="w-28 h-8"
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
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
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

