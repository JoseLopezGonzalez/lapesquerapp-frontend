import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getCurrentTenant } from "@/lib/utils/getCurrentTenant";
import { getLabels, deleteLabel, duplicateLabel } from "@/services/labelService";
import type { Label } from "@/types/labelEditor";

const LABELS_QUERY_KEY = "labels";

function getLabelsQueryKey(): (string | null)[] {
  const tenantId = typeof window !== "undefined" ? getCurrentTenant() : null;
  return [LABELS_QUERY_KEY, tenantId ?? "unknown"];
}

export function useLabelsQuery(extraEnabled = true) {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const queryKey = getLabelsQueryKey();

  return useQuery({
    queryKey,
    queryFn: () => getLabels(token as string),
    enabled: extraEnabled && status === "authenticated" && !!token,
  });
}

export function useDeleteLabelMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  return useMutation({
    mutationFn: ({ labelId }: { labelId: string }) => deleteLabel(labelId, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getLabelsQueryKey() });
    },
  });
}

export function useDuplicateLabelMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  return useMutation({
    mutationFn: ({
      labelId,
      customName,
    }: {
      labelId: string;
      customName?: string | null;
    }) => duplicateLabel(labelId, token as string, customName ?? null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getLabelsQueryKey() });
    },
  });
}

export { getLabelsQueryKey };
