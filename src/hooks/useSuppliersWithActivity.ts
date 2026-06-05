'use client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { supplierLiquidationKeys } from '@/lib/routes/queryKeys';
import { getSuppliersWithActivity } from '@/services/domain/supplier-liquidations/supplierLiquidationService';

export function useSuppliersWithActivity(params: {
  startDate: string | undefined;
  endDate: string | undefined;
  enabled?: boolean;
}) {
  const { startDate, endDate, enabled = true } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const hasDates = !!startDate && !!endDate && startDate <= endDate;

  return useQuery({
    queryKey: supplierLiquidationKeys.suppliersWithActivity(tenantId, startDate, endDate),
    queryFn: () => getSuppliersWithActivity(startDate!, endDate!),
    enabled: !!tenantId && enabled && !!hasDates,
  });
}
