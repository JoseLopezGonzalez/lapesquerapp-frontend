'use client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { supplierLiquidationKeys } from '@/lib/routes/queryKeys';
import { getSupplierLiquidationShow } from '@/services/domain/supplier-liquidations/supplierLiquidationService';

export function useSupplierLiquidationShow(
  liquidationId: number | string | null | undefined,
  enabled = true
) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  return useQuery({
    queryKey: supplierLiquidationKeys.closedShow(tenantId, liquidationId),
    queryFn: () => getSupplierLiquidationShow(liquidationId!),
    enabled: !!tenantId && !!liquidationId && enabled,
  });
}
