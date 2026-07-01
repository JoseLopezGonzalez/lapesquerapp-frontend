'use client';

import { useState, useEffect } from 'react';
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
  const token = session?.user?.accessToken as string | undefined;
  const externalActor = isExternalActor(session?.user) as boolean;

  const [activeOrdersOptions, setActiveOrdersOptions] = useState<unknown[]>([]);
  const [activeOrdersLoading, setActiveOrdersLoading] = useState(true);
  const [productsOptions, setProductsOptions] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [boxCreationData, setBoxCreationData] = useState<BoxCreationData>(
    getInitialBoxCreationData()
  );

  useEffect(() => {
    setError(null);
    setLoading(true);
    setTemporalPallet(null);

    if (!token) {
      setError('No hay token de autenticación');
      setLoading(false);
      return;
    }

    if (id === 'new' || id === null) {
      const palletToSet = initialPallet || {
        ...emptyPallet,
        store: initialStoreId ? { id: initialStoreId } : null,
        orderId: initialOrderId || null,
      };
      setPallet(palletToSet as PalletState);
      setLoading(false);
    } else {
      (getPallet as (id: unknown, token: string) => Promise<unknown>)(id, token)
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
    (
      getProductOptions as (
        token: string
      ) => Promise<Array<{ id: number | string; name: string; boxGtin?: string | null }>>
    )(token)
      .then((data) => {
        setProductsOptions(
          data.map((product) => ({
            value: product.id,
            label: product.name,
            boxGtin: product.boxGtin || null,
          }))
        );
      })
      .catch((err: unknown) => {
        console.error('Error al cargar las opciones de productos:', err);
      })
      .finally(() => {
        setProductsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, reload, initialStoreId, initialOrderId, externalActor]);

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
    token,
    session,
    boxCreationData,
  });

  // Auto-submit scanner when code reaches expected length
  useEffect(() => {
    if (boxCreationData.scannedCode.length >= 42) {
      onAddNewBox({ method: 'lector' });
      setBoxCreationData((prev) => resetBoxCreationDataPreservingDiscounts(prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxCreationData.scannedCode]);

  useEffect(() => {
    if (boxCreationData.deleteScannedCode.length >= 42) {
      onDeleteScannedCode();
      setBoxCreationData((prev) => ({ ...prev, deleteScannedCode: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxCreationData.deleteScannedCode]);

  const editPallet = {
    box: {
      add: addBox,
      duplicate: duplicateBox,
      delete: deleteBox,
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
