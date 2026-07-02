import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { labelQueryKeys } from '@/lib/routes/queryKeys';
import { getLabels, deleteLabel, duplicateLabel } from '@/services/labelService';

export function useLabelsQuery(extraEnabled = true) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  return useQuery({
    queryKey: labelQueryKeys.list(tenantId),
    queryFn: () => getLabels(),
    enabled: extraEnabled && !!tenantId,
  });
}

export function useDeleteLabelMutation() {
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  return useMutation({
    mutationFn: ({ labelId }: { labelId: string }) => deleteLabel(labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelQueryKeys.list(tenantId) });
    },
  });
}

export function useDuplicateLabelMutation() {
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  return useMutation({
    mutationFn: ({ labelId, customName }: { labelId: string; customName?: string | null }) =>
      duplicateLabel(labelId, customName ?? null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelQueryKeys.list(tenantId) });
    },
  });
}
