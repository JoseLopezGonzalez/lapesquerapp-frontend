import type { MaquilaPallet } from './pallet';

/** Devolución de mercancía al cliente de maquila (TollClientReturn::toArrayAssoc(),
 * ver docs/maquila/frontend/07-devoluciones.md). No es una venta: sin Customer, sin precio. */
export interface MaquilaTollClientReturn {
  id: number;
  tollClientId: number;
  tollClient: { id: number; name: string };
  transportId: number | null;
  transport: { id: number; name: string } | null;
  date: string;
  documentReference: string | null;
  reason: string | null;
  notes: string | null;
  pallets: MaquilaPallet[];
  createdAt: string;
  updatedAt: string;
}

export interface MaquilaTollClientReturnListMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface MaquilaTollClientReturnListResponse {
  data: MaquilaTollClientReturn[];
  meta: MaquilaTollClientReturnListMeta;
}
