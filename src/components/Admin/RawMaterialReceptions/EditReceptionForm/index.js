// components/EditReceptionForm.jsx
'use client'

import React, { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Plus, Trash2, ArrowRight, AlertTriangle, Package, Edit, Loader2, Printer } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSession } from 'next-auth/react';
import { useProductOptions } from '@/hooks/useProductOptions';
import { useSupplierOptions } from '@/hooks/useSupplierOptions';
import Loader from '@/components/Utilities/Loader';
import { getToastTheme } from '@/customs/reactHotToast';
import toast from 'react-hot-toast';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/datePicker';
import { format } from "date-fns";
import { getRawMaterialReception, updateRawMaterialReception } from '@/services/rawMaterialReceptionService';
import { useRouter } from 'next/navigation';
import { formatDecimal, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PalletDialog from '@/components/Admin/Pallets/PalletDialog';
import PalletLabelDialog from '@/components/Admin/Pallets/PalletLabelDialog';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { getPallet } from '@/services/palletService';

const TARE_OPTIONS = [
    { value: '1', label: '1kg' },
    { value: '2', label: '2kg' },
    { value: '3', label: '3kg' },
    { value: '4', label: '4kg' },
    { value: '5', label: '5kg' },
];

const EditReceptionForm = ({ receptionId, onSuccess }) => {
    const { productOptions } = useProductOptions();
    const { supplierOptions, loading: suppliersLoading } = useSupplierOptions();
    const { data: session } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [creationMode, setCreationMode] = useState(null); // 'lines', 'pallets', or null (old receptions)
    const [canEdit, setCanEdit] = useState(true);
    const [cannotEditReason, setCannotEditReason] = useState(null);
    // Estados para modo 'pallets'
    const [temporalPallets, setTemporalPallets] = useState([]);
    const [isPalletDialogOpen, setIsPalletDialogOpen] = useState(false);
    const [selectedPalletId, setSelectedPalletId] = useState(null);
    const [editingPalletIndex, setEditingPalletIndex] = useState(null);
    const [palletMetadata, setPalletMetadata] = useState({ price: '', observations: '' });
    const [isPalletLabelDialogOpen, setIsPalletLabelDialogOpen] = useState(false);
    const [selectedPalletForLabel, setSelectedPalletForLabel] = useState(null);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            supplier: null,
            date: new Date(),
            notes: '',
            details: [],
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

    // Load reception data
    useEffect(() => {
        const loadReception = async () => {
            if (!receptionId || !session?.user?.accessToken) return;

            try {
                setLoading(true);
                const reception = await getRawMaterialReception(receptionId, session.user.accessToken);
                
                // Detectar el modo de creación y si se puede editar
                const mode = reception.creationMode || null;
                setCreationMode(mode);
                setCanEdit(reception.canEdit !== false); // Default a true si no viene
                setCannotEditReason(reception.cannotEditReason || null);
                
                // Si no se puede editar, no cargar datos
                if (!reception.canEdit) {
                    console.log('Recepción no se puede editar:', reception.cannotEditReason);
                    return;
                }
                
                // Si es modo 'pallets', cargar los palets para edición
                if (mode === 'pallets') {
                    console.log('Recepción creada por palets - cargando palets para edición');
                    
                    // Convertir palets del backend al formato temporal del frontend
                    if (reception.pallets && reception.pallets.length > 0) {
                        const convertedPallets = reception.pallets.map(pallet => {
                            // Convertir boxes del palet al formato esperado por PalletDialog
                            const boxes = (pallet.boxes || []).map(box => ({
                                id: box.id,
                                product: box.product ? {
                                    id: box.product.id,
                                    name: box.product.name || box.product.alias || '',
                                } : null,
                                lot: box.lot || '',
                                grossWeight: box.grossWeight ? parseFloat(box.grossWeight).toString() : '',
                                netWeight: box.netWeight ? parseFloat(box.netWeight).toString() : '',
                                gs1128: box.gs1128 || undefined,
                            }));
                            
                            return {
                                pallet: {
                                    id: pallet.id,
                                    boxes: boxes,
                                    numberOfBoxes: boxes.length,
                                    netWeight: boxes.reduce((sum, box) => sum + (parseFloat(box.netWeight) || 0), 0),
                                    observations: pallet.observations || '',
                                },
                                // El precio viene en costPerKg del palet, no en price
                                price: pallet.costPerKg ? parseFloat(pallet.costPerKg).toString() : '',
                                observations: pallet.observations || '',
                            };
                        });
                        
                        setTemporalPallets(convertedPallets);
                    }
                    
                    // Cargar datos básicos del formulario
                    reset({
                        supplier: reception.supplier?.id ? reception.supplier.id.toString() : null,
                        date: reception.date ? new Date(reception.date) : new Date(),
                        notes: reception.notes || '',
                    });
                    
                    return;
                }
                
                // Map details from backend structure to form structure
                // Backend details only have: id, product, netWeight, alias
                // We need to calculate/estimate grossWeight, boxes, tare, price, lot
                const mapDetails = (details) => {
                    if (!details || details.length === 0) return [];
                    
                    return details.map(detail => {
                        // Default values
                        let boxes = 1;
                        let grossWeight = '';
                        let tare = '3';
                        let price = '';
                        let lot = '';
                        
                        // Get price only from detail.price field
                        if (detail.price !== null && detail.price !== undefined) {
                            price = parseFloat(detail.price).toString();
                        }
                        
                        // Try to get data from pallets if available
                        if (reception.pallets && reception.pallets.length > 0) {
                            const pallet = reception.pallets[0]; // Assuming single palet for editing
                            if (pallet.boxes && pallet.boxes.length > 0) {
                                // Find boxes for this product
                                const productBoxes = pallet.boxes.filter(box => 
                                    box.product?.id === detail.product?.id
                                );
                                if (productBoxes.length > 0) {
                                    boxes = productBoxes.length;
                                    // Sum gross weights from boxes
                                    const totalGross = productBoxes.reduce((sum, box) => 
                                        sum + (parseFloat(box.grossWeight) || 0), 0
                                    );
                                    grossWeight = totalGross.toFixed(2);
                                    // Try to infer tare from first box
                                    if (productBoxes[0].tare) {
                                        const tareValue = productBoxes[0].tare;
                                        // Handle both string "3kg" and number 3
                                        if (typeof tareValue === 'string') {
                                            tare = tareValue.replace('kg', '').trim();
                                        } else {
                                            tare = tareValue.toString();
                                        }
                                    }
                                    // Try to get lot from first box
                                    if (productBoxes[0].lot) {
                                        lot = productBoxes[0].lot;
                                    }
                                }
                            }
                        }
                        
                        // If we don't have grossWeight from pallets, estimate it from netWeight
                        // Formula: grossWeight = netWeight + (tare * boxes)
                        // We assume 1 box by default and tare of 3kg
                        if (!grossWeight && detail.netWeight) {
                            const netW = parseFloat(detail.netWeight) || 0;
                            const t = parseFloat(tare) || 3;
                            grossWeight = (netW + (t * boxes)).toFixed(2);
                        }
                        
                        return {
                            product: detail.product?.id ? detail.product.id.toString() : null,
                            grossWeight: grossWeight || '',
                            boxes: boxes,
                            tare: tare,
                            netWeight: detail.netWeight || '',
                            price: price,
                            lot: lot,
                        };
                    });
                };
                
                // Map reception data to form values
                reset({
                    supplier: reception.supplier?.id ? reception.supplier.id.toString() : null,
                    date: reception.date ? new Date(reception.date) : new Date(),
                    notes: reception.notes || '',
                    details: mapDetails(reception.details),
                });
            } catch (error) {
                console.error('Error al cargar recepción:', error);
                toast.error(error.message || 'Error al cargar la recepción', getToastTheme());
            } finally {
                setLoading(false);
            }
        };

        loadReception();
    }, [receptionId, session, reset]);

    const handleUpdate = async (data) => {
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

            if (creationMode === 'pallets') {
                // Validate pallets
                if (!temporalPallets || temporalPallets.length === 0) {
                    toast.error('Debe agregar al menos un palet', getToastTheme());
                    return;
                }

                // Convert temporal pallets to API format (include IDs for editing)
                const convertedPallets = temporalPallets
                    .filter(item => item.pallet && item.pallet.boxes && item.pallet.boxes.length > 0)
                    .map(item => {
                        const pallet = item.pallet;
                        const firstBox = pallet.boxes?.[0];
                        const productId = firstBox?.product?.id;
                        
                        if (!productId) {
                            return null;
                        }

                        // Preparar el objeto del palet con ID si existe
                        const palletPayload = {
                            // Incluir ID del palet si existe (para editar en lugar de crear)
                            ...(pallet.id && { id: pallet.id }),
                            product: {
                                id: productId,
                            },
                            price: item.price ? parseFloat(item.price) : undefined,
                            observations: item.observations || pallet.observations || undefined,
                            boxes: pallet.boxes
                                .filter(box => box.product && box.netWeight)
                                .map(box => {
                                    // Preparar el objeto de la caja con ID si existe
                                    const boxPayload = {
                                        // Incluir ID de la caja si existe (para editar en lugar de crear)
                                        ...(box.id && { id: box.id }),
                                        gs1128: box.gs1128 || undefined,
                                        grossWeight: box.grossWeight ? parseFloat(box.grossWeight) : undefined,
                                        netWeight: box.netWeight ? parseFloat(box.netWeight) : undefined,
                                    };
                                    return boxPayload;
                                })
                                .filter(box => box.netWeight),
                        };
                        
                        return palletPayload;
                    })
                    .filter(pallet => pallet !== null && pallet.boxes && pallet.boxes.length > 0);

                if (convertedPallets.length === 0) {
                    toast.error('Debe completar al menos un palet válido con producto y cajas', getToastTheme());
                    return;
                }

                // Prepare payload for Mode Manual (pallets)
                payload = {
                    supplier: {
                        id: data.supplier,
                    },
                    date: format(data.date, 'yyyy-MM-dd'),
                    notes: data.notes || '',
                    pallets: convertedPallets,
                };
            } else {
                // Validate details
                if (!data.details || data.details.length === 0) {
                    toast.error('Debe agregar al menos una línea de producto', getToastTheme());
                    return;
                }

                // Prepare payload according to API documentation (Mode Automático)
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
            }

            const updatedReception = await updateRawMaterialReception(receptionId, payload);
            
            toast.success('Recepción actualizada exitosamente', getToastTheme());
            
            if (onSuccess) {
                onSuccess(updatedReception);
            } else {
                // Redirigir a la misma página de edición para recargar los datos actualizados
                router.push(`/admin/raw-material-receptions/${receptionId}/edit`);
            }
        } catch (error) {
            console.error('Error al actualizar recepción:', error);
            toast.error(error.message || 'Error al actualizar la recepción', getToastTheme());
        }
    };

    if (suppliersLoading || loading) {
        return (
            <div className='w-full h-full flex items-center justify-center'>
                <Loader />
            </div>
        );
    }

    // Si no se puede editar, mostrar mensaje
    if (!canEdit) {
        return (
            <div className="w-full h-full p-6">
                <div className="flex justify-between items-start mb-6">
                    <h1 className="text-2xl font-semibold mb-4">Editar recepción de materia prima</h1>
                </div>
                <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No se puede editar esta recepción</AlertTitle>
                    <AlertDescription>
                        {cannotEditReason || 'Esta recepción no se puede editar debido a restricciones del sistema.'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="w-full h-full p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <h1 className="text-2xl font-semibold mb-4">Editar recepción de materia prima</h1>
                <Button
                    type="button"
                    onClick={handleSubmit(handleUpdate)}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Guardando
                        </>
                    ) : (
                        <>
                            Guardar cambios
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>

            <form onSubmit={handleSubmit(handleUpdate)} className="flex flex-col gap-8">
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

                {/* Details Table (solo para modo lines) */}
                {creationMode !== 'pallets' && (
                <div className="w-full">
                    <h3 className="text-sm font-medium text-muted-foreground">Líneas de Producto</h3>
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
                                                    rules={{ required: 'El producto es obligatorio' }}
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
                                                        required: 'El peso bruto es obligatorio',
                                                        valueAsNumber: true,
                                                        min: { value: 0.01, message: 'El peso debe ser mayor que 0' }
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
                                                            required: 'Las cajas son obligatorias',
                                                            valueAsNumber: true,
                                                            min: { value: 1, message: 'Mínimo 1 caja' }
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
                                                    {...register(`details.${index}.price`)}
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
                )}

                {/* Pallets Section (solo para modo pallets) */}
                {creationMode === 'pallets' && (
                <div className="w-full">
                    <div className="flex justify-between items-center mb-2">
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
                    <Separator className="my-2" />

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
                        <div className="space-y-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Productos</TableHead>
                                        <TableHead>Precio (€/kg)</TableHead>
                                        <TableHead>Cajas</TableHead>
                                        <TableHead>Peso Neto</TableHead>
                                        <TableHead className="w-[150px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {temporalPallets.map((item, index) => {
                                        const pallet = item.pallet;
                                        const productsNames = pallet.boxes
                                            ?.map(box => box.product?.name)
                                            .filter(Boolean) || [];
                                        const uniqueProducts = [...new Set(productsNames)];

                                        return (
                                            <TableRow key={index}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {uniqueProducts.length > 0 ? (
                                                            uniqueProducts.map((product, idx) => (
                                                                <div key={idx} className="text-sm">{product}</div>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">Sin productos</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={item.price || ''}
                                                        onChange={(e) => {
                                                            setTemporalPallets(prev => {
                                                                const updated = [...prev];
                                                                updated[index] = { ...updated[index], price: e.target.value };
                                                                return updated;
                                                            });
                                                        }}
                                                        placeholder="0.00"
                                                        className="w-24"
                                                    />
                                                </TableCell>
                                                <TableCell>{pallet.numberOfBoxes || pallet.boxes?.length || 0}</TableCell>
                                                <TableCell>
                                                    {formatDecimalWeight(pallet.netWeight || 0)}
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
                                                                setPalletMetadata({ price: item.price || '', observations: item.observations || '' });
                                                                setIsPalletDialogOpen(true);
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        {pallet.id && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={async () => {
                                                                    try {
                                                                        if (!session?.user?.accessToken) {
                                                                            toast.error('No hay sesión autenticada', getToastTheme());
                                                                            return;
                                                                        }
                                                                        const fullPallet = await getPallet(pallet.id, session.user.accessToken);
                                                                        setSelectedPalletForLabel(fullPallet);
                                                                        setIsPalletLabelDialogOpen(true);
                                                                    } catch (error) {
                                                                        console.error('Error al cargar palet para etiqueta:', error);
                                                                        toast.error(error.message || 'Error al cargar el palet', getToastTheme());
                                                                    }
                                                                }}
                                                                title="Ver etiqueta del palet"
                                                            >
                                                                <Printer className="h-4 w-4" />
                                                            </Button>
                                                        )}
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
                        </div>
                    )}
                </div>
                )}
            </form>

            {/* PalletDialog for creating/editing palets */}
            {creationMode === 'pallets' && (
            <PalletDialog
                palletId={selectedPalletId}
                isOpen={isPalletDialogOpen}
                initialPallet={editingPalletIndex !== null ? temporalPallets[editingPalletIndex]?.pallet : null}
                onSaveTemporal={(pallet) => {
                    if (editingPalletIndex !== null) {
                        setTemporalPallets(prev => {
                            const updated = [...prev];
                            const existingPallet = updated[editingPalletIndex].pallet;
                            
                            // Preservar el ID del palet original si el nuevo no lo tiene
                            const palletWithId = pallet.id 
                                ? pallet 
                                : (existingPallet?.id ? { ...pallet, id: existingPallet.id } : pallet);
                            
                            // Preservar IDs de cajas: si el palet devuelto ya tiene IDs, usarlos
                            // Si no, intentar preservarlos del original (el PalletDialog debería preservarlos)
                            const boxesWithIds = palletWithId.boxes?.map((box) => {
                                // Si la caja ya tiene ID, usarlo (PalletDialog lo preservó)
                                if (box.id) {
                                    return box;
                                }
                                // Si no tiene ID, es una caja nueva, dejarla sin ID
                                return box;
                            }) || [];
                            
                            updated[editingPalletIndex] = {
                                pallet: {
                                    ...palletWithId,
                                    boxes: boxesWithIds,
                                    numberOfBoxes: boxesWithIds.length,
                                    netWeight: boxesWithIds.reduce((sum, box) => sum + (parseFloat(box.netWeight) || 0), 0),
                                },
                                price: palletMetadata.price || '',
                                observations: palletMetadata.observations || pallet.observations || '',
                            };
                            return updated;
                        });
                    } else {
                        setTemporalPallets(prev => [...prev, {
                            pallet: pallet,
                            price: '',
                            observations: pallet.observations || '',
                        }]);
                    }
                    setIsPalletDialogOpen(false);
                    setSelectedPalletId(null);
                    setEditingPalletIndex(null);
                    setPalletMetadata({ price: '', observations: '' });
                }}
                onChange={() => {}}
                onCloseDialog={() => {
                    setIsPalletDialogOpen(false);
                    setSelectedPalletId(null);
                    setEditingPalletIndex(null);
                }}
            />
            )}

            {/* PalletLabelDialog para ver/imprimir etiquetas de palets */}
            {creationMode === 'pallets' && (
                <PalletLabelDialog
                    isOpen={isPalletLabelDialogOpen}
                    onClose={() => {
                        setIsPalletLabelDialogOpen(false);
                        setSelectedPalletForLabel(null);
                    }}
                    pallet={selectedPalletForLabel}
                />
            )}
        </div>
    );
};

export default EditReceptionForm;

