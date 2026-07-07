/**
 * Service de dominio para Pallets (Palets)
 *
 * Expone métodos semánticos de negocio para interactuar con palets.
 */

import { API_URL_V2 } from '@/configs/config';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import {
  fetchEntitiesGeneric,
  deleteEntityGeneric,
  performActionGeneric,
} from '@/services/generic/entityService';
import { addFiltersToParams } from '@/lib/entity/filtersHelper';
import { addWithParams } from '@/lib/entity/entityRelationsHelper';

const ENDPOINT = 'pallets';

export const palletService = {
  /**
   * Lista todos los palets con filtros opcionales
   * @param {Object} filters - Filtros de búsqueda (search, ids, products, dates, etc.)
   * @param {Object} pagination - Opciones de paginación { page, perPage }
   * @returns {Promise<Object>} Datos paginados con palets { data, links, meta }
   *
   * @example
   * const result = await palletService.list({ ids: [1, 2], products: [38] }, { page: 1, perPage: 10 });
   */
  async list(filters = {}, pagination = {}) {
    const token = await getAuthToken();
    const { page = 1, perPage = 12 } = pagination;

    const queryParams = new URLSearchParams();

    // Agregar todos los filtros genéricos usando el helper
    addFiltersToParams(queryParams, filters);

    // Agregar parámetros with[] para cargar relaciones necesarias
    if (filters._requiredRelations && Array.isArray(filters._requiredRelations)) {
      addWithParams(queryParams, filters._requiredRelations);
    }

    // Paginación
    queryParams.append('page', page);
    queryParams.append('perPage', perPage);

    const url = `${API_URL_V2}${ENDPOINT}?${queryParams.toString()}`;
    return fetchEntitiesGeneric(url, token);
  },

  async delete(id) {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/${id}`;
    return deleteEntityGeneric(url, null, token);
  },

  async deleteMultiple(ids) {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}`;
    return deleteEntityGeneric(url, { ids }, token);
  },
};
