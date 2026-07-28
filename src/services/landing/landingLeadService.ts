/**
 * Landing Lead Service
 *
 * Envía el formulario de captura de leads de la landing pública al Route Handler
 * interno /api/landing/lead. Usa fetch() nativo (no fetchWithTenant) porque es una
 * ruta interna de Next.js, no el backend Laravel — no hay tenant ni token que inyectar.
 */

const LANDING_LEAD_ENDPOINT = '/api/landing/lead';

export interface LandingLeadPayload {
  email: string;
  /** Honeypot anti-spam: debe llegar vacío para usuarios reales. */
  company: string;
}

export async function submitLandingLead(payload: LandingLeadPayload): Promise<void> {
  let response: Response;
  try {
    response = await fetch(LANDING_LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // fetch() lanza TypeError nativo ("Failed to fetch") en fallos de red/conexión.
    // Se normaliza aquí para no propagar un mensaje técnico en inglés al usuario.
    throw new Error('No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.');
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.userMessage || 'No se pudo enviar la solicitud');
  }
}
