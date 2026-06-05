'use client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { supplierLiquidationKeys } from '@/lib/routes/queryKeys';
import { getSupplierLiquidationDetails } from '@/services/domain/supplier-liquidations/supplierLiquidationService';

export function useSupplierLiquidationDetails(params: {
  supplierId: number | string | undefined;
  startDate: string | undefined;
  endDate: string | undefined;
  enabled?: boolean;
}) {
  const { supplierId, startDate, endDate, enabled = true } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const hasParams = !!supplierId && !!startDate && !!endDate;

  return useQuery({
    queryKey: supplierLiquidationKeys.detail(tenantId, supplierId, startDate, endDate),
    queryFn: () => getSupplierLiquidationDetails(supplierId!, startDate!, endDate!),
    enabled: !!tenantId && enabled && !!hasParams,
  });
}
