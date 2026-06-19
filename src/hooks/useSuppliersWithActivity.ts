'use client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { supplierLiquidationKeys } from '@/lib/routes/queryKeys';
import { getSuppliersWithActivity } from '@/services/domain/supplier-liquidations/supplierLiquidationService';

export function useSuppliersWithActivity(params: {
  startDate: string | undefined;
  endDate: string | undefined;
  onlyUnliquidated?: boolean;
  enabled?: boolean;
}) {
  const { startDate, endDate, onlyUnliquidated = false, enabled = true } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const hasDates = !!startDate && !!endDate && startDate <= endDate;
  const canQuery = hasDates || onlyUnliquidated;

  return useQuery({
    queryKey: supplierLiquidationKeys.suppliersWithActivity(
      tenantId,
      startDate,
      endDate,
      onlyUnliquidated
    ),
    queryFn: () => getSuppliersWithActivity(startDate, endDate, onlyUnliquidated),
    enabled: !!tenantId && enabled && canQuery,
  });
}
