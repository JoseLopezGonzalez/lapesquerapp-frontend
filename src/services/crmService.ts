import { API_URL_V2 } from '@/configs/config';
import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { getAuthToken, clearAuthTokenCache } from '@/lib/auth/getAuthToken';
import type {
  AgendaAction,
  AgendaSummaryData,
  CommercialInteraction,
  CommercialInteractionCreateResponse,
  CommercialInteractionPayload,
  CrmDashboardCustomersData,
  CrmDashboardPendingActionsData,
  CrmDashboardProspectsData,
  CrmPaginatedResponse,
  CrmWriteResponse,
  Offer,
  OfferPayload,
  Prospect,
  ProspectContact,
  ProspectContactPayload,
  ProspectPayload,
  ResolveNextActionPayload,
  ResolveNextActionResponse,
  PendingAgendaResponse,
  ConvertToCustomerPayload,
} from '@/types/crm';
import { getErrorMessage, ApiError } from '@/lib/api/apiHelpers';

async function resolveAccessToken() {
  return getAuthToken();
}

async function getAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const token = await resolveAccessToken();

  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    clearAuthTokenCache();
  }

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    throw new ApiError(
      getErrorMessage(errorData) || `Error HTTP ${response.status}`,
      response.status,
      errorData
    );
  }

  return response.json() as Promise<T>;
}

function buildQuery(params: Record<string, unknown> = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null && item !== '') query.append(`${key}[]`, String(item));
      });
      return;
    }
    query.append(key, String(value));
  });

  return query.toString();
}

