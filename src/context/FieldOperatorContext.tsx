'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useMe } from '@/hooks/useMe';

type FieldOperatorContextValue = {
  fieldOperatorId: number | null;
  isFieldOperator: boolean;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
};

const FieldOperatorContext = createContext<FieldOperatorContextValue>({
  fieldOperatorId: null,
  isFieldOperator: false,
  isLoading: true,
  refetch: async () => ({}),
});

export function FieldOperatorProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = useMe();

  const value = useMemo<FieldOperatorContextValue>(
    () => ({
      fieldOperatorId: data?.fieldOperatorId ?? null,
      isFieldOperator: Boolean(data?.isFieldOperator),
      isLoading,
      refetch: async () => {
        await refetch();
      },
    }),
    [data, isLoading, refetch]
  );

  return <FieldOperatorContext.Provider value={value}>{children}</FieldOperatorContext.Provider>;
}

export function useFieldOperator() {
  return useContext(FieldOperatorContext);
}
