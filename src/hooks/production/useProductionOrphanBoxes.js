'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant'
import { productionQueryKeys } from '@/lib/routes/queryKeys'
import { getProductionOrphanBoxes } from '@/services/productionService'

/** Referencia estable: evita bucles infinitos si el consumidor depende de `boxes` en un effect. */
export const EMPTY_ORPHAN_BOXES = []

export function useProductionOrphanBoxes(params = {}) {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null

  const query = useQuery({
    queryKey: productionQueryKeys.orphanBoxes(tenantId, params),
    queryFn: () => {
      if (!token) throw new Error('No se pudo autenticar la consulta')
      return getProductionOrphanBoxes(token, params)
    },
    enabled: Boolean(token && tenantId),
    staleTime: 30 * 1000,
  })

  const fallbackPagination = useMemo(
    () => ({
      currentPage: 1,
      perPage: Number(params.per_page) || 25,
      total: 0,
      lastPage: 1,
    }),
    [params.per_page]
  )

  const emptySummary = useMemo(
    () => ({ totalOrphanBoxes: 0, totalOrphanWeightKg: 0 }),
    []
  )

  return {
    summary: query.data?.summary ?? emptySummary,
    boxes: query.data?.boxes ?? EMPTY_ORPHAN_BOXES,
    pagination: query.data?.pagination ?? fallbackPagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  }
}
