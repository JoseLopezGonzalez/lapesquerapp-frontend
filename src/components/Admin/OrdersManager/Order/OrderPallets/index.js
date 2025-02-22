import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, SaveIcon } from 'lucide-react';


const OrderPallets = () => {
    return (
        <div className='h-full pb-2'>
            <Card className='h-full'>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-medium">Gestión de Palets</CardTitle>
                        <CardDescription>Modifica los palets de la orden</CardDescription>
                    </div>
                    <Button>
                        <Plus className="h-4 w-4"/>
                        Añadir palet
                    </Button>
                </CardHeader>
                <CardContent>
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
                            <TableRow>
                                <TableCell>2913</TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div>Pulpo Fresco -1kg</div>
                                        <div>Pulpo Fresco +1kg</div>
                                        <div>Pulpo Fresco +2kg</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div>1002250CC01001</div>
                                        <div>Lote 2</div>
                                        <div>Lote 3</div>
                                    </div>
                                </TableCell>
                                <TableCell>5</TableCell>
                                <TableCell>120.00 kg</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export default OrderPallets