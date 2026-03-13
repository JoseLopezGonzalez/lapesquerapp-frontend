'use client'

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/Utilities/EmptyState";
import { useStores } from "@/hooks/useStores";
import { useEffect, useRef, useState } from "react";
import StoreCard from "./StoresManager/StoreCard";
import LoadMoreStoreCard from "./StoresManager/StoreCard/LoadMoreStoreCard";
import { Store } from "./StoresManager/Store";
import Loader from "@/components/Utilities/Loader";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isExternalActor } from "@/lib/auth/actor";

export default function StoresManager() {
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
  const { data: session, status: sessionStatus } = useSession();
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const router = useRouter();
  const externalActor = isExternalActor(session?.user);

  const sessionReady = sessionStatus !== "loading";
  const showLoader = !sessionReady || isInitialLoading;

  const realStores = stores?.filter((store) => store.id !== "registered") || [];
  const loadingStore = false;

  const handleOnSelectStore = (id) => {
    if (loadingStore) return;
    if (id === selectedStoreId) {
      setSelectedStoreId(null);
      return;
    }
    setSelectedStoreId(id);
  };

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
  }, [isInitialLoading]);

  if (showLoader) {
    return (
      <div className="flex min-h-0 flex-1 w-full items-center justify-center p-6">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 p-2">
      <div
        ref={horizontalScrollRef}
        className="flex shrink-0 gap-3 overflow-x-auto overflow-y-hidden py-2 rounded-xl"
      >
        {stores?.length > 0 &&
          stores.map((store) => (
            <StoreCard
              key={store.id || `store-${store.name}`}
              store={store}
              disabled={isStoreLoading}
              isSelected={selectedStoreId}
              onClick={() => handleOnSelectStore(store.id)}
              block={loadingStore}
            />
          ))}
        {realStores.length === 0 && !externalActor && (
          <Card
            onClick={() => router.push("/admin/stores/create")}
            className="min-w-56 cursor-pointer border-2 border-dashed border-muted-foreground/25 bg-background transition-colors hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 opacity-70 blur-xl" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
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
          <LoadMoreStoreCard onClick={loadMoreStores} loading={loadingMore} />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {!selectedStoreId ? (
          <Card className="flex h-full min-h-0 w-full items-center justify-center">
            <EmptyState
              title="Selecciona un almacén"
              description="Selecciona un almacén para ver su información"
            />
          </Card>
        ) : (
          <div className="h-full min-h-0 overflow-hidden">
          <Store
            storeId={selectedStoreId}
            storeName={stores?.find((s) => s.id === selectedStoreId)?.name}
            onUpdateCurrentStoreTotalNetWeight={onUpdateCurrentStoreTotalNetWeight}
            onAddNetWeightToStore={onAddNetWeightToStore}
            setIsStoreLoading={setIsStoreLoading}
          />
          </div>
        )}
      </div>
    </div>
  );
}
