// components/CreateReceptionForm.jsx
'use client'

import React, { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Plus, Trash2, ArrowRight, Package, List, Edit } from 'lucide-react';
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
import ReceptionPalletDialog from '@/components/Admin/RawMaterialReceptions/ReceptionPalletDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/Utilities/EmptyState';

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
    // Store pallets with metadata: { pallet: temporalPallet, price: string, lot: string, observations: string }
    const [temporalPallets, setTemporalPallets] = useState([]); // Lista de palets temporales para modo manual
    const [isPalletDialogOpen, setIsPalletDialogOpen] = useState(false);
    const [selectedPalletId, setSelectedPalletId] = useState(null);
    const [editingPalletIndex, setEditingPalletIndex] = useState(null); // Índice del palet que se está editando
    const [palletMetadata, setPalletMetadata] = useState({ price: '', lot: '', observations: '' }); // Metadata for the current pallet being edited

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

    const handleCreate = async (data) => {
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
                // The API expects: { product: { id }, price, lot, observations, boxes: [{ gs1128, grossWeight, netWeight }] }
                // temporalPallets is an array of { pallet: temporalPallet, price: string, lot: string, observations: string }
                const convertedPallets = temporalPallets
                    .filter(item => item.pallet && item.pallet.boxes && item.pallet.boxes.length > 0)
                    .map(item => {
                        const pallet = item.pallet;
                        // Get product from first box (all boxes in a pallet should have the same product in reception context)
                        const firstBox = pallet.boxes?.[0];
                        const productId = firstBox?.product?.id;
                        
                        if (!productId) {
                            return null; // Skip pallets without product
                        }

                        // Use lot from metadata, or extract common lot from boxes
                        let lot = item.lot;
                        if (!lot) {
                            const lots = pallet.boxes.map(box => box.lot).filter(Boolean);
                            const uniqueLots = [...new Set(lots)];
                            lot = uniqueLots.length === 1 ? uniqueLots[0] : undefined;
                        }
                        
                        return {
                            product: {
                                id: productId,
                            },
                            price: item.price ? parseFloat(item.price) : undefined,
                            lot: lot || undefined,
                            observations: item.observations || pallet.observations || undefined,
                            boxes: pallet.boxes
                                .filter(box => box.product && box.netWeight) // Must have product and netWeight
                                .map(box => {
                                    // Extract box data - boxes from PalletDialog have: product, lot, netWeight, gs1128 (optional)
                                    return {
                                        gs1128: box.gs1128 || undefined,
                                        grossWeight: box.grossWeight ? parseFloat(box.grossWeight) : undefined,
                                        netWeight: box.netWeight ? parseFloat(box.netWeight) : undefined,
                                    };
                                })
                                .filter(box => box.netWeight), // Must have netWeight
                        };
                    })
                    .filter(pallet => pallet !== null && pallet.boxes && pallet.boxes.length > 0);

                if (convertedPallets.length === 0) {
                    toast.error('Debe completar al menos un palet válido con producto y cajas', getToastTheme());
                    return;
                }

                // Prepare payload for Mode Manual
                payload = {
                    supplier: {
                        id: data.supplier,
                    },
                    date: format(data.date, 'yyyy-MM-dd'),
                    notes: data.notes || '',
                    pallets: convertedPallets,
                };
            }

            const createdReception = await createRawMaterialReception(payload);
            
            toast.success('Recepción creada exitosamente', getToastTheme());
            
            if (onSuccess) {
                onSuccess(createdReception);
            } else {
                router.push(`/admin/raw-material-receptions/${createdReception.id}`);
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
                    onClick={handleSubmit(handleCreate)}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Guardando...' : 'Aceptar'}
                    <ArrowRight className="ml-2 h-4 w-4" />
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
                    <Tabs value={mode} onValueChange={setMode} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
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
                                    <div className="space-y-4">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>#</TableHead>
                                                    <TableHead>Productos</TableHead>
                                                    <TableHead>Precio (€/kg)</TableHead>
                                                    <TableHead>Lote</TableHead>
                                                    <TableHead>Cajas</TableHead>
                                                    <TableHead>Peso Neto</TableHead>
                                                    <TableHead className="w-[150px]">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {temporalPallets.map((item, index) => {
                                                    const pallet = item.pallet;
                                                    // Extract product names from boxes
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
                                                            <TableCell>
                                                                <Input
                                                                    value={item.lot || ''}
                                                                    onChange={(e) => {
                                                                        setTemporalPallets(prev => {
                                                                            const updated = [...prev];
                                                                            updated[index] = { ...updated[index], lot: e.target.value };
                                                                            return updated;
                                                                        });
                                                                    }}
                                                                    placeholder="Lote"
                                                                    className="w-32"
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
                                                                            // For editing, we pass the pallet data to initialize
                                                                            setSelectedPalletId('new'); // Use 'new' since we're editing a temporal pallet
                                                                            setEditingPalletIndex(index);
                                                                            setPalletMetadata({ price: item.price || '', lot: item.lot || '', observations: item.observations || '' });
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
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </form>

            {/* ReceptionPalletDialog for creating/editing palets */}
            <ReceptionPalletDialog
                palletId={selectedPalletId}
                isOpen={isPalletDialogOpen}
                initialPallet={editingPalletIndex !== null ? temporalPallets[editingPalletIndex]?.pallet : null}
                onSave={(pallet) => {
                    // When pallet is saved, add it to temporal pallets list with metadata
                    if (editingPalletIndex !== null) {
                        // Update existing pallet
                        setTemporalPallets(prev => {
                            const updated = [...prev];
                            updated[editingPalletIndex] = {
                                pallet: pallet,
                                price: palletMetadata.price || '',
                                lot: palletMetadata.lot || '',
                                observations: palletMetadata.observations || pallet.observations || '',
                            };
                            return updated;
                        });
                    } else {
                        // Add new pallet with metadata
                        setTemporalPallets(prev => [...prev, {
                            pallet: pallet,
                            price: '',
                            lot: '',
                            observations: pallet.observations || '',
                        }]);
                    }
                    setIsPalletDialogOpen(false);
                    setSelectedPalletId(null);
                    setEditingPalletIndex(null);
                    setPalletMetadata({ price: '', lot: '', observations: '' });
                }}
                onCloseDialog={() => {
                    setIsPalletDialogOpen(false);
                    setSelectedPalletId(null);
                    setEditingPalletIndex(null);
                }}
            />
        </div>
    );
};

export default CreateReceptionForm;

