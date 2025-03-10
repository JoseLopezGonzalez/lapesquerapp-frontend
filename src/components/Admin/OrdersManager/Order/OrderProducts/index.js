import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalCurrency, formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';
import { DeleteIcon, EditIcon, SaveIcon } from 'lucide-react';
import { Combobox } from '@/components/Shadcn/Combobox';



const OrderProducts = () => {

    const { order , productOptions } = useOrderContext();

    const [details, setDetails] = useState(order.plannedProductDetails);
    const [editIndex, setEditIndex] = useState(null);

    const addLine = () => {
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
            updatedDetails[index].tax.rate = Number(value);
        } else {
            updatedDetails[index][field] = Number(value);
        }
        setDetails(updatedDetails);
    };

    const deleteLine = (index) => {
        setDetails(details.filter((_, i) => i !== index));
        setEditIndex(null);
    };

    const clearAllLines = () => {
        setDetails([]);
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
                        <Button onClick={addLine}>Añadir línea</Button>
                        <Button variant="destructive" onClick={clearAllLines}>Eliminar todo</Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 flex-1 overflow-y-auto">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Artículo</TableHead>
                                    <TableHead>Cajas</TableHead>
                                    <TableHead>Cantidad</TableHead>
                                    <TableHead>Precio</TableHead>
                                    <TableHead>Impuesto (%)</TableHead>
                                    <TableHead>Acciones</TableHead>
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
                                                <Input
                                                    type="number"
                                                    value={detail.tax.rate}
                                                    onChange={(e) => handleInputChange(index, 'tax', e.target.value)}
                                                />
                                            ) : `${detail.tax.rate}%`}
                                        </TableCell>
                                        <TableCell className="space-x-2">
                                            {editIndex === index ? (
                                                <Button onClick={() => setEditIndex(null)} size='icon'>
                                                    <SaveIcon size={16} />
                                                </Button>
                                            ) : (
                                                <Button onClick={() => setEditIndex(index)} size='icon' variant="outline">
                                                    <EditIcon size={16} />
                                                </Button>
                                            )}
                                            <Button variant="destructive" onClick={() => deleteLine(index)} size='icon'>
                                                <DeleteIcon size={16} />
                                            </Button>
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
