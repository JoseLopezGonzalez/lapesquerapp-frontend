// components/EditReceptionForm.jsx
'use client'

import React, { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
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
import { formatDecimal } from '@/helpers/formats/numbers/formatNumbers';

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

            // Validate details
            if (!data.details || data.details.length === 0) {
                toast.error('Debe agregar al menos una línea de producto', getToastTheme());
                return;
            }

            // Prepare payload according to API documentation (Mode Automático)
            const payload = {
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

            const updatedReception = await updateRawMaterialReception(receptionId, payload);
            
            toast.success('Recepción actualizada exitosamente', getToastTheme());
            
            if (onSuccess) {
                onSuccess(updatedReception);
            } else {
                router.push(`/admin/raw-material-receptions/${updatedReception.id}`);
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
                    {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                    <ArrowRight className="ml-2 h-4 w-4" />
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

                {/* Details Table */}
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
            </form>
        </div>
    );
};

export default EditReceptionForm;

