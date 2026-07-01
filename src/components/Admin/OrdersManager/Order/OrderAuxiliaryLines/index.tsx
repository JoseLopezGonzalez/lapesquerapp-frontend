'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrderContext } from '@/context/OrderContext';
import {
  formatDecimalCurrency,
  formatDecimalWeight,
} from '@/helpers/formats/numbers/formatNumbers';
import { Plus, X, Check, Edit2, Trash2 } from 'lucide-react';
import { Combobox } from '@/components/Shadcn/Combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { useIsMobile } from '@/hooks/use-mobile';
import { notify } from '@/lib/notifications';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Info } from 'lucide-react';
import type { AuxiliaryOrderLine, AuxiliaryOrderLinePayload } from '@/services/orderService';
import type { AuxiliaryProductOption } from '@/types/catalog';

interface OrderSelectOption {
  value: number | string;
  label: string | number;
}

interface AuxiliaryLineRow {
  id?: number | string;
  tempId?: number;
  isTemporary?: boolean;
  auxiliaryProduct: { id: number | string; name: string } | null;
  description: string;
  quantity: number | string;
  unit: string;
  unitPrice: number | string;
  tax: { id: number | string | null; rate: number };
}

function parseTaxRate(value: unknown): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  const normalized = String(value).replace(',', '.');
  const match = normalized.match(/-?\d+(\.\d+)?/);
  const parsed = match ? Number(match[0]) : Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getErrorDescription(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const err = error as { userMessage?: string; message?: string };
    return err.userMessage || err.message || fallback;
  }
  return fallback;
}

function toRow(line: AuxiliaryOrderLine): AuxiliaryLineRow {
  return {
    id: line.id,
    auxiliaryProduct: line.auxiliaryProduct ?? null,
    description: line.description ?? '',
    quantity: line.quantity ?? '',
    unit: line.unit ?? '',
    unitPrice: line.unitPrice ?? '',
    tax: { id: line.tax?.id ?? null, rate: parseTaxRate(line.tax?.rate) },
  };
}

const NO_CATALOG_VALUE = '__none__';

