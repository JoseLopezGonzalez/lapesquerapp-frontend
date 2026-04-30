'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant'
import { productionQueryKeys } from '@/lib/routes/queryKeys'
import { getProductionControlPanel } from '@/services/productionService'

export function useProductionControlPanel(params = {}) {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null

  const query = useQuery({
    queryKey: productionQueryKeys.controlPanel(tenantId, params),
    queryFn: () => {
      if (!token) throw new Error('No se pudo autenticar la consulta')
      return getProductionControlPanel(token, params)
    },
    enabled: Boolean(token && tenantId),
    staleTime: 30 * 1000,
  })

  return {
    summary: query.data?.summary ?? null,
    alerts: query.data?.alerts ?? [],
    productions: query.data?.productions ?? [],
    pagination: query.data?.pagination ?? {
      currentPage: 1,
      perPage: Number(params.per_page) || 25,
      total: 0,
      lastPage: 1,
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  }
}
