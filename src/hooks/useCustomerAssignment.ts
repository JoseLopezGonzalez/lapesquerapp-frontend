'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { customerService } from '@/services/domain/customers/customerService';

type CustomerAssignmentPayload = {
  salesperson_id: number | null;
  field_operator_id: number | null;
  operational_status: string;
};

type CustomerAssignmentVariables = {
  customerId: number | string;
  payload: CustomerAssignmentPayload;
};

export function useCustomerAssignmentMutation() {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : 'unknown';
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, CustomerAssignmentVariables>({
    mutationFn: ({ customerId, payload }) => customerService.updateAssignment(customerId, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers', 'list', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['crm', 'customers', 'detail', tenantId, variables.customerId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'customers', 'assignment', variables.customerId] }),
      ]);
    },
  });
}
