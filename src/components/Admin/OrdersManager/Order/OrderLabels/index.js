import React from 'react';
import { Printer, FileText } from 'lucide-react';
import { useOrderContext } from '@/context/OrderContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const OrderLabels = () => {
    const { pallets } = useOrderContext();

    // Agrupado por producto + lote
    const groupedBoxes = React.useMemo(() => {
        const map = new Map();

        pallets?.forEach(pallet => {
            pallet.boxes.forEach(box => {
                const key = `${box.article.name}-${box.lot}`;
                if (!map.has(key)) {
                    map.set(key, {
                        articleName: box.article.name,
                        lot: box.lot,
                        count: 0
                    });
                }
                map.get(key).count += 1;
            });
        });

        return Array.from(map.values());
    }, [pallets]);

    return (
        <div className='h-full pb-2'>
            <Card className='h-full flex flex-col bg-transparent'>
                <CardContent className="flex-1 overflow-y-auto py-6  flex flex-col gap-6">
                    <Card className=' flex flex-col bg-transparent'>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium">Etiquetas Agrupadas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium">Etiquetas por lote y producto</div>
                                    <div className="text-sm text-muted-foreground">
                                        Puedes imprimir un número determinado de etiquetas por cada grupo
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Printer className="h-4 w-4 mr-2" />
                                            Imprimir
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[200px]">
                                        <DropdownMenuItem>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Etiqueta estándar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Etiqueta con precio
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Etiqueta logística
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox />
                                            </TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Cajas</TableHead>
                                            <TableHead>Etiquetas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupedBoxes.map((group, index) => (
                                            <TableRow key={index}>
                                                <TableCell><Checkbox /></TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{group.articleName}</div>
                                                    <div className="text-sm text-muted-foreground">Lote: {group.lot}</div>
                                                </TableCell>
                                                <TableCell>{group.count}</TableCell>
                                                <TableCell>
                                                    <Input type="number" defaultValue={group.count} className="w-20 h-8" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tarjeta de etiquetas individuales */}
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium">Etiquetas Individuales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-sm text-muted-foreground mb-2">
                                Lista completa de cajas con su producto, lote, peso y pallet.
                            </div>
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]"><Checkbox /></TableHead>
                                            <TableHead>Pallet ID</TableHead>
                                            <TableHead>Caja ID</TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Lote</TableHead>
                                            <TableHead className="text-right">Peso neto (kg)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pallets?.map(pallet =>
                                            pallet.boxes.map(box => (
                                                <TableRow key={box.id}>
                                                    <TableCell><Checkbox /></TableCell>
                                                    <TableCell>{pallet.id}</TableCell>
                                                    <TableCell>{box.id}</TableCell>
                                                    <TableCell>{box.article.name}</TableCell>
                                                    <TableCell>{box.lot}</TableCell>
                                                    <TableCell className="text-right">{box.netWeight}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
};

export default OrderLabels;
