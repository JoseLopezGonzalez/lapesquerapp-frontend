'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores';
import { useStoreData } from '@/hooks/useStoreData';
import { useStorePositions } from '@/hooks/useStorePositions';
import { useStoreDialogs } from '@/hooks/useStoreDialogs';

export function useStore({
  storeId,
  onUpdateCurrentStoreTotalNetWeight,
  onAddNetWeightToStore,
  setIsStoreLoading,
}) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const { store: fetchedStore, loading, error } = useStoreData({
    storeId,
    setIsStoreLoading,
  });
  const [store, setStore] = useState(null);

  useEffect(() => {
    setStore(fetchedStore ?? null);
  }, [fetchedStore, storeId]);

  const positions = useStorePositions({ store, setStore, token });
  const dialogs = useStoreDialogs({
    store,
    setStore,
    token,
    storeId,
    onUpdateCurrentStoreTotalNetWeight,
    onAddNetWeightToStore,
  });

  return {
    store,
    loading,
    error,
    isPositionFilled: positions.isPositionFilled,

    onChangeFilters: positions.onChangeFilters,
    filteredPositionsMap: positions.filteredPositionsMap,
    removePalletFromPosition: positions.removePalletFromPosition,

    filters: positions.filters,
    resetFilters: positions.resetFilters,
    palletsOptions: positions.palletsOptions,
    productsOptions: positions.productsOptions,
    speciesSummary: positions.speciesSummary,

    getPositionPallets: positions.getPositionPallets,
    getPosition: positions.getPosition,
    openPositionSlideover: dialogs.openPositionSlideover,
    closePositionSlideover: dialogs.closePositionSlideover,
    isOpenPositionSlideover: dialogs.isOpenPositionSlideover,
    selectedPosition: dialogs.selectedPosition,

    isOpenAddElementToPositionDialog: dialogs.isOpenAddElementToPositionDialog,
    openAddElementToPosition: dialogs.openAddElementToPosition,
    closeAddElementToPosition: dialogs.closeAddElementToPosition,

    unlocatedPallets: positions.unlocatedPallets,
    pallets: dialogs.pallets,

    isOpenPalletDialog: dialogs.isOpenPalletDialog,
    openPalletDialog: dialogs.openPalletDialog,
    closePalletDialog: dialogs.closePalletDialog,
    palletDialogData: dialogs.palletDialogData,
    clonedPalletData: dialogs.clonedPalletData,
    openDuplicatePalletDialog: dialogs.openDuplicatePalletDialog,
    isDuplicatingPallet: dialogs.isDuplicatingPallet,

    isOpenUnallocatedPositionSlideover: dialogs.isOpenUnallocatedPositionSlideover,
    openUnallocatedPositionSlideover: dialogs.openUnallocatedPositionSlideover,
    closeUnallocatedPositionSlideover: dialogs.closeUnallocatedPositionSlideover,

    isPositionRelevant: positions.isPositionRelevant,
    isPalletRelevant: positions.isPalletRelevant,
    updateStoreWhenOnChangePallet: dialogs.updateStoreWhenOnChangePallet,
    openCreatePalletDialog: dialogs.openCreatePalletDialog,

    openPalletLabelDialog: dialogs.openPalletLabelDialog,
    closePalletLabelDialog: dialogs.closePalletLabelDialog,
    palletLabelDialogData: dialogs.palletLabelDialogData,
    isOpenPalletLabelDialog: dialogs.isOpenPalletLabelDialog,
    addElementToPositionDialogData: dialogs.addElementToPositionDialogData,
    changePalletsPosition: positions.changePalletsPosition,

    openMovePalletToStoreDialog: dialogs.openMovePalletToStoreDialog,
    closeMovePalletToStoreDialog: dialogs.closeMovePalletToStoreDialog,
    movePalletToStoreDialogData: dialogs.movePalletToStoreDialogData,
    isOpenMovePalletToStoreDialog: dialogs.isOpenMovePalletToStoreDialog,
    updateStoreWhenOnMovePalletToStore: dialogs.updateStoreWhenOnMovePalletToStore,

    openMoveMultiplePalletsToStoreDialog: dialogs.openMoveMultiplePalletsToStoreDialog,
    closeMoveMultiplePalletsToStoreDialog: dialogs.closeMoveMultiplePalletsToStoreDialog,
    isOpenMoveMultiplePalletsToStoreDialog:
      dialogs.isOpenMoveMultiplePalletsToStoreDialog,
    updateStoreWhenOnMoveMultiplePalletsToStore:
      dialogs.updateStoreWhenOnMoveMultiplePalletsToStore,
  };
}
