import { getAvailableBoxesCount, getAvailableNetWeight } from '@/helpers/pallet/boxAvailability';

export interface PalletBox {
  id: number | string;
  product: { id: number | string; name: string } | null;
  lot: string;
  netWeight: number;
  grossWeight?: number;
  gs1128?: string;
  new?: boolean;
  printed?: boolean;
  manualCostPerKg?: number | null;
  traceableCostPerKg?: number | null;
  isPounds?: boolean;
  originalWeightInPounds?: number | null;
  isAvailable?: boolean;
  [key: string]: unknown;
}

export interface PalletState {
  id: number | string | null;
  observations?: string;
  palletTareWeightKg?: number | string | null;
  state?: { id: number; name: string } | null;
  productsNames?: string[];
  boxes: PalletBox[];
  lots?: string[];
  netWeight?: number;
  position?: unknown;
  store?: { id: number | string } | null;
  orderId?: number | string | null;
  numberOfBoxes?: number;
  [key: string]: unknown;
}

export interface BoxCreationData {
  productId: number | string | '';
  lot: string;
  netWeight: number | string | '';
  weights: string;
  totalWeight: string;
  numberOfBoxes: string;
  palletWeight: string;
  showPalletWeight: boolean;
  boxTare: string;
  showBoxTare: boolean;
  scannedCode: string;
  deleteScannedCode: string;
  gs1codes: string;
  manualCostPerKg: string;
}

export interface ProductOption {
  value: number | string;
  label: string;
  boxGtin?: string | null;
}

export const STORAGE_KEYS = {
  showPalletWeight: 'pallet_creation_showPalletWeight',
  showBoxTare: 'pallet_creation_showBoxTare',
  palletWeight: 'pallet_creation_palletWeight',
  boxTare: 'pallet_creation_boxTare',
};

export const emptyPallet: PalletState = {
  id: null,
  observations: '',
  palletTareWeightKg: null,
  state: { id: 1, name: 'Registrado' },
  productsNames: [],
  boxes: [],
  lots: [],
  netWeight: 0,
  position: null,
  store: null,
  orderId: null,
  numberOfBoxes: 0,
};

export function recalculatePalletStats(pallet: PalletState): PalletState {
  const numberOfBoxes = getAvailableBoxesCount(pallet) as number;
  const netWeight = getAvailableNetWeight(pallet) as number;
  return {
    ...pallet,
    numberOfBoxes,
    netWeight: parseFloat(netWeight.toFixed(3)),
  };
}

export function getStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    if (defaultValue === false || (defaultValue as unknown) === true) {
      return (stored === 'true') as unknown as T;
    }
    return stored as unknown as T;
  } catch {
    return defaultValue;
  }
}

export function setStoredValue(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore localStorage errors
  }
}

export const saveDiscountPreferences = (_boxCreationData: BoxCreationData): void => {
  // Memory disabled — user must choose preferences each time
  return;
};

export function getInitialBoxCreationData(): BoxCreationData {
  return {
    productId: '',
    lot: '',
    netWeight: '',
    weights: '',
    totalWeight: '',
    numberOfBoxes: '',
    palletWeight: '',
    showPalletWeight: false,
    boxTare: '',
    showBoxTare: false,
    scannedCode: '',
    deleteScannedCode: '',
    gs1codes: '',
    manualCostPerKg: '',
  };
}

export function resetBoxCreationDataPreservingDiscounts(
  currentData: Partial<BoxCreationData>
): BoxCreationData {
  const reset = getInitialBoxCreationData();
  return {
    ...reset,
    palletWeight:
      currentData?.palletWeight !== undefined ? currentData.palletWeight : reset.palletWeight,
    showPalletWeight:
      currentData?.showPalletWeight !== undefined
        ? currentData.showPalletWeight
        : reset.showPalletWeight,
    boxTare: currentData?.boxTare !== undefined ? currentData.boxTare : reset.boxTare,
    showBoxTare:
      currentData?.showBoxTare !== undefined ? currentData.showBoxTare : reset.showBoxTare,
  };
}

export function parseDecimalInput(value: unknown): number {
  if (typeof value === 'number') return value;
  const normalized = String(value).trim().replace(',', '.');
  return parseFloat(normalized);
}

export function roundToTwoDecimals(weight: unknown): number {
  const num = parseDecimalInput(weight);
  if (isNaN(num)) return 0;
  return parseFloat(num.toFixed(2));
}

export function normNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function boxContentEqual(origBox: PalletBox, tempBox: PalletBox): boolean {
  const oProductId = (origBox.product as Record<string, unknown> | null)?.id ?? origBox.product;
  const tProductId = (tempBox.product as Record<string, unknown> | null)?.id ?? tempBox.product;
  if (normNum(oProductId) !== normNum(tProductId)) return false;
  if (String(origBox.lot ?? '') !== String(tempBox.lot ?? '')) return false;
  if (normNum(origBox.netWeight) !== normNum(tempBox.netWeight)) return false;
  if (normNum(origBox.grossWeight) !== normNum(tempBox.grossWeight)) return false;
  if (normNum(origBox.manualCostPerKg) !== normNum(tempBox.manualCostPerKg)) return false;
  return true;
}

export function palletDataEqual(
  original: PalletState | null,
  temporal: PalletState | null
): boolean {
  if (!original && !temporal) return true;
  if (!original || !temporal) return false;
  if ((original.observations ?? '') !== (temporal.observations ?? '')) return false;
  if (normNum(original.palletTareWeightKg) !== normNum(temporal.palletTareWeightKg)) return false;

  const oStateId = (original.state as Record<string, unknown> | null)?.id ?? original.state;
  const tStateId = (temporal.state as Record<string, unknown> | null)?.id ?? temporal.state;
  if (normNum(oStateId) !== normNum(tStateId)) return false;

  const oStoreId = (original.store as Record<string, unknown> | null)?.id ?? null;
  const tStoreId = (temporal.store as Record<string, unknown> | null)?.id ?? null;
  if (normNum(oStoreId) !== normNum(tStoreId)) return false;

  const oOrderId = normNum(original.orderId) || null;
  const tOrderId = normNum(temporal.orderId) || null;
  if (oOrderId !== tOrderId) return false;

  const origBoxes = original.boxes ?? [];
  const tempBoxes = temporal.boxes ?? [];
  if (origBoxes.length !== tempBoxes.length) return false;
  if (origBoxes.length === 0) return true;

  const originalById = new Map(origBoxes.map((b) => [b.id, b]));
  const originalIds = new Set(originalById.keys());
  const temporalIds = new Set(tempBoxes.map((b) => b.id));
  if (originalIds.size !== temporalIds.size || temporalIds.size !== tempBoxes.length) return false;
  for (const id of temporalIds) {
    if (!originalIds.has(id)) return false;
  }
  for (const tempBox of tempBoxes) {
    const origBox = originalById.get(tempBox.id);
    if (!origBox || !boxContentEqual(origBox, tempBox)) return false;
  }
  return true;
}

let nextBoxId = Date.now();

export function generateUniqueIntId(): number {
  return nextBoxId++;
}
