'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { fieldProductOptionKeys } from '@/lib/routes/queryKeys';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { getFieldProductsOptions } from '@/services/fieldOperatorService';
import { useFieldOperator } from '@/context/FieldOperatorContext';

type FieldProductsOptionsQueryOptions = {
  enabled?: boolean;
};

function useFieldProductsBase() {
  const { data: session } = useSession();
  const { fieldOperatorId } = useFieldOperator();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return { token, tenantId, fieldOperatorId };
}

export function useFieldProductsOptions(options: FieldProductsOptionsQueryOptions = {}) {
  const { token, tenantId, fieldOperatorId } = useFieldProductsBase();
  const { enabled = true } = options;
  return useQuery({
    queryKey: fieldProductOptionKeys.list(tenantId),
    queryFn: () => getFieldProductsOptions(token as string),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId) && enabled,
    select: (data) => (Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? []),
    staleTime: 5 * 60 * 1000, // opciones de productos cambian poco — 5 min de stale
  });
}