async function getJson<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const headers = await getAuthHeaders();
  const query = params ? buildQuery(params) : '';
  const response = await fetchWithTenant(`${API_URL_V2}${path}${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers,
  });
  return parseResponse<T>(response);
}

async function sendJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
  const response = await fetchWithTenant(`${API_URL_V2}${path}`, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

export const crmService = {
  getCrmPendingActions() {
    return getJson<{ data: CrmDashboardPendingActionsData }>('crm/dashboard/pending-actions');
  },
  getCrmCustomersData() {
    return getJson<{ data: CrmDashboardCustomersData }>('crm/dashboard/customers');
  },
  getCrmProspectsData() {
    return getJson<{ data: CrmDashboardProspectsData }>('crm/dashboard/prospects');
  },
  listAgenda(params: Record<string, unknown> = {}) {
    return getJson<{ data: { events: AgendaAction[] } }>('crm/agenda', params);
  },
  getAgendaSummary(params: Record<string, unknown> = {}) {
    return getJson<{ data: AgendaSummaryData }>('crm/agenda/summary', params);
  },
  getPendingAgendaAction(params: {
    targetType: 'prospect' | 'customer';
    targetId: number | string;
  }) {
    return getJson<{ data: PendingAgendaResponse | AgendaAction | null }>(
      'crm/agenda/pending',
      params
    );
  },
  resolveNextAction(payload: ResolveNextActionPayload) {
    return sendJson<ResolveNextActionResponse>('crm/agenda/resolve-next-action', 'POST', payload);
  },
  listCommercialOrders(params: Record<string, unknown> = {}) {
    return getJson<{
      data: Record<string, unknown>[];
      meta?: Record<string, unknown>;
      links?: Record<string, unknown>;
    }>('orders', params);
  },
  rescheduleAgendaAction(
    id: number | string,
    payload: {
      nextActionAt: string;
      nextActionNote?: string | null;
      sourceInteractionId?: number | string | null;
    }
  ) {
    return sendJson<{ data: AgendaAction }>(`crm/agenda/${id}/reschedule`, 'POST', payload);
  },
  cancelAgendaAction(id: number | string, reason: string) {
    return sendJson<{ data: AgendaAction; message?: string }>(`crm/agenda/${id}/cancel`, 'POST', {
      reason,
    });
  },
  listProspects(params: Record<string, unknown> = {}) {
    return getJson<CrmPaginatedResponse<Prospect>>('prospects', params);
  },
  getProspect(id: number | string) {
    return getJson<{ data: Prospect }>(`prospects/${id}`);
  },
  createProspect(payload: ProspectPayload) {
    return sendJson<CrmWriteResponse<Prospect>>('prospects', 'POST', payload);
  },
  updateProspect(id: number | string, payload: ProspectPayload) {
    return sendJson<CrmWriteResponse<Prospect>>(`prospects/${id}`, 'PUT', payload);
  },
  deleteProspect(id: number | string) {
    return sendJson<{ message?: string }>(`prospects/${id}`, 'DELETE');
  },
  listProspectContacts(id: number | string) {
    return getJson<{ data: ProspectContact[] }>(`prospects/${id}/contacts`);
  },
  createProspectContact(id: number | string, payload: ProspectContactPayload) {
    return sendJson<CrmWriteResponse<ProspectContact>>(`prospects/${id}/contacts`, 'POST', payload);
  },
  updateProspectContact(
    prospectId: number | string,
    contactId: number | string,
    payload: ProspectContactPayload
  ) {
    return sendJson<CrmWriteResponse<ProspectContact>>(
      `prospects/${prospectId}/contacts/${contactId}`,
      'PUT',
      payload
    );
  },
  deleteProspectContact(prospectId: number | string, contactId: number | string) {
    return sendJson<{ message?: string }>(
      `prospects/${prospectId}/contacts/${contactId}`,
      'DELETE'
    );
  },
  convertProspectToCustomer(id: number | string, payload?: ConvertToCustomerPayload) {
    return sendJson<{ message: string; data: Record<string, unknown> }>(
      `prospects/${id}/convert-to-customer`,
      'POST',
      payload ?? {}
    );
  },
  scheduleProspectAction(
    id: number | string,
    nextActionAt: string,
    nextActionNote?: string | null
  ) {
    const body: { nextActionAt: string; nextActionNote?: string | null } = { nextActionAt };
    if (nextActionNote !== undefined) body.nextActionNote = nextActionNote || null;
    return sendJson<CrmWriteResponse<Prospect>>(`prospects/${id}/schedule-action`, 'POST', body);
  },
  clearProspectAction(id: number | string) {
    return sendJson<{ message?: string }>(`prospects/${id}/next-action`, 'DELETE');
  },
  listCommercialInteractions(params: Record<string, unknown> = {}) {
    return getJson<CrmPaginatedResponse<CommercialInteraction>>('commercial-interactions', params);
  },
  createCommercialInteraction(payload: CommercialInteractionPayload) {
    return sendJson<CommercialInteractionCreateResponse>(
      'commercial-interactions',
      'POST',
      payload
    );
  },
  getCommercialInteraction(id: number | string) {
    return getJson<{ data: CommercialInteraction }>(`commercial-interactions/${id}`);
  },
  listOffers(params: Record<string, unknown> = {}) {
    return getJson<CrmPaginatedResponse<Offer>>('offers', params);
  },
  getOffer(id: number | string) {
    return getJson<{ data: Offer }>(`offers/${id}`);
  },
  createOffer(payload: OfferPayload) {
    return sendJson<CrmWriteResponse<Offer>>('offers', 'POST', payload);
  },
  updateOffer(id: number | string, payload: OfferPayload) {
    return sendJson<CrmWriteResponse<Offer>>(`offers/${id}`, 'PUT', payload);
  },
  deleteOffer(id: number | string) {
    return sendJson<{ message?: string }>(`offers/${id}`, 'DELETE');
  },
  sendOffer(id: number | string, payload: { channel: string; email?: string; subject?: string }) {
    return sendJson<CrmWriteResponse<Offer>>(`offers/${id}/send`, 'POST', payload);
  },
  acceptOffer(id: number | string) {
    return sendJson<CrmWriteResponse<Offer>>(`offers/${id}/accept`, 'POST');
  },
  rejectOffer(id: number | string, reason: string) {
    return sendJson<CrmWriteResponse<Offer>>(`offers/${id}/reject`, 'POST', { reason });
  },
  expireOffer(id: number | string) {
    return sendJson<CrmWriteResponse<Offer>>(`offers/${id}/expire`, 'POST');
  },
  getOfferWhatsappText(id: number | string) {
    return getJson<{ data: { text: string } }>(`offers/${id}/whatsapp-text`);
  },
  sendOfferEmail(id: number | string, payload: { email: string; subject?: string }) {
    return sendJson<CrmWriteResponse<Offer>>(`offers/${id}/email`, 'POST', payload);
  },
  createOrderFromOffer(id: number | string, payload: Record<string, unknown>) {
    return sendJson<CrmWriteResponse<{ id: number | string }>>(
      `offers/${id}/create-order`,
      'POST',
      payload
    );
  },
  async downloadOfferPdf(id: number | string) {
    const headers = await getAuthHeaders();
    const response = await fetchWithTenant(`${API_URL_V2}offers/${id}/pdf`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }
      throw new ApiError(
        getErrorMessage(errorData) || `Error HTTP ${response.status}`,
        response.status,
        errorData
      );
    }
    return response.blob();
  },
};
