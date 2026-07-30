/**
 * Order domain types — API payloads, responses, and stats/profitability shapes.
 * Moved out of orderService.ts (GAP-V2-032) so consumers can import types
 * without pulling in the fetching layer.
 */

import type { CustomsBroker } from './catalog';

/** Order payload for create/update */
export interface OrderPayload {
  [key: string]: unknown;
}

/** Order data from API */
export interface Order {
  id: number | string;
  orderType?: 'standard' | 'autoventa' | 'maritime_export';
  invoiced?: boolean;
  revenuePerKg?: number | null;
  totalCost?: number | null;
  costPerKg?: number | null;
  grossMargin?: number | null;
  marginPercentage?: number | null;
  marginPerKg?: number | null;
  auxiliaryLines?: AuxiliaryOrderLine[];
  auxiliarySubtotal?: number | null;
  auxiliaryTotal?: number | null;
  maritimeShippingDetail?: MaritimeShippingDetail | null;
  maritimeContainers?: MaritimeContainer[];
  [key: string]: unknown;
}

/** Datos de envío marítimo (buque, viaje, documentación) — recurso 1:1 por pedido */
export interface MaritimeShippingDetail {
  id: number | string;
  orderId: number | string;
  vesselName: string | null;
  voyageNumber: string | null;
  exportInvoiceNumber: string | null;
  swbNumber: string | null;
  loadingPort: string | null;
  dischargePort: string | null;
  customsBrokerId: number | string | null;
  customsBroker: CustomsBroker | null;
  ultimateConsigneeName: string | null;
  ultimateConsigneeAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload de reemplazo completo (PUT) para los datos de envío marítimo */
export interface MaritimeShippingDetailPayload {
  vesselName?: string | null;
  voyageNumber?: string | null;
  exportInvoiceNumber?: string | null;
  swbNumber?: string | null;
  loadingPort?: string | null;
  dischargePort?: string | null;
  customsBrokerId?: number | string | null;
  ultimateConsigneeName?: string | null;
  ultimateConsigneeAddress?: string | null;
}

/** Contenedor marítimo — recurso 1:N por pedido */
export interface MaritimeContainer {
  id: number | string;
  orderId: number | string;
  containerNumber: string;
  sealNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload de creación de contenedor marítimo */
export interface MaritimeContainerCreatePayload {
  containerNumber: string;
  sealNumber?: string | null;
}

/** Payload de actualización parcial de contenedor marítimo */
export interface MaritimeContainerUpdatePayload {
  containerNumber?: string;
  sealNumber?: string | null;
}

/** Order planned product detail payload */
export interface OrderPlannedProductDetailPayload {
  [key: string]: unknown;
}

/** Auxiliary order line — línea de venta directa (nieve, envases, palets, servicios) */
export interface AuxiliaryOrderLine {
  id: number | string;
  orderId?: number | string;
  auxiliaryProduct?: { id: number | string; name: string } | null;
  description?: string | null;
  effectiveDescription?: string;
  quantity?: string | number;
  unit?: string;
  unitPrice?: string | number;
  tax?: { id: number | string; name?: string; rate?: number } | null;
  subtotal?: number;
  total?: number;
  [key: string]: unknown;
}

/** Auxiliary order line payload for create/update */
export interface AuxiliaryOrderLinePayload {
  auxiliaryProductId?: number | string | null;
  description?: string | null;
  quantity?: number | string;
  unit?: string;
  unitPrice?: number | string;
  taxId?: number | string | null;
  [key: string]: unknown;
}

export interface OrderCostAnalysisSummary {
  totalRevenue: number;
  totalCost: number | null;
  grossMargin: number | null;
  marginPercentage: number | null;
}

export interface OrderCostAnalysisProductLine {
  product: {
    id: number;
    name: string;
  };
  unitPrice: number;
  taxRate: number;
  lineWeightKg: number;
  lineRevenue: number;
  lineRevenueWithTax: number;
  revenuePerKg?: number | null;
  lineCost: number | null;
  costPerKg?: number | null;
  lineMargin: number | null;
  lineMarginPct: number | null;
  marginPerKg?: number | null;
}

export interface OrderCostAnalysisPallet {
  palletId: number;
  totalWeightKg: number;
  totalRevenue?: number | null;
  revenuePerKg?: number | null;
  totalCost: number | null;
  costPerKg: number | null;
  totalMargin?: number | null;
  marginPercentage?: number | null;
  marginPerKg?: number | null;
  products: string[];
}

export interface OrderCostAnalysisResponse {
  summary: OrderCostAnalysisSummary;
  byProductLine: OrderCostAnalysisProductLine[];
  byPallet: OrderCostAnalysisPallet[];
}

export interface OrdersProfitabilitySummaryParams {
  dateFrom: string;
  dateTo: string;
  productIds?: Array<string | number>;
}

export interface OrdersProfitabilityExportJobParams extends OrdersProfitabilitySummaryParams {
  onlyMissingCosts?: boolean;
}

export type OrdersProfitabilityExportJobStatus = 'pending' | 'processing' | 'finished' | 'failed';

export interface OrdersProfitabilityExportJob {
  id: string;
  status: OrdersProfitabilityExportJobStatus;
  filters: {
    dateFrom: string;
    dateTo: string;
    productIds?: Array<string | number>;
    onlyMissingCosts?: boolean;
  };
  filename: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  downloadUrl: string | null;
}

export interface OrdersProfitabilityExportDownload {
  blob: Blob;
  filename: string;
}

export interface OrdersProfitabilityTimelineParams extends OrdersProfitabilitySummaryParams {
  granularity?: 'day' | 'week' | 'month';
}

export interface OrdersProfitabilityProductsParams {
  dateFrom: string;
  dateTo: string;
}

/** Alerta: cajas cuyo producto no tiene precio €/kg válido en la previsión del pedido (no suman a totalRevenue). */
export interface OrdersProfitabilitySalePriceAlert {
  active: boolean;
  boxesWithoutSalePrice: number;
  hint: string | null;
}

export interface ProfitabilitySummaryResponse {
  period: {
    from: string;
    to: string;
  };
  ordersCount: number;
  totalRevenue: number;
  totalCost: number | null;
  grossMargin: number | null;
  marginPercentage: number | null;
  coveredBoxes: number;
  uncoveredBoxes: number;
  costCoverageBoxesPct: number;
  salePriceAlert?: OrdersProfitabilitySalePriceAlert | null;
}

export interface ProfitabilityTimelinePoint {
  period: string;
  periodLabel: string;
  ordersCount: number;
  totalRevenue: number;
  totalCost: number | null;
  grossMargin: number | null;
  marginPercentage: number | null;
}

export interface ProfitabilityTimelineResponse {
  granularity: 'day' | 'week' | 'month';
  series: ProfitabilityTimelinePoint[];
}

export interface ProfitabilityProductItem {
  product: {
    id: number;
    name: string;
  };
  totalWeightKg: number;
  totalRevenue: number;
  revenuePerKg?: number | null;
  totalCost: number | null;
  costPerKg?: number | null;
  grossMargin: number | null;
  marginPercentage: number | null;
  marginPerKg?: number | null;
  ordersCount: number;
}

export interface ProfitabilityProductsResponse {
  period: {
    from: string;
    to: string;
  };
  products: ProfitabilityProductItem[];
}

/** Order incident payload */
export interface OrderIncidentPayload {
  description?: string;
  resolution_type?: string;
  resolution_notes?: string;
  [key: string]: unknown;
}

/** Ranking stats params */
export interface OrderRankingStatsParams {
  groupBy: string;
  valueType: string;
  dateFrom: string;
  dateTo: string;
  speciesId?: string;
}

/** Sales chart params */
export interface SalesChartParams {
  speciesId?: string;
  categoryId?: string;
  familyId?: string;
  from: string;
  to: string;
  unit: string;
  groupBy: string;
}

/** Auxiliary lines statistics response — total amount with previous-year comparison */
export interface AuxiliaryLinesTotalAmountStats {
  value: number;
  subtotal: number;
  tax: number;
  comparisonValue: number | null;
  comparisonSubtotal: number | null;
  comparisonTax: number | null;
  percentageChange: number | null;
  range: { from: string; to: string; fromPrev: string; toPrev: string };
}

/** Auxiliary lines statistics response — ranking by product */
export interface AuxiliaryLinesByProductStat {
  name: string;
  quantity: number;
  unit: string;
  subtotal: number;
}

/** Auxiliary lines statistics response — ranking by customer */
export interface AuxiliaryLinesByCustomerStat {
  customerName: string;
  subtotal: number;
  total: number;
}

/** Auxiliary lines statistics response — time series point */
export interface AuxiliaryLinesChartPoint {
  date: string;
  subtotal: number;
  total: number;
}

/** Transport chart params */
export interface TransportChartParams {
  from: string;
  to: string;
}

export type OrderStatus = 'pending' | 'finished' | 'incident';
