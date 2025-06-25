import React, { useMemo, useState } from 'react';
import { Printer, FileText } from 'lucide-react';
import { useOrderContext } from '@/context/OrderContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"


import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import BoxLabelPrintDialog from '@/components/Admin/Labels/BoxLabelPrintDialog';

const OrderLabels = () => {
    const { pallets } = useOrderContext();

    const [palletIdFilter, setPalletIdFilter] = useState('');
    const [lotFilter, setLotFilter] = useState('');
    const [productFilter, setProductFilter] = useState('');
    const [selectedGroupedLines, setSelectedGroupedLines] = useState([]);
    const [selectedIndividualLines, setSelectedIndividualLines] = useState([]);

    const [isOpenLabelPrintDialog, setIsOpenLabelPrintDialog] = useState(false);
    const [labelPrintDialogBoxes, setLabelPrintDialogBoxes] = useState([]);

    // Manejadores









    // Filtros únicos
    const palletIds = useMemo(() => {
        const set = new Set();
        pallets?.forEach(p => set.add(p.id));
        return Array.from(set);
    }, [pallets]);

    const lots = useMemo(() => {
        const set = new Set();
        pallets?.forEach(p => p.boxes.forEach(b => set.add(b.lot)));
        return Array.from(set);
    }, [pallets]);

    const productNames = useMemo(() => {
        const set = new Set();
        pallets?.forEach(p => p.boxes.forEach(b => set.add(b.article.name)));
        return Array.from(set);
    }, [pallets]);

    // Agrupado por producto + lote
    const groupedBoxes = useMemo(() => {
        const map = new Map();

        pallets?.forEach(pallet => {
            pallet.boxes.forEach(box => {
                const key = `${box.article.name}-${box.lot}`;
                if (!map.has(key)) {
                    map.set(key, {
                        article: box.article,
                        lot: box.lot,
                        boxIds: [], // ← aquí guardamos los IDs
                        count: 0
                    });
                }
                const group = map.get(key);
                group.count += 1;
                group.boxIds.push(box.id); // ← agregamos el ID
            });
        });

        return Array.from(map.values());
    }, [pallets]);


    // Cajas individuales con filtro aplicado
    const filteredBoxes = useMemo(() => {
        const list = [];
        pallets?.forEach(pallet => {
            pallet.boxes.forEach(box => {
                list.push({ ...box, palletId: pallet.id });
            });
        });
        return list.filter(box =>
            (!palletIdFilter || box.palletId?.toString() === palletIdFilter) &&
            (!lotFilter || box.lot === lotFilter) &&
            (!productFilter || box.article.name === productFilter)
        );
    }, [pallets, palletIdFilter, lotFilter, productFilter]);

    const handleSelectAllGrouped = () => {
        console.log('Grouped', groupedBoxes)
        setSelectedGroupedLines(groupedBoxes)
    };

    const handleUnselectAllGrouped = () => {
        setSelectedGroupedLines([]);
    };

    const isAllGroupedSelected = useMemo(() => {
        return groupedBoxes.length > 0 && selectedGroupedLines.length === groupedBoxes.length;
    }, [groupedBoxes, selectedGroupedLines]);

    const isGroupedLineSelected = (group) => {
        return selectedGroupedLines.some(selected =>
            selected.article.id === group.article.id && selected.lot === group.lot
        );
    };

    const handleSelectGroupedLine = (group) => {
        if (isGroupedLineSelected(group)) {
            setSelectedGroupedLines(prev => prev.filter(selected =>
                !(selected.article.id === group.article.id && selected.lot === group.lot)
            ));
        } else {
            setSelectedGroupedLines(prev => [...prev, group]);
        }
    };

    const handleSelectAllIndividual = () => {
        console.log('Individual', filteredBoxes);
        setSelectedIndividualLines(filteredBoxes);
    };

    const handleUnselectAllIndividual = () => {
        setSelectedIndividualLines([]);
    };

    const isAllIndividualSelected = useMemo(() => {
        return filteredBoxes.length > 0 && selectedIndividualLines.length === filteredBoxes.length;
    }, [filteredBoxes, selectedIndividualLines]);

    const isIndividualLineSelected = (box) => {
        return selectedIndividualLines.some(selected => selected.id === box.id);
    };

    const handleSelectIndividualLine = (box) => {
        if (isIndividualLineSelected(box)) {
            setSelectedIndividualLines(prev => prev.filter(selected => selected.id !== box.id));
        } else {
            setSelectedIndividualLines(prev => [...prev, box]);
        }
    };

    const handlePrintGroupedLabels = () => {
        if (selectedGroupedLines.length === 0) {
            alert('Por favor, selecciona al menos una línea agrupada para imprimir.');
            return;
        }
        console.log('Imprimiendo etiquetas agrupadas:', selectedGroupedLines);
        /* Buscar los boxIds de cada grupo seleccionado en pallets */
        /* Extraer boxIds de cada linea y unificarlo */
        const boxIds = selectedGroupedLines.flatMap(group => group.boxIds);

        /* Extraer todas las cajas de los palets */
        const boxesOfAllPallets = pallets.flatMap(pallet => pallet.boxes);

        /* Buscar en pallets las cajas con esos ids */
        const formattedLines = boxIds.map(boxId => {
            const box = boxesOfAllPallets.find(b => b.id === boxId);
            if (!box) return null; // Si no se encuentra, retornar null
            return {
                ...box,
                product: box.article,
            };
        }).filter(box => box !== null); // Filtrar los nulls

        console.log('Formatted lines for grouped labels:', formattedLines);

        setLabelPrintDialogBoxes(formattedLines);
        setIsOpenLabelPrintDialog(true);
    };

    const handlePrintIndividualLabels = () => {
        if (selectedIndividualLines.length === 0) {
            alert('Por favor, selecciona al menos una línea individual para imprimir.');
            return;
        }
        console.log('Imprimiendo etiquetas individuales:', selectedIndividualLines);
        const formattedLines = selectedIndividualLines.map(box => ({
            ...box,
            product: box.article,
        }));
        setLabelPrintDialogBoxes(formattedLines);
        setIsOpenLabelPrintDialog(true);
    };



    return (
        <div className='h-full pb-2'>
            <Card className='h-full flex flex-col bg-transparent'>
                <CardContent className="flex-1 overflow-y-auto py-6 flex flex-col gap-6">
                    {/* Agrupadas */}
                    <Card className='flex flex-col bg-transparent'>
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

                                <Button variant="outline" size="sm" onClick={handlePrintGroupedLabels}>
                                    <Printer className="h-4 w-4" />
                                    Imprimir
                                </Button>

                            </div>

                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            handleSelectAllGrouped();
                                                        } else {
                                                            handleUnselectAllGrouped();
                                                        }
                                                    }}
                                                    checked={isAllGroupedSelected}
                                                />
                                            </TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Cajas</TableHead>
                                            {/* <TableHead>Etiquetas</TableHead> */}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupedBoxes.map((group, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={isGroupedLineSelected(group)}
                                                        onCheckedChange={() => handleSelectGroupedLine(group)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{group.article.name}</div>
                                                    <div className="text-sm text-muted-foreground">Lote: {group.lot}</div>
                                                </TableCell>
                                                <TableCell>{group.count}</TableCell>
                                                {/* <TableCell>
                                                    <Input type="number" defaultValue={group.count} className="w-20 h-8" />
                                                </TableCell> */}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Individuales */}
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium">Etiquetas Individuales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium">Etiquetas por caja individual</div>
                                    <div className="text-sm text-muted-foreground">
                                        Puedes imprimir etiquetas para cada caja individual, filtrando por Pallet, Lote o Producto
                                    </div>
                                </div>

                                <Button variant="outline" size="sm" onClick={handlePrintIndividualLabels}>
                                    <Printer className="h-4 w-4" />
                                    Imprimir
                                </Button>

                            </div>


                            {/* Filtros */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Filtro por Pallet */}
                                <Select value={palletIdFilter} onValueChange={setPalletIdFilter}>
                                    <SelectTrigger className="w-full h-10 text-sm">
                                        <SelectValue placeholder="Todos los Pallets" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos los Pallets</SelectItem>
                                        {palletIds.map((id) => (
                                            <SelectItem key={id} value={id}>
                                                {id}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Filtro por Lote */}
                                <Select value={lotFilter} onValueChange={setLotFilter}>
                                    <SelectTrigger className="w-full h-10 text-sm">
                                        <SelectValue placeholder="Todos los Lotes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos los Lotes</SelectItem>
                                        {lots.map((lot) => (
                                            <SelectItem key={lot} value={lot}>
                                                {lot}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Filtro por Producto */}
                                <Select value={productFilter} onValueChange={setProductFilter}>
                                    <SelectTrigger className="w-full h-10 text-sm">
                                        <SelectValue placeholder="Todos los Productos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos los Productos</SelectItem>
                                        {productNames.map((name) => (
                                            <SelectItem key={name} value={name}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>


                            {/* Tabla */}
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            handleSelectAllIndividual();
                                                        } else {
                                                            handleUnselectAllIndividual();
                                                        }
                                                    }}
                                                    checked={isAllIndividualSelected}
                                                />
                                            </TableHead>
                                            <TableHead>Pallet ID</TableHead>
                                            <TableHead>Caja ID</TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Lote</TableHead>
                                            <TableHead className="text-right">Peso neto (kg)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredBoxes.map((box) => (
                                            <TableRow key={box.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={isIndividualLineSelected(box)}
                                                        onCheckedChange={() => handleSelectIndividualLine(box)}
                                                    />
                                                </TableCell>
                                                <TableCell>{box.palletId}</TableCell>
                                                <TableCell>{box.id}</TableCell>
                                                <TableCell>{box.article.name}</TableCell>
                                                <TableCell>{box.lot}</TableCell>
                                                <TableCell className="text-right">{box.netWeight}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>


            <BoxLabelPrintDialog
                open={isOpenLabelPrintDialog}
                onClose={() => setIsOpenLabelPrintDialog(false)}
                boxes={labelPrintDialogBoxes}
            />

        </div>
    );
};

export default OrderLabels;
