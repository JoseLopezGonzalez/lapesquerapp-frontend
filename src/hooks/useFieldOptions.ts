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

function useFieldQuery(queryKey, queryFn, requireFieldOperator = true) {
  const { data: session } = useSession();
  const { fieldOperatorId } = useFieldOperator();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  return useQuery({
    queryKey: [...queryKey, tenantId ?? 'unknown'],
    queryFn: () => queryFn(token),
    enabled: Boolean(token) && Boolean(tenantId) && (!requireFieldOperator || Boolean(fieldOperatorId)),
  });
}

export function useFieldCustomerOptions() {
  const query = useFieldQuery(['field', 'customers', 'options'], getFieldCustomersOptions, true);
  const raw = Array.isArray(query.data) ? query.data : query.data?.data ?? [];
  return {
    ...query,
    data: raw,
    options: raw.map((customer) => ({
      value: String(customer.id),
      label: customer.name,
      operationalStatus: customer.operationalStatus,
    })),
  };
}

export function useFieldProductOptions() {
  const query = useFieldQuery(['field', 'products', 'options'], getFieldProductsOptions, true);
  const raw = Array.isArray(query.data) ? query.data : query.data?.data ?? [];
  return {
    ...query,
    data: raw,
    options: raw.map((product) => ({
      value: String(product.id),
      label: product.name,
      boxGtin: product.boxGtin ?? null,
      species: product.species ?? null,
    })),
  };
}

export function useFieldOperatorOptions() {
  const query = useFieldQuery(['field-operators', 'options'], getFieldOperatorsOptions, false);
  const raw = Array.isArray(query.data) ? query.data : query.data?.data ?? [];
  return {
    ...query,
    data: raw,
    options: raw.map((operator) => ({ value: String(operator.id), label: operator.name })),
  };
}
