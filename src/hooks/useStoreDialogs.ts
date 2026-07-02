'use client';

import { getPallet } from '@/services/palletService';
import { getAvailableNetWeight } from '@/helpers/pallet/boxAvailability';
import { useRef, useState } from 'react';
import { notify } from '@/lib/notifications';

export interface StoreBox {
  netWeight?: number;
  [key: string]: unknown;
}

export interface StorePallet {
  id: string | number;
  boxes?: StoreBox[];
  store?: { id: string | number } | null;
  storeId?: string | number | null;
  receptionId?: string | number | null;
  orderId?: string | number | null;
  [key: string]: unknown;
}

export interface StoreData {
  id: string | number;
  name?: string;
  content?: { pallets?: StorePallet[] };
  totalNetWeight?: number;
  [key: string]: unknown;
}

interface UseStoreDialogsParams {
  store: StoreData | null;
  setStore: React.Dispatch<React.SetStateAction<StoreData | null>>;
  token: string | undefined;
  storeId: string | number;
  onUpdateCurrentStoreTotalNetWeight?: ((storeId: string | number, totalNetWeight: number) => void) | null;
  onAddNetWeightToStore?: ((storeId: string | number, weight: number) => void) | null;
}

export function useStoreDialogs({
  store,
  setStore,
  token,
  storeId,
  onUpdateCurrentStoreTotalNetWeight,
  onAddNetWeightToStore,
}: UseStoreDialogsParams) {
  const [isOpenPositionSlideover, setIsOpenPositionSlideover] = useState(false);
  const [isOpenUnallocatedPositionSlideover, setIsOpenUnallocatedPositionSlideover] =
    useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | number | null>(null);

  const [isOpenAddElementToPositionDialog, setIsOpenAddElementToPositionDialog] = useState(false);
  const [addElementToPositionDialogData, setAddElementToPositionDialogData] = useState<
    string | number | null
  >(null);

  const [isOpenPalletDialog, setIsOpenPalletDialog] = useState(false);
  const [palletDialogData, setPalletDialogData] = useState<string | number | null>(null);
  const [palletDialogInitialTab, setPalletDialogInitialTab] = useState<string | null>(null);
  const [clonedPalletData, setClonedPalletData] = useState<StorePallet | null>(null);
  const [isDuplicatingPallet, setIsDuplicatingPallet] = useState(false);

  const [isOpenPalletLabelDialog, setIsOpenPalletLabelDialog] = useState(false);
  const [palletLabelDialogData, setPalletLabelDialogData] = useState<StorePallet | null>(null);

  const [isOpenMovePalletToStoreDialog, setIsOpenMovePalletToStoreDialog] = useState(false);
  const [movePalletToStoreDialogData, setMovePalletToStoreDialogData] = useState<
    string | number | null
  >(null);

  const [isOpenMoveMultiplePalletsToStoreDialog, setIsOpenMoveMultiplePalletsToStoreDialog] =
    useState(false);

  const pallets: StorePallet[] = store?.content?.pallets || [];

  const openPositionSlideover = (positionId: string | number) => {
    setSelectedPosition(positionId);
    setIsOpenPositionSlideover(true);
  };

  const closePositionSlideover = () => {
    setSelectedPosition(null);
    setIsOpenPositionSlideover(false);
  };

  const openUnallocatedPositionSlideover = () => setIsOpenUnallocatedPositionSlideover(true);
  const closeUnallocatedPositionSlideover = () => setIsOpenUnallocatedPositionSlideover(false);

  const openAddElementToPosition = (id: string | number) => {
    setIsOpenAddElementToPositionDialog(true);
    setAddElementToPositionDialogData(id);
  };

  const closeAddElementToPosition = () => {
    setIsOpenAddElementToPositionDialog(false);
    setTimeout(() => setAddElementToPositionDialogData(null), 1000);
  };

  const openMovePalletToStoreDialog = (palletId: string | number) => {
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

  const openPalletLabelDialog = (palletId: string | number) => {
    const pallet = store?.content?.pallets?.find((p) => p.id === palletId);
    if (!pallet) return;
    setPalletLabelDialogData(pallet);
    setIsOpenPalletLabelDialog(true);
  };

  const closePalletLabelDialog = () => {
    setIsOpenPalletLabelDialog(false);
    setTimeout(() => setPalletLabelDialogData(null), 1000);
  };

  const openPalletDialog = (palletId: string | number, initialTab: string | null = null) => {
    setPalletDialogData(palletId);
    setPalletDialogInitialTab(initialTab);
    setIsOpenPalletDialog(true);
  };

  const openCreatePalletDialog = () => {
    setPalletDialogData('new');
    setPalletDialogInitialTab(null);
    setClonedPalletData(null);
    setIsOpenPalletDialog(true);
  };

  const closePalletDialog = () => {
    setIsOpenPalletDialog(false);
    setTimeout(() => {
      setPalletDialogData(null);
      setPalletDialogInitialTab(null);
      setClonedPalletData(null);
    }, 1000);
  };

  const nextBoxIdRef = useRef(Date.now());
  const generateUniqueBoxId = () => ++nextBoxIdRef.current;

  const openDuplicatePalletDialog = async (palletId: string | number) => {
    if (!token) {
      notify.error({ title: 'No se pudo obtener el token de autenticación' });
      return;
    }

    setIsDuplicatingPallet(true);
    try {
      const originalPallet = await notify.promise(getPallet(palletId), {
        loading: 'Duplicando...',
        success: 'Datos del palet cargados',
        error: (error: unknown) => {
          const err = error as Record<string, unknown>;
          const desc =
            (err?.userMessage as string | undefined) ||
            ((err?.data as Record<string, unknown> | undefined)?.userMessage as
              | string
              | undefined) ||
            (
              (err?.response as Record<string, unknown> | undefined)?.data as
                | Record<string, unknown>
                | undefined
            )?.userMessage as string | undefined ||
            (err?.message as string | undefined) ||
            'No se pudo cargar el palet. Intente de nuevo.';
          return { title: 'Error al duplicar el palet', description: desc };
        },
      });

      const original = originalPallet as StorePallet;
      const clonedPallet: StorePallet = {
        ...original,
        id: null as unknown as string,
        receptionId: null,
        boxes:
          original.boxes?.map((box) => ({
            ...box,
            id: generateUniqueBoxId(),
            new: true,
          })) ?? [],
        store: original.store ? { id: original.store.id } : null,
        storeId: original.storeId || original.store?.id || storeId,
        orderId: null,
      };

      setClonedPalletData(clonedPallet);
      setPalletDialogData('new');
      setPalletDialogInitialTab(null);
      setIsOpenPalletDialog(true);
    } finally {
      setIsDuplicatingPallet(false);
    }
  };

  const updateStoreWhenOnChangePallet = (updatedPallet: StorePallet) => {
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

      const newStore: StoreData = {
        ...prevStore,
        content: { ...prevStore.content, pallets: updatedPallets },
        totalNetWeight,
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

  const updateStoreWhenOnMovePalletToStore = ({
    palletId,
    storeId: targetStoreId,
  }: {
    palletId: string | number;
    storeId: string | number;
  }) => {
    const pallet = store?.content?.pallets?.find((p) => p.id === palletId);
    const palletTotalNetWeight =
      pallet?.boxes?.reduce((sum, box) => sum + (Number(box.netWeight) || 0), 0) || 0;

    if (onAddNetWeightToStore) {
      onAddNetWeightToStore(targetStoreId, palletTotalNetWeight);
    }

    setStore((prevStore) => {
      if (!prevStore?.content?.pallets) return prevStore;
      const updatedPallets = prevStore.content.pallets.filter((p) => p.id !== palletId);
      const totalNetWeight = updatedPallets.reduce(
        (total, p) => total + getAvailableNetWeight(p),
        0
      );

      const newStore: StoreData = {
        ...prevStore,
        content: { ...prevStore.content, pallets: updatedPallets },
        totalNetWeight,
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
  }: {
    palletIds: (string | number)[];
    storeId: string | number;
  }) => {
    const movedPallets = store?.content?.pallets?.filter((p) => palletIds.includes(p.id)) ?? [];
    const totalMovedWeight = movedPallets.reduce((sum, pallet) => {
      const palletWeight =
        pallet.boxes?.reduce((boxSum, box) => boxSum + (Number(box.netWeight) || 0), 0) ?? 0;
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
        (total, p) => total + getAvailableNetWeight(p),
        0
      );

      const newStore: StoreData = {
        ...prevStore,
        content: { ...prevStore.content, pallets: updatedPallets },
        totalNetWeight,
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
    palletDialogInitialTab,
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
