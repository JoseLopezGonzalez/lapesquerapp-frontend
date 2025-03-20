import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { EmptyState } from '@/components/Utilities/EmptyState';


const OrderPallets = () => {
    const { pallets } = useOrderContext()

    return (
        <div className='h-full pb-2'>
            <Card className='h-full flex flex-col bg-transparent'>
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
                    {pallets.length === 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableBody>
                                    <TableRow className='text-nowrap'>
                                        <TableCell className='py-14'>
                                            <EmptyState
                                                title={'No existen palets vinculados'}
                                                description={'No se han añadido palets a este pedido'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
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
                                {pallets.map((pallet, index) => (
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
                                ))}
                            </TableBody>
                        </Table>)}
                </CardContent>
            </Card>
        </div>
    )
}

export default OrderPallets