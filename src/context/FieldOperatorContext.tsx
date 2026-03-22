'use client';

import { createContext, useContext, useMemo } from 'react';
import { useMe } from '@/hooks/useMe';

const FieldOperatorContext = createContext({
  fieldOperatorId: null,
  isFieldOperator: false,
  isLoading: true,
  refetch: async () => ({}),
});

export function FieldOperatorProvider({ children }) {
  const { data, isLoading, refetch } = useMe();

  const value = useMemo(
    () => ({
      fieldOperatorId: data?.fieldOperatorId ?? null,
      isFieldOperator: Boolean(data?.isFieldOperator),
      isLoading,
      refetch,
    }),
    [data, isLoading, refetch]
  );

  return <FieldOperatorContext.Provider value={value}>{children}</FieldOperatorContext.Provider>;
}

export function useFieldOperator() {
  return useContext(FieldOperatorContext);
}
