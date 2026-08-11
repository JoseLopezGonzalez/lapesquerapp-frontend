'use client';

import { notify } from '@/lib/notifications';
import {
  PalletBox,
  PalletState,
  ProductOption,
  recalculatePalletStats,
  generateUniqueIntId,
  roundToTwoDecimals,
  parseDecimalInput,
} from './palletHelpers';

interface UsePalletBoxOperationsParams {
  temporalPallet: PalletState | null;
  setTemporalPallet: React.Dispatch<React.SetStateAction<PalletState | null>>;
  productsOptions: ProductOption[];
}

export interface EditBoxMethods {
  product: (boxId: number | string, product: { id: number | string; name: string }) => void;
  lot: (boxId: number | string, lot: string) => void;
  netWeight: (boxId: number | string, netWeight: unknown) => void;
  grossWeight: (boxId: number | string, grossWeight: unknown) => void;
  manualCostPerKg: (boxId: number | string, value: unknown) => void;
}

export interface BulkEditBoxesMethods {
  changeLot: (boxIds: (number | string)[] | null, lot: string) => void;
  changeNetWeight: (boxIds: (number | string)[] | null, netWeight: unknown) => void;
  addOrSubtractWeight: (boxIds: (number | string)[] | null, weightDifference: unknown) => void;
  changeProduct: (
    boxIds: (number | string)[] | null,
    oldProductId: number | string,
    newProductId: number | string
  ) => void;
  setManualCostPerKg: (boxIds: (number | string)[] | null, cost: number | null) => void;
  setGrossWeightFromTare: (boxIds: (number | string)[] | null, tare: unknown) => void;
}

export interface UsePalletBoxOperationsResult {
  addBox: (
    box: Partial<PalletBox> & {
      product: { id: number | string; name: string } | null;
      lot: string;
      netWeight: unknown;
    }
  ) => void;
  duplicateBox: (boxId: number | string) => void;
  deleteBox: (boxId: number | string) => void;
  deleteBoxes: (boxIds: (number | string)[]) => void;
  editBox: EditBoxMethods;
  bulkEditBoxes: BulkEditBoxesMethods;
  editObservations: (observations: string) => void;
  editPalletTareWeightKg: (palletTareWeightKg: string) => void;
  editOrderId: (orderId: number | string | null) => void;
  setBoxPrinted: (boxId: number | string) => void;
  deleteAllBoxes: () => void;
}

