/**
 * Detecta si las fuentes (materia prima de stock / consumos del proceso padre) de un nodo
 * de producción están completamente repartidas entre sus salidas, o si queda peso pendiente
 * de asignar (o asignado de más). No implica necesariamente un error: puede ser que el reparto
 * todavía no se haya terminado (manual o automáticamente), aunque también puede reflejar un
 * desajuste heredado de un reparto anterior.
 *
 * Acepta datos tanto normalizados (camelCase, servicios de dominio) como en bruto
 * (camelCase/snake_case mezclado, árbol de procesos del diagrama) — mismo patrón defensivo
 * ya usado en diagramTransformers.js.
 */

export type SourceAllocationStatus = 'ok' | 'under_allocated' | 'over_allocated';
export type SourceAllocationSeverity = 'none' | 'warning' | 'critical';

export interface SourceAllocationEntry {
  key: string;
  sourceType: 'stock_product' | 'parent_output';
  productId: number | string | null;
  productionOutputConsumptionId: number | string | null;
  productName: string | null;
  totalAvailableWeight: number;
  totalAssignedWeight: number;
  gapWeight: number;
  gapPercentage: number;
  status: SourceAllocationStatus;
  severity: SourceAllocationSeverity;
}

export interface NodeSourcesAllocationResult {
  sources: SourceAllocationEntry[];
  hasIssues: boolean;
  worstSeverity: SourceAllocationSeverity;
}

export interface SourcesAllocationOptions {
  /** Suelo absoluto de tolerancia en kg (cubre el redondeo cuando la fuente es pequeña). */
  minAbsoluteToleranceKg?: number;
  /** Tolerancia relativa en % del peso disponible de la fuente. */
  relativeTolerancePercentage?: number;
  /** A partir de qué % de infra-asignación se considera "grave" en vez de "atención". */
  criticalGapPercentage?: number;
}

const DEFAULT_OPTIONS: Required<SourcesAllocationOptions> = {
  minAbsoluteToleranceKg: 0.1,
  relativeTolerancePercentage: 1,
  criticalGapPercentage: 5,
};

const roundToTwo = (value: unknown): number =>
  Math.round((parseFloat(String(value ?? 0)) + Number.EPSILON) * 100) / 100;

function computeTolerance(totalAvailableWeight: number, options: Required<SourcesAllocationOptions>) {
  return Math.max(
    options.minAbsoluteToleranceKg,
    (options.relativeTolerancePercentage / 100) * totalAvailableWeight
  );
}

interface SourceGroup {
  key: string;
  sourceType: 'stock_product' | 'parent_output';
  productId: number | string | null;
  productionOutputConsumptionId: number | string | null;
  productName: string | null;
  totalAvailableWeight: number;
  totalAssignedWeight: number;
}

function getBoxProductId(box: Record<string, unknown> | null | undefined) {
  if (!box) return null;
  const product = box.product as Record<string, unknown> | null | undefined;
  return (product?.id ?? box.productId ?? box.product_id ?? null) as number | string | null;
}

function getBoxProductName(box: Record<string, unknown> | null | undefined) {
  const product = box?.product as Record<string, unknown> | null | undefined;
  return (product?.name as string | undefined) ?? null;
}

function getSourceGroupKey(source: Record<string, unknown> | null | undefined): string | null {
  if (!source) return null;
  const sourceType = (source.sourceType ?? source.source_type) as string | undefined;
  if (sourceType === 'stock_product') {
    const productId = (source.productId ?? source.product_id ?? (source.product as Record<string, unknown> | undefined)?.id) as
      | number
      | string
      | undefined;
    return productId != null ? `stock_product:${productId}` : null;
  }
  if (sourceType === 'parent_output') {
    const consumptionId = (source.productionOutputConsumptionId ??
      source.production_output_consumption_id) as number | string | undefined;
    return consumptionId != null ? `parent_output:${consumptionId}` : null;
  }
  return null;
}

function getSourceContributedWeight(source: Record<string, unknown> | null | undefined): number {
  if (!source) return 0;
  const weight = source.contributedWeightKg ?? source.contributed_weight_kg;
  return parseFloat(String(weight ?? 0)) || 0;
}

/**
 * @param inputs Entradas de materia prima desde stock del nodo (record.inputs)
 * @param parentOutputConsumptions Consumos del proceso padre del nodo (record.parentOutputConsumptions)
 * @param outputs Salidas del nodo, con sources[] (record.outputs, con with_sources=true)
 */
