'use client';

import { useState } from 'react';
import { useStores } from '@/hooks/useStores';
import { useSession } from 'next-auth/react';
import { StoreProvider } from '@/context/StoreContext';
import {
  MobileStoreListSkeleton,
  MobileStoreListView,
} from './MobileStoreListView';
import { MobileStoreDetailView } from './MobileStoreDetailView';
import Loader from '@/components/Utilities/Loader';

export default function MobileStoresManager() {
  const {
    stores,
    isInitialLoading,
    onUpdateCurrentStoreTotalNetWeight,
    onAddNetWeightToStore,
    isStoreLoading,
    setIsStoreLoading,
    loadMoreStores,
    hasMoreStores,
    loadingMore,
  } = useStores();

  const { status: sessionStatus } = useSession();
  const [selectedStoreId, setSelectedStoreId] = useState<string | number | null>(null);

  const sessionReady = sessionStatus !== 'loading';
  const showLoader = !sessionReady || isInitialLoading;

  const selectedStore = stores?.find((s) => s.id === selectedStoreId);

  const handleSelectStore = (id: string | number) => {
    setSelectedStoreId(id);
  };

  const handleBack = () => {
    setSelectedStoreId(null);
  };

  if (showLoader) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  /* Vista de detalle — pantalla completa con StoreProvider */
  if (selectedStoreId !== null) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <StoreProvider
          storeId={selectedStoreId}
          onUpdateCurrentStoreTotalNetWeight={onUpdateCurrentStoreTotalNetWeight}
          onAddNetWeightToStore={onAddNetWeightToStore}
          setIsStoreLoading={setIsStoreLoading}
        >
          <MobileStoreDetailView
            passedStoreId={selectedStoreId}
            passedStoreName={selectedStore?.name}
            onBack={handleBack}
          />
        </StoreProvider>
      </div>
    );
  }

  /* Vista de lista */
  return (
    <div className="h-full overflow-y-auto">
      {isInitialLoading ? (
        <MobileStoreListSkeleton />
      ) : (
        <MobileStoreListView
          stores={stores ?? []}
          isStoreLoading={isStoreLoading}
          hasMoreStores={hasMoreStores}
          loadingMore={loadingMore}
          onSelectStore={handleSelectStore}
          onLoadMore={loadMoreStores}
        />
      )}
    </div>
  );
}
