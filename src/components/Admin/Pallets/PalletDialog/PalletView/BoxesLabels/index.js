import React, { useMemo, useState } from 'react';
import { Printer, Scroll } from 'lucide-react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from '@/components/ui/card';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import BoxLabelPrintDialog from '@/components/Admin/Labels/BoxLabelPrintDialog';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { set } from 'date-fns';

const BoxesLabels = ({ pallet, setBoxPrinted }) => {
    const [selectedGroupedLines, setSelectedGroupedLines] = useState([]);
    const [selectedIndividualLines, setSelectedIndividualLines] = useState([]);
    const [isOpenLabelPrintDialog, setIsOpenLabelPrintDialog] = useState(false);
    const [labelPrintDialogBoxes, setLabelPrintDialogBoxes] = useState([]);
    const [productFilter, setProductFilter] = useState('');
    const [lotFilter, setLotFilter] = useState('');

    // console.log(pallet)

    const productNames = useMemo(() => {
        const set = new Set();
        pallet?.boxes?.forEach(box => set.add(box.product.name));
        return Array.from(set);
    }, [pallet]);

    const lots = useMemo(() => {
        const set = new Set();
        pallet?.boxes?.forEach(box => set.add(box.lot));
        return Array.from(set);
    }, [pallet]);

    const groupedBoxes = useMemo(() => {
        const map = new Map();
        pallet?.boxes?.forEach(box => {
            if (
                (!productFilter || box.product.name === productFilter) &&
                (!lotFilter || box.lot === lotFilter)
            ) {
                const key = `${box.product.name}-${box.lot}`;
                if (!map.has(key)) {
                    map.set(key, {
                        product: box.product,
                        lot: box.lot,
                        boxIds: [],
                        count: 0
                    });
                }
                const group = map.get(key);
                group.count += 1;
                group.boxIds.push(box.id);
            }
        });
        return Array.from(map.values());
    }, [pallet, productFilter, lotFilter]);

    const filteredBoxes = useMemo(() => {
        return pallet?.boxes?.filter(box => {
            return (
                (!productFilter || box.product.name === productFilter) &&
                (!lotFilter || box.lot === lotFilter)
            );
        }) || [];
    }, [pallet, productFilter, lotFilter]);

    const newGroupedBoxes = useMemo(() => {
        const map = new Map();

        pallet.boxes?.forEach(box => {
            if (box.new !== true || box.printed === true) return;

            const key = `${box.product.id}-${box.lot}`;
            if (!map.has(key)) {
                map.set(key, {
                    id: key, // ← ID único basado en combinación de producto y lote
                    product: box.product,
                    lot: box.lot,
                    boxIds: [],
                    count: 0
                });
            }

            const group = map.get(key);
            group.count += 1;
            group.boxIds.push(box.id);
        });

        return Array.from(map.values());
    }, [pallet]);




    const handleSelectAllGrouped = () => {
        setSelectedGroupedLines(groupedBoxes);
    };

    const handleUnselectAllGrouped = () => {
        setSelectedGroupedLines([]);
    };

    const isAllGroupedSelected = useMemo(() => {
        return groupedBoxes.length > 0 && selectedGroupedLines.length === groupedBoxes.length;
    }, [groupedBoxes, selectedGroupedLines]);

    const isGroupedLineSelected = (group) => {
        return selectedGroupedLines.some(selected =>
            selected.product.id === group.product.id && selected.lot === group.lot
        );
    };

    const handleSelectGroupedLine = (group) => {
        if (isGroupedLineSelected(group)) {
            setSelectedGroupedLines(prev => prev.filter(selected =>
                !(selected.product.id === group.product.id && selected.lot === group.lot)
            ));
        } else {
            setSelectedGroupedLines(prev => [...prev, group]);
        }
    };

    const handlePrintGroupedLabels = () => {
        if (selectedGroupedLines.length === 0) return;
        const boxIds = selectedGroupedLines.flatMap(group => group.boxIds);
        const formattedLines = pallet.boxes.filter(b => boxIds.includes(b.id)).map(box => ({
            ...box,
            product: box.product
        }));
        setLabelPrintDialogBoxes(formattedLines);
        setIsOpenLabelPrintDialog(true);
    };

    const handleSelectAllIndividual = () => {
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

    const handlePrintIndividualLabels = () => {
        if (selectedIndividualLines.length === 0) return;
        const formattedLines = selectedIndividualLines.map(box => ({
            ...box,
            product: box.product
        }));
        setLabelPrintDialogBoxes(formattedLines);
        setIsOpenLabelPrintDialog(true);
    };

    const handleOnClickPrintNewGroupedLabels = (groupId) => {
        const group = newGroupedBoxes.find(g => g.id === groupId);
        if (!group) return;

        for (const box of pallet.boxes) {
            if (box.new && group.boxIds.includes(box.id)) {
                setBoxPrinted(box.id);
            }
        }

        const formattedLines = pallet.boxes
            .filter(b => group.boxIds.includes(b.id))
            .map(box => ({
                ...box,
                product: box.product
            }));

        setLabelPrintDialogBoxes(formattedLines);
        setIsOpenLabelPrintDialog(true);
    };


    // console.log('newGroupedBoxes', newGroupedBoxes);




    return (
        <div className=' pb-2 w-full h-[70vh]'>
            <Card className='h-full flex flex-col bg-transparent w-full'>
                <CardContent className="h-full overflow-y-auto py-6 flex flex-col gap-6 w-full">
                    <ScrollArea orientation="horizontal" className="w-full overflow-x-auto whitespace-nowrap py-2" >
                        <div className="flex gap-3 min-w-max">
                            {newGroupedBoxes.length > 0 && newGroupedBoxes.map((group) => (
                                <Card
                                    key={group.id}
                                    className="inline-flex flex-col w-min-56 h-full border border-muted rounded-2xl shadow-sm flex-shrink-0"
                                >
                                    <CardHeader className="space-y-2 pb-2">
                                        <CardTitle className="text-base font-semibold animate-pulse text-warning-500">
                                            ¡Nuevas etiquetas disponibles!
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="h-full flex gap-4 items-center justify-center">
                                            <div className="text-sm text-muted-foreground leading-tight flex-1">
                                                <span className="font-medium text-foreground">
                                                    {group.product.name}
                                                </span><br />
                                                <span className="font-mono">
                                                    {group.lot}
                                                </span><br />
                                                {group.count} cajas
                                            </div>
                                            <Button className="h-full self-stretch"
                                                onClick={() => handleOnClickPrintNewGroupedLabels(group.id)}
                                            >
                                                <Printer className="h-4 w-4" />
                                                Imprimir
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>


                    <ScrollArea className="flex-1 ">

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 h-full'>


                            <Card className='flex flex-col bg-transparent h-full'>
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select value={productFilter} onValueChange={setProductFilter}>
                                            <SelectTrigger className="w-full h-10 text-sm">
                                                <SelectValue placeholder="Todos los productos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={null}>Todos los productos</SelectItem>
                                                {productNames.map((name) => (
                                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={lotFilter} onValueChange={setLotFilter}>
                                            <SelectTrigger className="w-full h-10 text-sm">
                                                <SelectValue placeholder="Todos los lotes" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={null} >Todos los lotes</SelectItem>
                                                {lots.map((lot) => (
                                                    <SelectItem key={lot} value={lot}>{lot}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="rounded-lg border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]">
                                                        <Checkbox
                                                            onCheckedChange={(checked) => {
                                                                if (checked) handleSelectAllGrouped();
                                                                else handleUnselectAllGrouped();
                                                            }}
                                                            checked={isAllGroupedSelected}
                                                        />
                                                    </TableHead>
                                                    <TableHead>Producto</TableHead>
                                                    <TableHead>Lote</TableHead>
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
                                                        <TableCell>{group.product.name}</TableCell>
                                                        <TableCell>{group.lot}</TableCell>
                                                        <TableCell>{group.count}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="flex flex-col h-full">
                                <CardHeader>
                                    <CardTitle className="text-lg font-medium">Etiquetas Individuales</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium">Etiquetas por caja individual</div>
                                            <div className="text-sm text-muted-foreground">
                                                Puedes imprimir etiquetas para cada caja del pallet
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handlePrintIndividualLabels}>
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
                                                                if (checked) handleSelectAllIndividual();
                                                                else handleUnselectAllIndividual();
                                                            }}
                                                            checked={isAllIndividualSelected}
                                                        />
                                                    </TableHead>
                                                    {/*  <TableHead>Caja ID</TableHead> */}
                                                    <TableHead>Producto</TableHead>
                                                    <TableHead>Lote</TableHead>
                                                    <TableHead className="text-right">Peso neto</TableHead>
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
                                                        {/* <TableCell>{box.id}</TableCell> */}
                                                        <TableCell>{box.product.name}</TableCell>
                                                        <TableCell>{box.lot}</TableCell>
                                                        <TableCell className="text-right">{formatDecimalWeight(box.netWeight)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                    </ScrollArea>
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

export default BoxesLabels;