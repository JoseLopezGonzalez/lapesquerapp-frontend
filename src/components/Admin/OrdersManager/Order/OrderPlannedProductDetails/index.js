'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalCurrency, formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';
import { Delete, GitBranchPlus, Package, Pencil, Plus, PlusCircle, SaveIcon, SearchX, X } from 'lucide-react';
import { Combobox } from '@/components/Shadcn/Combobox';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { EmptyState } from '@/components/Utilities/EmptyState/index';

const OrderPlannedProductDetails = () => {

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
        <div className="h-full pb-2">
            <Card className='h-full flex flex-col bg-transparent'>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-medium">Previsión de productos</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Tabla con los productos previstos en el pedido
                        </p>
                    </div>
                    <div className="space-x-2">
                        <Button onClick={handleOnClickAddLine}>
                            <Plus size={16} />
                            Añadir línea
                        </Button>
                        {isSomeProductDetected && (
                            <Button variant="secondary" className='animate-pulse' onClick={handleOnClickAddDetectedProducts}>
                                <GitBranchPlus size={16} />
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
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className='text-nowrap'>
                                        <TableHead>Artículo</TableHead>
                                        <TableHead>Cajas</TableHead>
                                        <TableHead>Cantidad</TableHead>
                                        <TableHead>Precio</TableHead>
                                        <TableHead>Impuesto (%)</TableHead>
                                        <TableHead className='w-[150px] text-center'>Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {details.map((detail, index) => (
                                        <TableRow key={detail.id || detail.tempId} className='text-nowrap'>
                                            <TableCell>
                                                {editIndex === index ? (
                                                    <Combobox
                                                        options={productOptions}
                                                        value={detail.product.id}
                                                        onChange={(e) => handleInputChange(index, 'product', e)}
                                                        loading={optionsLoading}
                                                    />
                                                ) : detail.product.name}
                                            </TableCell>
                                            <TableCell>
                                                {editIndex === index ? (
                                                    <Input
                                                        type="number"
                                                        value={detail.boxes}
                                                        onChange={(e) => handleInputChange(index, 'boxes', e.target.value)}
                                                    />
                                                ) : formatInteger(detail.boxes)}
                                            </TableCell>
                                            <TableCell>
                                                {editIndex === index ? (
                                                    <Input
                                                        type="number"
                                                        value={detail.quantity}
                                                        onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
                                                    />
                                                ) : formatDecimalWeight(detail.quantity)}
                                            </TableCell>
                                            <TableCell>
                                                {editIndex === index ? (
                                                    <Input
                                                        type="number"
                                                        value={detail.unitPrice}
                                                        onChange={(e) => handleInputChange(index, 'unitPrice', e.target.value)}
                                                    />
                                                ) : formatDecimalCurrency(detail.unitPrice)}
                                            </TableCell>
                                            <TableCell>
                                                {editIndex === index ? (
                                                    <Combobox
                                                        options={taxOptions}
                                                        value={detail.tax.id}
                                                        onChange={(value) => handleInputChange(index, 'tax', value)}
                                                        loading={optionsLoading}
                                                    />
                                                ) : `${detail.tax.rate}%`}
                                            </TableCell>
                                            <TableCell className="flex gap-2 justify-center">
                                                {editIndex === index ? (
                                                    <>
                                                        <Button onClick={handleOnClickSaveLine} size='icon'>
                                                            <SaveIcon size={16} />
                                                        </Button>
                                                        <Button variant="secondary" onClick={() => handleOnClickCloseLine(detail)} size='icon'>
                                                            <Delete size={16} />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button onClick={() => setEditIndex(index)} size='icon' variant="outline">
                                                            <Pencil size={16} />
                                                        </Button>
                                                        <Button variant="secondary" onClick={() => handleOnClickDeleteLine(detail.id)} size='icon'>
                                                            <X size={16} />
                                                        </Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell>Total</TableCell>
                                        <TableCell>{formatInteger(totals.boxes)}</TableCell>
                                        <TableCell>{formatDecimalWeight(totals.quantity)}</TableCell>
                                        <TableCell>{formatDecimalCurrency(totals.averageUnitPrice)}</TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default OrderPlannedProductDetails;
