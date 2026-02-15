/**
 * Product Service - API client for product options and related endpoints
 * @module services/productService
 */

import { fetchWithTenant } from '@lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';
import type { ProductOption } from '@/types/product';

/** Auth token for API requests */
type AuthToken = string;

/**
 * Obtiene las opciones de productos (para selects/autocomplete).
 */
export function getProductOptions(token: AuthToken): Promise<ProductOption[]> {
  return fetchWithTenant(`${API_URL_V2}products/options`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(
          getErrorMessage(errorData) || 'Error al obtener los productos'
        );
      }
      const data = await response.json();
      return (Array.isArray(data) ? data : data?.data ?? []) as ProductOption[];
    })
    .catch((error) => {
      throw error;
    });
}
