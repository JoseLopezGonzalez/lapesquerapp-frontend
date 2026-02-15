'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { getStores, getRegisteredPallets } from '@/services/storeService';

export const REGISTERED_PALLETS_STORE_ID = 'registered';

function buildGhostStore(registeredPalletsData) {
  return {
    ...registeredPalletsData,
    id: REGISTERED_PALLETS_STORE_ID,
    name: registeredPalletsData?.name || 'En espera',
    capacity:
      registeredPalletsData?.capacity ||
      registeredPalletsData?.totalNetWeight ||
      registeredPalletsData?.netWeightPallets ||
      1,
    totalNetWeight:
      registeredPalletsData?.totalNetWeight ||
      registeredPalletsData?.netWeightPallets ||
      0,
    temperature: registeredPalletsData?.temperature ?? null,
    content: registeredPalletsData?.content || {
      pallets: [],
      boxes: [],
      bigBoxes: [],
    },
    map: registeredPalletsData?.map ?? null,
  };
}

function extractNextPage(links) {
  if (!links?.next) return undefined;
  const match = links.next.match(/[?&]page=(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

export function useStores() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryClient = useQueryClient();
  const [isStoreLoading, setIsStoreLoading] = useState(false);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['stores', tenantId ?? 'unknown'],
    queryFn: async ({ pageParam = 1 }) => {
      const [storesResponse, registeredPalletsData] = await Promise.all([
        getStores(token, pageParam),
        pageParam === 1
          ? getRegisteredPallets(token).catch(() => ({
              id: null,
              name: 'En espera',
              temperature: null,
              capacity: null,
              netWeightPallets: 0,
              totalNetWeight: 0,
              content: { pallets: [], boxes: [], bigBoxes: [] },
              map: null,
            }))
          : Promise.resolve(null),
      ]);

      const storesData = storesResponse.data || storesResponse || [];
      const ghostStore =
        pageParam === 1 ? buildGhostStore(registeredPalletsData) : null;

      return {
        ghostStore,
        stores: storesData,
        links: storesResponse.links ?? null,
        meta: storesResponse.meta ?? null,
      };
    },
    getNextPageParam: (lastPage) => extractNextPage(lastPage?.links),
    initialPageParam: 1,
    enabled: !!token && !!tenantId,
  });

  const stores =
    data?.pages?.reduce((acc, page) => {
      if (page?.ghostStore && acc.length === 0) {
        acc.push(page.ghostStore);
      }
      return acc.concat(page?.stores ?? []);
    }, []) ?? [];

  const lastPage = data?.pages?.[data.pages.length - 1];
  const hasMoreStores = !!extractNextPage(lastPage?.links);

  const onUpdateCurrentStoreTotalNetWeight = (storeId, totalNetWeight) => {
    queryClient.setQueryData(['stores', tenantId ?? 'unknown'], (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page) => {
          const updatedGhost =
            page.ghostStore?.id === storeId
              ? { ...page.ghostStore, totalNetWeight }
              : page.ghostStore;
          const updatedStores = (page.stores ?? []).map((s) =>
            s.id == storeId ? { ...s, totalNetWeight } : s
          );
          return { ...page, ghostStore: updatedGhost, stores: updatedStores };
        }),
      };
    });
  };

  const onAddNetWeightToStore = (storeId, netWeight) => {
    queryClient.setQueryData(['stores', tenantId ?? 'unknown'], (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page) => {
          const updatedGhost =
            page.ghostStore?.id === storeId
              ? {
                  ...page.ghostStore,
                  totalNetWeight:
                    (page.ghostStore.totalNetWeight || 0) + netWeight,
                }
              : page.ghostStore;
          const updatedStores = (page.stores ?? []).map((s) =>
            s.id == storeId
              ? {
                  ...s,
                  totalNetWeight: (s.totalNetWeight || 0) + netWeight,
                }
              : s
          );
          return { ...page, ghostStore: updatedGhost, stores: updatedStores };
        }),
      };
    });
  };

  const loadMoreStores = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return {
    stores,
    loading: isLoading,
    error: error ?? null,
    onUpdateCurrentStoreTotalNetWeight,
    onAddNetWeightToStore,
    isStoreLoading,
    setIsStoreLoading,
    loadMoreStores,
    hasMoreStores,
    loadingMore: isFetchingNextPage,
  };
}
