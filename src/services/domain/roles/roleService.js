/**
 * Service de dominio para Roles (solo opciones para select)
 *
 * La API ya no expone CRUD de roles; solo GET /v2/roles/options para
 * rellenar el desplegable de rol al crear/editar usuarios.
 */

import { getAuthToken } from '@/lib/auth/getAuthToken';
import { fetchAutocompleteOptionsGeneric } from '@/services/generic/editEntityService';
import { API_URL_V2 } from '@/configs/config';

const ENDPOINT = 'roles';

export const roleService = {
  async getOptions() {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/options`;
    return fetchAutocompleteOptionsGeneric(url, token);
  },
};
