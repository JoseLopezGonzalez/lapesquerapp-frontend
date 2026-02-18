'use client';

import { getPallet } from '@/services/palletService';
import { getAvailableNetWeight } from '@/helpers/pallet/boxAvailability';
import { useRef, useState } from 'react';
import { notify } from '@/lib/notifications';

/**
 * Hook para estado y handlers de diálogos/slideovers del almacén.
 * @param {Object} params
 * @param {Object} params.store - Datos del almacén
 * @param {Function} params.setStore - Setter del store
 * @param {string} [params.token] - Token de autenticación
 * @param {string} params.storeId - ID del almacén
 * @param {Function} [params.onUpdateCurrentStoreTotalNetWeight] - Callback al actualizar peso total
 * @param {Function} [params.onAddNetWeightToStore] - Callback al añadir peso a otro almacén
 */
export function useStoreDialogs({
  store,
  setStore,
  token,
  storeId,
  onUpdateCurrentStoreTotalNetWeight,
  onAddNetWeightToStore,
}) {
  const [isOpenPositionSlideover, setIsOpenPositionSlideover] = useState(false);
  const [isOpenUnallocatedPositionSlideover, setIsOpenUnallocatedPositionSlideover] =
    useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);

  const [isOpenAddElementToPositionDialog, setIsOpenAddElementToPositionDialog] =
    useState(false);
  const [addElementToPositionDialogData, setAddElementToPositionDialogData] =
    useState(null);

  const [isOpenPalletDialog, setIsOpenPalletDialog] = useState(false);
  const [palletDialogData, setPalletDialogData] = useState(null);
  const [clonedPalletData, setClonedPalletData] = useState(null);
  const [isDuplicatingPallet, setIsDuplicatingPallet] = useState(false);

  const [isOpenPalletLabelDialog, setIsOpenPalletLabelDialog] = useState(false);
  const [palletLabelDialogData, setPalletLabelDialogData] = useState(null);

  const [isOpenMovePalletToStoreDialog, setIsOpenMovePalletToStoreDialog] =
    useState(false);
  const [movePalletToStoreDialogData, setMovePalletToStoreDialogData] =
    useState(null);

  const [isOpenMoveMultiplePalletsToStoreDialog, setIsOpenMoveMultiplePalletsToStoreDialog] =
    useState(false);

  const pallets = store?.content?.pallets || [];

  const openPositionSlideover = (positionId) => {
    setSelectedPosition(positionId);
    setIsOpenPositionSlideover(true);
  };

  const closePositionSlideover = () => {
    setSelectedPosition(null);
    setIsOpenPositionSlideover(false);
  };

  const openUnallocatedPositionSlideover = () =>
    setIsOpenUnallocatedPositionSlideover(true);

  const closeUnallocatedPositionSlideover = () =>
    setIsOpenUnallocatedPositionSlideover(false);

  const openAddElementToPosition = (id) => {
    setIsOpenAddElementToPositionDialog(true);
    setAddElementToPositionDialogData(id);
  };

  const closeAddElementToPosition = () => {
    setIsOpenAddElementToPositionDialog(false);
    setTimeout(() => setAddElementToPositionDialogData(null), 1000);
  };

  const openMovePalletToStoreDialog = (palletId) => {
    setMovePalletToStoreDialogData(palletId);
    setIsOpenMovePalletToStoreDialog(true);
  };

  const closeMovePalletToStoreDialog = () => {
    setIsOpenMovePalletToStoreDialog(false);
    setTimeout(() => setMovePalletToStoreDialogData(null), 1000);
  };

  const openMoveMultiplePalletsToStoreDialog = () =>
    setIsOpenMoveMultiplePalletsToStoreDialog(true);

  const closeMoveMultiplePalletsToStoreDialog = () =>
    setIsOpenMoveMultiplePalletsToStoreDialog(false);

  const openPalletLabelDialog = (palletId) => {
    const pallet = store?.content?.pallets?.find((p) => p.id === palletId);
    if (!pallet) return;
    setPalletLabelDialogData(pallet);
    setIsOpenPalletLabelDialog(true);
  };

  const closePalletLabelDialog = () => {
    setIsOpenPalletLabelDialog(false);
    setTimeout(() => setPalletLabelDialogData(null), 1000);
  };

  const openPalletDialog = (palletId) => {
    setPalletDialogData(palletId);
    setIsOpenPalletDialog(true);
  };

  const openCreatePalletDialog = () => {
    setPalletDialogData('new');
    setClonedPalletData(null);
    setIsOpenPalletDialog(true);
  };

  const closePalletDialog = () => {
    setIsOpenPalletDialog(false);
    setTimeout(() => {
      setPalletDialogData(null);
      setClonedPalletData(null);
    }, 1000);
  };

  const nextBoxIdRef = useRef(Date.now());
  const generateUniqueBoxId = () => ++nextBoxIdRef.current;

  const openDuplicatePalletDialog = async (palletId) => {
    if (!token) {
      notify.error({ title: 'No se pudo obtener el token de autenticación' });
      return;
    }

    setIsDuplicatingPallet(true);
    try {
      const originalPallet = await notify.promise(getPallet(palletId, token), {
        loading: 'Duplicando...',
        success: 'Datos del palet cargados',
        error: (error) => {
          const desc =
            error?.userMessage ||
            error?.data?.userMessage ||
            error?.response?.data?.userMessage ||
            error?.message ||
            'No se pudo cargar el palet. Intente de nuevo.';
          return { title: 'Error al duplicar el palet', description: desc };
        },
      });

      const clonedPallet = {
        ...originalPallet,
        id: null,
        receptionId: null,
        boxes:
          originalPallet.boxes?.map((box) => ({
            ...box,
            id: generateUniqueBoxId(),
            new: true,
          })) ?? [],
        store: originalPallet.store ? { id: originalPallet.store.id } : null,
        storeId: originalPallet.storeId || originalPallet.store?.id || storeId,
        orderId: null,
      };

      setClonedPalletData(clonedPallet);
      setPalletDialogData('new');
      setIsOpenPalletDialog(true);
    } finally {
      setIsDuplicatingPallet(false);
    }
  };

  const updateStoreWhenOnChangePallet = (updatedPallet) => {
    setStore((prevStore) => {
      if (!prevStore?.content?.pallets) return prevStore;
      const existingPallets = prevStore.content.pallets || [];
      const palletIndex = existingPallets.findIndex((p) => p.id === updatedPallet.id);
      const updatedPallets =
        palletIndex !== -1
          ? existingPallets.map((p) =>
              p.id === updatedPallet.id ? { ...p, ...updatedPallet } : p
            )
          : [...existingPallets, updatedPallet];

      const totalNetWeight = updatedPallets.reduce(
        (total, pallet) => total + getAvailableNetWeight(pallet),
        0
      );

      const newStore = {
        ...prevStore,
        content: { ...prevStore.content, pallets: updatedPallets },
        totalNetWeight: totalNetWeight,
      };

      if (onUpdateCurrentStoreTotalNetWeight) {
        onUpdateCurrentStoreTotalNetWeight(prevStore.id, totalNetWeight);
      }
      return newStore;
    });

    if (palletDialogData === 'new') {
      setPalletDialogData(updatedPallet.id);
    }
  };

  const updateStoreWhenOnMovePalletToStore = ({ palletId, storeId: targetStoreId }) => {
    const pallet = store?.content?.pallets?.find((p) => p.id === palletId);
    const palletTotalNetWeight =
      pallet?.boxes?.reduce((sum, box) => sum + (box.netWeight || 0), 0) || 0;

    if (onAddNetWeightToStore) {
      onAddNetWeightToStore(targetStoreId, palletTotalNetWeight);
    }

    setStore((prevStore) => {
      if (!prevStore?.content?.pallets) return prevStore;
      const updatedPallets = prevStore.content.pallets.filter((p) => p.id !== palletId);
      const totalNetWeight = updatedPallets.reduce(
        (total, pallet) => total + getAvailableNetWeight(pallet),
        0
      );

      const newStore = {
        ...prevStore,
        content: { ...prevStore.content, pallets: updatedPallets },
        totalNetWeight: totalNetWeight,
      };

      if (onUpdateCurrentStoreTotalNetWeight) {
        onUpdateCurrentStoreTotalNetWeight(prevStore.id, totalNetWeight);
      }
      return newStore;
    });
  };

  const updateStoreWhenOnMoveMultiplePalletsToStore = ({
    palletIds,
    storeId: targetStoreId,
  }) => {
    const movedPallets =
      store?.content?.pallets?.filter((p) => palletIds.includes(p.id)) ?? [];
    const totalMovedWeight = movedPallets.reduce((sum, pallet) => {
      const palletWeight =
        pallet.boxes?.reduce((boxSum, box) => boxSum + (box.netWeight || 0), 0) ?? 0;
      return sum + palletWeight;
    }, 0);

    if (onAddNetWeightToStore) {
      onAddNetWeightToStore(targetStoreId, totalMovedWeight);
    }

    setStore((prevStore) => {
      if (!prevStore?.content?.pallets) return prevStore;
      const updatedPallets = prevStore.content.pallets.filter(
        (pallet) => !palletIds.includes(pallet.id)
      );
      const totalNetWeight = updatedPallets.reduce(
        (total, pallet) => total + getAvailableNetWeight(pallet),
        0
      );

      const newStore = {
        ...prevStore,
        content: { ...prevStore.content, pallets: updatedPallets },
        totalNetWeight: totalNetWeight,
      };

      if (onUpdateCurrentStoreTotalNetWeight) {
        onUpdateCurrentStoreTotalNetWeight(prevStore.id, totalNetWeight);
      }
      return newStore;
    });
  };

  return {
    isOpenPositionSlideover,
    selectedPosition,
    openPositionSlideover,
    closePositionSlideover,

    isOpenUnallocatedPositionSlideover,
    openUnallocatedPositionSlideover,
    closeUnallocatedPositionSlideover,

    isOpenAddElementToPositionDialog,
    addElementToPositionDialogData,
    openAddElementToPosition,
    closeAddElementToPosition,

    pallets,

    isOpenPalletDialog,
    palletDialogData,
    clonedPalletData,
    isDuplicatingPallet,
    openPalletDialog,
    closePalletDialog,
    openCreatePalletDialog,
    openDuplicatePalletDialog,

    isOpenPalletLabelDialog,
    palletLabelDialogData,
    openPalletLabelDialog,
    closePalletLabelDialog,

    isOpenMovePalletToStoreDialog,
    movePalletToStoreDialogData,
    openMovePalletToStoreDialog,
    closeMovePalletToStoreDialog,

    isOpenMoveMultiplePalletsToStoreDialog,
    openMoveMultiplePalletsToStoreDialog,
    closeMoveMultiplePalletsToStoreDialog,

    updateStoreWhenOnChangePallet,
    updateStoreWhenOnMovePalletToStore,
    updateStoreWhenOnMoveMultiplePalletsToStore,
  };
}
