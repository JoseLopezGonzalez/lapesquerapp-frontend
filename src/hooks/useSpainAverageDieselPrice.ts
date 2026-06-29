'use client';

import { useQuery } from '@tanstack/react-query';
import { getSpainAverageDieselPrice } from '@/services/domain/fuel/fuelService';
import { fuelQueryKeys } from '@/lib/routes/queryKeys';

export function useSpainAverageDieselPrice() {
  const query = useQuery({
    queryKey: fuelQueryKeys.spainAverageDiesel(),
    queryFn: getSpainAverageDieselPrice,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    value: query.data?.value ?? null,
    label: query.data?.label ?? null,
    sampleCount: query.data?.sampleCount ?? 0,
    sourceDate: query.data?.sourceDate ?? null,
    isLoading: query.isLoading,
    isUnavailable: query.isError || !query.data?.label,
  };
}
