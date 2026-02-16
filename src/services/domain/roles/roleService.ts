/**
 * Service de dominio para Roles (solo opciones para select)
 * Bloque 11 — Usuarios y sesiones
 *
 * La API no expone CRUD de roles; solo GET /v2/roles/options para
 * rellenar el desplegable de rol al crear/editar usuarios.
 */

import { getAuthToken } from '@/lib/auth/getAuthToken';
import { fetchAutocompleteOptionsGeneric } from '@/services/generic/editEntityService';
import { API_URL_V2 } from '@/configs/config';

const ENDPOINT = 'roles';

export interface RoleOption {
  value: number | string;
  label: string;
}

export const roleService = {
  async getOptions(): Promise<RoleOption[]> {
    const token = await getAuthToken();
    const url = `${API_URL_V2}${ENDPOINT}/options`;
    return fetchAutocompleteOptionsGeneric(url, token) as Promise<RoleOption[]>;
  },
};
