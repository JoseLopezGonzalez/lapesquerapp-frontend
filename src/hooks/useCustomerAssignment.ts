'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { customerService } from '@/services/domain/customers/customerService';

export function useCustomerAssignmentMutation() {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : 'unknown';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, payload }) => customerService.updateAssignment(customerId, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers', 'list', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['crm', 'customers', 'detail', variables.customerId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'customers', 'assignment', variables.customerId] }),
      ]);
    },
  });
}