const OrderAuxiliaryLines = () => {
  const isMobile = useIsMobile();
  const {
    auxiliaryLines,
    auxiliaryLineActions,
    auxiliaryProductOptions,
    options,
  } = useOrderContext() as {
    auxiliaryLines: AuxiliaryOrderLine[];
    auxiliaryLineActions: {
      update: (id: number | string, data: AuxiliaryOrderLinePayload) => Promise<void>;
      delete: (id: number | string) => Promise<void>;
      create: (data: AuxiliaryOrderLinePayload) => Promise<void>;
    };
    auxiliaryProductOptions: AuxiliaryProductOption[];
    options: { taxOptions: OrderSelectOption[]; loading: boolean };
  };

  const { taxOptions: rawTaxOptions, loading: optionsLoading } = options || {};

  const taxOptions = useMemo(() => {
    if (!Array.isArray(rawTaxOptions)) return [];
    return rawTaxOptions
      .filter(Boolean)
      .map((opt) => ({ value: opt.value, label: String(opt.label ?? '') }));
  }, [rawTaxOptions]);

  const taxOptionsMap = useMemo(() => {
    const map = new Map<string, number>();
    taxOptions.forEach((option) => map.set(String(option.value), parseTaxRate(option.label)));
    return map;
  }, [taxOptions]);

  const catalogOptions = useMemo(
    () => [
      { value: NO_CATALOG_VALUE, label: '— Descripción libre —' },
      ...(Array.isArray(auxiliaryProductOptions) ? auxiliaryProductOptions : []).map((opt) => ({
        value: String(opt.id),
        label: opt.name,
      })),
    ],
    [auxiliaryProductOptions]
  );

  const catalogOptionsMap = useMemo(() => {
    const map = new Map<string, AuxiliaryProductOption>();
    (Array.isArray(auxiliaryProductOptions) ? auxiliaryProductOptions : []).forEach((opt) =>
      map.set(String(opt.id), opt)
    );
    return map;
  }, [auxiliaryProductOptions]);

  const [rows, setRows] = useState<AuxiliaryLineRow[]>([]);
  const [temporaryRows, setTemporaryRows] = useState<AuxiliaryLineRow[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showTotalsDialog, setShowTotalsDialog] = useState(false);
  const [deleteConfirmRow, setDeleteConfirmRow] = useState<AuxiliaryLineRow | null>(null);

  const persistedRows = useMemo(() => auxiliaryLines.map(toRow), [auxiliaryLines]);

  const allRows = useMemo(
    () => [...persistedRows, ...temporaryRows],
    [persistedRows, temporaryRows]
  );

  useEffect(() => {
    setRows(allRows);
  }, [allRows]);

  const handleOnClickAddLine = () => {
    if (editIndex !== null) return;

    const newRow: AuxiliaryLineRow = {
      auxiliaryProduct: null,
      description: '',
      quantity: '',
      unit: '',
      unitPrice: '',
      tax: { id: null, rate: 0 },
      isTemporary: true,
      tempId: Date.now() + Math.random(),
    };

    setTemporaryRows((prev) => [...prev, newRow]);
    setEditIndex(persistedRows.length + temporaryRows.length);
  };

  const handleInputChange = useCallback(
    (index: number, field: string, value: string) => {
      setRows((prevRows) => {
        const updated = [...prevRows];
        const row = updated[index];
        if (!row) return prevRows;

        if (field === 'auxiliaryProduct') {
          if (value === NO_CATALOG_VALUE || !value) {
            row.auxiliaryProduct = null;
          } else {
            const matched = catalogOptionsMap.get(value);
            row.auxiliaryProduct = { id: value, name: matched?.name ?? '' };
            if (matched?.unit) row.unit = matched.unit;
            if (matched?.defaultPrice != null) row.unitPrice = String(matched.defaultPrice);
          }
        } else if (field === 'description') {
          row.description = value;
        } else if (field === 'unit') {
          row.unit = value;
        } else if (field === 'tax') {
          row.tax = { id: value, rate: taxOptionsMap.get(value) ?? 0 };
        } else if (field === 'quantity' || field === 'unitPrice') {
          row[field] = value === '' ? '' : Number(value);
        }

        if (row.isTemporary) {
          setTemporaryRows((prevTemp) =>
            prevTemp.map((temp) => (temp.tempId === row.tempId ? row : temp))
          );
        }

        return updated;
      });
    },
    [catalogOptionsMap, taxOptionsMap]
  );

  const handleEditLine = (index: number) => setEditIndex(index);

  const handleOnClickCloseLine = (row: AuxiliaryLineRow) => {
    if (!row.id && row.isTemporary) {
      setTemporaryRows((prev) => prev.filter((temp) => temp.tempId !== row.tempId));
    }
    setEditIndex(null);
  };

  const handleOnClickSaveLine = async () => {
    if (editIndex === null) return;
    const row = rows[editIndex];
    if (!row) return;

    const payload: AuxiliaryOrderLinePayload = {
      auxiliaryProductId: row.auxiliaryProduct?.id ?? null,
      description: row.description || null,
      quantity: Number(row.quantity),
      unit: row.unit,
      unitPrice: Number(row.unitPrice),
      taxId: row.tax.id,
    };

    if (!row.id) {
      notify
        .promise(auxiliaryLineActions.create(payload), {
          loading: 'Creando línea auxiliar...',
          success: 'Línea auxiliar creada correctamente',
          error: (error: unknown) => ({
            title: 'Error al crear la línea',
            description: getErrorDescription(error, 'No se pudo crear la línea.'),
          }),
        })
        .then(() => {
          setTemporaryRows((prev) => prev.filter((temp) => temp.tempId !== row.tempId));
          setEditIndex(null);
        });
      return;
    }

    const rowId = row.id;
    notify
      .promise(auxiliaryLineActions.update(rowId, payload), {
        loading: 'Actualizando línea auxiliar...',
        success: 'Línea auxiliar actualizada correctamente',
        error: (error: unknown) => ({
          title: 'Error al actualizar la línea',
          description: getErrorDescription(error, 'No se pudo actualizar la línea.'),
        }),
      })
      .then(() => setEditIndex(null));
  };

  const handleOnClickDeleteLine = (row: AuxiliaryLineRow) => {
    if (!row.id && row.isTemporary) {
      setTemporaryRows((prev) => prev.filter((temp) => temp.tempId !== row.tempId));
      setEditIndex(null);
      return;
    }
    if (!row.id) return;
    setDeleteConfirmRow(row);
  };

  const handleConfirmDeleteLine = () => {
    const rowId = deleteConfirmRow?.id;
    if (rowId == null) return;
    setDeleteConfirmRow(null);
    notify
      .promise(auxiliaryLineActions.delete(rowId), {
        loading: 'Eliminando línea auxiliar...',
        success: 'Línea auxiliar eliminada correctamente',
        error: (error: unknown) => ({
          title: 'Error al eliminar la línea',
          description: getErrorDescription(error, 'No se pudo eliminar la línea.'),
        }),
      })
      .then(() => setEditIndex(null));
  };

  const totals = rows.reduce(
    (acc, row) => {
      const quantity = Number(row.quantity) || 0;
      const unitPrice = Number(row.unitPrice) || 0;
      const subtotal = quantity * unitPrice;
      acc.subtotal += subtotal;
      acc.total += subtotal * (1 + row.tax.rate / 100);
      return acc;
    },
    { subtotal: 0, total: 0 }
  );

  const articleLabel = (row: AuxiliaryLineRow) =>
    row.auxiliaryProduct?.name || row.description || 'Sin artículo';

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
          {rows.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <EmptyState
                title="No existen líneas auxiliares"
                description="Añade nieve, envases, palets u otros artículos al pedido"
              />
            </div>
          ) : (
            <div className="space-y-3 pb-24">
              {rows.map((row, index) => (
                <Card key={row.id ?? row.tempId} className="p-4">
                  <div className="space-y-3">
                    <div>
                      {editIndex === index ? (
                        <div className="space-y-2">
                          <div className="[&_button]:!h-9">
                            <Combobox
                              options={catalogOptions}
                              value={row.auxiliaryProduct ? String(row.auxiliaryProduct.id) : NO_CATALOG_VALUE}
                              onChange={(value) =>
                                handleInputChange(index, 'auxiliaryProduct', String(value))
                              }
                              placeholder="Seleccionar artículo del catálogo..."
                              searchPlaceholder="Buscar artículo..."
                              notFoundMessage="No se encontraron artículos"
                            />
                          </div>
                          <Input
                            placeholder="Descripción libre (opcional si hay artículo)"
                            value={row.description}
                            onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                            className="!h-9"
                          />
                        </div>
                      ) : (
                        <p className="py-2 text-sm font-medium">{articleLabel(row)}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-muted-foreground mb-1.5 text-xs">Cantidad</p>
                        {editIndex === index ? (
                          <Input
                            type="number"
                            value={row.quantity}
                            onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
                            className="!h-9"
                          />
                        ) : (
                          <p className="py-2 text-sm font-medium">{formatDecimalWeight(Number(row.quantity))}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1.5 text-xs">Unidad</p>
                        {editIndex === index ? (
                          <Input
                            value={row.unit}
                            onChange={(e) => handleInputChange(index, 'unit', e.target.value)}
                            className="!h-9"
                          />
                        ) : (
                          <p className="py-2 text-sm font-medium">{row.unit || '-'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1.5 text-xs">Precio</p>
                        {editIndex === index ? (
                          <Input
                            type="number"
                            value={row.unitPrice}
                            onChange={(e) => handleInputChange(index, 'unitPrice', e.target.value)}
                            className="!h-9"
                          />
                        ) : (
                          <p className="py-2 text-sm font-medium">
                            {formatDecimalCurrency(Number(row.unitPrice))}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1.5 text-xs">Impuesto (%)</p>
                        {editIndex === index ? (
                          <div className="[&_button]:!h-9">
                            <Select
                              value={row.tax.id != null ? String(row.tax.id) : ''}
                              onValueChange={(value) => handleInputChange(index, 'tax', value)}
                            >
                              <SelectTrigger loading={optionsLoading} className="w-full">
                                <SelectValue placeholder="IVA" />
                              </SelectTrigger>
                              <SelectContent loading={optionsLoading}>
                                {taxOptions.map((tax) => (
                                  <SelectItem key={tax.value} value={String(tax.value)}>
                                    {tax.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <p className="py-2 text-sm font-medium">{row.tax.rate}%</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 border-t pt-3">
                      {editIndex === index ? (
                        <>
                          <Button onClick={handleOnClickSaveLine} size="sm" className="flex-1">
                            <Check />
                            Guardar
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleOnClickCloseLine(row)}
                            size="sm"
                            className="flex-1"
                          >
                            <X />
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleEditLine(index)}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <Edit2 />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleOnClickDeleteLine(row)}
                            size="sm"
                            className="flex-1"
                          >
                            <Trash2 />
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div
            className="bg-background fixed right-0 bottom-0 left-0 z-50 flex items-center gap-2 border-t p-3"
            style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}
          >
            <Button
              onClick={() => setShowTotalsDialog(true)}
              variant="outline"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button onClick={handleOnClickAddLine} size="sm" className="min-h-[44px] flex-1">
              <Plus size={16} className="mr-2" />
              Añadir línea
            </Button>
          </div>

          <Dialog open={showTotalsDialog} onOpenChange={setShowTotalsDialog}>
            <DialogContent
              className={`${isMobile ? 'm-0 flex h-full max-h-full w-full max-w-full flex-col rounded-none' : ''}`}
            >
              <DialogHeader>
                <DialogTitle>Totales</DialogTitle>
                <DialogDescription>Resumen de las líneas auxiliares del pedido.</DialogDescription>
              </DialogHeader>
              <div className={`${isMobile ? 'flex flex-1 flex-col items-center justify-center px-4' : ''}`}>
                <div className={`space-y-6 ${isMobile ? 'w-full max-w-md' : ''}`}>
                  <div className="space-y-2 text-center">
                    <p className="text-muted-foreground text-xs font-normal tracking-wide uppercase">
                      Subtotal
                    </p>
                    <p className="text-foreground text-xl font-medium">
                      {formatDecimalCurrency(totals.subtotal)}
                    </p>
                  </div>
                  <div className="space-y-2 border-t pt-4 text-center">
                    <p className="text-muted-foreground text-xs font-normal tracking-wide uppercase">
                      Total (con IVA)
                    </p>
                    <p className="text-foreground text-xl font-medium">
                      {formatDecimalCurrency(totals.total)}
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="flex shrink-0 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium">Otros artículos</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Nieve, envases, palets y otros servicios facturados en el pedido
              </p>
            </div>
            <Button onClick={handleOnClickAddLine}>
              <Plus />
              Añadir línea
            </Button>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-6 overflow-y-auto">
            {rows.length === 0 ? (
              <div className="flex min-h-[200px] flex-1 items-center justify-center">
                <EmptyState
                  title="No existen líneas auxiliares"
                  description="Añade nieve, envases, palets u otros artículos al pedido"
                />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Artículo</TableHead>
                      <TableHead className="min-w-[160px]">Descripción</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Unidad</TableHead>
                      <TableHead className="text-right">Precio Unitario</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Impuesto</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={row.id ?? row.tempId}>
                        <TableCell className="min-w-[220px]">
                          {editIndex === index ? (
                            <Combobox
                              options={catalogOptions}
                              value={row.auxiliaryProduct ? String(row.auxiliaryProduct.id) : NO_CATALOG_VALUE}
                              onChange={(value) =>
                                handleInputChange(index, 'auxiliaryProduct', String(value))
                              }
                              placeholder="Catálogo (opcional)..."
                              searchPlaceholder="Buscar artículo..."
                              notFoundMessage="No se encontraron artículos"
                              className="w-full"
                            />
                          ) : (
                            row.auxiliaryProduct?.name || <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[160px]">
                          {editIndex === index ? (
                            <Input
                              value={row.description}
                              onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                              placeholder="Descripción libre"
                            />
                          ) : (
                            row.description || <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editIndex === index ? (
                            <Input
                              type="number"
                              value={row.quantity}
                              onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
                              className="w-full text-right"
                            />
                          ) : (
                            formatDecimalWeight(Number(row.quantity))
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editIndex === index ? (
                            <Input
                              value={row.unit}
                              onChange={(e) => handleInputChange(index, 'unit', e.target.value)}
                              className="w-full text-right"
                            />
                          ) : (
                            row.unit || '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editIndex === index ? (
                            <Input
                              type="number"
                              value={row.unitPrice}
                              onChange={(e) => handleInputChange(index, 'unitPrice', e.target.value)}
                              className="w-full text-right"
                            />
                          ) : (
                            formatDecimalCurrency(Number(row.unitPrice))
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {editIndex === index ? (
                            <Select
                              value={row.tax.id != null ? String(row.tax.id) : ''}
                              onValueChange={(value) => handleInputChange(index, 'tax', value)}
                            >
                              <SelectTrigger loading={optionsLoading} className="w-full">
                                <SelectValue placeholder="IVA" />
                              </SelectTrigger>
                              <SelectContent loading={optionsLoading}>
                                {taxOptions.map((tax) => (
                                  <SelectItem key={tax.value} value={String(tax.value)}>
                                    {tax.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            `${row.tax.rate}%`
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {editIndex === index ? (
                            <div className="flex flex-nowrap items-center justify-end gap-2">
                              <Button onClick={handleOnClickSaveLine} size="icon-sm" aria-label="Guardar línea">
                                <Check />
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => handleOnClickCloseLine(row)}
                                size="icon-sm"
                                aria-label="Cancelar"
                              >
                                <X />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-nowrap items-center justify-end gap-2">
                              <Button
                                onClick={() => handleEditLine(index)}
                                size="icon-sm"
                                variant="outline"
                                aria-label="Editar línea"
                              >
                                <Edit2 />
                              </Button>
                              <Button
                                onClick={() => handleOnClickDeleteLine(row)}
                                size="icon-sm"
                                variant="destructive"
                                aria-label="Eliminar línea"
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="font-semibold">
                        Totales
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatDecimalCurrency(totals.subtotal)}
                      </TableCell>
                      <TableCell colSpan={2} className="text-right font-semibold">
                        {formatDecimalCurrency(totals.total)} con IVA
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <AlertDialog
        open={Boolean(deleteConfirmRow)}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmRow(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar línea auxiliar</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la línea del pedido y puede afectar los importes totales.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDeleteLine}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderAuxiliaryLines;
