'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { maquilaPalletKeys } from '@/lib/routes/queryKeys';
import { palletService } from '@/services/domain/pallets/palletService';
import type { MaquilaPallet, MaquilaPalletFilters, MaquilaPalletListMeta } from '@/types/pallet';

/**
 * Almacén interactivo del cliente de maquila — GET /pallets, ruta compartida con el admin
 * (grupo actor:internal,external). El filtrado por toll_client_id lo aplica el backend
 * automáticamente (ActorScopeService::scopeOwnedPallets()), no se pasa ningún parámetro de
 * propiedad. Ver docs/maquila/frontend/02-almacen-interactivo.md.
 */
export function useMaquilaPalletList(
  params: {
    filters?: MaquilaPalletFilters;
    page?: number;
    perPage?: number;
    enabled?: boolean;
  } = {}
) {
  const { filters = {}, page = 1, perPage = 12, enabled = true } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: maquilaPalletKeys.list(tenantId, filters as Record<string, unknown>, page, perPage),
    queryFn: () => palletService.list(filters, { page, perPage }),
    enabled: !!tenantId && enabled,
    staleTime: 60 * 1000,
  });

  const data = (response as { data?: MaquilaPallet[] })?.data ?? [];
  const meta = (response as { meta?: MaquilaPalletListMeta })?.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: perPage,
    total: 0,
  };

  return {
    data: Array.isArray(data) ? data : [],
    meta,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
