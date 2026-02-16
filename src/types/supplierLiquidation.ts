/**
 * Types for supplier liquidations — Bloque 6 Proveedores
 */

/** Supplier with activity stats for list view */
export interface SupplierWithActivity {
  id: number;
  name: string;
  receptions_count: number;
  dispatches_count: number;
  total_receptions_weight: number;
  total_dispatches_weight: number;
  total_receptions_amount: number;
  total_dispatches_amount: number;
}

/** Supplier info in liquidation detail */
export interface LiquidationSupplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  address?: string;
}

/** Date range in liquidation */
export interface LiquidationDateRange {
  start: string;
  end: string;
}

/** Product line in reception */
export interface LiquidationProductLine {
  id?: number;
  product?: { name: string };
  net_weight: number;
  price: number;
  amount: number;
}

/** Reception in liquidation detail */
export interface LiquidationReception {
  id: number;
  date: string;
  notes?: string;
  products?: LiquidationProductLine[];
  calculated_total_net_weight?: number;
  calculated_total_amount?: number;
  average_price?: number;
  declared_total_net_weight?: number | null;
  declared_total_amount?: number | null;
  related_dispatches?: LiquidationDispatch[];
}

/** Dispatch in liquidation detail */
export interface LiquidationDispatch {
  id: number;
  date: string;
  export_type?: 'a3erp' | 'facilcom';
  products?: LiquidationProductLine[];
  total_net_weight?: number;
  base_amount?: number;
  iva_amount?: number;
  total_amount: number;
}

/** Liquidation summary */
export interface LiquidationSummary {
  total_receptions?: number;
  total_dispatches?: number;
  total_receptions_weight?: number;
  total_receptions_amount?: number;
  total_dispatches_weight?: number;
  total_dispatches_base_amount?: number;
  total_dispatches_iva_amount?: number;
  total_dispatches_amount?: number;
  total_declared_weight?: number;
  total_declared_amount?: number;
  total_declared_with_iva?: number;
  weight_difference?: number;
  amount_difference?: number;
  percentage_not_declared?: number;
  net_amount?: number;
  has_iva_in_dispatches?: boolean;
}

/** Full liquidation detail response */
export interface SupplierLiquidationDetails {
  supplier: LiquidationSupplier;
  date_range: LiquidationDateRange;
  receptions: LiquidationReception[];
  dispatches: LiquidationDispatch[];
  summary?: LiquidationSummary;
}
