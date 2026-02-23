import { SUPERADMIN_API_URL } from '@/configs/superadminConfig';

const TOKEN_KEY = '__superadmin_token__';

export function getSuperadminToken() {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSuperadminToken(token) {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch { /* ignore */ }
}

export class SuperadminApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'SuperadminApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * HTTP client for superadmin API.
 * - Prepends SUPERADMIN_API_URL to relative paths
 * - Adds Authorization: Bearer {token}
 * - Does NOT send X-Tenant
 * - Handles 401 (redirect to login), 429 (rate limit), 422 (validation)
 */
export async function fetchSuperadmin(path, options = {}) {
  const url = path.startsWith('http') ? path : `${SUPERADMIN_API_URL}${path}`;

  const token = getSuperadminToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.ok) return res;

  let body = {};
  try {
    body = await res.clone().json();
  } catch { /* empty body */ }

  if (res.status === 401) {
    setSuperadminToken(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superadmin:unauthorized'));
    }
    throw new SuperadminApiError(
      body.message || body.error || 'No autenticado',
      401,
      body,
    );
  }

  if (res.status === 429) {
    throw new SuperadminApiError(
      'Demasiadas peticiones, espera un momento.',
      429,
      body,
    );
  }

  if (res.status === 422) {
    throw new SuperadminApiError(
      body.message || 'Error de validación',
      422,
      body,
    );
  }

  throw new SuperadminApiError(
    body.message || `Error HTTP ${res.status}`,
    res.status,
    body,
  );
}
