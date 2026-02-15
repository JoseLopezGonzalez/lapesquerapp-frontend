'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { getProductOptions } from '@/services/productService';
import { getProductCategoryOptions } from '@/services/productCategoryService';
import { getProductFamilyOptions } from '@/services/productFamilyService';

/**
 * Hook para obtener opciones de productos (value, label) para selects.
 * Usado por useAdminReceptionForm, CreateOrderForm, EditReceptionForm.
 */
export function useProductOptions() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'options', tenantId ?? 'unknown'],
    queryFn: () => getProductOptions(token),
    enabled: !!token && !!tenantId,
  });

  const productOptions = Array.isArray(data)
    ? data.map((p) => ({ value: `${p.id}`, label: p.name }))
    : [];

  return {
    productOptions,
    loading: isLoading,
  };
}

function useOptions(queryKey, queryFn, enabled) {
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    enabled,
  });
  return {
    data: Array.isArray(data) ? data : [],
    isLoading,
    error: error?.message ?? null,
  };
}

/**
 * Hook para obtener opciones de categorías de productos usando React Query.
 */
export function useProductCategoryOptions() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  return useOptions(
    ['productCategories', 'options', tenantId ?? 'unknown'],
    () => getProductCategoryOptions(token),
    !!token && !!tenantId
  );
}

/**
 * Hook para obtener opciones de familias de productos usando React Query.
 */
export function useProductFamilyOptions() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  return useOptions(
    ['productFamilies', 'options', tenantId ?? 'unknown'],
    () => getProductFamilyOptions(token),
    !!token && !!tenantId
  );
}
