'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { roleService } from '@/services/domain/roles/roleService';
import type { RoleOption } from '@/services/domain/roles/roleService';

export interface UseRoleOptionsResult {
  options: RoleOption[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para opciones de roles (desplegable crear/editar usuario). Bloque 11.
 * Cache key incluye tenant para aislamiento multi-tenant.
 */
export function useRoleOptions(): UseRoleOptionsResult {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const {
    data: options = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['roles', 'options', tenantId ?? 'unknown'],
    queryFn: () => roleService.getOptions(),
    enabled: !!tenantId,
  });

  return {
    options: Array.isArray(options) ? options : [],
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
