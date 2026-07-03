'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { MOBILE_SAFE_AREAS } from '@/lib/design-tokens-mobile';
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
  formatInteger,
} from '@/helpers/formats/numbers/formatNumbers';
import { GitBranchPlus, Plus, X, Check, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Combobox } from '@/components/Shadcn/Combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notify } from '@/lib/notifications';
import { parseTaxRate } from '@/hooks/orders/useOrderPlannedDetails';
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
import { isDetailValid, type PlannedDetail, type PlannedDetailProduct } from './types';
import { OrderPlannedDetailSheet } from './OrderPlannedDetailSheet';

function getErrorDescription(error: unknown, fallback: string): string {
  const e = error as Record<string, unknown> | undefined;
  const data = e?.data as Record<string, unknown> | undefined;
  const response = e?.response as { data?: Record<string, unknown> } | undefined;
  return (
    (e?.userMessage as string) ||
    (data?.userMessage as string) ||
    (response?.data?.userMessage as string) ||
    (e?.message as string) ||
    fallback
  );
}

function formatTaxRate(rate: number | null): string {
  return rate == null ? 'IVA pendiente' : `${rate}%`;
}

const OrderPlannedProductDetails = () => {
  const { isMobile, mounted } = useIsMobileSafe();
  const {
    options,
    plannedProductDetailActions,
    plannedProductDetails: rawPlannedProductDetails,
    order,
    mergedProductDetails: rawMergedProductDetails,
  } = useOrderContext();
  const plannedProductDetails = rawPlannedProductDetails as unknown as PlannedDetail[];
  const mergedProductDetails = rawMergedProductDetails as unknown as Array<
    Record<string, unknown> & {
      status: string;
      product?: PlannedDetailProduct;
      productionBoxes: number;
      productionQuantity: number;
    }
  >;

  const {
    productOptions: rawProductOptions,
    taxOptions: rawTaxOptions,
    loading: optionsLoading,
  } = options || {};

  // Asegurar que siempre sean arrays válidos
  const productOptions = useMemo(() => {
    if (!Array.isArray(rawProductOptions)) return [];
    return rawProductOptions
      .map((opt) => {
        if (!opt || typeof opt !== 'object') return null;
        return {
          value: String(opt.value || ''), // Asegurar que value sea siempre string
          label: String(opt.label || ''),
        };
      })
      .filter((opt): opt is { value: string; label: string } => Boolean(opt)); // Filtrar opciones nulas
  }, [rawProductOptions]);

  const taxOptions = useMemo(() => {
    if (!Array.isArray(rawTaxOptions)) return [];
    return rawTaxOptions
      .map((opt) => {
        if (!opt || typeof opt !== 'object') return null;
        return {
          value: opt.value, // Mantener como número para impuestos
          label: String(opt.label || ''),
        };
      })
      .filter((opt): opt is { value: number | string; label: string } => Boolean(opt)); // Filtrar opciones nulas
  }, [rawTaxOptions]);

  const [details, setDetails] = useState<PlannedDetail[]>([]);
  const [temporaryDetails, setTemporaryDetails] = useState<PlannedDetail[]>([]); // Estado para líneas temporales (solo desktop)
  const [editIndex, setEditIndex] = useState<number | null>(null); // Edición inline (solo desktop)
  const [deleteConfirmDetail, setDeleteConfirmDetail] = useState<PlannedDetail | null>(null);

  // Estado del Sheet de creación/edición (solo mobile)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
  const [sheetDetail, setSheetDetail] = useState<PlannedDetail | null>(null);

  // Crear Maps para búsquedas O(1) en lugar de O(n)
  const productOptionsMap = useMemo(() => {
    const map = new Map<string, string>();
    productOptions.forEach((option) => {
      map.set(option.value, option.label);
    });
    return map;
  }, [productOptions]);

  const taxOptionsMap = useMemo(() => {
    const map = new Map<number, number | null>();
    taxOptions.forEach((option) => {
      map.set(Number(option.value), parseTaxRate(option.label));
    });
    return map;
  }, [taxOptions]);

  // Memoizar la combinación de detalles
  const allDetails = useMemo(() => {
    return [...plannedProductDetails, ...temporaryDetails];
  }, [plannedProductDetails, temporaryDetails]);

  useEffect(() => {
    setDetails(allDetails);
  }, [allDetails]);

  const handleOnClickAddLine = () => {
    if (editIndex !== null) return;

    const newTemporaryDetail: PlannedDetail = {
      product: { name: '', id: null },
      boxes: '',
      quantity: '',
      unitPrice: '',
      tax: { rate: null },
      isTemporary: true, // Marca para identificar líneas temporales
      tempId: Date.now() + Math.random(), // ID único temporal para identificación
    };

    setTemporaryDetails([...temporaryDetails, newTemporaryDetail]);
    // El índice será la posición final en la lista combinada
    setEditIndex(plannedProductDetails.length + temporaryDetails.length);
  };

  const handleEditLine = (index: number) => {
    setEditIndex(index);
  };

  const handleInputChange = useCallback(
    (index: number, field: string, value: unknown) => {
      const updatedDetails = [...details];
      if (!updatedDetails[index]) return;

      if (!updatedDetails[index].tax || typeof updatedDetails[index].tax !== 'object') {
        updatedDetails[index].tax = { id: null, rate: null };
      }

      if (!updatedDetails[index].product || typeof updatedDetails[index].product !== 'object') {
        updatedDetails[index].product = { id: null, name: '' };
      }

      if (field.includes('product')) {
        // Asegurar que el valor sea string para productos
        const productValue = value ? String(value) : null;
        updatedDetails[index].product.id = productValue;
        // Usar Map para búsqueda O(1) en lugar de find O(n)
        updatedDetails[index].product.name = productOptionsMap.get(productValue ?? '') || '';
      } else if (field.includes('tax')) {
        updatedDetails[index].tax.id = Number(value);
        // Usar Map para búsqueda O(1) en lugar de find O(n)
        updatedDetails[index].tax.rate = taxOptionsMap.get(Number(value)) ?? null;
      } else {
        updatedDetails[index][field] = value == '' ? '' : Number(value as string);
      }
      setDetails(updatedDetails);

      // También actualizar el estado temporal si es una línea temporal
      if (updatedDetails[index].isTemporary) {
        const tempIndex = temporaryDetails.findIndex(
          (temp) => temp.tempId === updatedDetails[index].tempId
        );
        if (tempIndex !== -1) {
          const updatedTemporaryDetails = [...temporaryDetails];
          updatedTemporaryDetails[tempIndex] = updatedDetails[index];
          setTemporaryDetails(updatedTemporaryDetails);
        }
      }
    },
    [details, temporaryDetails, productOptionsMap, taxOptionsMap]
  );

  // Lógica de guardado compartida entre la edición inline de desktop y el Sheet de mobile
  const saveDetail = useCallback(
    (detail: PlannedDetail, onSuccess: () => void) => {
      const payload: PlannedDetail = {
        ...detail,
        boxes: Number(detail.boxes),
        quantity: Number(detail.quantity),
        unitPrice: Number(detail.unitPrice),
      };

      if (!payload.id) {
        payload.orderId = order?.id;
        return notify
          .promise(plannedProductDetailActions.create(payload), {
            loading: 'Creando nueva línea...',
            success: 'Línea creada correctamente',
            error: (error: unknown) => {
              console.error('Error al crear la línea:', error);
              return {
                title: 'Error al crear la línea',
                description: getErrorDescription(
                  error,
                  'No se pudo crear la línea. Intente de nuevo.'
                ),
              };
            },
          })
          .then(onSuccess);
      }

      return notify
        .promise(plannedProductDetailActions.update(payload.id as number | string, payload), {
          loading: 'Actualizando línea...',
          success: 'Línea actualizada correctamente',
          error: (error: unknown) => {
            console.error('Error al actualizar la línea:', error);
            return {
              title: 'Error al actualizar la línea',
              description: getErrorDescription(
                error,
                'No se pudo actualizar la línea. Intente de nuevo.'
              ),
            };
          },
        })
        .then(onSuccess);
    },
    [order?.id, plannedProductDetailActions]
  );

  const handleOnClickSaveLine = () => {
    if (editIndex === null) return;
    const detail = details[editIndex];
    if (!detail || !isDetailValid(detail)) return;

    saveDetail(detail, () => {
      setTemporaryDetails((prev) => prev.filter((temp) => temp.tempId !== detail.tempId));
      setEditIndex(null);
    });
  };

  const deletePersistedLine = useCallback(
    (detail: PlannedDetail) => {
      notify
        .promise(plannedProductDetailActions.delete(detail.id as number | string), {
          loading: 'Eliminando línea...',
          success: 'Línea eliminada correctamente',
          error: (error: unknown) => {
            console.error('Error al eliminar la línea:', error);
            return {
              title: 'Error al eliminar la línea',
              description: getErrorDescription(
                error,
                'No se pudo eliminar la línea. Intente de nuevo.'
              ),
            };
          },
        })
        .then(() => setEditIndex(null));
    },
    [plannedProductDetailActions]
  );

  const handleOnClickDeleteLine = async (detail: PlannedDetail) => {
    // Línea temporal: solo remover del estado local (identificar por tempId, no por editIndex)
    if (!detail?.id && detail?.isTemporary) {
      setTemporaryDetails((prev) => prev.filter((temp) => temp.tempId !== detail.tempId));
      setEditIndex(null);
      return;
    }

    // Línea persistida: requiere id para eliminar vía API
    if (!detail?.id) return;

    setDeleteConfirmDetail(detail);
  };

  const handleConfirmDeleteLine = () => {
    if (!deleteConfirmDetail?.id) return;

    const detail = deleteConfirmDetail;
    setDeleteConfirmDetail(null);
    deletePersistedLine(detail);
  };

  const handleOnClickCloseLine = (detail: PlannedDetail) => {
    if (!detail?.id && detail?.isTemporary) {
      setTemporaryDetails((prev) => prev.filter((temp) => temp.tempId !== detail.tempId));
    }
    setEditIndex(null);
  };

  const handleOnClickAddDetectedProducts = () => {
    if (editIndex !== null) return;

    const detail = mergedProductDetails.find(
      (productDetail) => productDetail.status === 'noPlanned'
    );
    if (!detail) {
      notify.error({ title: 'No hay productos detectados' });
      return;
    }
    const product = detail?.product;
    if (!product?.id) {
      notify.error({
        title: 'Producto detectado inválido. Recarga el pedido e inténtalo de nuevo.',
      });
      return;
    }
    const newTemporaryDetail: PlannedDetail = {
      product: { name: product?.name || '', id: product.id },
      boxes: detail.productionBoxes,
      quantity: detail.productionQuantity,
      unitPrice: '',
      tax: { rate: null },
      isTemporary: true,
      tempId: Date.now() + Math.random(), // ID único temporal para identificación
    };

    setTemporaryDetails([...temporaryDetails, newTemporaryDetail]);
    // El índice será la posición final en la lista combinada
    setEditIndex(plannedProductDetails.length + temporaryDetails.length);
  };

  // Apertura del Sheet de creación/edición (solo mobile) — la edición vive en el
  // Sheet, no inline en la lista, así que no usa editIndex/temporaryDetails.
  const openCreateSheet = () => {
    setSheetMode('create');
    setSheetDetail({
      product: { name: '', id: null },
      boxes: '',
      quantity: '',
      unitPrice: '',
      tax: { rate: null },
    });
    setSheetOpen(true);
  };

  const openEditSheet = (detail: PlannedDetail) => {
    setSheetMode('edit');
    setSheetDetail(detail);
    setSheetOpen(true);
  };

  const openDetectedProductSheet = () => {
    const detail = mergedProductDetails.find(
      (productDetail) => productDetail.status === 'noPlanned'
    );
    if (!detail) {
      notify.error({ title: 'No hay productos detectados' });
      return;
    }
    const product = detail?.product;
    if (!product?.id) {
      notify.error({
        title: 'Producto detectado inválido. Recarga el pedido e inténtalo de nuevo.',
      });
      return;
    }
    setSheetMode('create');
    setSheetDetail({
      product: { name: product?.name || '', id: product.id },
      boxes: detail.productionBoxes,
      quantity: detail.productionQuantity,
      unitPrice: '',
      tax: { rate: null },
    });
    setSheetOpen(true);
  };

  const handleSheetSave = (detail: PlannedDetail) => {
    if (!isDetailValid(detail)) return;
    return saveDetail(detail, () => {
      setSheetOpen(false);
      setSheetDetail(null);
    });
  };

  const isSomeProductDetected = mergedProductDetails.some(
    (productDetail) => productDetail.status === 'noPlanned'
  );

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

  const averageUnitPrice = totals.quantity ? totals.totalAmount / totals.quantity : 0;

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
          {details.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <EmptyState
                title={'No existen productos previstos'}
                description={'Añade productos a la previsión del pedido'}
              />
            </div>
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-3 pb-20">
                <div className="border-border bg-card sticky top-0 z-10 rounded-lg border p-3 shadow-sm">
                  <p className="text-muted-foreground text-xs font-medium">Totales</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-[11px] leading-tight">Cajas</p>
                      <p className="text-sm font-medium tabular-nums">
                        {formatInteger(totals.boxes)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-[11px] leading-tight">Cantidad</p>
                      <p className="text-sm font-medium tabular-nums">
                        {formatDecimalWeight(totals.quantity)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-[11px] leading-tight">Precio med.</p>
                      <p className="text-sm font-medium tabular-nums">
                        {formatDecimalCurrency(averageUnitPrice)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-border bg-card overflow-hidden rounded-lg border">
                  {details.map((detail) => {
                    const taxRate = parseTaxRate(detail?.tax?.rate);

                    return (
                      <article
                        key={detail.id || detail.tempId}
                        className="border-border space-y-3 border-b p-3 last:border-b-0"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 text-sm leading-snug font-medium">
                            {detail?.product?.name || 'Sin producto'}
                          </p>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Editar línea"
                              onClick={() => openEditSheet(detail)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive h-8 w-8"
                              aria-label="Eliminar línea"
                              onClick={() => handleOnClickDeleteLine(detail)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                          <div className="min-w-0">
                            <p className="text-muted-foreground text-[11px] leading-tight">Cajas</p>
                            <p className="text-sm font-medium tabular-nums">
                              {formatInteger(detail.boxes)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-muted-foreground text-[11px] leading-tight">
                              Cantidad
                            </p>
                            <p className="text-sm font-medium tabular-nums">
                              {formatDecimalWeight(detail.quantity)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-muted-foreground text-[11px] leading-tight">
                              Precio
                            </p>
                            <p className="text-sm font-medium tabular-nums">
                              {formatDecimalCurrency(detail.unitPrice)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-muted-foreground text-[11px] leading-tight">
                              Impuesto
                            </p>
                            <p
                              className={cn(
                                'text-sm font-medium tabular-nums',
                                taxRate == null && 'text-warning'
                              )}
                            >
                              {formatTaxRate(taxRate)}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          )}
          {/* Footer con acciones */}
          <div
            className={cn(
              'bg-background fixed right-0 bottom-0 left-0 z-50 flex items-center gap-2 border-t p-3',
              MOBILE_SAFE_AREAS.BOTTOM_INSET
            )}
          >
            <Button onClick={openCreateSheet} size="sm" className="min-h-[44px] flex-1">
              <Plus size={16} className="mr-2" />
              Añadir línea
            </Button>
            {isSomeProductDetected && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={openDetectedProductSheet}
                    className="text-info focus:text-info"
                  >
                    <GitBranchPlus size={16} className="mr-2" />
                    Añadir productos detectados
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <OrderPlannedDetailSheet
            open={sheetOpen}
            onOpenChange={(open) => {
              setSheetOpen(open);
              if (!open) setSheetDetail(null);
            }}
            mode={sheetMode}
            detail={sheetDetail}
            productOptions={productOptions}
            taxOptions={taxOptions}
            optionsLoading={optionsLoading}
            onSave={handleSheetSave}
          />
        </div>
      ) : (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="flex shrink-0 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium">Previsión de productos</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Tabla con los productos previstos en el pedido
              </p>
            </div>
            <div className="space-x-2">
              <Button onClick={handleOnClickAddLine}>
                <Plus />
                Añadir línea
              </Button>
              {isSomeProductDetected && (
                <Button variant="secondary" onClick={handleOnClickAddDetectedProducts}>
                  <GitBranchPlus />
                  Añadir productos detectados
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-6 overflow-y-auto">
            {details.length === 0 ? (
              <div className="flex min-h-[200px] flex-1 items-center justify-center">
                <EmptyState
                  title={'No existen productos previstos'}
                  description={'Añade productos a la previsión del pedido'}
                />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Artículo</TableHead>
                      <TableHead className="text-right">Cajas</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unitario</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Impuesto</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.map((detail, index) => {
                      const taxRate = parseTaxRate(detail?.tax?.rate);

                      return (
                        <TableRow key={detail.id || detail.tempId}>
                          <TableCell className="min-w-[500px]">
                            {editIndex === index ? (
                              <Combobox
                                options={productOptions || []}
                                value={detail?.product?.id ? String(detail.product.id) : undefined}
                                onChange={(e) => handleInputChange(index, 'product', e)}
                                loading={optionsLoading}
                                placeholder="Seleccionar producto..."
                                searchPlaceholder="Buscar producto..."
                                notFoundMessage="No se encontraron productos"
                                className="w-full"
                              />
                            ) : (
                              detail?.product?.name || 'Sin producto'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editIndex === index ? (
                              <Input
                                type="number"
                                value={detail.boxes}
                                onChange={(e) => handleInputChange(index, 'boxes', e.target.value)}
                                className="w-full text-right"
                              />
                            ) : (
                              formatInteger(detail.boxes)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editIndex === index ? (
                              <Input
                                type="number"
                                value={detail.quantity}
                                onChange={(e) =>
                                  handleInputChange(index, 'quantity', e.target.value)
                                }
                                className="w-full text-right"
                              />
                            ) : (
                              formatDecimalWeight(detail.quantity)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editIndex === index ? (
                              <Input
                                type="number"
                                value={detail.unitPrice}
                                onChange={(e) =>
                                  handleInputChange(index, 'unitPrice', e.target.value)
                                }
                                className="w-full text-right"
                              />
                            ) : (
                              formatDecimalCurrency(detail.unitPrice)
                            )}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {editIndex === index ? (
                              <Select
                                value={detail?.tax?.id != null ? String(detail.tax.id) : ''}
                                onValueChange={(value) => handleInputChange(index, 'tax', value)}
                              >
                                <SelectTrigger loading={optionsLoading} className="w-full">
                                  <SelectValue placeholder="IVA" loading={optionsLoading} />
                                </SelectTrigger>
                                <SelectContent loading={optionsLoading}>
                                  {(taxOptions || []).map((tax) => (
                                    <SelectItem key={tax.value} value={String(tax.value)}>
                                      {tax.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className={cn(taxRate == null && 'text-warning')}>
                                {formatTaxRate(taxRate)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {editIndex === index ? (
                              <div className="flex flex-nowrap items-center justify-end gap-2">
                                <Button
                                  onClick={handleOnClickSaveLine}
                                  disabled={!isDetailValid(detail)}
                                  size="icon-sm"
                                  aria-label="Guardar línea"
                                >
                                  <Check />
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => handleOnClickCloseLine(detail)}
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
                                  onClick={() => handleOnClickDeleteLine(detail)}
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
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-medium">Totales</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatInteger(totals.boxes)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatDecimalWeight(totals.quantity)}
                      </TableCell>
                      <TableCell colSpan={3}></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <AlertDialog
        open={Boolean(deleteConfirmDetail)}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmDetail(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar línea prevista?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la línea del pedido y puede afectar importes, cajas y
              preparación. No se puede deshacer.
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

export default OrderPlannedProductDetails;
