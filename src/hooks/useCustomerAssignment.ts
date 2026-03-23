'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { adminCustomerKeys, crmCustomerKeys, customerListKeys } from '@/lib/routes/queryKeys';
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
        queryClient.invalidateQueries({ queryKey: customerListKeys.listPrefix(tenantId) }),
        queryClient.invalidateQueries({ queryKey: crmCustomerKeys.detail(tenantId, variables.customerId) }),
        queryClient.invalidateQueries({ queryKey: adminCustomerKeys.assignment(variables.customerId) }),
      ]);
    },
  });
}