export function usePalletBoxOperations({
  temporalPallet,
  setTemporalPallet,
  productsOptions,
}: UsePalletBoxOperationsParams): UsePalletBoxOperationsResult {
  const getProductById = (productId: number | string) => {
    const product = productsOptions.find((p) => p.value === productId);
    if (!product) return null;
    return { id: product.value, name: String(product.label) };
  };

  const getBoxGtinById = (productId: number | string): string | null => {
    const product = productsOptions.find((p) => p.value === productId);
    return product?.boxGtin ?? null;
  };

  // AI GS1 3102/3202: peso neto codificado con 2 decimales implícitos (el dígito "n" de la
  // familia 310n/320n indica el número de decimales según el estándar GS1 General
  // Specifications). No usar 3100/3200 (0 decimales) — un lector GS1-128 externo
  // decodificaría el peso como 100 veces el real. Ver GAP-V2-078.
  //
  // AI GS1 01 exige siempre 14 dígitos. boxGtin se valida en el catálogo de productos como
  // 8-14 dígitos (EAN-8/UPC-12/EAN-13/GTIN-14, ver docs/API-references/productos/README.md),
  // así que hay que rellenar con ceros a la izquierda hasta 14 al construir el código — si no,
  // parseGs1128Line (que sí exige \d{14} tras "01" siguiendo el estándar) nunca puede volver a
  // leer su propio código para GTIN de menos de 14 dígitos.
  const getGs1128 = (productId: number | string, lot: string, netWeight: unknown): string => {
    const boxGtin = (getBoxGtinById(productId) ?? '').padStart(14, '0');
    const weight = parseFloat(String(netWeight)) || 0;
    const formattedNetWeight = weight.toFixed(2).replace('.', '').padStart(6, '0');
    return `(01)${boxGtin}(3102)${formattedNetWeight}(10)${lot}`;
  };

  const getGs1128WithPounds = (
    productId: number | string,
    lot: string,
    netWeightInPounds: number
  ): string => {
    const boxGtin = (getBoxGtinById(productId) ?? '').padStart(14, '0');
    const formattedNetWeight = netWeightInPounds.toFixed(2).replace('.', '').padStart(6, '0');
    return `(01)${boxGtin}(3202)${formattedNetWeight}(10)${lot}`;
  };

  const addBox = (
    box: Partial<PalletBox> & {
      product: { id: number | string; name: string } | null;
      lot: string;
      netWeight: unknown;
    }
  ) => {
    if (!temporalPallet) return;
    const uniqueId = generateUniqueIntId();
    const roundedNetWeight = roundToTwoDecimals(box.netWeight);
    const boxWithRoundedWeight = { ...box, netWeight: roundedNetWeight };
    const gs1128 = boxWithRoundedWeight.isPounds
      ? getGs1128WithPounds(
          boxWithRoundedWeight.product!.id,
          boxWithRoundedWeight.lot,
          (boxWithRoundedWeight.originalWeightInPounds as number) ?? roundedNetWeight
        )
      : getGs1128(boxWithRoundedWeight.product!.id, boxWithRoundedWeight.lot, roundedNetWeight);
    const boxWithId: PalletBox = {
      ...(boxWithRoundedWeight as PalletBox),
      id: uniqueId,
      new: true,
      gs1128,
      grossWeight: roundedNetWeight,
    };
    setTemporalPallet((prev) =>
      prev
        ? recalculatePalletStats({
            ...prev,
            boxes: [...(prev.boxes || []), boxWithId],
          })
        : prev
    );
  };

  const duplicateBox = (boxId: number | string) => {
    if (!temporalPallet) return;
    const boxToDuplicate = temporalPallet.boxes.find((box) => box.id === boxId);
    if (!boxToDuplicate) return;
    const roundedNetWeight = roundToTwoDecimals(boxToDuplicate.netWeight);
    const newBox: PalletBox = {
      ...boxToDuplicate,
      id: generateUniqueIntId(),
      new: true,
      netWeight: roundedNetWeight,
    };
    setTemporalPallet((prev) =>
      prev ? recalculatePalletStats({ ...prev, boxes: [...(prev.boxes || []), newBox] }) : prev
    );
    notify.success({
      title: 'Caja duplicada',
      description: 'La caja se ha duplicado con el mismo producto, lote y peso.',
    });
  };

  const deleteBox = (boxId: number | string) => {
    if (!temporalPallet) return;
    setTemporalPallet((prev) =>
      prev
        ? recalculatePalletStats({ ...prev, boxes: prev.boxes.filter((box) => box.id !== boxId) })
        : prev
    );
    notify.success({ title: 'Caja eliminada', description: 'La caja se ha quitado del palet.' });
  };

  const deleteBoxes = (boxIds: (number | string)[]) => {
    if (!temporalPallet) return;
    const boxesToDelete = temporalPallet.boxes.filter(
      (box) => boxIds.includes(box.id) && box.isAvailable !== false
    );

    if (boxesToDelete.length === 0) {
      notify.error({
        title: 'Sin cajas para eliminar',
        description:
          'No hay cajas disponibles para eliminar. Solo se pueden quitar cajas que no estén en producción.',
      });
      return;
    }

    setTemporalPallet((prev) =>
      prev
        ? recalculatePalletStats({
            ...prev,
            boxes: prev.boxes.filter((box) => !boxesToDelete.some((b) => b.id === box.id)),
          })
        : prev
    );

    notify.success({
      title: 'Cajas eliminadas',
      description: `Se ${boxesToDelete.length === 1 ? 'ha quitado 1 caja' : `han quitado ${boxesToDelete.length} cajas`} del palet.`,
    });
  };

  const editBox: EditBoxMethods = {
    product: (boxId, product) => {
      if (!temporalPallet) return;
      setTemporalPallet((prev) =>
        prev
          ? recalculatePalletStats({
              ...prev,
              boxes: prev.boxes.map((box) => (box.id === boxId ? { ...box, product } : box)),
            })
          : prev
      );
    },
    lot: (boxId, lot) => {
      if (!temporalPallet) return;
      setTemporalPallet((prev) =>
        prev
          ? recalculatePalletStats({
              ...prev,
              boxes: prev.boxes.map((box) =>
                box.id === boxId
                  ? { ...box, lot, gs1128: getGs1128(box.product!.id, lot, box.netWeight) }
                  : box
              ),
            })
          : prev
      );
    },
    netWeight: (boxId, netWeight) => {
      if (!temporalPallet) return;
      const roundedWeight = roundToTwoDecimals(netWeight);
      setTemporalPallet((prev) =>
        prev
          ? recalculatePalletStats({
              ...prev,
              boxes: prev.boxes.map((box) =>
                box.id === boxId
                  ? {
                      ...box,
                      netWeight: roundedWeight,
                      gs1128: getGs1128(box.product!.id, box.lot, roundedWeight),
                    }
                  : box
              ),
            })
          : prev
      );
    },
    grossWeight: (boxId, grossWeight) => {
      if (!temporalPallet) return;
      const roundedWeight = roundToTwoDecimals(grossWeight);
      setTemporalPallet((prev) =>
        prev
          ? recalculatePalletStats({
              ...prev,
              boxes: prev.boxes.map((box) =>
                box.id === boxId ? { ...box, grossWeight: roundedWeight } : box
              ),
            })
          : prev
      );
    },
    manualCostPerKg: (boxId, value) => {
      if (!temporalPallet) return;
      const parsed =
        value === '' || value === null || value === undefined ? null : parseDecimalInput(value);
      const cost = parsed !== null && isNaN(parsed) ? null : parsed;
      setTemporalPallet((prev) =>
        prev
          ? recalculatePalletStats({
              ...prev,
              boxes: prev.boxes.map((box) =>
                box.id === boxId ? { ...box, manualCostPerKg: cost } : box
              ),
            })
          : prev
      );
    },
  };

  const bulkEditBoxes: BulkEditBoxesMethods = {
    changeLot: (boxIds, lot) => {
      if (!temporalPallet) return;
      const boxesToEdit = boxIds
        ? temporalPallet.boxes.filter((box) => boxIds.includes(box.id) && box.isAvailable !== false)
        : temporalPallet.boxes.filter((box) => box.isAvailable !== false);

      if (boxesToEdit.length === 0) {
        notify.error({
          title: 'Sin cajas para editar',
          description:
            'No hay cajas disponibles para editar. Solo se pueden modificar cajas que no estén en producción.',
        });
        return;
      }

      setTemporalPallet((prev) =>
        prev
          ? recalculatePalletStats({
              ...prev,
              boxes: prev.boxes.map((box) => {
                if (boxesToEdit.some((b) => b.id === box.id)) {
                  return { ...box, lot, gs1128: getGs1128(box.product!.id, lot, box.netWeight) };
                }
                return box;
              }),
            })
          : prev
      );

      notify.success({
        title: 'Lote actualizado',
        description: `Se ha cambiado el lote en ${boxesToEdit.length} ${boxesToEdit.length === 1 ? 'caja disponible' : 'cajas disponibles'}.`,
      });
    },

    changeNetWeight: (boxIds, netWeight) => {
      if (!temporalPallet) return;
      const boxesToEdit = boxIds
        ? temporalPallet.boxes.filter((box) => boxIds.includes(box.id) && box.isAvailable !== false)
        : temporalPallet.boxes.filter((box) => box.isAvailable !== false);

      if (boxesToEdit.length === 0) {
        notify.error({
          title: 'Sin cajas para editar',
          description:
            'No hay cajas disponibles para editar. Solo se pueden modificar cajas que no estén en producción.',
        });
        return;
      }

      const parsedWeight = parseDecimalInput(netWeight);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        notify.error({
          title: 'Peso no válido',
          description: 'El peso debe ser un número positivo.',
        });
        return;
      }

      const roundedWeight = roundToTwoDecimals(parsedWeight);
      setTemporalPallet((prev) =>
        prev
          ? recalculatePalletStats({
              ...prev,
              boxes: prev.boxes.map((box) => {
                if (boxesToEdit.some((b) => b.id === box.id)) {
                  return {
                    ...box,
                    netWeight: roundedWeight,
                    gs1128: getGs1128(box.product!.id, box.lot, roundedWeight),
                  };
                }
                return box;
              }),
            })
          : prev
      );

      notify.success({
        title: 'Peso actualizado',
        description: `Se ha cambiado el peso neto en ${boxesToEdit.length} ${boxesToEdit.length === 1 ? 'caja disponible' : 'cajas disponibles'}.`,
      });
    },

    addOrSubtractWeight: (boxIds, weightDifference) => {
      if (!temporalPallet) return;
      const boxesToEdit = boxIds
        ? temporalPallet.boxes.filter((box) => boxIds.includes(box.id) && box.isAvailable !== false)
        : temporalPallet.boxes.filter((box) => box.isAvailable !== false);

      if (boxesToEdit.length === 0) {
        notify.error({
          title: 'Sin cajas para editar',
          description:
            'No hay cajas disponibles para editar. Solo se pueden modificar cajas que no estén en producción.',
        });
        return;
      }

      const parsedDifference = parseDecimalInput(weightDifference);
      if (isNaN(parsedDifference)) {
        notify.error({
          title: 'Peso no válido',
          description: 'El peso a sumar o restar debe ser un número válido.',
        });
        return;
      }
      if (parsedDifference === 0) {
        notify.error({
          title: 'Peso cero',
          description: 'El peso a sumar o restar no puede ser cero.',
        });
        return;
      }

      const boxesWithInvalidResult = boxesToEdit.filter((box) => {
        const currentWeight = parseFloat(String(box.netWeight)) || 0;
        return currentWeight + parsedDifference <= 0;
      }).length;

      setTemporalPallet((prev) => {
        if (!prev) return prev;
        const newBoxes = prev.boxes.map((box) => {
          if (!boxesToEdit.some((b) => b.id === box.id)) return box;
          const currentWeight = parseFloat(String(box.netWeight)) || 0;
          const newWeight = roundToTwoDecimals(currentWeight + parsedDifference);
          if (newWeight <= 0) return box;
          return {
            ...box,
            netWeight: newWeight,
            gs1128: getGs1128(box.product!.id, box.lot, newWeight),
          };
        });
        return recalculatePalletStats({ ...prev, boxes: newBoxes });
      });

      const successfullyUpdated = boxesToEdit.length - boxesWithInvalidResult;
      if (boxesWithInvalidResult > 0) {
        notify.warning({
          title: 'Edición parcial',
          description: `${successfullyUpdated} ${successfullyUpdated === 1 ? 'caja actualizada' : 'cajas actualizadas'}. ${boxesWithInvalidResult} ${boxesWithInvalidResult === 1 ? 'caja no se pudo actualizar' : 'cajas no se pudieron actualizar'} porque el peso resultante sería negativo o cero.`,
        });
      } else {
        const action = parsedDifference > 0 ? 'sumado' : 'restado';
        notify.success({
          title: 'Peso actualizado',
          description: `Se han ${action} ${Math.abs(parsedDifference)} kg en ${successfullyUpdated} ${successfullyUpdated === 1 ? 'caja disponible' : 'cajas disponibles'}.`,
        });
      }
    },

    changeProduct: (boxIds, oldProductId, newProductId) => {
      if (!temporalPallet) return;
      if (!oldProductId || !newProductId) {
        notify.error({
          title: 'Productos requeridos',
          description: 'Debe seleccionar el producto actual y el nuevo producto.',
        });
        return;
      }
      if (oldProductId === newProductId) {
        notify.error({
          title: 'Producto duplicado',
          description: 'El producto nuevo debe ser diferente al actual.',
        });
        return;
      }
      const newProduct = getProductById(newProductId);
      if (!newProduct) {
        notify.error({
          title: 'Producto no encontrado',
          description: 'El producto seleccionado no existe.',
        });
        return;
      }

      const boxesToEdit = boxIds
        ? temporalPallet.boxes.filter(
            (box) =>
              boxIds.includes(box.id) &&
              box.isAvailable !== false &&
              (box.product as { id?: unknown } | null)?.id === oldProductId
          )
        : temporalPallet.boxes.filter(
            (box) =>
              box.isAvailable !== false &&
              (box.product as { id?: unknown } | null)?.id === oldProductId
          );

      if (boxesToEdit.length === 0) {
        notify.error({
          title: 'Sin cajas para editar',
          description:
            'No hay cajas disponibles con el producto seleccionado. Solo se pueden modificar cajas que no estén en producción.',
        });
        return;
      }

      setTemporalPallet((prev) =>
        prev
          ? recalculatePalletStats({
              ...prev,
              boxes: prev.boxes.map((box) => {
                if (!boxesToEdit.some((b) => b.id === box.id)) return box;
                return {
                  ...box,
                  product: newProduct,
                  gs1128: getGs1128(newProductId, box.lot, box.netWeight),
                };
              }),
            })
          : prev
      );

      notify.success({
        title: 'Producto actualizado',
        description: `Se ha cambiado el producto en ${boxesToEdit.length} ${boxesToEdit.length === 1 ? 'caja disponible' : 'cajas disponibles'}.`,
      });
    },

    setManualCostPerKg: (boxIds, cost) => {
      if (!temporalPallet) return;
      const boxesToEdit = (
        boxIds
          ? temporalPallet.boxes.filter(
              (box) => boxIds.includes(box.id) && box.isAvailable !== false
            )
          : temporalPallet.boxes.filter((box) => box.isAvailable !== false)
      ).filter((box) => box.traceableCostPerKg == null);

      if (boxesToEdit.length === 0) {
        notify.error({
          title: 'Sin cajas elegibles',
          description:
            'No hay cajas disponibles sin coste trazable a las que aplicar el coste manual.',
        });
        return;
      }

      setTemporalPallet((prev) =>
        prev
          ? recalculatePalletStats({
              ...prev,
              boxes: prev.boxes.map((box) =>
                boxesToEdit.some((b) => b.id === box.id) ? { ...box, manualCostPerKg: cost } : box
              ),
            })
          : prev
      );

      const skipped =
        temporalPallet.boxes.filter((b) => b.isAvailable !== false).length - boxesToEdit.length;
      const skippedMsg =
        skipped > 0
          ? ` (${skipped} omitida${skipped !== 1 ? 's' : ''} por tener coste trazable)`
          : '';
      notify.success({
        title: cost != null ? 'Coste aplicado' : 'Coste limpiado',
        description:
          cost != null
            ? `${cost} €/kg asignado a ${boxesToEdit.length} caja${boxesToEdit.length !== 1 ? 's' : ''}${skippedMsg}.`
            : `Coste manual eliminado de ${boxesToEdit.length} caja${boxesToEdit.length !== 1 ? 's' : ''}${skippedMsg}.`,
      });
    },

    setGrossWeightFromTare: (boxIds, tare) => {
      if (!temporalPallet) return;
      const boxesToEdit = boxIds
        ? temporalPallet.boxes.filter((box) => boxIds.includes(box.id) && box.isAvailable !== false)
        : temporalPallet.boxes.filter((box) => box.isAvailable !== false);

      if (boxesToEdit.length === 0) {
        notify.error({
          title: 'Sin cajas para editar',
          description:
            'No hay cajas disponibles para editar. Solo se pueden modificar cajas que no estén en producción.',
        });
        return;
      }

      const parsedTare = parseDecimalInput(tare);
      if (isNaN(parsedTare) || parsedTare < 0) {
        notify.error({
          title: 'Tara no válida',
          description: 'La tara de caja debe ser un número igual o mayor que cero.',
        });
        return;
      }

      setTemporalPallet((prev) => {
        if (!prev) return prev;
        const newBoxes = prev.boxes.map((box) => {
          if (!boxesToEdit.some((b) => b.id === box.id)) return box;
          const currentNetWeight = parseFloat(String(box.netWeight)) || 0;
          return {
            ...box,
            grossWeight: roundToTwoDecimals(currentNetWeight + parsedTare),
          };
        });
        return recalculatePalletStats({ ...prev, boxes: newBoxes });
      });

      notify.success({
        title: 'Peso bruto calculado',
        description: `Se ha calculado el peso bruto (neto + ${parsedTare} kg de tara) en ${boxesToEdit.length} ${boxesToEdit.length === 1 ? 'caja disponible' : 'cajas disponibles'}.`,
      });
    },
  };

  const editObservations = (observations: string) => {
    if (!temporalPallet) return;
    setTemporalPallet((prev) => (prev ? { ...prev, observations } : prev));
  };

  const editPalletTareWeightKg = (palletTareWeightKg: string) => {
    if (!temporalPallet) return;
    setTemporalPallet((prev) => (prev ? { ...prev, palletTareWeightKg } : prev));
  };

  const editOrderId = (orderId: number | string | null) => {
    if (!temporalPallet) return;
    setTemporalPallet((prev) => (prev ? { ...prev, orderId } : prev));
  };

  const setBoxPrinted = (boxId: number | string) => {
    if (!temporalPallet) return;
    setTemporalPallet((prev) =>
      prev
        ? {
            ...prev,
            boxes: prev.boxes.map((box) => (box.id === boxId ? { ...box, printed: true } : box)),
          }
        : prev
    );
  };

  const deleteAllBoxes = () => {
    if (!temporalPallet) return;
    setTemporalPallet((prev) => (prev ? recalculatePalletStats({ ...prev, boxes: [] }) : prev));
    notify.success({
      title: 'Todas las cajas eliminadas',
      description: 'Se han quitado todas las cajas del palet. Esta acción no se puede deshacer.',
    });
  };

  return {
    addBox,
    duplicateBox,
    deleteBox,
    deleteBoxes,
    editBox,
    bulkEditBoxes,
    editObservations,
    editPalletTareWeightKg,
    editOrderId,
    setBoxPrinted,
    deleteAllBoxes,
  };
}
