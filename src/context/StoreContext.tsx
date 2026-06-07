'use client';

import React, { createContext, useContext } from 'react';
import { useStore } from '@/hooks/useStore';

type StoreContextValue = ReturnType<typeof useStore>;

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

interface StoreProviderProps {
  storeId: string | number;
  onUpdateCurrentStoreTotalNetWeight?: ((storeId: string | number, totalNetWeight: number) => void) | null;
  onAddNetWeightToStore?: ((storeId: string | number, weight: number) => void) | null;
  setIsStoreLoading?: ((loading: boolean) => void) | null;
  children: React.ReactNode;
}

export function StoreProvider({
  storeId,
  onUpdateCurrentStoreTotalNetWeight,
  onAddNetWeightToStore,
  setIsStoreLoading,
  children,
}: StoreProviderProps) {
  const orderData = useStore({
    storeId,
    onUpdateCurrentStoreTotalNetWeight,
    onAddNetWeightToStore,
    setIsStoreLoading,
  });

  return <StoreContext.Provider value={orderData}>{children}</StoreContext.Provider>;
}

export function useStoreContext() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreContext must be used within an StoreProvider');
  }
  return context;
}
