'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import {
  productCategoryOptionKeys,
  productFamilyOptionKeys,
  productOptionKeys,
} from '@/lib/routes/queryKeys';
import { getProductOptions } from '@/services/productService';
import { getProductCategoryOptions } from '@/services/productCategoryService';
import { getProductFamilyOptions } from '@/services/productFamilyService';

/**
 * Hook para obtener opciones de productos (value, label) para selects.
 * Usado por useAdminReceptionForm, CreateOrderForm, EditReceptionForm.
 */
export function useProductOptions(params = {}) {
  const { enabled = true } = params;
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, refetch } = useQuery({
    queryKey: productOptionKeys.list(tenantId),
    queryFn: () => getProductOptions(token),
    enabled: !!token && !!tenantId && enabled,
    staleTime: 5 * 60 * 1000,
  });

  const products = Array.isArray(data) ? data : [];
  const productOptions = products.map((p) => ({ value: `${p.id}`, label: p.name }));

  return {
    products,
    productOptions,
    loading: isLoading,
    refetch,
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
    productCategoryOptionKeys.list(tenantId),
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
    productFamilyOptionKeys.list(tenantId),
    () => getProductFamilyOptions(token),
    !!token && !!tenantId
  );
}
