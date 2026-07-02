'use client';

import { useEffect } from 'react';
import { useQueries } from '@tanstack/react-query';
import { customerService } from '@/services/domain/customers/customerService';
import { externalProcessorService } from '@/services/domain/external-processors/externalProcessorService';
import type { ExternalProcessorOption } from '@/services/domain/external-processors/externalProcessorService';
import { fieldOperatorAdminService } from '@/services/domain/field-operators/fieldOperatorService';
import { incotermService } from '@/services/domain/incoterms/incotermService';
import { paymentTermService } from '@/services/domain/payment-terms/paymentTermService';
import { salespersonService } from '@/services/domain/salespeople/salespersonService';
import { transportService } from '@/services/domain/transports/transportService';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { notify } from '@/lib/notifications';
import { orderFormOptionKeys } from '@/lib/routes/queryKeys';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';

interface OptionItem {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

interface OrderFormOptionsState {
  salespeople: OptionItem[];
  fieldOperators: OptionItem[];
  incoterms: OptionItem[];
  paymentTerms: OptionItem[];
  transports: OptionItem[];
  externalProcessors: ExternalProcessorOption[];
  customers: OptionItem[];
}

interface UseOrderFormOptionsParams {
  enabled?: boolean;
  includeCustomers?: boolean;
}

const EMPTY_OPTIONS: OrderFormOptionsState = {
  salespeople: [],
  fieldOperators: [],
  incoterms: [],
  paymentTerms: [],
  transports: [],
  externalProcessors: [],
  customers: [],
};

const CATALOG_STALE_TIME = 10 * 60 * 1000;

export function useOrderFormOptions(params: UseOrderFormOptionsParams = {}) {
  const { enabled = true, includeCustomers = false } = params;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const queryEnabled = Boolean(enabled && tenantId);

  const [
    salespeopleQuery,
    fieldOperatorsQuery,
    incotermsQuery,
    paymentTermsQuery,
    transportsQuery,
    externalProcessorsQuery,
    customersQuery,
  ] = useQueries({
    queries: [
      {
        queryKey: orderFormOptionKeys.catalog(tenantId, 'salespeople'),
        queryFn: () => salespersonService.getOptions(),
        enabled: queryEnabled,
        staleTime: CATALOG_STALE_TIME,
      },
      {
        queryKey: orderFormOptionKeys.catalog(tenantId, 'field-operators'),
        queryFn: () => fieldOperatorAdminService.getOptions(),
        enabled: queryEnabled,
        staleTime: CATALOG_STALE_TIME,
      },
      {
        queryKey: orderFormOptionKeys.catalog(tenantId, 'incoterms'),
        queryFn: () => incotermService.getOptions(),
        enabled: queryEnabled,
        staleTime: CATALOG_STALE_TIME,
      },
      {
        queryKey: orderFormOptionKeys.catalog(tenantId, 'payment-terms'),
        queryFn: () => paymentTermService.getOptions(),
        enabled: queryEnabled,
        staleTime: CATALOG_STALE_TIME,
      },
      {
        queryKey: orderFormOptionKeys.catalog(tenantId, 'transports'),
        queryFn: () => transportService.getOptions(),
        enabled: queryEnabled,
        staleTime: CATALOG_STALE_TIME,
      },
      {
        queryKey: orderFormOptionKeys.catalog(tenantId, 'external-processors'),
        queryFn: () => externalProcessorService.getOptions(),
        enabled: queryEnabled,
        staleTime: CATALOG_STALE_TIME,
      },
      {
        queryKey: orderFormOptionKeys.catalog(tenantId, 'customers'),
        queryFn: () => customerService.getOptions(),
        enabled: queryEnabled && includeCustomers,
        staleTime: CATALOG_STALE_TIME,
      },
    ],
  });

  useEffect(() => {
    const firstError = [
      salespeopleQuery.error,
      fieldOperatorsQuery.error,
      incotermsQuery.error,
      paymentTermsQuery.error,
      transportsQuery.error,
      externalProcessorsQuery.error,
      customersQuery.error,
    ].find(Boolean);

    if (!firstError) return;

    notify.error(
      {
        title: 'No se pudieron cargar todas las opciones del pedido',
        description: getErrorMessage(firstError),
      },
      { dedupeKey: 'orders-form-options-error' }
    );
  }, [
    salespeopleQuery.error,
    fieldOperatorsQuery.error,
    incotermsQuery.error,
    paymentTermsQuery.error,
    transportsQuery.error,
    externalProcessorsQuery.error,
    customersQuery.error,
  ]);

  const options: OrderFormOptionsState = {
    salespeople: (salespeopleQuery.data as OptionItem[] | undefined) ?? EMPTY_OPTIONS.salespeople,
    fieldOperators:
      (fieldOperatorsQuery.data as OptionItem[] | undefined) ?? EMPTY_OPTIONS.fieldOperators,
    incoterms: (incotermsQuery.data as OptionItem[] | undefined) ?? EMPTY_OPTIONS.incoterms,
    paymentTerms:
      (paymentTermsQuery.data as OptionItem[] | undefined) ?? EMPTY_OPTIONS.paymentTerms,
    transports: (transportsQuery.data as OptionItem[] | undefined) ?? EMPTY_OPTIONS.transports,
    externalProcessors:
      (externalProcessorsQuery.data as ExternalProcessorOption[] | undefined) ??
      EMPTY_OPTIONS.externalProcessors,
    customers: (customersQuery.data as OptionItem[] | undefined) ?? EMPTY_OPTIONS.customers,
  };

  const activeQueries = [
    salespeopleQuery,
    fieldOperatorsQuery,
    incotermsQuery,
    paymentTermsQuery,
    transportsQuery,
    externalProcessorsQuery,
    ...(includeCustomers ? [customersQuery] : []),
  ];
  const loading = queryEnabled && activeQueries.some((query) => query.isLoading);
  const error = activeQueries.find((query) => query.error)?.error ?? null;

  return { options, loading, error };
}
