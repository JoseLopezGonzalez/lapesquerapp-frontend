import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, SaveIcon } from 'lucide-react';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';


const OrderPallets = () => {
    const { pallets } = useOrderContext()


    return (
        <>
            {
                pallets.length <= 0 ? (
                    <div className='h-full flex items-center justify-center'>
                        <Button>
                            <Plus className="h-4 w-4" />
                            Añadir palet
                        </Button>
                    </div>
                ) : (
                    <div className='h-full pb-2'>
                        <Card className='h-full flex flex-col'>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-medium">Gestión de Palets</CardTitle>
                                    <CardDescription>Modifica los palets de la orden</CardDescription>
                                </div>
                                <Button>
                                    <Plus className="h-4 w-4" />
                                    Añadir palet
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Número</TableHead>
                                            <TableHead>Productos</TableHead>
                                            <TableHead>Lotes</TableHead>
                                            <TableHead>Cajas</TableHead>
                                            <TableHead>Peso</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {
                                            pallets.map((pallet, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{pallet.id}</TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            {pallet.productsNames.map((product) => (
                                                                <div key={product}>{product}</div>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            {pallet.lots.map((lot) => (
                                                                <div key={lot}>{lot}</div>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {pallet.numberOfBoxes}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatDecimalWeight(pallet.netWeight)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        }

                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </>
    )
}

export default OrderPallets