export function calculateSourcesAllocation(
  inputs: ReadonlyArray<unknown> | null | undefined,
  parentOutputConsumptions: ReadonlyArray<unknown> | null | undefined,
  outputs: ReadonlyArray<unknown> | null | undefined,
  options: SourcesAllocationOptions = {}
): NodeSourcesAllocationResult {
  const resolvedOptions: Required<SourcesAllocationOptions> = { ...DEFAULT_OPTIONS, ...options };
  const groups = new Map<string, SourceGroup>();

  (inputs || []).forEach((rawInput) => {
    const input = rawInput as Record<string, unknown> | null | undefined;
    const box = (input?.box ?? null) as Record<string, unknown> | null;
    const productId = getBoxProductId(box);
    if (productId == null) return;
    const key = `stock_product:${productId}`;
    const weight = parseFloat(String(box?.netWeight ?? box?.net_weight ?? 0)) || 0;
    const existing = groups.get(key);
    if (existing) {
      existing.totalAvailableWeight += weight;
    } else {
      groups.set(key, {
        key,
        sourceType: 'stock_product',
        productId,
        productionOutputConsumptionId: null,
        productName: getBoxProductName(box),
        totalAvailableWeight: weight,
        totalAssignedWeight: 0,
      });
    }
  });

  (parentOutputConsumptions || []).forEach((rawConsumption) => {
    const consumption = rawConsumption as Record<string, unknown> | null | undefined;
    const consumptionId = (consumption?.id ?? null) as number | string | null;
    if (consumptionId == null) return;
    const key = `parent_output:${consumptionId}`;
    const weight =
      parseFloat(String(consumption?.consumedWeightKg ?? consumption?.consumed_weight_kg ?? 0)) ||
      0;
    const productionOutput = (consumption?.productionOutput ?? consumption?.production_output ?? null) as
      | Record<string, unknown>
      | null;
    const product = (consumption?.product ??
      productionOutput?.product ??
      null) as Record<string, unknown> | null;
    groups.set(key, {
      key,
      sourceType: 'parent_output',
      productId: null,
      productionOutputConsumptionId: consumptionId,
      productName: (product?.name as string | undefined) ?? (consumption?.productName as string | undefined) ?? null,
      totalAvailableWeight: weight,
      totalAssignedWeight: 0,
    });
  });

  (outputs || []).forEach((rawOutput) => {
    const output = rawOutput as Record<string, unknown> | null | undefined;
    const sources = output?.sources;
    if (!Array.isArray(sources)) return;
    sources.forEach((source) => {
      const key = getSourceGroupKey(source as Record<string, unknown>);
      if (!key) return;
      const group = groups.get(key);
      if (!group) return;
      group.totalAssignedWeight += getSourceContributedWeight(source as Record<string, unknown>);
    });
  });

  const sources: SourceAllocationEntry[] = Array.from(groups.values())
    .filter((group) => group.totalAvailableWeight > 0)
    .map((group) => {
      const totalAvailableWeight = roundToTwo(group.totalAvailableWeight);
      const totalAssignedWeight = roundToTwo(group.totalAssignedWeight);
      const gapWeight = roundToTwo(totalAvailableWeight - totalAssignedWeight);
      const gapPercentage =
        totalAvailableWeight > 0 ? roundToTwo((gapWeight / totalAvailableWeight) * 100) : 0;
      const tolerance = computeTolerance(totalAvailableWeight, resolvedOptions);

      let status: SourceAllocationStatus = 'ok';
      let severity: SourceAllocationSeverity = 'none';
      if (Math.abs(gapWeight) > tolerance) {
        if (gapWeight < 0) {
          status = 'over_allocated';
          severity = 'critical';
        } else {
          status = 'under_allocated';
          severity = gapPercentage > resolvedOptions.criticalGapPercentage ? 'critical' : 'warning';
        }
      }

      return {
        key: group.key,
        sourceType: group.sourceType,
        productId: group.productId,
        productionOutputConsumptionId: group.productionOutputConsumptionId,
        productName: group.productName,
        totalAvailableWeight,
        totalAssignedWeight,
        gapWeight,
        gapPercentage,
        status,
        severity,
      };
    })
    .sort((a, b) => Math.abs(b.gapWeight) - Math.abs(a.gapWeight));

  const flagged = sources.filter((source) => source.status !== 'ok');
  const worstSeverity: SourceAllocationSeverity = flagged.some((source) => source.severity === 'critical')
    ? 'critical'
    : flagged.some((source) => source.severity === 'warning')
      ? 'warning'
      : 'none';

  return {
    sources,
    hasIssues: flagged.length > 0,
    worstSeverity,
  };
}
