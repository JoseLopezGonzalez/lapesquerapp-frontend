'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { getStore, getRegisteredPallets } from '@/services/storeService';
import { REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores';
import type { StoreData } from '@/hooks/useStoreDialogs';

interface UseStoreDataParams {
  storeId: string;
  setIsStoreLoading?: ((loading: boolean) => void) | null;
}

export function useStoreData({ storeId, setIsStoreLoading }: UseStoreDataParams) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['store', tenantId ?? 'unknown', storeId],
    queryFn: async () => {
      const result = await (storeId === REGISTERED_PALLETS_STORE_ID
        ? getRegisteredPallets(token as string)
        : getStore(storeId, token as string));

      if (!result) {
        throw new Error('No se pudieron obtener los datos del almacén');
      }

      if (storeId === REGISTERED_PALLETS_STORE_ID) {
        return {
          ...(result as StoreData),
          id: REGISTERED_PALLETS_STORE_ID,
          content: (result as StoreData)?.content || {
            pallets: [],
            boxes: [],
            bigBoxes: [],
          },
        };
      }

      return result as StoreData;
    },
    enabled: !!token && !!tenantId && !!storeId,
  });

  useEffect(() => {
    if (typeof setIsStoreLoading === 'function') {
      setIsStoreLoading(isLoading);
    }
  }, [isLoading, setIsStoreLoading]);

  return {
    store: (data ?? null) as StoreData | null,
    loading: isLoading,
    error: error ?? null,
    refetch,
  };
}
