'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { getStore, getRegisteredPallets } from '@/services/storeService';
import { REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores';
import { useEffect } from 'react';

/**
 * Hook para obtener datos de un almacén usando React Query.
 * Usado internamente por useStore.
 *
 * @param {Object} params
 * @param {string} [params.storeId] - ID del almacén (o REGISTERED_PALLETS_STORE_ID para palets registrados)
 * @param {Function} [params.setIsStoreLoading] - Callback para notificar loading al padre
 * @returns {{ store: object|null, loading: boolean, error: Error|null, refetch: Function }}
 */
export function useStoreData({ storeId, setIsStoreLoading }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['store', tenantId ?? 'unknown', storeId],
    queryFn: async () => {
      const fetchStore =
        storeId === REGISTERED_PALLETS_STORE_ID
          ? getRegisteredPallets(token)
          : getStore(storeId, token);

      const result = await fetchStore;

      if (!result) {
        throw new Error('No se pudieron obtener los datos del almacén');
      }

      if (storeId === REGISTERED_PALLETS_STORE_ID) {
        return {
          ...result,
          id: REGISTERED_PALLETS_STORE_ID,
          content: result?.content || {
            pallets: [],
            boxes: [],
            bigBoxes: [],
          },
        };
      }

      return result;
    },
    enabled: !!token && !!tenantId && !!storeId,
  });

  useEffect(() => {
    if (typeof setIsStoreLoading === 'function') {
      setIsStoreLoading(isLoading);
    }
  }, [isLoading, setIsStoreLoading]);

  return {
    store: data ?? null,
    loading: isLoading,
    error: error ?? null,
    refetch,
  };
}
