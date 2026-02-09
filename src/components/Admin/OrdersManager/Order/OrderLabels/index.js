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
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';


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
    const isMobile = useIsMobile();

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
        pallets?.forEach(p => p.boxes.forEach(b => b.product?.name && set.add(b.product.name)));
        return Array.from(set);
    }, [pallets]);

    // Agrupado por producto + lote
    const groupedBoxes = useMemo(() => {
        const map = new Map();

        pallets?.forEach(pallet => {
            pallet.boxes.forEach(box => {
                if (!box.product?.name) return; // Skip boxes without product
                const key = `${box.product.name}-${box.lot}`;
                if (!map.has(key)) {
                    map.set(key, {
                        product: box.product,
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
            (!palletIdFilter || palletIdFilter === '' || box.palletId?.toString() === palletIdFilter) &&
            (!lotFilter || lotFilter === '' || box.lot === lotFilter) &&
            (!productFilter || productFilter === '' || box.product?.name === productFilter)
        );
    }, [pallets, palletIdFilter, lotFilter, productFilter]);

    const handleSelectAllGrouped = () => {
        // console.log('Grouped', groupedBoxes)
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
            selected.product?.id === group.product?.id && selected.lot === group.lot
        );
    };

    const handleSelectGroupedLine = (group) => {
        if (isGroupedLineSelected(group)) {
            setSelectedGroupedLines(prev => prev.filter(selected =>
                !(selected.product?.id === group.product?.id && selected.lot === group.lot)
            ));
        } else {
            setSelectedGroupedLines(prev => [...prev, group]);
        }
    };

    const handleSelectAllIndividual = () => {
        // console.log('Individual', filteredBoxes);
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
        // console.log('Imprimiendo etiquetas agrupadas:', selectedGroupedLines);
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
                product: box.product,
            };
        }).filter(box => box !== null); // Filtrar los nulls

        // console.log('Formatted lines for grouped labels:', formattedLines);

        setLabelPrintDialogBoxes(formattedLines);
        setIsOpenLabelPrintDialog(true);
    };

    const handlePrintIndividualLabels = () => {
        if (selectedIndividualLines.length === 0) {
            alert('Por favor, selecciona al menos una línea individual para imprimir.');
            return;
        }
        // console.log('Imprimiendo etiquetas individuales:', selectedIndividualLines);
        const formattedLines = selectedIndividualLines.map(box => ({
            ...box,
            product: box.product,
        }));
        setLabelPrintDialogBoxes(formattedLines);
        setIsOpenLabelPrintDialog(true);
    };



    return (
        <div className={isMobile ? "flex-1 flex flex-col min-h-0" : "h-full pb-2"}>
            {isMobile ? (
                <div className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="px-4 py-6 space-y-6">
                            {/* Agrupadas */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-semibold">Etiquetas Agrupadas</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Etiquetas por lote y producto
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handlePrintGroupedLabels} disabled={selectedGroupedLines.length === 0}>
                                        <Printer className="h-4 w-4 mr-2" />
                                        Imprimir
                                    </Button>
                                </div>

                                {/* Checkbox seleccionar todos */}
                                <div className="flex items-center gap-2 pb-2 border-b">
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
                                    <label className="text-sm font-medium cursor-pointer" onClick={() => {
                                        if (isAllGroupedSelected) {
                                            handleUnselectAllGrouped();
                                        } else {
                                            handleSelectAllGrouped();
                                        }
                                    }}>
                                        Seleccionar todos
                                    </label>
                                </div>

                                {/* Cards de grupos */}
                                <div className="space-y-2">
                                    {groupedBoxes.map((group, index) => (
                                        <Card key={index} className="border">
                                            <CardContent className="p-3">
                                                <div className="flex items-start gap-3">
                                                    <Checkbox
                                                        checked={isGroupedLineSelected(group)}
                                                        onCheckedChange={() => handleSelectGroupedLine(group)}
                                                        className="mt-0.5"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold truncate">{group.product?.name}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <p className="text-xs text-muted-foreground">Lote: {group.lot}</p>
                                                            <p className="text-xs font-medium">{group.count} cajas</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Individuales */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-semibold">Etiquetas Individuales</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Etiquetas por caja individual
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handlePrintIndividualLabels} disabled={selectedIndividualLines.length === 0}>
                                        <Printer className="h-4 w-4 mr-2" />
                                        Imprimir
                                    </Button>
                                </div>

                                {/* Filtros */}
                                <div className="space-y-2">
                                    <Select value={palletIdFilter || "all"} onValueChange={(value) => setPalletIdFilter(value === "all" ? "" : value)}>
                                        <SelectTrigger className="w-full h-11">
                                            <SelectValue placeholder="Todos los Pallets" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los Pallets</SelectItem>
                                            {palletIds.map((id) => (
                                                <SelectItem key={id} value={String(id)}>
                                                    {id}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={lotFilter || "all"} onValueChange={(value) => setLotFilter(value === "all" ? "" : value)}>
                                        <SelectTrigger className="w-full h-11">
                                            <SelectValue placeholder="Todos los Lotes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los Lotes</SelectItem>
                                            {lots.map((lot) => (
                                                <SelectItem key={lot} value={lot}>
                                                    {lot}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={productFilter || "all"} onValueChange={(value) => setProductFilter(value === "all" ? "" : value)}>
                                        <SelectTrigger className="w-full h-11">
                                            <SelectValue placeholder="Todos los Productos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los Productos</SelectItem>
                                            {productNames.map((name) => (
                                                <SelectItem key={name} value={name}>
                                                    {name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Checkbox seleccionar todos */}
                                <div className="flex items-center gap-2 pb-2 border-b">
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
                                    <label className="text-sm font-medium cursor-pointer" onClick={() => {
                                        if (isAllIndividualSelected) {
                                            handleUnselectAllIndividual();
                                        } else {
                                            handleSelectAllIndividual();
                                        }
                                    }}>
                                        Seleccionar todos
                                    </label>
                                </div>

                                {/* Cards de cajas individuales */}
                                <div className="space-y-2">
                                    {filteredBoxes.map((box) => (
                                        <Card key={box.id} className="border">
                                            <CardContent className="p-3">
                                                <div className="flex items-start gap-3">
                                                    <Checkbox
                                                        checked={isIndividualLineSelected(box)}
                                                        onCheckedChange={() => handleSelectIndividualLine(box)}
                                                        className="mt-0.5"
                                                    />
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <p className="text-sm font-semibold truncate">{box.product?.name || 'Sin producto'}</p>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-muted-foreground">Pallet:</span>
                                                                <span className="ml-1 font-medium">{box.palletId}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Caja:</span>
                                                                <span className="ml-1 font-medium">{box.id}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Lote:</span>
                                                                <span className="ml-1 font-medium">{box.lot}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Peso:</span>
                                                                <span className="ml-1 font-medium">{formatDecimalWeight(box.netWeight)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            ) : (
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
                                                        <div className="font-medium">{group.product?.name}</div>
                                                        <div className="text-sm text-muted-foreground">Lote: {group.lot}</div>
                                                    </TableCell>
                                                    <TableCell>{group.count}</TableCell>
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
                                                    <TableCell>{box.product?.name}</TableCell>
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
            )}

            <BoxLabelPrintDialog
                open={isOpenLabelPrintDialog}
                onClose={() => setIsOpenLabelPrintDialog(false)}
                boxes={labelPrintDialogBoxes}
            />

        </div>
    );
};

export default OrderLabels;
