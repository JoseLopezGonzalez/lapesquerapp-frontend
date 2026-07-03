'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
import { GitBranchPlus, Plus, X, Check, Edit2, Trash2, MoreVertical, Info } from 'lucide-react';
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
import { OrderTotalsSummaryDialog } from '@/components/Admin/OrdersManager/Order/components/OrderTotalsSummaryDialog';
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

interface PlannedDetailProduct {
  id: number | string | null;
  name: string;
}

interface PlannedDetailTax {
  id?: number | string | null;
  rate: number | string | null;
}

interface PlannedDetail {
  id?: number | string;
  tempId?: number;
  isTemporary?: boolean;
  orderId?: number | string;
  product: PlannedDetailProduct;
  boxes: number | string;
  quantity: number | string;
  unitPrice: number | string;
  tax: PlannedDetailTax;
  [key: string]: unknown;
}

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

function isDetailValid(detail: PlannedDetail): boolean {
  const hasProduct = detail.product?.id != null && detail.product.id !== '';
  const quantity = detail.quantity === '' ? NaN : Number(detail.quantity);
  const unitPrice = detail.unitPrice === '' ? NaN : Number(detail.unitPrice);
  return (
    hasProduct &&
    Number.isFinite(quantity) &&
    quantity > 0 &&
    Number.isFinite(unitPrice) &&
    unitPrice >= 0
  );
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
  const [temporaryDetails, setTemporaryDetails] = useState<PlannedDetail[]>([]); // Estado para líneas temporales
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showTotalsDialog, setShowTotalsDialog] = useState(false);
  const [deleteConfirmDetail, setDeleteConfirmDetail] = useState<PlannedDetail | null>(null);

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

  // Intención de scroll pendiente, consumida por el useEffect de editIndex una vez
  // que React ya ha pintado la card correspondiente en el DOM (ref directa, sin
  // delay arbitrario de setTimeout).
  const pendingScrollIntentRef = useRef<'bottom' | 'card' | null>(null);

  // Hacer scroll (al final al añadir línea, o hasta la card al editar) cuando
  // editIndex cambia. requestAnimationFrame espera al siguiente frame de pintado
  // en vez de un delay arbitrario.
  useEffect(() => {
    if (!isMobile || editIndex === null || !pendingScrollIntentRef.current) return;
    const intent = pendingScrollIntentRef.current;
    pendingScrollIntentRef.current = null;

    const viewportEl = scrollAreaRef.current?.querySelector<HTMLDivElement>(
      '[data-radix-scroll-area-viewport]'
    );
    if (!viewportEl) return;

    requestAnimationFrame(() => {
      if (intent === 'bottom') {
        viewportEl.scrollTo({ top: viewportEl.scrollHeight, behavior: 'smooth' });
        return;
      }

      const targetCard = viewportEl.querySelector<HTMLElement>(`[data-card-index="${editIndex}"]`);
      targetCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [editIndex, isMobile]);

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
    pendingScrollIntentRef.current = 'bottom';
    setEditIndex(plannedProductDetails.length + temporaryDetails.length);
  };

  const handleEditLine = (index: number) => {
    pendingScrollIntentRef.current = 'card';
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

  const handleOnClickSaveLine = async () => {
    if (editIndex === null) return;
    const detail = details[editIndex];
    if (!detail || !isDetailValid(detail)) return;

    /* conversion datos enteros y decimales*/
    detail.boxes = Number(detail.boxes);
    detail.quantity = Number(detail.quantity);
    detail.unitPrice = Number(detail.unitPrice);

    if (!detail.id) {
      detail.orderId = order?.id;
      notify
        .promise(plannedProductDetailActions.create(detail), {
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
        .then(() => {
          setTemporaryDetails((prev) => prev.filter((temp) => temp.tempId !== detail.tempId));
          setEditIndex(null);
        });
      return;
    }

    notify
      .promise(plannedProductDetailActions.update(detail.id, detail), {
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
      .then(() => setEditIndex(null));
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
            <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1">
              <div className="space-y-6 pb-20">
                {/* Vista Mobile: Cards */}
                <div className="space-y-3">
                  {details.map((detail, index) => {
                    const taxRate = parseTaxRate(detail?.tax?.rate);

                    return (
                      <Card
                        key={detail.id || detail.tempId}
                        data-card-index={index}
                        className="p-4"
                      >
                        <div className="space-y-3">
                          {/* Artículo */}
                          <div>
                            {editIndex === index ? (
                              // Combobox no expone un prop de tamaño propio (ver
                              // src/components/Shadcn/Combobox/index.d.ts); className
                              // se aplica directamente al Button interno vía cn().
                              <Combobox
                                options={productOptions || []}
                                value={detail?.product?.id ? String(detail.product.id) : undefined}
                                onChange={(e) => handleInputChange(index, 'product', e)}
                                loading={optionsLoading}
                                placeholder="Seleccionar producto..."
                                searchPlaceholder="Buscar producto..."
                                notFoundMessage="No se encontraron productos"
                                className="h-9"
                              />
                            ) : (
                              <p className="py-2 text-sm font-medium">
                                {detail?.product?.name || 'Sin producto'}
                              </p>
                            )}
                          </div>

                          {/* Información en grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-muted-foreground mb-1.5 text-xs">Cajas</p>
                              {editIndex === index ? (
                                <Input
                                  type="number"
                                  value={detail.boxes}
                                  onChange={(e) =>
                                    handleInputChange(index, 'boxes', e.target.value)
                                  }
                                  className="!h-9"
                                />
                              ) : (
                                <p className="py-2 text-sm font-medium">
                                  {formatInteger(detail.boxes)}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1.5 text-xs">Cantidad</p>
                              {editIndex === index ? (
                                <Input
                                  type="number"
                                  value={detail.quantity}
                                  onChange={(e) =>
                                    handleInputChange(index, 'quantity', e.target.value)
                                  }
                                  className="!h-9"
                                />
                              ) : (
                                <p className="py-2 text-sm font-medium">
                                  {formatDecimalWeight(detail.quantity)}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1.5 text-xs">Precio</p>
                              {editIndex === index ? (
                                <Input
                                  type="number"
                                  value={detail.unitPrice}
                                  onChange={(e) =>
                                    handleInputChange(index, 'unitPrice', e.target.value)
                                  }
                                  className="!h-9"
                                />
                              ) : (
                                <p className="py-2 text-sm font-medium">
                                  {formatDecimalCurrency(detail.unitPrice)}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1.5 text-xs">Impuesto (%)</p>
                              {editIndex === index ? (
                                <div className="[&_button]:!h-9">
                                  <Select
                                    value={detail?.tax?.id != null ? String(detail.tax.id) : ''}
                                    onValueChange={(value) =>
                                      handleInputChange(index, 'tax', value)
                                    }
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
                                </div>
                              ) : (
                                <p
                                  className={cn(
                                    'py-2 text-sm font-medium',
                                    taxRate == null && 'text-warning'
                                  )}
                                >
                                  {formatTaxRate(taxRate)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="flex gap-2 border-t pt-3">
                            {editIndex === index ? (
                              <>
                                <Button
                                  onClick={handleOnClickSaveLine}
                                  disabled={!isDetailValid(detail)}
                                  size="sm"
                                  className="flex-1"
                                >
                                  <Check />
                                  Guardar
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => handleOnClickCloseLine(detail)}
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
                                  onClick={() => handleOnClickDeleteLine(detail)}
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
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          )}
          {/* Footer con botones */}
          <div
            className={cn(
              'bg-background fixed right-0 bottom-0 left-0 z-50 flex items-center gap-2 border-t p-3',
              MOBILE_SAFE_AREAS.BOTTOM_INSET
            )}
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
            {isSomeProductDetected && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleOnClickAddDetectedProducts}
                    className="text-info focus:text-info"
                  >
                    <GitBranchPlus size={16} className="mr-2" />
                    Añadir productos detectados
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Dialog de Totales */}
          <OrderTotalsSummaryDialog
            open={showTotalsDialog}
            onOpenChange={setShowTotalsDialog}
            title="Totales"
            description="Resumen de cajas, cantidad y precio promedio de la previsión."
            isMobile={isMobile}
            items={[
              { key: 'boxes', label: 'Cajas', value: formatInteger(totals.boxes) },
              {
                key: 'quantity',
                label: 'Cantidad',
                value: formatDecimalWeight(totals.quantity),
              },
              {
                key: 'averagePrice',
                label: 'Precio promedio',
                value: formatDecimalCurrency(averageUnitPrice),
              },
            ]}
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
                      <TableCell className="font-semibold">Totales</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatInteger(totals.boxes)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
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
