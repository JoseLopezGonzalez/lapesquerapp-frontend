import type { MaquilaPallet } from './pallet';

/** Línea de detalle de una recepción — nunca incluye 'price' para el cliente de maquila. */
export interface MaquilaReceptionDetail {
  productId: number;
  lot: string | null;
  [key: string]: unknown;
}

/** Recepción propia de materia prima (RawMaterialReceptionResource recortado,
 * ver docs/maquila/frontend/05-recepciones.md). Campos eliminados por completo para este
 * actor: supplier, prices, declaredTotalAmount, totalAmount, supplier_liquidation_id. */
export interface MaquilaReception {
  id: number;
  date: string;
  notes: string | null;
  declaredTotalNetWeight: number;
  creationMode: string;
  netWeight: number;
  species: string[];
  details: MaquilaReceptionDetail[];
  pallets: MaquilaPallet[];
  /** Siempre false para este actor — el portal no expone ningún endpoint de escritura. */
  canEdit: boolean;
  cannotEditReason: string | null;
  lockedPalletIds: number[];
}

export interface MaquilaReceptionListMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface MaquilaReceptionListResponse {
  data: MaquilaReception[];
  meta: MaquilaReceptionListMeta;
}
