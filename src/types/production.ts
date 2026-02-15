/**
 * Types for production block (Bloque 8) — productions, records, processes, inputs, outputs
 * Aligned with helpers/production/normalizers.js
 */

export interface Species {
  id: number;
  name: string;
}

export interface CaptureZone {
  id: number;
  name: string;
}

export interface Production {
  id: number;
  lot: string | null;
  species: Species | null;
  captureZone: CaptureZone | null;
  openedAt: string | null;
  closedAt: string | null;
  notes: string | null;
  waste?: number;
  wastePercentage?: number;
  yield?: number;
  yieldPercentage?: number;
  reconciliation?: ProductionReconciliation | null;
}

export interface ProductionReconciliation {
  summary?: {
    overallStatus?: 'ok' | 'warning' | 'error';
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ProductionTotals {
  totalInputWeight?: number;
  totalOutputWeight?: number;
  totalInputBoxes?: number;
  totalOutputBoxes?: number;
  [key: string]: unknown;
}

export interface Process {
  id: number;
  name: string;
  type?: string;
  description?: string | null;
}

export interface ProductionRecordMinimal {
  id: number;
  process_id?: number;
  process?: Process;
  [key: string]: unknown;
}

export interface ProductionInputNormalized {
  id: number;
  productionRecordId: number;
  boxId: number;
  box?: BoxNormalized | null;
}

export interface BoxNormalized {
  id: number;
  productId?: number;
  product?: { id: number; name: string; code?: string | null } | null;
  lot?: string | null;
  netWeight?: number;
  [key: string]: unknown;
}

export interface ProductionOutputNormalized {
  id: number;
  productionRecordId: number;
  productId: number;
  product?: { id: number; name: string; code?: string | null } | null;
  weightKg?: number;
  boxes?: number;
  notes?: string | null;
  costPerKg?: number | null;
  totalCost?: number | null;
  sources?: unknown[];
}

export interface ProductionOutputConsumptionNormalized {
  id: number;
  productionRecordId: number;
  productionOutputId: number;
  productionOutput?: ProductionOutputNormalized | null;
  consumedWeightKg?: number;
  consumedBoxes?: number;
  notes?: string | null;
}

export interface ProductionRecord {
  id: number;
  productionId: number;
  parentRecordId: number | null;
  processId: number;
  process: Process | null;
  startedAt: string;
  finishedAt: string | null;
  notes: string | null;
  isCompleted: boolean;
  isRoot: boolean;
  totalInputWeight: number;
  totalOutputWeight: number;
  totalInputBoxes: number;
  totalOutputBoxes: number;
  waste: number;
  wastePercentage: number;
  yield: number;
  yieldPercentage: number;
  inputs: ProductionInputNormalized[];
  outputs: ProductionOutputNormalized[];
  parentOutputConsumptions: ProductionOutputConsumptionNormalized[];
}

export type ProcessTree = unknown;
