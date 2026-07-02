'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { productOptionKeys, taxOptionKeys } from '@/lib/routes/queryKeys';
import { getProductOptions } from '@/services/productService';
import { taxService } from '@/services/domain/taxes/taxService';

interface OrdersManagerOption {
  value: string;
  label: string;
}

interface OrdersManagerOptionsValue {
  productOptions: OrdersManagerOption[];
  taxOptions: OrdersManagerOption[];
  productsLoading: boolean;
  taxOptionsLoading: boolean;
  loading: boolean;
}

/**
 * Contexto de opciones solo para el Gestor de pedidos.
 * Carga productOptions y taxOptions cuando el usuario está en esta sección.
 * Ver documentación: docs/OPCIONES-POR-GESTOR.md
 */
const OrdersManagerOptionsContext = createContext<OrdersManagerOptionsValue | null>(null);

export function OrdersManagerOptionsProvider({ children }: { children: ReactNode }) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data: productOptions = [], isLoading: productsLoading } = useQuery({
    queryKey: productOptionKeys.options(tenantId),
    queryFn: async (): Promise<OrdersManagerOption[]> => {
      const products = await getProductOptions();
      return (products || []).map((p) => ({ value: String(p.id), label: p.name }));
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!tenantId,
  });

  const { data: taxOptions = [], isLoading: taxOptionsLoading } = useQuery({
    queryKey: taxOptionKeys.options(tenantId),
    queryFn: async (): Promise<OrdersManagerOption[]> => {
      const taxes = (await taxService.getOptions()) as Array<{
        value: number | string;
        label: string;
      }>;
      return (taxes || []).map((tax) => ({ value: String(tax.value), label: tax.label }));
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!tenantId,
  });

  const value = useMemo(
    () => ({
      productOptions,
      taxOptions,
      productsLoading,
      taxOptionsLoading,
      loading: productsLoading || taxOptionsLoading,
    }),
    [productOptions, taxOptions, productsLoading, taxOptionsLoading]
  );

  return (
    <OrdersManagerOptionsContext.Provider value={value}>
      {children}
    </OrdersManagerOptionsContext.Provider>
  );
}

export function useOrdersManagerOptions(): OrdersManagerOptionsValue | null {
  return useContext(OrdersManagerOptionsContext);
}

export { OrdersManagerOptionsContext };
