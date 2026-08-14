/** Caja de un palet — nunca incluye manualCostPerKg/traceableCostPerKg/costPerKg/totalCost
 * para el actor cliente de maquila (recortado por PalletManualCostPolicy en backend). */
export interface MaquilaPalletBox {
  id: number;
  netWeight: number;
  isAvailable?: boolean;
  product?: { id: number | string; name: string };
  [key: string]: unknown;
}

/** Palet propio de un cliente de maquila (PalletResource, ver docs/maquila/frontend/02-almacen-interactivo.md) */
export interface MaquilaPallet {
  id: number;
  observations: string | null;
  palletTareWeightKg: number | null;
  state: { id: 'registered' | 'stored' | 'shipped' | 'processed'; name: string };
  productsNames: string[];
  boxes: MaquilaPalletBox[];
  lots: string[];
  netWeight: number;
  position: string | null;
  store: { id: number; name: string } | null;
  orderId: number | string | null;
  numberOfBoxes: number;
  availableBoxesCount: number;
  usedBoxesCount: number;
  totalAvailableWeight: number;
  totalUsedWeight: number;
  receptionId: number | string | null;
}

export interface MaquilaPalletListMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface MaquilaPalletListResponse {
  data: MaquilaPallet[];
  meta: MaquilaPalletListMeta;
}

/** Filtros expuestos en el portal — solo los que tienen sentido para un cliente de maquila
 * (excluye stores/orders/buyerReference: el cliente no ve nuestros almacenes ni pedidos internos). */
export interface MaquilaPalletFilters {
  state?: 'registered' | 'stored' | 'shipped' | 'processed';
  orderState?: 'pending' | 'finished' | 'without_order';
  position?: 'located' | 'unlocated';
  dateFrom?: string;
  dateTo?: string;
  notes?: string;
  lots?: string[];
  products?: (number | string)[];
  species?: (number | string)[];
  hasAvailableBoxes?: boolean;
  hasUsedBoxes?: boolean;
}
