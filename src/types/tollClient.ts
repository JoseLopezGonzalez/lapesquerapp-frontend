/** Branding público de un cliente de maquila (GET /toll-clients/branding/{slug}, sin sesión) */
export interface TollClientBranding {
  name: string;
  loginBannerUrl: string | null;
  logoUrl: string | null;
}

/**
 * Cliente de maquila — gestión admin (staff interno). Campos confirmados contra
 * openapi/frontend.yaml (POST/PUT /api/v2/toll-clients) tras refrescar el contrato el
 * 2026-08-14. Mismos campos que ExternalProcessor + a3erpCode/facilcomCode (exportación
 * contable) + slug/loginBannerUrl/logoUrl (branding, ver docs §22 del documento maestro).
 *
 * ⚠️ No existe hoy ningún endpoint que vincule este TollClient a un ExternalUser
 * (POST/PUT /external-users no acepta tollClientId/toll_client_id) — gap de backend
 * confirmado 2026-08-14, pendiente de resolver aparte. Ver conversación / memoria del proyecto.
 */
export interface TollClient {
  id: number;
  name: string;
  legalName: string | null;
  vatNumber: string;
  a3erpCode: string | null;
  facilcomCode: string | null;
  sanitaryRegistrationNumber: string | null;
  contactPerson: string | null;
  phone: string | null;
  emails: string[];
  ccEmails: string[];
  address: string | null;
  city: string | null;
  postalCode: string | null;
  province: string | null;
  country: { id: number; name: string } | null;
  isActive: boolean;
  notes: string | null;
  slug: string;
  loginBannerUrl: string | null;
  logoUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface TollClientOption {
  value: number | string;
  label: string;
}
