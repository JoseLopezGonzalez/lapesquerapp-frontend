'use client'

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalCurrency, formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';
import { Delete, Pencil, Plus, SaveIcon, X } from 'lucide-react';
import { Combobox } from '@/components/Shadcn/Combobox';
import toast from 'react-hot-toast';
import { darkToastTheme } from '@/customs/reactHotToast';



const OrderProducts = () => {

    const { options, plannedProductDetailActions , plannedProductDetails } = useOrderContext();

    const { productOptions, taxOptions } = options;

    const [details, setDetails] = useState([]);
    const [editIndex, setEditIndex] = useState(null);

    useEffect(() => {
        setDetails(plannedProductDetails);
    }, [plannedProductDetails]);

    const handleOnClickAddLine = () => {
        if (editIndex !== null) return;

        setDetails([...details, {
            product: { name: "", id: null },
            boxes: 0,
            quantity: 0,
            unitPrice: 0,
            tax: { rate: 0 }
        }]);
        setEditIndex(details.length);
    };

    const handleInputChange = (index, field, value) => {
        const updatedDetails = [...details];
        if (field.includes("product")) {
            updatedDetails[index].product.id = value;
            updatedDetails[index].product.name = productOptions.find(option => option.value === value).label;
        } else if (field.includes("tax")) {
            updatedDetails[index].tax.id = Number(value);
            updatedDetails[index].tax.rate = taxOptions.find(option => option.value === value).label;
        } else {
            updatedDetails[index][field] = Number(value);
        }
        setDetails(updatedDetails);
    };

    const handleOnClickSaveLine = async () => {
        const detail = details[editIndex];

        /* conversion datos enteros y decimales*/
        detail.boxes = Number(detail.boxes);
        detail.quantity = Number(detail.quantity);
        detail.unitPrice = Number(detail.unitPrice);

        if (!detail.id) {
            const toastId = toast.loading('Creando nueva linea...', darkToastTheme);
            plannedProductDetailActions.create(detail)
                .then(() => {
                    toast.success('Linea creada correctamente', { id: toastId });
                    setEditIndex(null);
                })
                .catch((error) => {
                    console.error('Error al crear la linea:', error);
                    toast.error('Error al crear nueva linea', { id: toastId });
                });
            return;
        }


        /* Toast */
        const toastId = toast.loading('Actualizando linea...', darkToastTheme);

        plannedProductDetailActions.update(detail.id, detail)
            .then(() => {
                toast.success('Linea actualizada correctamente', { id: toastId });
                setEditIndex(null);
            })
            .catch((error) => {
                console.error('Error al actualizar la linea:', error);
                toast.error('Error al actualizar la linea', { id: toastId });
            });
    };

    const handleOnClickDeleteLine = async (detailId) => {

        const toastId = toast.loading('Eliminando linea...', darkToastTheme);

        plannedProductDetailActions.delete(detailId)
            .then(() => {
                toast.success('Linea eliminada correctamente', { id: toastId });
                setDetails(details.filter((detail) => detail.id !== detailId));
                setEditIndex(null);
            })
            .catch((error) => {
                console.error('Error al eliminar la linea:', error);
                toast.error('Error al eliminar la linea', { id: toastId });
            });
    };

    const handleOnClickCloseLine = (detail) => {
        if (!detail.id) {
            setDetails(details.splice(0, details.length - 1));
        }
        setEditIndex(null);
    };


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
        <div className="h-full pb-2 ">
            <Card className='h-full flex flex-col'>
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
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 overflow-y-auto">
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
                                    <TableRow key={index} className='text-nowrap'>
                                        <TableCell>
                                            {editIndex === index ? (
                                                <Combobox
                                                    options={productOptions}
                                                    value={detail.product.id}
                                                    onChange={(e) => handleInputChange(index, 'product', e)}
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
                </CardContent>
            </Card>
        </div>
    );
};

export default OrderProducts;
