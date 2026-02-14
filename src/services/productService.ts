/**
 * Product Service - API client for product options and related endpoints
 * @module services/productService
 */

import { fetchWithTenant } from '@lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { getUserAgent } from '@/lib/utils/getUserAgent';

/** Auth token for API requests */
type AuthToken = string;

/**
 * Obtiene las opciones de productos (para selects/autocomplete).
 */
export function getProductOptions(token: AuthToken): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}products/options`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData: { message?: string }) => {
          throw new Error(
            getErrorMessage(errorData) || 'Error al obtener los productos'
          );
        });
      }
      return response.json();
    })
    .catch((error) => {
      throw error;
    });
}
