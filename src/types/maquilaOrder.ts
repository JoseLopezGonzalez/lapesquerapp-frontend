/**
 * Pedidos del portal de maquila — cliente de maquila hacia sus propios clientes finales.
 * Ver docs/maquila/frontend/04-pedidos.md.
 *
 * ⚠️ Estos tipos son una LISTA BLANCA deliberada, no un reflejo completo de lo que devuelve
 * hoy el backend. `OrderResource`/`OrderDetailsResource` incluyen hoy, sin recortar,
 * `subtotalAmount`/`totalAmount`/`totalCost`/`grossMargin`/`marginPercentage`/`revenuePerKg`/
 * `costPerKg`/`marginPerKg`/`plannedProductDetails`/`auxiliaryLines` — precio/coste/margen de
 * la venta a los clientes finales del cliente de maquila, que nunca debe ver (gap real, ver
 * docs/maquila/frontend/99-pendientes-y-gaps.md). NO añadas esos campos a estos tipos aunque
 * los veas en la respuesta real — si un componente no puede tipar un campo, no debe poder
 * leerlo por accidente.
 */

export type MaquilaOrderStatus = 'pending' | 'incident' | 'finished';

export interface MaquilaOrderTransport {
  id: number;
  name: string;
}

export interface MaquilaOrderIncoterm {
  id: number;
  name: string;
}

/** Fila del listado — OrderResource recortado (MaquilaOrderVisibilityPolicy::stripFromOrderArray) */
export interface MaquilaOrderListItem {
  id: number;
  orderType: string;
  /** Siempre null — el nombre real está en adhocCustomerName (solo en el detalle) */
  customer: null;
  buyerReference: string | null;
  status: MaquilaOrderStatus;
  invoiced: boolean;
  loadDate: string | null;
  transport: MaquilaOrderTransport | null;
  pallets: number;
  totalBoxes: number;
  incoterm: MaquilaOrderIncoterm | null;
  totalNetWeight: number;
}

export interface MaquilaOrderListMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface MaquilaOrderListResponse {
  data: MaquilaOrderListItem[];
  meta: MaquilaOrderListMeta;
}

/** Detalle — OrderDetailsResource recortado. Campos de "cliente al vuelo" verificados en el
 * modelo Order (migración 2026_08_12_100000). `customerDisplayName` no confirmado todavía en
 * el Resource — tratar como opcional y verificar cuando haya datos reales (ver 99-pendientes-y-gaps.md). */
export interface MaquilaOrderDetail {
  id: number;
  orderType: string;
  status: MaquilaOrderStatus;
  invoiced: boolean;
  entryDate: string | null;
  loadDate: string | null;
  customerId: number | null;
  adhocCustomerName: string | null;
  adhocCustomerAddress: string | null;
  customerDisplayName?: string | null;
  buyerReference: string | null;
  transport: MaquilaOrderTransport | null;
  transportationNotes: string | null;
  truckPlate: string | null;
  trailerPlate: string | null;
  temperature: number | null;
  emails: string[];
  ccEmails: string[];
  incoterm: MaquilaOrderIncoterm | null;
  pallets?: number;
  totalBoxes?: number;
  totalNetWeight?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Whitelist exacta de UpdateOrderAsProcessorRequest/StoreOrderAsProcessorRequest —
 * nunca envíes customerId, pallets, plannedProducts ni tollClientId (se ignoran o se fuerzan
 * desde el actor autenticado, ver docs/maquila/frontend/04-pedidos.md §3). */
export interface MaquilaOrderPayload {
  entryDate?: string;
  loadDate?: string;
  adhocCustomerName?: string;
  adhocCustomerAddress?: string | null;
  buyerReference?: string | null;
  transport?: { id: number } | null;
  transportationNotes?: string | null;
  truckPlate?: string | null;
  trailerPlate?: string | null;
  temperature?: number | null;
  emails?: string[];
  ccEmails?: string[];
}

/** Incidencia del pedido (lectura) — Incident::toArrayAssoc() */
export interface MaquilaOrderIncident {
  id: number;
  description: string;
  status: string;
  resolutionType: string | null;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
