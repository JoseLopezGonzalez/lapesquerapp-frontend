import { SUPERADMIN_API_URL } from '@/configs/superadminConfig';

const TOKEN_KEY = '__superadmin_token__';

export function getSuperadminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSuperadminToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* ignore */
  }
}

export class SuperadminApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
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
export async function fetchSuperadmin(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${SUPERADMIN_API_URL}${path}`;

  const token = getSuperadminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.ok) return res;

  let body: Record<string, unknown> = {};
  try {
    body = await res.clone().json();
  } catch {
    /* empty body */
  }

  if (res.status === 401) {
    setSuperadminToken(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superadmin:unauthorized'));
    }
    throw new SuperadminApiError(
      (body.message as string) || (body.error as string) || 'No autenticado',
      401,
      body
    );
  }

  if (res.status === 429) {
    throw new SuperadminApiError('Demasiadas peticiones, espera un momento.', 429, body);
  }

  if (res.status === 422) {
    throw new SuperadminApiError((body.message as string) || 'Error de validación', 422, body);
  }

  throw new SuperadminApiError(
    (body.message as string) || `Error HTTP ${res.status}`,
    res.status,
    body
  );
}
