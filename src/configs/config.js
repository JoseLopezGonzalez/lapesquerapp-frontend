// Base URL del backend (desarrollo: http://localhost:8000, producción: https://api.lapesquerapp.es)
// En el navegador con backend en localhost:8000 usamos proxy /api-backend para evitar CORS
const envBase =
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.lapesquerapp.es').replace(/\/$/, '')
    : 'https://api.lapesquerapp.es';
const isDevBackend = envBase === 'http://localhost:8000';
const API_BASE_URL =
  typeof window !== 'undefined' && isDevBackend ? '/api-backend' : envBase;

export const API_URL = `${API_BASE_URL}/api/`;
export const API_URL_V1 = `${API_URL}v1/`;
export const API_URL_V2 = `${API_URL}v2/`;
export { API_BASE_URL };

export const LOGIN_FORM_LOGO = '/brisapp.svg'; 

export const NAVBAR_LOGO = '/logos/blueapp-logo-horizontal.png';

/* Nombre de empresa */
export const COMPANY_NAME = 'Congelados Brisamar S.L.';

export const UNLOCATED_POSITION_ID = "unlocated";

export const PALLET_LABEL_SIZE = {
  width: "110mm",
  height: "90mm",
};
