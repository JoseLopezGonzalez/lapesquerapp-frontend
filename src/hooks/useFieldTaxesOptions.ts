'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { useFieldOperator } from '@/context/FieldOperatorContext';
import { getFieldTaxesOptions } from '@/services/fieldOperatorService';

type FieldTaxesOptionsQueryOptions = {
  enabled?: boolean;
};

export function useFieldTaxesOptions(options: FieldTaxesOptionsQueryOptions = {}) {
  const { data: session } = useSession();
  const { fieldOperatorId } = useFieldOperator();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['field', 'taxes', 'options', tenantId ?? 'unknown'],
    queryFn: () => getFieldTaxesOptions(token as string),
    enabled: Boolean(token) && Boolean(tenantId) && Boolean(fieldOperatorId) && enabled,
    select: (data) => (Array.isArray(data) ? data : ((data as { data?: unknown[] })?.data ?? [])),
    staleTime: 5 * 60 * 1000,
  });
}
