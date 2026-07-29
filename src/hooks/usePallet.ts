'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getActiveOrdersOptions } from '@/services/orderService';
import { getPallet } from '@/services/palletService';
import { getProductOptions } from '@/services/productService';
import { isExternalActor } from '@/lib/auth/actor';
import { notify } from '@/lib/notifications';
import {
  PalletState,
  BoxCreationData,
  ProductOption,
  emptyPallet,
  palletDataEqual,
  getInitialBoxCreationData,
  resetBoxCreationDataPreservingDiscounts,
} from './pallets/palletHelpers';
import { usePalletBoxOperations } from './pallets/usePalletBoxOperations';
import { usePalletBoxCreation } from './pallets/usePalletBoxCreation';
import { usePalletSave } from './pallets/usePalletSave';
import { usePalletScannerEffects } from './pallets/usePalletScannerEffects';

export { saveDiscountPreferences } from './pallets/palletHelpers';
export type { PalletState } from './pallets/palletHelpers';

interface UsePalletParams {
  id: string | number | null;
  onChange: (pallet: PalletState) => void;
  initialStoreId?: string | number | null;
  initialOrderId?: string | number | null;
  skipBackendSave?: boolean;
  initialPallet?: PalletState | null;
}

export function usePallet({
  id,
  onChange,
  initialStoreId = null,
  initialOrderId = null,
  skipBackendSave = false,
  initialPallet = null,
}: UsePalletParams) {
  const [pallet, setPallet] = useState<PalletState | null>(null);
  const [temporalPallet, setTemporalPallet] = useState<PalletState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(false);
  const { data: session } = useSession();
  const externalActor = isExternalActor(session?.user) as boolean;

  const [activeOrdersOptions, setActiveOrdersOptions] = useState<unknown[]>([]);
  const [activeOrdersLoading, setActiveOrdersLoading] = useState(true);
  const [productsOptions, setProductsOptions] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [boxCreationData, setBoxCreationData] = useState<BoxCreationData>(
    getInitialBoxCreationData()
  );

  // initialPallet is only meant to seed the "new pallet" state once per id change — it is not
  // guaranteed to be referentially stable across renders of the caller (it is threaded down
  // as a prop through PalletDialog/PalletView without local memoization). Reading it through a
  // ref keeps the load effect's dependency array honest (only id/reload/store/order/actor
  // actually determine when a (re)load should happen) without re-triggering the full load
  // (and its loading-state resets) whenever the caller re-renders with a new object reference
  // for the same logical initialPallet. The ref is updated in its own effect (never mutated
  // during render, per react-hooks/refs).
  const initialPalletRef = useRef(initialPallet);
  useEffect(() => {
    initialPalletRef.current = initialPallet;
  });

  useEffect(() => {
    setError(null);
    setLoading(true);
    setTemporalPallet(null);

    if (id === 'new' || id === null) {
      const palletToSet = initialPalletRef.current || {
        ...emptyPallet,
        store: initialStoreId ? { id: initialStoreId } : null,
        orderId: initialOrderId || null,
      };
      setPallet(palletToSet as PalletState);
      setLoading(false);
    } else {
      getPallet(id)
        .then((data) => {
          setPallet(data as PalletState);
        })
        .catch((err: Record<string, unknown>) => {
          const errorMessage =
            (err.userMessage as string) ||
            ((err.data as Record<string, unknown>)?.userMessage as string) ||
            (((err.response as Record<string, unknown>)?.data as Record<string, unknown>)
              ?.userMessage as string) ||
            (err.message as string) ||
            'Error al cargar el palet';
          setError(errorMessage);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    if (externalActor) {
      setActiveOrdersOptions([]);
      setActiveOrdersLoading(false);
    } else {
      setActiveOrdersLoading(true);
      getActiveOrdersOptions()
        .then((data) => {
          setActiveOrdersOptions(data as unknown[]);
        })
        .catch((err: unknown) => {
          console.error('Error al cargar las opciones de pedidos:', err);
        })
        .finally(() => {
          setActiveOrdersLoading(false);
        });
    }

    setProductsLoading(true);
    getProductOptions()
      .then((data) => {
        setProductsOptions(
          data.map((product) => {
            const productWithGtin = product as unknown as {
              id: number | string;
              name: string;
              boxGtin?: string | null;
            };
            return {
              value: productWithGtin.id,
              label: productWithGtin.name,
              boxGtin: productWithGtin.boxGtin || null,
            };
          })
        );
      })
      .catch((err: unknown) => {
        console.error('Error al cargar las opciones de productos:', err);
      })
      .finally(() => {
        setProductsLoading(false);
      });
  }, [id, reload, initialStoreId, initialOrderId, externalActor]);

  useEffect(() => {
    if (pallet) {
      setTemporalPallet({ ...pallet });
      setBoxCreationData((prev) => resetBoxCreationDataPreservingDiscounts(prev));
    }
  }, [pallet]);

  const reloadPallet = () => {
    setReload((prev) => !prev);
  };

  const onClose = () => {
    setTimeout(() => {
      setPallet(null);
      setTemporalPallet(null);
      setLoading(false);
      setError(null);
      setReload(false);
      setBoxCreationData((prev) => resetBoxCreationDataPreservingDiscounts(prev));
    }, 1000);
  };

  const {
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
  } = usePalletBoxOperations({ temporalPallet, setTemporalPallet, productsOptions });

  const { boxCreationDataChange, onAddNewBox, onDeleteScannedCode, onResetBoxCreationData } =
    usePalletBoxCreation({
      temporalPallet,
      setTemporalPallet,
      productsOptions,
      addBox,
      boxCreationData,
      setBoxCreationData,
      session,
    });

  const { onSavingChanges } = usePalletSave({
    temporalPallet,
    setPallet,
    setSaving,
    onChange,
    skipBackendSave,
    session,
    boxCreationData,
  });

  // Auto-submit scanner when code reaches expected length (add / delete by GS1-128 scan)
  usePalletScannerEffects({
    scannedCode: boxCreationData.scannedCode,
    deleteScannedCode: boxCreationData.deleteScannedCode,
    onAddNewBox,
    onDeleteScannedCode,
    setBoxCreationData,
  });

  const editPallet = {
    box: {
      add: addBox,
      duplicate: duplicateBox,
      delete: deleteBox,
      deleteMultiple: deleteBoxes,
      edit: editBox,
      bulkEdit: bulkEditBoxes,
    },
    observations: editObservations,
    palletTareWeightKg: editPalletTareWeightKg,
    orderId: editOrderId,
  };

  type ProductSummaryEntry = {
    numberOfBoxes: number;
    totalNetWeight: number;
    lots: Record<string, number[]>;
  };
  const temporalProductsSummary: Record<string, ProductSummaryEntry> =
    temporalPallet?.boxes?.reduce((acc: Record<string, ProductSummaryEntry>, box) => {
      const productName = (box.product as { name?: string } | null)?.name ?? '';
      const lot = box.lot;
      const netWeight = parseFloat(String(box.netWeight));
      if (!acc[productName]) {
        acc[productName] = { numberOfBoxes: 0, totalNetWeight: 0, lots: {} };
      }
      acc[productName].numberOfBoxes += 1;
      acc[productName].totalNetWeight += netWeight;
      if (!acc[productName].lots[lot]) {
        acc[productName].lots[lot] = [];
      }
      acc[productName].lots[lot].push(netWeight);
      return acc;
    }, {}) || {};

  const temporalTotalProducts = Object.keys(temporalProductsSummary).length;

  const temporalUniqueLots = new Set<string>();
  temporalPallet?.boxes?.forEach((box) => temporalUniqueLots.add(box.lot));
  const temporalTotalLots = temporalUniqueLots.size;

  const getPieChartData = Object.entries(temporalProductsSummary).map(([productName, data]) => ({
    name: productName,
    value: parseFloat(data.totalNetWeight.toFixed(2)),
  }));

  const resetAllChanges = () => {
    if (pallet) setTemporalPallet({ ...pallet });
    setBoxCreationData((prev) => resetBoxCreationDataPreservingDiscounts(prev));
    notify.success({
      title: 'Cambios desechados',
      description: 'Se han descartado los cambios y el palet ha vuelto al estado anterior.',
    });
  };

  const hasPalletChanges = !temporalPallet
    ? false
    : !palletDataEqual(pallet, temporalPallet);

  return {
    pallet,
    reloadPallet,
    loading,
    saving,
    temporalPallet,
    temporalProductsSummary,
    temporalTotalProducts,
    error,
    temporalTotalLots,
    temporalUniqueLots,
    activeOrdersOptions,
    activeOrdersLoading,
    editPallet,
    productsOptions,
    productsLoading,
    boxCreationData,
    boxCreationDataChange,
    onResetBoxCreationData,
    onAddNewBox,
    deleteAllBoxes,
    resetAllChanges,
    getPieChartData,
    onSavingChanges,
    onClose,
    setBoxPrinted,
    hasPalletChanges,
  };
}
