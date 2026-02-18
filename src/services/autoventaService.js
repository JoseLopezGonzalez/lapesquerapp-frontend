/**
 * Servicio para crear autoventa (POST /api/v2/orders con orderType: "autoventa").
 * Contrato: docs/71-autoventa-api-frontend.md
 */

import { createOrder } from '@/services/orderService';
import { ApiError } from '@/lib/api/apiHelpers';

/**
 * Convierte Date o string a Y-m-d
 */
function toYmd(date) {
  if (!date) return null;
  if (typeof date === 'string') {
    const d = new Date(date);
    return isNaN(d.getTime()) ? date : d.toISOString().slice(0, 10);
  }
  if (date instanceof Date) return date.toISOString().slice(0, 10);
  return null;
}

/**
 * Construye el payload para POST /api/v2/orders (autoventa).
 * @param {Object} state - Estado del wizard useAutoventa
 * @returns {Object} Body según doc 71
 */
export function buildAutoventaPayload(state) {
  const entryDate = toYmd(state.entryDate);
  const loadDate = toYmd(state.loadDate) || entryDate;
  const observations =
    typeof state.observations === 'string'
      ? state.observations.slice(0, 1000)
      : '';

  const items = (state.items || []).map((item) => ({
    productId: Number(item.productId),
    boxesCount: Number(item.boxesCount) || 0,
    totalWeight: Number(item.totalWeight) || 0,
    unitPrice: Number(item.unitPrice) || 0,
    subtotal: Number(item.subtotal) || 0,
    tax: item.tax != null ? Number(item.tax) : undefined,
  }));

  const boxes = (state.boxes || []).map((box) => ({
    productId: Number(box.productId),
    lot: box.lot || undefined,
    netWeight: Number(box.netWeight) || 0,
    gs1128: box.gs1128 || undefined,
    grossWeight: box.grossWeight != null ? Number(box.grossWeight) : undefined,
  }));

  return {
    orderType: 'autoventa',
    customer: Number(state.customerId),
    entryDate,
    loadDate,
    invoiceRequired: Boolean(state.invoiceRequired),
    observations,
    items,
    boxes,
  };
}

/**
 * Crea la autoventa en el backend.
 * @param {Object} state - Estado del wizard
 * @returns {Promise<Object>} data del pedido creado (OrderDetailsResource)
 * @throws {ApiError} con status 422 y data.errors para validación
 */
export async function createAutoventa(state) {
  const payload = buildAutoventaPayload(state);
  try {
    const data = await createOrder(payload);
    return data;
  } catch (err) {
    if (err instanceof ApiError && err.data?.errors) {
      const messages = Object.values(err.data.errors).flat();
      throw new Error(messages.length ? messages.join(' ') : err.message);
    }
    throw err;
  }
}
