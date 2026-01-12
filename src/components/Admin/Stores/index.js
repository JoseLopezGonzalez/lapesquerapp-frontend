'use client'

import { Card } from "@/components/ui/card";
/* import { useState } from 'react'
import Almacen from '../../../Almacen'
import { useStores } from '../../../../hooks/stores/useStores'
import { useStore } from '../../../../hooks/stores/useStore'
import numeral from 'numeral';
import 'numeral/locales/es';
import { ScrollShadow } from '@nextui-org/react';
import { EmptyState } from '../../../Utilities/EmptyState';
import SkeletonTab from './Skeleton/SkeletonTab';
import TabItem from './Tab/TabItem'; */

import { EmptyState } from "@/components/Utilities/EmptyState";
import { useStores } from "@/hooks/useStores";
import { ScrollShadow } from "@nextui-org/react";
import { useState } from "react";
import React from "react";
import StoreCard from "./StoresManager/StoreCard";
import LoadMoreStoreCard from "./StoresManager/StoreCard/LoadMoreStoreCard";
import LoadingStoresHeader from "./StoresManager/LoadingStoresHeader";
import { Store } from "./StoresManager/Store";


// Configurar Numeral.js para usar el formato español
/* numeral.locale('es'); */

export default function StoresManager() {

  const { stores, loading, error, onUpdateCurrentStoreTotalNetWeight, onAddNetWeightToStore, isStoreLoading, setIsStoreLoading, loadMoreStores, hasMoreStores, loadingMore } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  /* const { store, loadingStore, updateStore } = useStore(selectedStore); */


  const loadingStore = false;
  const store = null;

  /* const [selectedStoreId, setSelectedStoreId] = useState(store); */

  // Debug: Log stores cuando cambian
  React.useEffect(() => {
    if (stores && stores.length > 0) {
      console.log('StoresManager - Rendering stores:', stores.length);
      console.log('First store (should be ghost):', stores[0]);
      const ghostStore = stores.find(s => s.id === 'registered');
      console.log('Ghost store found:', ghostStore);
    }
  }, [stores]);

  const handleOnSelectStore = (id) => {
    if (loadingStore) return;
    if (id === selectedStoreId) {
      setSelectedStoreId(null);
      return;
    }
    setSelectedStoreId(id);
  }


  return (
    <>
      <div className='w-full h-full  flex flex-col items-center justify-center p-2'>
        {loading ? (
          <LoadingStoresHeader />
        ) : (
          /* Content */
          <div className="h-full w-full gap-6 flex flex-col items-center justify-center">
            <ScrollShadow
              onWheel={(e) => {
                e.preventDefault();
                e.currentTarget.scrollLeft += e.deltaY; // Permite desplazamiento horizontal con la rueda
              }}
              hideScrollBar
              orientation="horizontal" className="space-x-3 rounded-xl  flex  w-full min-h-36 py-2">
              {stores && stores.length > 0 ? (
                <>
                  {stores.map((store) => {
                    // Debug log para cada store
                    if (store.id === 'registered') {
                      console.log('Rendering ghost store:', store);
                    }
                    return (
                      <StoreCard 
                        key={store.id || `store-${store.name}`} 
                        store={store} 
                        disabled={isStoreLoading} 
                        isSelected={selectedStoreId} 
                        onClick={() => handleOnSelectStore(store.id)} 
                        block={loadingStore} 
                      />
                    );
                  })}
                  {hasMoreStores && (
                    <LoadMoreStoreCard 
                      onClick={loadMoreStores}
                      loading={loadingMore}
                    />
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground p-4">
                  No hay almacenes disponibles
                </div>
              )}
            </ScrollShadow>

            {/* Content Box */}
            <div className='grow flex items-center justify-center w-full overflow-hidden'>
              {!selectedStoreId ? (
                <Card className='h-full w-full flex items-center justify-center  '>
                  <EmptyState title="Selecciona un almacén" description="Selecciona un almacén para ver su información" />
                </Card>
              ) : (
                <Store storeId={selectedStoreId}
                  onUpdateCurrentStoreTotalNetWeight={onUpdateCurrentStoreTotalNetWeight}
                  onAddNetWeightToStore={onAddNetWeightToStore}
                  setIsStoreLoading={setIsStoreLoading}

                />
              )}
            </div>
          </div>
        )}

      </div>
    </>
  )
}
