import { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { useOrderContext } from '@/context/OrderContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import BoxLabelPrintDialog from '@/components/Admin/Labels/BoxLabelPrintDialog';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { notify } from '@/lib/notifications';

interface OrderLabelBox {
  id: number | string;
  lot: string;
  netWeight: number;
  product?: { id: number | string; name: string } | null;
  [key: string]: unknown;
}

interface OrderLabelPallet {
  id: number | string;
  boxes: OrderLabelBox[];
}

interface GroupedLabelLine {
  product: OrderLabelBox['product'];
  lot: string;
  boxIds: (number | string)[];
  count: number;
}

interface IndividualLabelBox extends OrderLabelBox {
  palletId: number | string;
}

const OrderLabels = () => {
  const { pallets } = useOrderContext();
  const typedPallets = pallets as unknown as OrderLabelPallet[];
  const { isMobile, mounted } = useIsMobileSafe();

  const [palletIdFilter, setPalletIdFilter] = useState('');
  const [lotFilter, setLotFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [selectedGroupedLines, setSelectedGroupedLines] = useState<GroupedLabelLine[]>([]);
  const [selectedIndividualLines, setSelectedIndividualLines] = useState<IndividualLabelBox[]>([]);

  const [isOpenLabelPrintDialog, setIsOpenLabelPrintDialog] = useState(false);
  const [labelPrintDialogBoxes, setLabelPrintDialogBoxes] = useState<IndividualLabelBox[]>([]);

  // Manejadores

  // Filtros únicos
  const palletIds = useMemo(() => {
    const set = new Set<number | string>();
    typedPallets?.forEach((p) => set.add(p.id));
    return Array.from(set);
  }, [typedPallets]);

  const lots = useMemo(() => {
    const set = new Set<string>();
    typedPallets?.forEach((p) => p.boxes.forEach((b) => set.add(b.lot)));
    return Array.from(set);
  }, [typedPallets]);

  const productNames = useMemo(() => {
    const set = new Set<string>();
    typedPallets?.forEach((p) =>
      p.boxes.forEach((b) => b.product?.name && set.add(b.product.name))
    );
    return Array.from(set);
  }, [typedPallets]);

  // Agrupado por producto + lote
  const groupedBoxes = useMemo(() => {
    const map = new Map<string, GroupedLabelLine>();

    typedPallets?.forEach((pallet) => {
      pallet.boxes.forEach((box) => {
        if (!box.product?.name) return; // Skip boxes without product
        const key = `${box.product.name}-${box.lot}`;
        if (!map.has(key)) {
          map.set(key, {
            product: box.product,
            lot: box.lot,
            boxIds: [], // ← aquí guardamos los IDs
            count: 0,
          });
        }
        const group = map.get(key)!;
        group.count += 1;
        group.boxIds.push(box.id); // ← agregamos el ID
      });
    });

    return Array.from(map.values());
  }, [typedPallets]);

  // Cajas individuales con filtro aplicado
  const filteredBoxes = useMemo(() => {
    const list: IndividualLabelBox[] = [];
    typedPallets?.forEach((pallet) => {
      pallet.boxes.forEach((box) => {
        list.push({ ...box, palletId: pallet.id });
      });
    });
    return list.filter(
      (box) =>
        (!palletIdFilter || palletIdFilter === '' || box.palletId?.toString() === palletIdFilter) &&
        (!lotFilter || lotFilter === '' || box.lot === lotFilter) &&
        (!productFilter || productFilter === '' || box.product?.name === productFilter)
    );
  }, [typedPallets, palletIdFilter, lotFilter, productFilter]);

  const handleSelectAllGrouped = () => {
    setSelectedGroupedLines(groupedBoxes);
  };

  const handleUnselectAllGrouped = () => {
    setSelectedGroupedLines([]);
  };

  const isAllGroupedSelected = useMemo(() => {
    return groupedBoxes.length > 0 && selectedGroupedLines.length === groupedBoxes.length;
  }, [groupedBoxes, selectedGroupedLines]);

  const isGroupedLineSelected = (group: GroupedLabelLine) => {
    return selectedGroupedLines.some(
      (selected) => selected.product?.id === group.product?.id && selected.lot === group.lot
    );
  };

  const handleSelectGroupedLine = (group: GroupedLabelLine) => {
    if (isGroupedLineSelected(group)) {
      setSelectedGroupedLines((prev) =>
        prev.filter(
          (selected) => !(selected.product?.id === group.product?.id && selected.lot === group.lot)
        )
      );
    } else {
      setSelectedGroupedLines((prev) => [...prev, group]);
    }
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

  const isIndividualLineSelected = (box: IndividualLabelBox) => {
    return selectedIndividualLines.some((selected) => selected.id === box.id);
  };

  const handleSelectIndividualLine = (box: IndividualLabelBox) => {
    if (isIndividualLineSelected(box)) {
      setSelectedIndividualLines((prev) => prev.filter((selected) => selected.id !== box.id));
    } else {
      setSelectedIndividualLines((prev) => [...prev, box]);
    }
  };

  const handlePrintGroupedLabels = () => {
    if (selectedGroupedLines.length === 0) {
      notify.error({
        title: 'Selecciona al menos una línea agrupada para imprimir',
      });
      return;
    }
    /* Buscar los boxIds de cada grupo seleccionado en pallets */
    /* Extraer boxIds de cada linea y unificarlo */
    const boxIds = selectedGroupedLines.flatMap((group) => group.boxIds);

    /* Extraer todas las cajas de los palets */
    const boxesOfAllPallets = typedPallets.flatMap((pallet) =>
      pallet.boxes.map((box) => ({ ...box, palletId: pallet.id }))
    );

    /* Buscar en pallets las cajas con esos ids */
    const formattedLines = boxIds
      .map((boxId) => boxesOfAllPallets.find((b) => b.id === boxId) ?? null)
      .filter((box): box is IndividualLabelBox => box !== null);

    setLabelPrintDialogBoxes(formattedLines);
    setIsOpenLabelPrintDialog(true);
  };

  const handlePrintIndividualLabels = () => {
    if (selectedIndividualLines.length === 0) {
      notify.error({
        title: 'Selecciona al menos una línea individual para imprimir',
      });
      return;
    }
    setLabelPrintDialogBoxes(selectedIndividualLines);
    setIsOpenLabelPrintDialog(true);
  };

  if (!mounted) return null;

  return (
    <div
      className={
        isMobile
          ? 'flex min-h-0 flex-1 flex-col'
          : 'flex min-h-0 flex-1 flex-col overflow-hidden pb-2'
      }
    >
      {isMobile ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-6 px-4 py-6">
              {/* Agrupadas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Etiquetas Agrupadas</h3>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Etiquetas por lote y producto
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintGroupedLabels}
                    disabled={selectedGroupedLines.length === 0}
                  >
                    <Printer />
                    Imprimir
                  </Button>
                </div>

                {/* Checkbox seleccionar todos */}
                <div className="flex items-center gap-2 border-b pb-2">
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
                  <label
                    className="cursor-pointer text-sm font-medium"
                    onClick={() => {
                      if (isAllGroupedSelected) {
                        handleUnselectAllGrouped();
                      } else {
                        handleSelectAllGrouped();
                      }
                    }}
                  >
                    Seleccionar todos
                  </label>
                </div>

                {/* Cards de grupos */}
                <div className="space-y-2">
                  {groupedBoxes.length === 0 ? (
                    <EmptyState
                      className="py-8"
                      title="No existen grupos de etiquetas"
                      description="Añade palets con cajas al pedido para ver grupos por producto y lote."
                    />
                  ) : (
                    groupedBoxes.map((group, index) => (
                      <Card key={index}>
                        <CardContent>
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isGroupedLineSelected(group)}
                              onCheckedChange={() => handleSelectGroupedLine(group)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className="truncate text-base font-medium"
                                title={group.product?.name}
                              >
                                {group.product?.name}
                              </p>
                              <div className="mt-1 flex items-center gap-3">
                                <p className="text-muted-foreground text-xs">Lote: {group.lot}</p>
                                <p className="text-xs font-medium">{group.count} cajas</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              {/* Individuales */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Etiquetas Individuales</h3>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Etiquetas por caja individual
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintIndividualLabels}
                    disabled={selectedIndividualLines.length === 0}
                  >
                    <Printer />
                    Imprimir
                  </Button>
                </div>

                {/* Filtros */}
                <div className="space-y-2">
                  <Select
                    value={palletIdFilter || 'all'}
                    onValueChange={(value) => setPalletIdFilter(value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Todos los palets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los palets</SelectItem>
                      {palletIds.map((id) => (
                        <SelectItem key={id} value={String(id)}>
                          {id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={lotFilter || 'all'}
                    onValueChange={(value) => setLotFilter(value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Todos los lotes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los lotes</SelectItem>
                      {lots.map((lot) => (
                        <SelectItem key={lot} value={lot}>
                          {lot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={productFilter || 'all'}
                    onValueChange={(value) => setProductFilter(value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Todos los productos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los productos</SelectItem>
                      {productNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Checkbox seleccionar todos */}
                <div className="flex items-center gap-2 border-b pb-2">
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
                  <label
                    className="cursor-pointer text-sm font-medium"
                    onClick={() => {
                      if (isAllIndividualSelected) {
                        handleUnselectAllIndividual();
                      } else {
                        handleSelectAllIndividual();
                      }
                    }}
                  >
                    Seleccionar todos
                  </label>
                </div>

                {/* Cards de cajas individuales */}
                <div className="space-y-2">
                  {filteredBoxes.length === 0 ? (
                    <EmptyState
                      className="py-8"
                      title="No existen cajas para mostrar"
                      description={
                        typedPallets?.length
                          ? 'No hay cajas con los filtros seleccionados. Prueba a cambiar palet, lote o producto.'
                          : 'Añade palets con cajas al pedido para imprimir etiquetas individuales.'
                      }
                    />
                  ) : (
                    filteredBoxes.map((box) => (
                      <Card key={box.id}>
                        <CardContent>
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isIndividualLineSelected(box)}
                              onCheckedChange={() => handleSelectIndividualLine(box)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <p
                                className="truncate text-base font-medium"
                                title={box.product?.name || 'Sin producto'}
                              >
                                {box.product?.name || 'Sin producto'}
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Palet:</span>
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
                                  <span className="ml-1 font-medium">
                                    {formatDecimalWeight(box.netWeight)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      ) : (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto py-6">
            {/* Agrupadas */}
            <Card className="shrink-0">
              <CardHeader>
                <CardTitle>Etiquetas Agrupadas</CardTitle>
                <CardDescription>
                  Etiquetas por lote y producto. Puedes imprimir un número determinado de etiquetas
                  por cada grupo.
                </CardDescription>
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintGroupedLabels}
                    disabled={selectedGroupedLines.length === 0}
                  >
                    <Printer />
                    Imprimir
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupedBoxes.length === 0 ? (
                  <EmptyState
                    className="py-8"
                    title="No existen grupos de etiquetas"
                    description="Añade palets con cajas al pedido para ver grupos por producto y lote."
                  />
                ) : (
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
                              <div className="text-muted-foreground text-sm">Lote: {group.lot}</div>
                            </TableCell>
                            <TableCell>{group.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Individuales */}
            <Card className="shrink-0">
              <CardHeader>
                <CardTitle>Etiquetas Individuales</CardTitle>
                <CardDescription>
                  Etiquetas por caja individual. Puedes imprimir etiquetas para cada caja, filtrando
                  por palet, lote o producto.
                </CardDescription>
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintIndividualLabels}
                    disabled={selectedIndividualLines.length === 0}
                  >
                    <Printer />
                    Imprimir
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Filtro por palet */}
                  <Select
                    value={palletIdFilter || 'all'}
                    onValueChange={(value) => setPalletIdFilter(value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="h-10 w-full text-sm">
                      <SelectValue placeholder="Todos los palets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los palets</SelectItem>
                      {palletIds.map((id) => (
                        <SelectItem key={id} value={String(id)}>
                          {id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Filtro por lote */}
                  <Select
                    value={lotFilter || 'all'}
                    onValueChange={(value) => setLotFilter(value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="h-10 w-full text-sm">
                      <SelectValue placeholder="Todos los lotes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los lotes</SelectItem>
                      {lots.map((lot) => (
                        <SelectItem key={lot} value={lot}>
                          {lot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Filtro por producto */}
                  <Select
                    value={productFilter || 'all'}
                    onValueChange={(value) => setProductFilter(value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="h-10 w-full text-sm">
                      <SelectValue placeholder="Todos los productos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los productos</SelectItem>
                      {productNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tabla */}
                {filteredBoxes.length === 0 ? (
                  <EmptyState
                    className="py-8"
                    title="No existen cajas para mostrar"
                    description={
                      typedPallets?.length
                        ? 'No hay cajas con los filtros seleccionados. Prueba a cambiar palet, lote o producto.'
                        : 'Añade palets con cajas al pedido para imprimir etiquetas individuales.'
                    }
                  />
                ) : (
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
                          <TableHead>ID de palet</TableHead>
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
                            <TableCell className="text-right">
                              {formatDecimalWeight(box.netWeight)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
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
