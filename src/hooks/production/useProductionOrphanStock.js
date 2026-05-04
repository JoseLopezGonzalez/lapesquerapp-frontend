'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant'
import { productionQueryKeys } from '@/lib/routes/queryKeys'
import { getProductionOrphanStock } from '@/services/productionService'

/** Referencia estable: evita bucles infinitos si el consumidor depende de `lots` en un effect. */
export const EMPTY_ORPHAN_LOTS = []

export function useProductionOrphanStock(params = {}) {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null

  const query = useQuery({
    queryKey: productionQueryKeys.orphanStock(tenantId, params),
    queryFn: () => {
      if (!token) throw new Error('No se pudo autenticar la consulta')
      return getProductionOrphanStock(token, params)
    },
    enabled: Boolean(token && tenantId),
    staleTime: 30 * 1000,
  })

  const fallbackPagination = useMemo(
    () => ({
      currentPage: 1,
      perPage: Number(params.per_page) || 10,
      total: 0,
      lastPage: 1,
    }),
    [params.per_page]
  )

  return {
    lots: query.data?.lots ?? EMPTY_ORPHAN_LOTS,
    pagination: query.data?.pagination ?? fallbackPagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  }
}
