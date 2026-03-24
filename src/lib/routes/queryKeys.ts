type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;

export function normalizeQueryParams(params: Record<string, unknown> = {}): Record<string, unknown> {
  return Object.entries(params)
    .filter(([, value]) => value != null && value !== '' && (!Array.isArray(value) || value.length > 0))
    .sort(([left], [right]) => left.localeCompare(right))
    .reduce<Record<string, unknown>>((accumulator, [key, value]) => {
      accumulator[key] = Array.isArray(value) ? [...value].map((item) => String(item)).sort() : value;
      return accumulator;
    }, {});
}

export const commercialRouteKeys = {
  all: (tenantId: string | null | undefined) => ['routes', tenantId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, params: QueryParams = {}) =>
    ['routes', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
  detail: (tenantId: string | null | undefined, routeId: number | string | null | undefined) =>
    ['routes', 'detail', tenantId ?? 'unknown', routeId] as const,
};

export const routeTemplateKeys = {
  all: (tenantId: string | null | undefined) => ['route-templates', tenantId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, params: QueryParams = {}) =>
    ['route-templates', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
};

export const fieldRouteKeys = {
  all: (tenantId: string | null | undefined, fieldOperatorId: number | string | null | undefined = 'unknown') =>
    ['field', 'routes', tenantId ?? 'unknown', fieldOperatorId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, fieldOperatorId: number | string | null | undefined = 'unknown', params: QueryParams = {}) =>
    ['field', 'routes', tenantId ?? 'unknown', fieldOperatorId ?? 'unknown', normalizeQueryParams(params)] as const,
  detail: (tenantId: string | null | undefined, fieldOperatorId: number | string | null | undefined = 'unknown', routeId: number | string | null | undefined) =>
    ['field', 'routes', 'detail', tenantId ?? 'unknown', fieldOperatorId ?? 'unknown', routeId] as const,
};

export const fieldOrderKeys = {
  all: (tenantId: string | null | undefined, fieldOperatorId: number | string | null | undefined = 'unknown') =>
    ['field', 'orders', tenantId ?? 'unknown', fieldOperatorId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, fieldOperatorId: number | string | null | undefined = 'unknown', params: QueryParams = {}) =>
    ['field', 'orders', tenantId ?? 'unknown', fieldOperatorId ?? 'unknown', normalizeQueryParams(params)] as const,
  detail: (tenantId: string | null | undefined, fieldOperatorId: number | string | null | undefined = 'unknown', orderId: number | string | null | undefined) =>
    ['field', 'orders', 'detail', tenantId ?? 'unknown', fieldOperatorId ?? 'unknown', orderId] as const,
};

// P05 — clave de opciones de clientes para field (autoventa y listados)
export const fieldCustomerOptionKeys = {
  list: (tenantId: string | null | undefined) =>
    ['field', 'customers', 'options', tenantId ?? 'unknown'] as const,
};

// P07 — opciones de productos para field (Step2QRScan)
export const fieldProductOptionKeys = {
  list: (tenantId: string | null | undefined) =>
    ['field', 'products', 'options', tenantId ?? 'unknown'] as const,
};

// P01 — pedidos comerciales CRM
export const comercialOrderKeys = {
  all: (tenantId: string | null | undefined) =>
    ['crm', 'orders', tenantId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, params: Record<string, unknown> = {}) =>
    ['crm', 'orders', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
};

// P03 — listado de clientes
export const customerListKeys = {
  listPrefix: (tenantId: string | null | undefined) =>
    ['customers', 'list', tenantId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, filters: Record<string, unknown> = {}, page = 1, perPage = 12) =>
    ['customers', 'list', tenantId ?? 'unknown', normalizeQueryParams(filters), page, perPage] as const,
};

// P10 — claves de cliente usadas en useCustomerAssignment
export const crmCustomerKeys = {
  detail: (tenantId: string | null | undefined, customerId: number | string | null | undefined) =>
    ['crm', 'customers', 'detail', tenantId ?? 'unknown', customerId] as const,
};

export const adminCustomerKeys = {
  assignment: (customerId: number | string | null | undefined) =>
    ['admin', 'customers', 'assignment', customerId] as const,
};

export const productionQueryKeys = {
  detail: (
    tenantId: string | null | undefined,
    productionId: number | string | null | undefined
  ) => ['productions', 'detail', tenantId ?? 'unknown', productionId] as const,
  totals: (
    tenantId: string | null | undefined,
    productionId: number | string | null | undefined
  ) => ['productions', 'totals', tenantId ?? 'unknown', productionId] as const,
  processTree: (
    tenantId: string | null | undefined,
    productionId: number | string | null | undefined
  ) => ['productions', 'processTree', tenantId ?? 'unknown', productionId] as const,
  recordDetail: (
    tenantId: string | null | undefined,
    recordId: number | string | null | undefined
  ) => ['productionRecords', 'detail', tenantId ?? 'unknown', recordId] as const,
  recordOptions: (
    tenantId: string | null | undefined,
    productionId: number | string | null | undefined,
    recordId: number | string | null | undefined
  ) => ['productionRecords', 'options', tenantId ?? 'unknown', productionId, recordId] as const,
  inputs: (
    tenantId: string | null | undefined,
    recordId: number | string | null | undefined
  ) => ['productionInputs', tenantId ?? 'unknown', recordId] as const,
  outputs: (
    tenantId: string | null | undefined,
    recordId: number | string | null | undefined,
    withSources: boolean = true
  ) => ['productionOutputs', tenantId ?? 'unknown', recordId, { withSources }] as const,
  consumptions: (
    tenantId: string | null | undefined,
    recordId: number | string | null | undefined
  ) => ['productionOutputConsumptions', tenantId ?? 'unknown', recordId] as const,
};

export const productOptionKeys = {
  list: (tenantId: string | null | undefined) =>
    ['products', 'options', tenantId ?? 'unknown'] as const,
};

export const productCategoryOptionKeys = {
  list: (tenantId: string | null | undefined) =>
    ['productCategories', 'options', tenantId ?? 'unknown'] as const,
};

export const productFamilyOptionKeys = {
  list: (tenantId: string | null | undefined) =>
    ['productFamilies', 'options', tenantId ?? 'unknown'] as const,
};

export const settingsQueryKeys = {
  detail: (tenantId: string | null | undefined) =>
    ['settings', tenantId ?? 'unknown'] as const,
};
