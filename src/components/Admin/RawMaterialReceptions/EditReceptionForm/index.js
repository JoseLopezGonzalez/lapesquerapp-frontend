// components/EditReceptionForm.jsx
'use client'

import React, { useEffect, useState, useRef } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Plus, Trash2, ArrowRight, AlertTriangle, Package, Edit, Loader2, Printer, FileText } from 'lucide-react';
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
import ReceptionSummaryDialog from '@/components/Admin/RawMaterialReceptions/ReceptionSummaryDialog';
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
    const [palletMetadata, setPalletMetadata] = useState({ prices: {}, observations: '' });
    const [isPalletLabelDialogOpen, setIsPalletLabelDialogOpen] = useState(false);
    const [selectedPalletForLabel, setSelectedPalletForLabel] = useState(null);
    const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
    const [receptionPrices, setReceptionPrices] = useState([]);
    // Store original box IDs from backend to distinguish between real and temporary IDs
    const [originalBoxIds, setOriginalBoxIds] = useState(new Set());
    
    // Ref para evitar recargas innecesarias cuando se hace focus en la pestaña
    const hasLoadedRef = useRef(false);
    const lastReceptionIdRef = useRef(null);

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

    // Watch all detail fields (no calculation needed, netWeight is directly editable)
    const watchedDetails = watch('details');

    // Load reception data
    useEffect(() => {
        const loadReception = async () => {
            if (!receptionId || !session?.user?.accessToken) return;
            
            // Evitar recargar si ya se cargó esta recepción y no ha cambiado el ID
            if (hasLoadedRef.current && lastReceptionIdRef.current === receptionId) {
                return;
            }

            try {
                setLoading(true);
                const reception = await getRawMaterialReception(receptionId, session.user.accessToken);
                
                // Marcar como cargado y guardar el ID
                hasLoadedRef.current = true;
                lastReceptionIdRef.current = receptionId;
                
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
                        // Backend now returns prices array in ROOT (same format as request)
                        // Convert prices array to object { [productId-lot]: price } for easy lookup
                        const globalPricesObj = {};
                        if (reception.prices && Array.isArray(reception.prices)) {
                            // Store original prices array for summary dialog
                            setReceptionPrices(reception.prices);
                            
                            reception.prices.forEach(priceEntry => {
                                // Backend only includes prices with values (excludes null)
                                if (priceEntry.product?.id && priceEntry.lot && priceEntry.price !== null && priceEntry.price !== undefined) {
                                    const key = `${priceEntry.product.id}-${priceEntry.lot}`;
                                    globalPricesObj[key] = parseFloat(priceEntry.price).toString();
                                }
                            });
                        } else {
                            setReceptionPrices([]);
                        }
                        
                        // Collect all original box IDs from backend
                        const boxIdsSet = new Set();
                        reception.pallets.forEach(pallet => {
                            (pallet.boxes || []).forEach(box => {
                                if (box.id) {
                                    boxIdsSet.add(box.id);
                                }
                            });
                        });
                        setOriginalBoxIds(boxIdsSet);
                        
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
                            
                            // Build prices object for this pallet from global prices
                            // Filter only the prices that apply to boxes in this pallet
                            const palletPricesObj = {};
                            boxes.forEach(box => {
                                if (box.product?.id && box.lot) {
                                    const key = `${box.product.id}-${box.lot}`;
                                    if (globalPricesObj[key]) {
                                        palletPricesObj[key] = globalPricesObj[key];
                                    }
                                }
                            });
                            
                            return {
                                pallet: {
                                    id: pallet.id,
                                    boxes: boxes,
                                    numberOfBoxes: boxes.length,
                                    netWeight: boxes.reduce((sum, box) => sum + (parseFloat(box.netWeight) || 0), 0),
                                    observations: pallet.observations || '',
                                },
                                prices: palletPricesObj, // Prices filtered for this pallet's boxes
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
                // Backend details only have: id, product, netWeight, price, lot
                // We only need: product, netWeight, boxes, price, lot (no tare, no grossWeight)
                const mapDetails = (details) => {
                    if (!details || details.length === 0) return [];
                    
                    return details.map(detail => {
                        // Default values
                        let boxes = 1;
                        let price = '';
                        let lot = '';
                        
                        // Get price from detail.price field
                        if (detail.price !== null && detail.price !== undefined) {
                            price = parseFloat(detail.price).toString();
                        }
                        
                        // Get lot from detail.lot field
                        if (detail.lot) {
                            lot = detail.lot;
                        }
                        
                        // Try to get boxes count from pallets if available (to infer number of boxes)
                        // But this is just for display - boxes count might not be accurate
                        if (reception.pallets && reception.pallets.length > 0) {
                            const pallet = reception.pallets[0];
                            if (pallet.boxes && pallet.boxes.length > 0) {
                                // Find boxes for this product
                                const productBoxes = pallet.boxes.filter(box => 
                                    box.product?.id === detail.product?.id
                                );
                                if (productBoxes.length > 0) {
                                    boxes = productBoxes.length;
                                    // Try to get lot from first box if not in detail
                                    if (!lot && productBoxes[0].lot) {
                                        lot = productBoxes[0].lot;
                                    }
                                }
                            }
                        }
                        
                        return {
                            product: detail.product?.id ? detail.product.id.toString() : null,
                            netWeight: detail.netWeight || '',
                            boxes: boxes,
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
    }, [receptionId, session?.user?.accessToken]);
    
    // Resetear el flag cuando cambia el receptionId
    useEffect(() => {
        if (lastReceptionIdRef.current !== receptionId) {
            hasLoadedRef.current = false;
        }
    }, [receptionId]);

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
                // NEW STRUCTURE: boxes have product.id and lot, prices are in ROOT (not in each pallet)
                
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
                const globalPriceMap = new Map();
                validPallets.forEach(({ item, validBoxes }) => {
                    const pricesObj = item.prices || {};
                    validBoxes.forEach(box => {
                        if (box.product?.id && box.lot) {
                            const key = `${box.product.id}-${box.lot}`;
                            if (!globalPriceMap.has(key)) {
                                const priceKey = `${box.product.id}-${box.lot}`;
                                const priceValue = pricesObj[priceKey];
                                globalPriceMap.set(key, {
                                    product: { id: box.product.id },
                                    lot: box.lot,
                                    price: priceValue ? parseFloat(priceValue) : undefined,
                                });
                            }
                        }
                    });
                });

                // Build prices array in ROOT (unique combinations from all pallets)
                const prices = Array.from(globalPriceMap.values());

                // Build pallets WITHOUT prices (prices are now in root), including IDs for editing
                // IMPORTANT: Only include box.id if it's a real backend ID, otherwise set to null for new boxes
                const convertedPallets = validPallets.map(({ item, pallet, validBoxes }) => {
                    const boxes = validBoxes.map(box => {
                        const boxData = {
                            product: {
                                id: box.product.id,
                            },
                            lot: box.lot || undefined,
                            gs1128: box.gs1128 || undefined,
                            grossWeight: box.grossWeight ? parseFloat(box.grossWeight) : undefined,
                            netWeight: box.netWeight ? parseFloat(box.netWeight) : undefined,
                        };
                        
                        // Only include ID if it's a real backend ID (from originalBoxIds Set)
                        // If box.id exists but is NOT in originalBoxIds, it's a temporary ID from frontend
                        // In that case, set id to null (backend will create new box)
                        if (box.id && originalBoxIds.has(box.id)) {
                            boxData.id = box.id;
                        } else {
                            // New box - explicitly set id to null
                            boxData.id = null;
                        }
                        
                        return boxData;
                    });

                    return {
                        ...(pallet.id && { id: pallet.id }), // Include pallet ID if exists (for editing)
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
                                        <TableHead>Peso Neto (kg)</TableHead>
                                        <TableHead>Cajas</TableHead>
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
                                                    {...register(`details.${index}.netWeight`, {
                                                        required: 'El peso neto es obligatorio',
                                                        valueAsNumber: true,
                                                        min: { value: 0.01, message: 'El peso debe ser mayor que 0' }
                                                    })}
                                                    placeholder="0.00"
                                                    className="w-32"
                                                />
                                                {errors.details?.[index]?.netWeight && (
                                                    <p className="text-destructive text-xs mt-1">
                                                        {errors.details[index].netWeight.message}
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
                                                    className="w-48"
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
                                netWeight: '',
                                boxes: 1,
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
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsSummaryDialogOpen(true);
                                }}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Ver Resumen
                            </Button>
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
                                            const key = `${box.product.id}-${box.lot || ''}`;
                                            if (!productLotMap.has(key)) {
                                                productLotMap.set(key, {
                                                    productId: box.product.id,
                                                    productName: box.product.name || box.product.alias || 'Producto sin nombre',
                                                    lot: box.lot || '(sin lote)',
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
                                            <TableCell className="font-medium">
                                                {pallet.id ? `#${pallet.id}` : `Nuevo ${index + 1}`}
                                            </TableCell>
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
                                prices: palletMetadata.prices || {},
                                observations: palletMetadata.observations || pallet.observations || '',
                            };
                            return updated;
                        });
                    } else {
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

            {/* ReceptionSummaryDialog para ver resumen de productos y palets */}
            {creationMode === 'pallets' && (
                <ReceptionSummaryDialog
                    isOpen={isSummaryDialogOpen}
                    onClose={() => setIsSummaryDialogOpen(false)}
                    pallets={temporalPallets}
                    prices={(() => {
                        // Build prices array from temporalPallets (similar to handleUpdate)
                        const globalPriceMap = new Map();
                        temporalPallets.forEach((item) => {
                            const pallet = item.pallet;
                            const pricesObj = item.prices || {};
                            (pallet?.boxes || []).forEach(box => {
                                const lotIdentifier = box.lot || '';
                                if (box.product?.id && lotIdentifier !== undefined) {
                                    const key = `${box.product.id}-${lotIdentifier}`;
                                    const priceKey = `${box.product.id}-${lotIdentifier}`;
                                    const priceValue = pricesObj[priceKey];
                                    globalPriceMap.set(key, {
                                        product: { id: box.product.id },
                                        lot: lotIdentifier,
                                        price: priceValue ? parseFloat(priceValue) : undefined,
                                    });
                                }
                            });
                        });
                        return Array.from(globalPriceMap.values());
                    })()}
                    onPriceChange={(productId, lot, price) => {
                        // Sincronizar precio en todos los pallets que tengan esta combinación producto+lote
                        const priceKey = `${productId}-${lot || ''}`;
                        setTemporalPallets(prev => {
                            const updated = prev.map(item => {
                                // Verificar si este pallet tiene cajas con la misma combinación producto+lote
                                const hasMatchingCombination = item.pallet?.boxes?.some(box => {
                                    const boxKey = `${box.product?.id}-${box.lot || ''}`;
                                    return boxKey === priceKey;
                                });
                                
                                if (hasMatchingCombination) {
                                    return {
                                        ...item,
                                        prices: {
                                            ...(item.prices || {}),
                                            [priceKey]: price
                                        }
                                    };
                                }
                                return item;
                            });
                            return updated;
                        });
                    }}
                />
            )}
        </div>
    );
};

export default EditReceptionForm;

