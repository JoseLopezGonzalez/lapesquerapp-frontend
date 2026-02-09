'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalCurrency, formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';
import { GitBranchPlus, Plus, X, Check, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Combobox } from '@/components/Shadcn/Combobox';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const OrderPlannedProductDetails = () => {
    const isMobile = useIsMobile();
    const { options, plannedProductDetailActions, plannedProductDetails, order, mergedProductDetails } = useOrderContext();

    const { productOptions, taxOptions, loading: optionsLoading } = options;

    const [details, setDetails] = useState([]);
    const [temporaryDetails, setTemporaryDetails] = useState([]); // Estado para líneas temporales
    const [editIndex, setEditIndex] = useState(null);

    // Crear Maps para búsquedas O(1) en lugar de O(n)
    const productOptionsMap = useMemo(() => {
        const map = new Map();
        productOptions.forEach(option => {
            map.set(option.value, option.label);
        });
        return map;
    }, [productOptions]);

    const taxOptionsMap = useMemo(() => {
        const map = new Map();
        taxOptions.forEach(option => {
            map.set(option.value, option.label);
        });
        return map;
    }, [taxOptions]);

    // Memoizar la combinación de detalles
    const allDetails = useMemo(() => {
        return [...plannedProductDetails, ...temporaryDetails];
    }, [plannedProductDetails, temporaryDetails]);

    useEffect(() => {
        setDetails(allDetails);
    }, [allDetails]);

    const handleOnClickAddLine = () => {
        if (editIndex !== null) return;

        const newTemporaryDetail = {
            product: { name: "", id: null },
            boxes: '',
            quantity: '',
            unitPrice: '',
            tax: { rate: 0 },
            isTemporary: true, // Marca para identificar líneas temporales
            tempId: Date.now() + Math.random() // ID único temporal para identificación
        };
        
        setTemporaryDetails([...temporaryDetails, newTemporaryDetail]);
        // El índice será la posición final en la lista combinada
        setEditIndex(plannedProductDetails.length + temporaryDetails.length);
    };

    const handleInputChange = useCallback((index, field, value) => {
        const updatedDetails = [...details];
        if (field.includes("product")) {
            updatedDetails[index].product.id = value;
            // Usar Map para búsqueda O(1) en lugar de find O(n)
            updatedDetails[index].product.name = productOptionsMap.get(value) || '';
        } else if (field.includes("tax")) {
            updatedDetails[index].tax.id = Number(value);
            // Usar Map para búsqueda O(1) en lugar de find O(n)
            updatedDetails[index].tax.rate = taxOptionsMap.get(Number(value)) || '';
        } else {
            updatedDetails[index][field] = value == '' ? '' : Number(value);
        }
        setDetails(updatedDetails);

        // También actualizar el estado temporal si es una línea temporal
        if (updatedDetails[index].isTemporary) {
            const tempIndex = temporaryDetails.findIndex(temp => temp.tempId === updatedDetails[index].tempId);
            if (tempIndex !== -1) {
                const updatedTemporaryDetails = [...temporaryDetails];
                updatedTemporaryDetails[tempIndex] = updatedDetails[index];
                setTemporaryDetails(updatedTemporaryDetails);
            }
        }
    }, [details, temporaryDetails, productOptionsMap, taxOptionsMap]);

    const handleOnClickSaveLine = async () => {
        const detail = details[editIndex];

        /* conversion datos enteros y decimales*/
        detail.boxes = Number(detail.boxes);
        detail.quantity = Number(detail.quantity);
        detail.unitPrice = Number(detail.unitPrice);

        if (!detail.id) {
            detail.orderId = order.id;
            const toastId = toast.loading('Creando nueva linea...', getToastTheme());
            plannedProductDetailActions.create(detail)
                .then(() => {
                    toast.success('Linea creada correctamente', { id: toastId });
                    // Remover la línea temporal del estado local usando tempId
                    setTemporaryDetails(temporaryDetails.filter(temp => temp.tempId !== detail.tempId));
                    setEditIndex(null);
                })
                .catch((error) => {
                    console.error('Error al crear la linea:', error);
                    // Priorizar userMessage sobre message para mostrar errores en formato natural
                    const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al crear nueva linea';
                    toast.error(errorMessage, { id: toastId });
                });
            return;
        }

        /* Toast */
        const toastId = toast.loading('Actualizando linea...', getToastTheme());

        plannedProductDetailActions.update(detail.id, detail)
            .then(() => {
                toast.success('Linea actualizada correctamente', { id: toastId });
                setEditIndex(null);
            })
            .catch((error) => {
                console.error('Error al actualizar la linea:', error);
                // Priorizar userMessage sobre message para mostrar errores en formato natural
                const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al actualizar la linea';
                toast.error(errorMessage, { id: toastId });
            });
    };

    const handleOnClickDeleteLine = async (detailId) => {
        // Si es una línea temporal, solo removerla del estado local
        if (detailId === null || detailId === undefined) {
            const detail = details[editIndex];
            if (detail.isTemporary) {
                setTemporaryDetails(temporaryDetails.filter(temp => temp.tempId !== detail.tempId));
            }
            setEditIndex(null);
            return;
        }

        const toastId = toast.loading('Eliminando linea...', getToastTheme());

        plannedProductDetailActions.delete(detailId)
            .then(() => {
                toast.success('Linea eliminada correctamente', { id: toastId });
                setEditIndex(null);
            })
            .catch((error) => {
                console.error('Error al eliminar la linea:', error);
                // Priorizar userMessage sobre message para mostrar errores en formato natural
                const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al eliminar la linea';
                toast.error(errorMessage, { id: toastId });
            });
    };

    const handleOnClickCloseLine = (detail) => {
        if (!detail.id) {
            // Remover línea temporal del estado local usando tempId
            setTemporaryDetails(temporaryDetails.filter(temp => temp.tempId !== detail.tempId));
        }
        setEditIndex(null);
    };

    const handleOnClickAddDetectedProducts = () => {
        if (editIndex !== null) return;

        const detail = mergedProductDetails.find((productDetail) => productDetail.status === 'noPlanned');
        if (!detail) {
            toast.error('No hay productos detectados ', getToastTheme());
            return;
        }
        const product = detail.product;
        const newTemporaryDetail = {
            product: { name: product.name, id: product.id },
            boxes: detail.productionBoxes,
            quantity: detail.productionQuantity,
            unitPrice: '',
            tax: { rate: 0 },
            isTemporary: true,
            tempId: Date.now() + Math.random() // ID único temporal para identificación
        };
        
        setTemporaryDetails([...temporaryDetails, newTemporaryDetail]);
        // El índice será la posición final en la lista combinada
        setEditIndex(plannedProductDetails.length + temporaryDetails.length);
    };

    const isSomeProductDetected = mergedProductDetails.some((productDetail) => productDetail.status === 'noPlanned');

    const totals = details.reduce(
        (acc, item) => {
            const quantity = Number(item.quantity);
            const unitPrice = Number(item.unitPrice);
            const boxes = Number(item.boxes);

            acc.quantity += quantity;
            acc.boxes += boxes;
            acc.totalAmount += quantity * unitPrice;

            return acc;
        },
        { quantity: 0, boxes: 0, totalAmount: 0 }
    );

    totals.averageUnitPrice = totals.quantity ? (totals.totalAmount / totals.quantity) : 0;

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {isMobile ? (
                <div className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="pb-20 space-y-6">
                            {details.length === 0 ? (
                                <div className="rounded-md border">
                                    <div className="py-14 px-4">
                                        <EmptyState
                                            title={'No existen productos previstos'}
                                            description={'Añade productos a la previsión del pedido'}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Vista Mobile: Cards */}
                                    <div className="space-y-3">
                                    {details.map((detail, index) => (
                                        <Card key={detail.id || detail.tempId} className="p-4">
                                            <div className="space-y-3">
                                                {/* Artículo */}
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1.5">Artículo</p>
                                                    {editIndex === index ? (
                                                        <div className="[&_button]:!h-9">
                                                            <Combobox
                                                                options={productOptions}
                                                                value={detail.product.id}
                                                                onChange={(e) => handleInputChange(index, 'product', e)}
                                                                loading={optionsLoading}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm font-medium py-2">{detail.product.name || 'Sin producto'}</p>
                                                    )}
                                                </div>
                                                
                                                {/* Información en grid */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1.5">Cajas</p>
                                                        {editIndex === index ? (
                                                            <Input
                                                                type="number"
                                                                value={detail.boxes}
                                                                onChange={(e) => handleInputChange(index, 'boxes', e.target.value)}
                                                                className="!h-9"
                                                            />
                                                        ) : (
                                                            <p className="text-sm font-medium py-2">{formatInteger(detail.boxes)}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1.5">Cantidad</p>
                                                        {editIndex === index ? (
                                                            <Input
                                                                type="number"
                                                                value={detail.quantity}
                                                                onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
                                                                className="!h-9"
                                                            />
                                                        ) : (
                                                            <p className="text-sm font-medium py-2">{formatDecimalWeight(detail.quantity)}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1.5">Precio</p>
                                                        {editIndex === index ? (
                                                            <Input
                                                                type="number"
                                                                value={detail.unitPrice}
                                                                onChange={(e) => handleInputChange(index, 'unitPrice', e.target.value)}
                                                                className="!h-9"
                                                            />
                                                        ) : (
                                                            <p className="text-sm font-medium py-2">{formatDecimalCurrency(detail.unitPrice)}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1.5">Impuesto (%)</p>
                                                        {editIndex === index ? (
                                                            <div className="[&_button]:!h-9">
                                                                <Combobox
                                                                    options={taxOptions}
                                                                    value={detail.tax.id}
                                                                    onChange={(value) => handleInputChange(index, 'tax', value)}
                                                                    loading={optionsLoading}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm font-medium py-2">{detail.tax.rate}%</p>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Acciones */}
                                                <div className="flex gap-2 pt-3 border-t">
                                                    {editIndex === index ? (
                                                        <>
                                                            <Button onClick={handleOnClickSaveLine} size="sm" className="flex-1">
                                                                <Check size={16} className="mr-2" />
                                                                Guardar
                                                            </Button>
                                                            <Button variant="secondary" onClick={() => handleOnClickCloseLine(detail)} size="sm" className="flex-1">
                                                                <X size={16} className="mr-2" />
                                                                Cancelar
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button onClick={() => setEditIndex(index)} size="sm" variant="outline" className="flex-1">
                                                                <Edit2 size={16} className="mr-2" />
                                                                Editar
                                                            </Button>
                                                            <Button variant="secondary" onClick={() => handleOnClickDeleteLine(detail.id)} size="sm" className="flex-1">
                                                                <Trash2 size={16} className="mr-2" />
                                                                Eliminar
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    
                                    {/* Totales Mobile */}
                                    <Card className="p-4 bg-muted/30 border-2">
                                        <div className="space-y-4">
                                            <p className="text-base font-semibold text-foreground">Totales</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cajas</p>
                                                    <p className="text-base font-semibold text-foreground">{formatInteger(totals.boxes)}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cantidad</p>
                                                    <p className="text-base font-semibold text-foreground">{formatDecimalWeight(totals.quantity)}</p>
                                                </div>
                                                <div className="space-y-1 col-span-2 pt-2 border-t">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Precio promedio</p>
                                                    <p className="text-base font-semibold text-foreground">{formatDecimalCurrency(totals.averageUnitPrice)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                        </>
                            )}
                        </div>
                    </ScrollArea>
                    {/* Footer con botones */}
                    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex items-center gap-2 z-50" style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}>
                        <Button 
                            onClick={handleOnClickAddLine} 
                            size="sm"
                            className="flex-1 min-h-[44px]"
                        >
                            <Plus size={16} className="mr-2" />
                            Añadir línea
                        </Button>
                        {isSomeProductDetected && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="outline"
                                        size="icon"
                                        className="min-h-[44px] min-w-[44px]"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={handleOnClickAddDetectedProducts}
                                        className="animate-pulse"
                                    >
                                        <GitBranchPlus size={16} className="mr-2" />
                                        Añadir productos detectados
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            ) : (
                <Card className='h-full flex flex-col bg-transparent'>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-medium">Previsión de productos</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Tabla con los productos previstos en el pedido
                            </p>
                        </div>
                        <div className="space-x-2">
                            <Button onClick={handleOnClickAddLine} size="default">
                                <Plus size={16} className="mr-2" />
                                Añadir línea
                            </Button>
                            {isSomeProductDetected && (
                                <Button variant="secondary" className="animate-pulse" onClick={handleOnClickAddDetectedProducts} size="default">
                                    <GitBranchPlus size={16} className="mr-2" />
                                    Añadir productos detectados
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 flex-1 overflow-y-auto">
                        {details.length === 0 ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableBody>
                                        <TableRow className='text-nowrap'>
                                            <TableCell className='py-14'>
                                                <EmptyState
                                                    title={'No existen productos previstos'}
                                                    description={'Añade productos a la previsión del pedido'}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="border rounded-md max-h-[500px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Artículo</TableHead>
                                            <TableHead className="text-right">Cajas</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">Precio Unitario</TableHead>
                                            <TableHead className="text-right">Impuesto</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {details.map((detail, index) => {
                                            const quantity = Number(detail.quantity);
                                            const unitPrice = Number(detail.unitPrice);
                                            const subtotal = quantity * unitPrice;
                                            const taxRate = Number(detail.tax.rate) || 0;
                                            const total = subtotal * (1 + taxRate / 100);

                                            return (
                                                <TableRow key={detail.id || detail.tempId}>
                                                    <TableCell>
                                                        {editIndex === index ? (
                                                            <Combobox
                                                                options={productOptions}
                                                                value={detail.product.id}
                                                                onChange={(e) => handleInputChange(index, 'product', e)}
                                                                loading={optionsLoading}
                                                            />
                                                        ) : (
                                                            detail.product.name || 'Sin producto'
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {editIndex === index ? (
                                                            <Input
                                                                type="number"
                                                                value={detail.boxes}
                                                                onChange={(e) => handleInputChange(index, 'boxes', e.target.value)}
                                                                className="w-20 text-right"
                                                            />
                                                        ) : (
                                                            formatInteger(detail.boxes)
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {editIndex === index ? (
                                                            <Input
                                                                type="number"
                                                                value={detail.quantity}
                                                                onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
                                                                className="w-24 text-right"
                                                            />
                                                        ) : (
                                                            formatDecimalWeight(detail.quantity)
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {editIndex === index ? (
                                                            <Input
                                                                type="number"
                                                                value={detail.unitPrice}
                                                                onChange={(e) => handleInputChange(index, 'unitPrice', e.target.value)}
                                                                className="w-24 text-right"
                                                            />
                                                        ) : (
                                                            formatDecimalCurrency(detail.unitPrice)
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {editIndex === index ? (
                                                            <Combobox
                                                                options={taxOptions}
                                                                value={detail.tax.id}
                                                                onChange={(e) => handleInputChange(index, 'tax', e)}
                                                                loading={optionsLoading}
                                                            />
                                                        ) : (
                                                            `${taxRate}%`
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatDecimalCurrency(subtotal)}</TableCell>
                                                    <TableCell className="text-right">{formatDecimalCurrency(total)}</TableCell>
                                                    <TableCell className="text-right">
                                                        {editIndex === index ? (
                                                            <div className="flex justify-end gap-1">
                                                                <Button onClick={handleOnClickSaveLine} size="sm">
                                                                    <Check size={16} />
                                                                </Button>
                                                                <Button variant="secondary" onClick={() => handleOnClickCloseLine(detail)} size="sm">
                                                                    <X size={16} />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-end gap-1">
                                                                <Button onClick={() => setEditIndex(index)} size="sm" variant="outline">
                                                                    <Edit2 size={16} />
                                                                </Button>
                                                                <Button onClick={() => handleOnClickDeleteLine(detail)} size="sm" variant="outline" className="text-destructive hover:text-destructive">
                                                                    <Trash2 size={16} />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-right font-semibold">Totales</TableCell>
                                            <TableCell className="text-right font-semibold">{formatInteger(totals.boxes)}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatDecimalWeight(totals.quantity)}</TableCell>
                                            <TableCell colSpan={2}></TableCell>
                                            <TableCell className="text-right font-semibold">{formatDecimalCurrency(totals.averageUnitPrice)}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatDecimalCurrency(totals.totalAmount)}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default OrderPlannedProductDetails;
