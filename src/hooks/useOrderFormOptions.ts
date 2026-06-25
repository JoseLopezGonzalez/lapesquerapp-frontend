'use client';

import { getIncotermsOptions } from '@/services/incotermService';
import { getPaymentTermsOptions } from '@/services/paymentTernService';
import { getSalespeopleOptions } from '@/services/salespersonService';
import { getTransportsOptions } from '@/services/transportService';
import { getFieldOperatorsOptions } from '@/services/fieldOperatorService';
import { externalProcessorService } from '@/services/domain/external-processors/externalProcessorService';
import type { ExternalProcessorOption } from '@/services/domain/external-processors/externalProcessorService';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';

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
}

interface UseOrderFormOptionsParams {
  enabled?: boolean;
}

export function useOrderFormOptions(params: UseOrderFormOptionsParams = {}) {
  const { enabled = true } = params;
  const { data: session } = useSession();
  const [options, setOptions] = useState<OrderFormOptionsState>({
    salespeople: [],
    fieldOperators: [],
    incoterms: [],
    paymentTerms: [],
    transports: [],
    externalProcessors: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    const token = session?.user?.accessToken as string | undefined;

    if (hasLoadedRef.current && token) {
      setLoading(false);
      return;
    }

    if (!enabled) {
      setLoading(false);
      return;
    }

    if (!token) {
      setLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    hasLoadedRef.current = false;
    setLoading(true);

    Promise.all([
      getSalespeopleOptions(token).catch((err: unknown) => {
        console.error('Error loading salespeople:', err);
        return [] as OptionItem[];
      }),
      getFieldOperatorsOptions(token).catch((err: unknown) => {
        console.error('Error loading field operators:', err);
        return [] as OptionItem[];
      }),
      getIncotermsOptions(token).catch((err: unknown) => {
        console.error('Error loading incoterms:', err);
        return [] as OptionItem[];
      }),
      getPaymentTermsOptions(token).catch((err: unknown) => {
        console.error('Error loading payment terms:', err);
        return [] as OptionItem[];
      }),
      getTransportsOptions(token).catch((err: unknown) => {
        console.error('Error loading transports:', err);
        return [] as OptionItem[];
      }),
      externalProcessorService.getOptions().catch((err: unknown) => {
        console.error('Error loading external processors:', err);
        return [] as ExternalProcessorOption[];
      }),
    ])
      .then(([salespeople, fieldOperators, incoterms, paymentTerms, transports, externalProcessors]) => {
        if (!isMountedRef.current) return;

        setOptions({
          salespeople: (salespeople as OptionItem[]) || [],
          fieldOperators: (fieldOperators as OptionItem[]) || [],
          incoterms: (incoterms as OptionItem[]) || [],
          paymentTerms: (paymentTerms as OptionItem[]) || [],
          transports: (transports as OptionItem[]) || [],
          externalProcessors: (externalProcessors as ExternalProcessorOption[]) || [],
        });
        setLoading(false);
        setError(null);
        hasLoadedRef.current = true;
      })
      .catch((err: unknown) => {
        console.error('Error loading form options:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });

    return () => {
      isMountedRef.current = false;
    };
  }, [session?.user?.accessToken, enabled]);

  useEffect(() => {
    const hasAnyOptions =
      options.salespeople.length > 0 ||
      options.fieldOperators.length > 0 ||
      options.incoterms.length > 0 ||
      options.paymentTerms.length > 0 ||
      options.transports.length > 0;

    if (hasAnyOptions && loading) {
      setLoading(false);
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
      }
    }
  }, [
    loading,
    options.salespeople.length,
    options.fieldOperators.length,
    options.incoterms.length,
    options.paymentTerms.length,
    options.transports.length,
  ]);

  const hasAnyOptions =
    options.salespeople.length > 0 ||
    options.fieldOperators.length > 0 ||
    options.incoterms.length > 0 ||
    options.paymentTerms.length > 0 ||
    options.transports.length > 0;
  const finalLoading = loading && !hasAnyOptions;

  return { options, loading: finalLoading, error };
}
