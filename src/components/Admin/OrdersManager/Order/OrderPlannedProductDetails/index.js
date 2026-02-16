'use client'

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalCurrency, formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';
import { GitBranchPlus, Plus, X, Check, Edit2, Trash2, MoreVertical, Info } from 'lucide-react';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { notify } from '@/lib/notifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const OrderPlannedProductDetails = () => {
    const isMobile = useIsMobile();
    const { options, plannedProductDetailActions, plannedProductDetails, order, mergedProductDetails } = useOrderContext();
    const scrollAreaRef = useRef(null);

    const { productOptions: rawProductOptions, taxOptions: rawTaxOptions, loading: optionsLoading } = options || {};

    // Asegurar que siempre sean arrays válidos
    const productOptions = useMemo(() => {
        if (!Array.isArray(rawProductOptions)) return [];
        return rawProductOptions.map(opt => {
            if (!opt || typeof opt !== 'object') return null;
            return {
                value: String(opt.value || ''), // Asegurar que value sea siempre string
                label: String(opt.label || '')
            };
        }).filter(Boolean); // Filtrar opciones nulas
    }, [rawProductOptions]);

    const taxOptions = useMemo(() => {
        if (!Array.isArray(rawTaxOptions)) return [];
        return rawTaxOptions.map(opt => {
            if (!opt || typeof opt !== 'object') return null;
            return {
                value: opt.value, // Mantener como número para impuestos
                label: String(opt.label || '')
            };
        }).filter(Boolean); // Filtrar opciones nulas
    }, [rawTaxOptions]);

    const [details, setDetails] = useState([]);
    const [temporaryDetails, setTemporaryDetails] = useState([]); // Estado para líneas temporales
    const [editIndex, setEditIndex] = useState(null);
    const [showTotalsDialog, setShowTotalsDialog] = useState(false);

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
        
        // Hacer scroll hasta abajo después de añadir la línea
        if (isMobile && scrollAreaRef.current) {
            setTimeout(() => {
                const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
                if (viewport) {
                    viewport.scrollTo({
                        top: viewport.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    };

    const handleEditLine = (index) => {
        setEditIndex(index);
        
        // Hacer scroll hasta la línea que se está editando para que quede visible arriba
        if (isMobile && scrollAreaRef.current) {
            setTimeout(() => {
                const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
                if (viewport) {
                    // Buscar la card correspondiente al índice
                    const cards = viewport.querySelectorAll('[data-card-index]');
                    const targetCard = Array.from(cards).find(card => {
                        const cardIndex = parseInt(card.getAttribute('data-card-index'));
                        return cardIndex === index;
                    });
                    
                    if (targetCard) {
                        targetCard.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            }, 100);
        }
    };

    const handleInputChange = useCallback((index, field, value) => {
        const updatedDetails = [...details];
        if (field.includes("product")) {
            // Asegurar que el valor sea string para productos
            const productValue = value ? String(value) : null;
            updatedDetails[index].product.id = productValue;
            // Usar Map para búsqueda O(1) en lugar de find O(n)
            updatedDetails[index].product.name = productOptionsMap.get(productValue) || '';
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
            notify.promise(plannedProductDetailActions.create(detail), {
                loading: 'Creando nueva linea...',
                success: 'Linea creada correctamente',
                error: (error) => {
                    console.error('Error al crear la linea:', error);
                    return error?.userMessage || error?.data?.userMessage || error?.response?.data?.userMessage || error?.message || 'Error al crear nueva linea';
                },
            }).then(() => {
                setTemporaryDetails(prev => prev.filter(temp => temp.tempId !== detail.tempId));
                setEditIndex(null);
            });
            return;
        }

        notify.promise(plannedProductDetailActions.update(detail.id, detail), {
            loading: 'Actualizando linea...',
            success: 'Linea actualizada correctamente',
            error: (error) => {
                console.error('Error al actualizar la linea:', error);
                return error?.userMessage || error?.data?.userMessage || error?.response?.data?.userMessage || error?.message || 'Error al actualizar la linea';
            },
        }).then(() => setEditIndex(null));
    };

    const handleOnClickDeleteLine = async (detail) => {
        // Línea temporal: solo remover del estado local (identificar por tempId, no por editIndex)
        if (!detail?.id && detail?.isTemporary) {
            setTemporaryDetails(prev => prev.filter(temp => temp.tempId !== detail.tempId));
            setEditIndex(null);
            return;
        }

        // Línea persistida: requiere id para eliminar vía API
        if (!detail?.id) return;

        notify.promise(plannedProductDetailActions.delete(detail.id), {
            loading: 'Eliminando linea...',
            success: 'Linea eliminada correctamente',
            error: (error) => {
                console.error('Error al eliminar la linea:', error);
                return error?.userMessage || error?.data?.userMessage || error?.response?.data?.userMessage || error?.message || 'Error al eliminar la linea';
            },
        }).then(() => setEditIndex(null));
    };

    const handleOnClickCloseLine = (detail) => {
        if (!detail?.id && detail?.isTemporary) {
            setTemporaryDetails(prev => prev.filter(temp => temp.tempId !== detail.tempId));
        }
        setEditIndex(null);
    };

    const handleOnClickAddDetectedProducts = () => {
        if (editIndex !== null) return;

        const detail = mergedProductDetails.find((productDetail) => productDetail.status === 'noPlanned');
        if (!detail) {
            notify.error('No hay productos detectados ');
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
                    {details.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center min-h-0">
                            <EmptyState
                                title={'No existen productos previstos'}
                                description={'Añade productos a la previsión del pedido'}
                            />
                        </div>
                    ) : (
                        <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
                            <div className="pb-20 space-y-6">
                                {/* Vista Mobile: Cards */}
                                <div className="space-y-3">
                                    {details.map((detail, index) => (
                                        <Card key={detail.id || detail.tempId} data-card-index={index} className="p-4">
                                            <div className="space-y-3">
                                                {/* Artículo */}
                                                <div>
                                                    {editIndex === index ? (
                                                        <div className="[&_button]:!h-9">
                                                            <Combobox
                                                                options={productOptions || []}
                                                                value={detail.product.id ? String(detail.product.id) : null}
                                                                onChange={(e) => handleInputChange(index, 'product', e)}
                                                                loading={optionsLoading}
                                                                placeholder="Seleccionar producto..."
                                                                searchPlaceholder="Buscar producto..."
                                                                notFoundMessage="No se encontraron productos"
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
                                                                <Select
                                                                    value={detail.tax.id != null ? String(detail.tax.id) : ''}
                                                                    onValueChange={(value) => handleInputChange(index, 'tax', value)}
                                                                >
                                                                    <SelectTrigger loading={optionsLoading} className="w-full">
                                                                        <SelectValue placeholder="IVA" loading={optionsLoading} />
                                                                    </SelectTrigger>
                                                                    <SelectContent loading={optionsLoading}>
                                                                        {(taxOptions || []).map((tax) => (
                                                                            <SelectItem key={tax.value} value={String(tax.value)}>
                                                                                {tax.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
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
                                                            <Button onClick={() => handleEditLine(index)} size="sm" variant="outline" className="flex-1">
                                                                <Edit2 size={16} className="mr-2" />
                                                                Editar
                                                            </Button>
                                                            <Button variant="destructive" onClick={() => handleOnClickDeleteLine(detail)} size="sm" className="flex-1">
                                                                <Trash2 size={16} className="mr-2" />
                                                                Eliminar
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                    {/* Footer con botones */}
                    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex items-center gap-2 z-50" style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}>
                        <Button 
                            onClick={() => setShowTotalsDialog(true)}
                            variant="outline"
                            size="icon"
                            className="min-h-[44px] min-w-[44px]"
                        >
                            <Info className="h-4 w-4" />
                        </Button>
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
                    
                    {/* Dialog de Totales */}
                    <Dialog open={showTotalsDialog} onOpenChange={setShowTotalsDialog}>
                        <DialogContent className={`${isMobile ? 'max-w-full w-full h-full max-h-full m-0 rounded-none flex flex-col' : ''}`}>
                            <DialogHeader>
                                <DialogTitle>Totales</DialogTitle>
                            </DialogHeader>
                            <div className={`${isMobile ? 'flex-1 flex flex-col items-center justify-center px-4' : ''}`}>
                                <div className={`space-y-6 ${isMobile ? 'w-full max-w-md' : ''}`}>
                                    <div className="flex flex-col space-y-6">
                                        <div className="space-y-2 text-center">
                                            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">Cajas</p>
                                            <p className="text-xl font-medium text-foreground">{formatInteger(totals.boxes)}</p>
                                        </div>
                                        <div className="space-y-2 pt-4 border-t text-center">
                                            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">Cantidad</p>
                                            <p className="text-xl font-medium text-foreground">{formatDecimalWeight(totals.quantity)}</p>
                                        </div>
                                        <div className="space-y-2 pt-4 border-t text-center">
                                            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">Precio promedio</p>
                                            <p className="text-xl font-medium text-foreground">{formatDecimalCurrency(totals.averageUnitPrice)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
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
                        <div className="h-full flex items-center justify-center">
                            <EmptyState
                                title={'No existen productos previstos'}
                                description={'Añade productos a la previsión del pedido'}
                            />
                        </div>
                    ) : (
                            <div className="border rounded-md max-h-[500px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                        <TableRow>
                                        <TableHead className="min-w-[200px]">Artículo</TableHead>
                                            <TableHead className="text-right">Cajas</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">Precio Unitario</TableHead>
                                            <TableHead className="text-right whitespace-nowrap">Impuesto</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                        {details.map((detail, index) => {
                                            const taxRate = Number(detail.tax.rate) || 0;

                                            return (
                                                <TableRow key={detail.id || detail.tempId}>
                                            <TableCell className="min-w-[500px]">
                                                {editIndex === index ? (
                                                    <Combobox
                                                        options={productOptions || []}
                                                        value={detail.product.id ? String(detail.product.id) : null}
                                                        onChange={(e) => handleInputChange(index, 'product', e)}
                                                        loading={optionsLoading}
                                                        placeholder="Seleccionar producto..."
                                                        searchPlaceholder="Buscar producto..."
                                                        notFoundMessage="No se encontraron productos"
                                                        className="w-full"
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
                                                        className="w-full text-right"
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
                                                        className="w-full text-right"
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
                                                        className="w-full text-right"
                                                    />
                                                        ) : (
                                                            formatDecimalCurrency(detail.unitPrice)
                                                        )}
                                            </TableCell>
                                                    <TableCell className="text-right whitespace-nowrap">
                                                {editIndex === index ? (
                                                    <Select
                                                        value={detail.tax.id != null ? String(detail.tax.id) : ''}
                                                        onValueChange={(value) => handleInputChange(index, 'tax', value)}
                                                    >
                                                        <SelectTrigger loading={optionsLoading} className="w-full">
                                                            <SelectValue placeholder="IVA" loading={optionsLoading} />
                                                        </SelectTrigger>
                                                        <SelectContent loading={optionsLoading}>
                                                            {(taxOptions || []).map((tax) => (
                                                                <SelectItem key={tax.value} value={String(tax.value)}>
                                                                    {tax.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                        ) : (
                                                            `${taxRate}%`
                                                        )}
                                            </TableCell>
                                                    <TableCell className="text-right whitespace-nowrap">
                                                {editIndex === index ? (
                                                    <div className="flex flex-nowrap items-center justify-end gap-2">
                                                        <Button onClick={handleOnClickSaveLine} size="sm">
                                                            <Check size={16} />
                                                        </Button>
                                                        <Button variant="secondary" onClick={() => handleOnClickCloseLine(detail)} size="sm">
                                                            <X size={16} />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-nowrap items-center justify-end gap-2">
                                                        <Button onClick={() => handleEditLine(index)} size="sm" variant="outline">
                                                            <Edit2 size={16} />
                                                        </Button>
                                                        <Button onClick={() => handleOnClickDeleteLine(detail)} size="sm" variant="destructive">
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
                                            <TableCell className="font-semibold">Totales</TableCell>
                                            <TableCell className="text-right font-semibold">{formatInteger(totals.boxes)}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatDecimalWeight(totals.quantity)}</TableCell>
                                            <TableCell colSpan={3}></TableCell>
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
