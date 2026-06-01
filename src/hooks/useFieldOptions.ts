'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { useFieldOperator } from '@/context/FieldOperatorContext';
import {
  getFieldCustomersOptions,
  getFieldProductsOptions,
  getFieldOperatorsOptions,
} from '@/services/fieldOperatorService';

type OptionRecord = Record<string, unknown>;

function useFieldQuery<T = unknown>(
  queryKey: string[],
  queryFn: (token: string) => Promise<T>,
  requireFieldOperator = true
) {
  const { data: session } = useSession();
  const { fieldOperatorId } = useFieldOperator();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  return useQuery({
    queryKey: [...queryKey, tenantId ?? 'unknown'],
    queryFn: () => queryFn(token as string),
    enabled:
      Boolean(token) && Boolean(tenantId) && (!requireFieldOperator || Boolean(fieldOperatorId)),
  });
}

export function useFieldCustomerOptions() {
  const query = useFieldQuery(['field', 'customers', 'options'], getFieldCustomersOptions, true);
  const raw: OptionRecord[] = Array.isArray(query.data)
    ? query.data
    : ((query.data as { data?: OptionRecord[] } | undefined)?.data ?? []);
  return {
    ...query,
    data: raw,
    options: raw.map((customer: OptionRecord) => ({
      value: String(customer.id),
      label: String(customer.name ?? ''),
      operationalStatus: customer.operationalStatus,
    })),
  };
}

export function useFieldProductOptions() {
  const query = useFieldQuery(['field', 'products', 'options'], getFieldProductsOptions, true);
  const raw: OptionRecord[] = Array.isArray(query.data)
    ? query.data
    : ((query.data as { data?: OptionRecord[] } | undefined)?.data ?? []);
  return {
    ...query,
    data: raw,
    options: raw.map((product: OptionRecord) => ({
      value: String(product.id),
      label: String(product.name ?? ''),
      boxGtin: product.boxGtin ?? null,
      species: product.species ?? null,
    })),
  };
}

export function useFieldOperatorOptions() {
  const query = useFieldQuery(['field-operators', 'options'], getFieldOperatorsOptions, false);
  const raw: OptionRecord[] = Array.isArray(query.data)
    ? query.data
    : ((query.data as { data?: OptionRecord[] } | undefined)?.data ?? []);
  return {
    ...query,
    data: raw,
    options: raw.map((operator: OptionRecord) => ({
      value: String(operator.id),
      label: String(operator.name ?? ''),
    })),
  };
}
