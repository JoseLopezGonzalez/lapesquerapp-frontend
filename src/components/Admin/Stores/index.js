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
import { useEffect, useRef, useState } from "react";
import StoreCard from "./StoresManager/StoreCard";
import LoadMoreStoreCard from "./StoresManager/StoreCard/LoadMoreStoreCard";
import LoadingStoresHeader from "./StoresManager/LoadingStoresHeader";
import { Store } from "./StoresManager/Store";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";


// Configurar Numeral.js para usar el formato español
/* numeral.locale('es'); */

export default function StoresManager() {

  const { stores, loading, error, onUpdateCurrentStoreTotalNetWeight, onAddNetWeightToStore, isStoreLoading, setIsStoreLoading, loadMoreStores, hasMoreStores, loadingMore } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const router = useRouter();
  
  // Filtrar el almacén "registered" (ghost store) para contar solo almacenes reales
  const realStores = stores?.filter(store => store.id !== 'registered') || [];
  /* const { store, loadingStore, updateStore } = useStore(selectedStore); */


  const loadingStore = false;
  const store = null;

  const handleOnSelectStore = (id) => {
    if (loadingStore) return;
    if (id === selectedStoreId) {
      setSelectedStoreId(null);
      return;
    }
    setSelectedStoreId(id);
  }

  const horizontalScrollRef = useRef(null);
  useEffect(() => {
    const el = horizontalScrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <>
      <div className='w-full h-full  flex flex-col items-center justify-center p-2'>
        {loading ? (
          <LoadingStoresHeader />
        ) : (
          /* Content */
          <div className="h-full w-full gap-6 flex flex-col items-center justify-center">
            <div
              ref={horizontalScrollRef}
              className="overflow-x-auto overflow-y-hidden w-full min-h-36 py-2 rounded-xl flex gap-3"
            >
              {stores && stores.length > 0 && stores.map((store) => (
                    <StoreCard 
                      key={store.id || `store-${store.name}`} 
                      store={store} 
                      disabled={isStoreLoading} 
                      isSelected={selectedStoreId} 
                      onClick={() => handleOnSelectStore(store.id)} 
                      block={loadingStore} 
                    />
                  ))}
                {realStores.length === 0 && (
                  <Card
                    onClick={() => router.push('/admin/stores/create')}
                    className="border-2 border-dashed min-w-56 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors bg-background"
                  >
                    <div className="flex flex-col items-center justify-center p-6 h-full w-full gap-3">
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                          <Plus className="h-6 w-6 text-primary" strokeWidth={1.5} />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-center">
                        <span className="text-sm font-medium text-foreground">
                          Crear almacén
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Haz clic para añadir tu primer almacén
                        </span>
                      </div>
                    </div>
                  </Card>
                )}
                {hasMoreStores && (
                  <LoadMoreStoreCard 
                    onClick={loadMoreStores}
                    loading={loadingMore}
                  />
                )}
            </div>

            {/* Content Box */}
            <div className='grow flex items-center justify-center w-full overflow-hidden'>
              {!selectedStoreId ? (
                <Card className='h-full w-full flex items-center justify-center  '>
                  <EmptyState title="Selecciona un almacén" description="Selecciona un almacén para ver su información" />
                </Card>
              ) : (
                <Store 
                  storeId={selectedStoreId}
                  storeName={stores?.find(s => s.id === selectedStoreId)?.name}
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
