type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;

export function normalizeQueryParams(
  params: Record<string, unknown> = {}
): Record<string, unknown> {
  return Object.entries(params)
    .filter(
      ([, value]) => value != null && value !== '' && (!Array.isArray(value) || value.length > 0)
    )
    .sort(([left], [right]) => left.localeCompare(right))
    .reduce<Record<string, unknown>>((accumulator, [key, value]) => {
      accumulator[key] = Array.isArray(value)
        ? [...value].map((item) => String(item)).sort()
        : value;
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
  all: (
    tenantId: string | null | undefined,
    fieldOperatorId: number | string | null | undefined = 'unknown'
  ) => ['field', 'routes', tenantId ?? 'unknown', fieldOperatorId ?? 'unknown'] as const,
  list: (
    tenantId: string | null | undefined,
    fieldOperatorId: number | string | null | undefined = 'unknown',
    params: QueryParams = {}
  ) =>
    [
      'field',
      'routes',
      tenantId ?? 'unknown',
      fieldOperatorId ?? 'unknown',
      normalizeQueryParams(params),
    ] as const,
  detail: (
    tenantId: string | null | undefined,
    fieldOperatorId: number | string | null | undefined = 'unknown',
    routeId: number | string | null | undefined
  ) =>
    [
      'field',
      'routes',
      'detail',
      tenantId ?? 'unknown',
      fieldOperatorId ?? 'unknown',
      routeId,
    ] as const,
};

export const fieldOrderKeys = {
  all: (
    tenantId: string | null | undefined,
    fieldOperatorId: number | string | null | undefined = 'unknown'
  ) => ['field', 'orders', tenantId ?? 'unknown', fieldOperatorId ?? 'unknown'] as const,
  list: (
    tenantId: string | null | undefined,
    fieldOperatorId: number | string | null | undefined = 'unknown',
    params: QueryParams = {}
  ) =>
    [
      'field',
      'orders',
      tenantId ?? 'unknown',
      fieldOperatorId ?? 'unknown',
      normalizeQueryParams(params),
    ] as const,
  detail: (
    tenantId: string | null | undefined,
    fieldOperatorId: number | string | null | undefined = 'unknown',
    orderId: number | string | null | undefined
  ) =>
    [
      'field',
      'orders',
      'detail',
      tenantId ?? 'unknown',
      fieldOperatorId ?? 'unknown',
      orderId,
    ] as const,
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
  all: (tenantId: string | null | undefined) => ['crm', 'orders', tenantId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, params: Record<string, unknown> = {}) =>
    ['crm', 'orders', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
};

// P03 — listado de clientes
export const customerListKeys = {
  listPrefix: (tenantId: string | null | undefined) =>
    ['customers', 'list', tenantId ?? 'unknown'] as const,
  list: (
    tenantId: string | null | undefined,
    filters: Record<string, unknown> = {},
    page = 1,
    perPage = 12
  ) =>
    [
      'customers',
      'list',
      tenantId ?? 'unknown',
      normalizeQueryParams(filters),
      page,
      perPage,
    ] as const,
};

// P10 — claves de cliente usadas en useCustomerAssignment
export const crmCustomerKeys = {
  detailPrefix: (tenantId: string | null | undefined) =>
    ['crm', 'customers', 'detail', tenantId ?? 'unknown'] as const,
  detail: (tenantId: string | null | undefined, customerId: number | string | null | undefined) =>
    ['crm', 'customers', 'detail', tenantId ?? 'unknown', customerId] as const,
};

export const adminCustomerKeys = {
  assignment: (customerId: number | string | null | undefined) =>
    ['admin', 'customers', 'assignment', customerId] as const,
};

export const productionQueryKeys = {
  controlPanel: (tenantId: string | null | undefined, params: Record<string, unknown> = {}) =>
    ['productions', 'controlPanel', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
  orphanStock: (tenantId: string | null | undefined, params: Record<string, unknown> = {}) =>
    ['productions', 'orphanStock', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
  orphanBoxes: (tenantId: string | null | undefined, params: Record<string, unknown> = {}) =>
    ['productions', 'orphanBoxes', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
  detail: (tenantId: string | null | undefined, productionId: number | string | null | undefined) =>
    ['productions', 'detail', tenantId ?? 'unknown', productionId] as const,
  totals: (tenantId: string | null | undefined, productionId: number | string | null | undefined) =>
    ['productions', 'totals', tenantId ?? 'unknown', productionId] as const,
  processTree: (
    tenantId: string | null | undefined,
    productionId: number | string | null | undefined,
    params: Record<string, unknown> = {}
  ) =>
    [
      'productions',
      'processTree',
      tenantId ?? 'unknown',
      productionId,
      normalizeQueryParams(params),
    ] as const,
  processTreePrefix: (
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
  inputs: (tenantId: string | null | undefined, recordId: number | string | null | undefined) =>
    ['productionInputs', tenantId ?? 'unknown', recordId] as const,
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
  options: (tenantId: string | null | undefined) =>
    ['products', 'options', tenantId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined) => productOptionKeys.options(tenantId),
};

export const taxOptionKeys = {
  options: (tenantId: string | null | undefined) =>
    ['taxes', 'options', tenantId ?? 'unknown'] as const,
};

export const productCategoryOptionKeys = {
  list: (tenantId: string | null | undefined) =>
    ['productCategories', 'options', tenantId ?? 'unknown'] as const,
};

export const productFamilyOptionKeys = {
  list: (tenantId: string | null | undefined) =>
    ['productFamilies', 'options', tenantId ?? 'unknown'] as const,
};

export const processOptionKeys = {
  options: (tenantId: string | null | undefined) =>
    ['processes', 'options', tenantId ?? 'unknown'] as const,
};

export const settingsQueryKeys = {
  detail: (tenantId: string | null | undefined) => ['settings', tenantId ?? 'unknown'] as const,
};

export const supplierLiquidationKeys = {
  // Calculadora (efímera, por proveedor + rango)
  detailPrefix: (
    tenantId: string | null | undefined,
    supplierId: number | string | null | undefined
  ) => ['supplier-liquidation-details', tenantId ?? 'unknown', supplierId] as const,
  detail: (
    tenantId: string | null | undefined,
    supplierId: number | string | null | undefined,
    startDate: string | undefined,
    endDate: string | undefined
  ) =>
    [
      'supplier-liquidation-details',
      tenantId ?? 'unknown',
      supplierId,
      startDate,
      endDate,
    ] as const,
  suppliersWithActivity: (
    tenantId: string | null | undefined,
    startDate: string | undefined,
    endDate: string | undefined,
    onlyUnliquidated?: boolean
  ) =>
    [
      'suppliers-with-activity',
      tenantId ?? 'unknown',
      startDate,
      endDate,
      onlyUnliquidated,
    ] as const,
  // CRUD historial de cerradas
  closedListPrefix: (tenantId: string | null | undefined) =>
    ['supplier-liquidations-closed', tenantId ?? 'unknown'] as const,
  closedList: (tenantId: string | null | undefined, filters: Record<string, unknown> = {}) =>
    ['supplier-liquidations-closed', tenantId ?? 'unknown', normalizeQueryParams(filters)] as const,
  closedShow: (
    tenantId: string | null | undefined,
    liquidationId: number | string | null | undefined
  ) => ['supplier-liquidation-show', tenantId ?? 'unknown', liquidationId] as const,
};

export const palletAttachmentKeys = {
  listPrefix: (tenantId: string | null | undefined, palletId: number | string | null | undefined) =>
    ['pallets', 'attachments', tenantId ?? 'unknown', palletId] as const,
  list: (
    tenantId: string | null | undefined,
    palletId: number | string | null | undefined,
    params: Record<string, unknown> = {}
  ) =>
    [
      'pallets',
      'attachments',
      tenantId ?? 'unknown',
      palletId,
      normalizeQueryParams(params),
    ] as const,
};

export const palletTimelineKeys = {
  detailPrefix: (
    tenantId: string | null | undefined,
    palletId: number | string | null | undefined
  ) => ['pallets', 'timeline', tenantId ?? 'unknown', palletId] as const,
  detail: (tenantId: string | null | undefined, palletId: number | string | null | undefined) =>
    ['pallets', 'timeline', tenantId ?? 'unknown', palletId] as const,
};

export const orderListKeys = {
  active: (tenantId: string | null | undefined) =>
    ['orders', 'active', tenantId ?? 'unknown'] as const,
};

export const orderKeys = {
  detailPrefix: (tenantId: string | null | undefined) =>
    ['orders', 'detail', tenantId ?? 'unknown'] as const,
  detail: (tenantId: string | null | undefined, orderId: number | string | null | undefined) =>
    ['orders', 'detail', tenantId ?? 'unknown', orderId] as const,
};

export const orderAttachmentKeys = {
  listPrefix: (tenantId: string | null | undefined, orderId: number | string | null | undefined) =>
    ['orders', 'attachments', tenantId ?? 'unknown', orderId] as const,
  list: (
    tenantId: string | null | undefined,
    orderId: number | string | null | undefined,
    params: Record<string, unknown> = {}
  ) =>
    [
      'orders',
      'attachments',
      tenantId ?? 'unknown',
      orderId,
      normalizeQueryParams(params),
    ] as const,
};

export const externalProcessorListKeys = {
  listPrefix: (tenantId: string | null | undefined) =>
    ['external-processors', 'list', tenantId ?? 'unknown'] as const,
  list: (
    tenantId: string | null | undefined,
    filters: Record<string, unknown> = {},
    page = 1,
    perPage = 12
  ) =>
    [
      'external-processors',
      'list',
      tenantId ?? 'unknown',
      normalizeQueryParams(filters),
      page,
      perPage,
    ] as const,
  detail: (tenantId: string | null | undefined, id: number | string | null | undefined) =>
    ['external-processors', 'detail', tenantId ?? 'unknown', id] as const,
};

export const externalProcessorOptionKeys = {
  list: (tenantId: string | null | undefined) =>
    ['external-processors', 'options', tenantId ?? 'unknown'] as const,
};

export const fuelQueryKeys = {
  spainAverageDiesel: () => ['fuel', 'spain-average-diesel'] as const,
};

export const storeQueryKeys = {
  totalStock: (tenantId: string | null | undefined) =>
    ['stock', 'total', tenantId ?? 'unknown'] as const,
  stockBySpecies: (tenantId: string | null | undefined) =>
    ['stock', 'by-species', tenantId ?? 'unknown'] as const,
  stockByProducts: (tenantId: string | null | undefined) =>
    ['stock', 'by-products', tenantId ?? 'unknown'] as const,
};

export const orderStatKeys = {
  totalNetWeight: (tenantId: string | null | undefined, dateFrom: string, dateTo: string) =>
    ['orders', 'totalNetWeight', tenantId ?? 'unknown', dateFrom, dateTo] as const,
  totalAmount: (
    tenantId: string | null | undefined,
    dateFrom: string,
    dateTo: string,
    includeAuxiliary = false
  ) =>
    ['orders', 'totalAmount', tenantId ?? 'unknown', dateFrom, dateTo, includeAuxiliary] as const,
  ranking: (
    tenantId: string | null | undefined,
    dateFrom: string,
    dateTo: string,
    groupBy: string,
    valueType: string,
    speciesId: string | undefined
  ) =>
    [
      'orders',
      'ranking',
      tenantId ?? 'unknown',
      dateFrom,
      dateTo,
      groupBy,
      valueType,
      speciesId,
    ] as const,
  salesBySalesperson: (tenantId: string | null | undefined, dateFrom: string, dateTo: string) =>
    ['orders', 'salesBySalesperson', tenantId ?? 'unknown', dateFrom, dateTo] as const,
  profitabilitySummary: (
    tenantId: string | null | undefined,
    dateFrom: string,
    dateTo: string,
    productId: string | undefined
  ) =>
    ['orders', 'profitabilitySummary', tenantId ?? 'unknown', dateFrom, dateTo, productId] as const,
  profitabilityTimeline: (
    tenantId: string | null | undefined,
    dateFrom: string,
    dateTo: string,
    granularity: string | undefined,
    productId: string | undefined
  ) =>
    [
      'orders',
      'profitabilityTimeline',
      tenantId ?? 'unknown',
      dateFrom,
      dateTo,
      granularity,
      productId,
    ] as const,
  profitabilityProducts: (tenantId: string | null | undefined, dateFrom: string, dateTo: string) =>
    ['orders', 'profitabilityProducts', tenantId ?? 'unknown', dateFrom, dateTo] as const,
};

export const auxiliaryLineStatKeys = {
  totalAmount: (tenantId: string | null | undefined, dateFrom: string, dateTo: string) =>
    ['auxiliary-lines', 'totalAmount', tenantId ?? 'unknown', dateFrom, dateTo] as const,
  byProduct: (tenantId: string | null | undefined, dateFrom: string, dateTo: string) =>
    ['auxiliary-lines', 'byProduct', tenantId ?? 'unknown', dateFrom, dateTo] as const,
  byCustomer: (tenantId: string | null | undefined, dateFrom: string, dateTo: string) =>
    ['auxiliary-lines', 'byCustomer', tenantId ?? 'unknown', dateFrom, dateTo] as const,
  chartData: (
    tenantId: string | null | undefined,
    dateFrom: string,
    dateTo: string,
    groupBy: string
  ) => ['auxiliary-lines', 'chartData', tenantId ?? 'unknown', dateFrom, dateTo, groupBy] as const,
};

export const agendaKeys = {
  all: (tenantId: string | null | undefined) => ['crm', 'agenda', tenantId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, params: Record<string, unknown> = {}) =>
    ['crm', 'agenda', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
  summaryPrefix: (tenantId: string | null | undefined) =>
    ['crm', 'agenda', 'summary', tenantId ?? 'unknown'] as const,
  summary: (tenantId: string | null | undefined, params: Record<string, unknown> = {}) =>
    ['crm', 'agenda', 'summary', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
  pendingPrefix: (tenantId: string | null | undefined) =>
    ['crm', 'agenda', 'pending', tenantId ?? 'unknown'] as const,
  pending: (
    tenantId: string | null | undefined,
    targetType: string | null | undefined,
    targetId: string | number | null | undefined
  ) =>
    [
      'crm',
      'agenda',
      'pending',
      tenantId ?? 'unknown',
      targetType ?? 'none',
      targetId != null ? String(targetId) : 'none',
    ] as const,
};

export const crmDashboardKeys = {
  all: (tenantId: string | null | undefined) =>
    ['crm', 'dashboard', tenantId ?? 'unknown'] as const,
  pendingActions: (tenantId: string | null | undefined) =>
    ['crm', 'dashboard', tenantId ?? 'unknown', 'pending-actions'] as const,
  customers: (tenantId: string | null | undefined) =>
    ['crm', 'dashboard', tenantId ?? 'unknown', 'customers'] as const,
  prospects: (tenantId: string | null | undefined) =>
    ['crm', 'dashboard', tenantId ?? 'unknown', 'prospects'] as const,
};

export const prospectKeys = {
  listPrefix: (tenantId: string | null | undefined) =>
    ['crm', 'prospects', 'list', tenantId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, params: Record<string, unknown> = {}) =>
    ['crm', 'prospects', 'list', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
  detailPrefix: (tenantId: string | null | undefined) =>
    ['crm', 'prospect', 'detail', tenantId ?? 'unknown'] as const,
  detail: (tenantId: string | null | undefined, id: number | string | null | undefined) =>
    ['crm', 'prospect', 'detail', tenantId ?? 'unknown', id] as const,
  contacts: (tenantId: string | null | undefined, id: number | string | null | undefined) =>
    ['crm', 'prospect', 'contacts', tenantId ?? 'unknown', id] as const,
};

export const interactionKeys = {
  listPrefix: (tenantId: string | null | undefined) =>
    ['crm', 'interactions', 'list', tenantId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, params: Record<string, unknown> = {}) =>
    ['crm', 'interactions', 'list', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
};

export const offerKeys = {
  listPrefix: (tenantId: string | null | undefined) =>
    ['crm', 'offers', 'list', tenantId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, params: Record<string, unknown> = {}) =>
    ['crm', 'offers', 'list', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
  detail: (tenantId: string | null | undefined, id: number | string | null | undefined) =>
    ['crm', 'offer', 'detail', tenantId ?? 'unknown', id] as const,
};

export const auxiliaryProductKeys = {
  options: (tenantId: string | null | undefined) =>
    ['auxiliary-products', 'options', tenantId ?? 'unknown'] as const,
};

export const incotermQueryKeys = {
  listPrefix: (tenantId: string | null | undefined) =>
    ['incoterms', 'list', tenantId ?? 'unknown'] as const,
  list: (
    tenantId: string | null | undefined,
    filters: Record<string, unknown> = {},
    page = 1,
    perPage = 12
  ) =>
    [
      'incoterms',
      'list',
      tenantId ?? 'unknown',
      normalizeQueryParams(filters),
      page,
      perPage,
    ] as const,
};

export const supplierListKeys = {
  listPrefix: (tenantId: string | null | undefined) =>
    ['suppliers', 'list', tenantId ?? 'unknown'] as const,
  list: (
    tenantId: string | null | undefined,
    filters: Record<string, unknown> = {},
    page = 1,
    perPage = 12
  ) =>
    [
      'suppliers',
      'list',
      tenantId ?? 'unknown',
      normalizeQueryParams(filters),
      page,
      perPage,
    ] as const,
};

export const userQueryKeys = {
  me: (tenantId: string | null | undefined) => ['me', tenantId ?? 'unknown'] as const,
};

export const fieldOperatorQueryKeys = {
  listPrefix: (tenantId: string | null | undefined) =>
    ['field-operators', 'list', tenantId ?? 'unknown'] as const,
  list: (
    tenantId: string | null | undefined,
    filters: Record<string, unknown> = {},
    page = 1,
    perPage = 12
  ) =>
    [
      'field-operators',
      'list',
      tenantId ?? 'unknown',
      normalizeQueryParams(filters),
      page,
      perPage,
    ] as const,
  detail: (tenantId: string | null | undefined, id: number | string | null | undefined) =>
    ['field-operators', 'detail', tenantId ?? 'unknown', id] as const,
  optionsPrefix: (tenantId: string | null | undefined) =>
    ['field-operators', 'options', tenantId ?? 'unknown'] as const,
};

export const dispatchQueryKeys = {
  listPrefix: (tenantId: string | null | undefined) =>
    ['dispatches', 'list', tenantId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, page: number, today: string) =>
    ['dispatches', 'list', tenantId ?? 'unknown', page, today] as const,
  chart: (
    tenantId: string | null | undefined,
    from: string | null,
    to: string | null,
    speciesId: string | undefined,
    categoryId: string | undefined,
    familyId: string | undefined,
    unit: string | undefined,
    groupBy: string | undefined
  ) =>
    [
      'dispatches',
      'chart',
      tenantId ?? 'unknown',
      from,
      to,
      speciesId,
      categoryId,
      familyId,
      unit,
      groupBy,
    ] as const,
};

export const receptionChartKeys = {
  chart: (
    tenantId: string | null | undefined,
    from: string | null,
    to: string | null,
    speciesId: string | undefined,
    categoryId: string | undefined,
    familyId: string | undefined,
    unit: string | undefined,
    groupBy: string | undefined
  ) =>
    [
      'receptions',
      'chart',
      tenantId ?? 'unknown',
      from,
      to,
      speciesId,
      categoryId,
      familyId,
      unit,
      groupBy,
    ] as const,
};

export const productionViewKeys = {
  data: (tenantId: string | null | undefined) =>
    ['productionView', 'data', tenantId ?? 'unknown'] as const,
};

export const labelQueryKeys = {
  list: (tenantId: string | null | undefined) => ['labels', tenantId ?? 'unknown'] as const,
};

export const orderChartKeys = {
  sales: (
    tenantId: string | null | undefined,
    from: string | null,
    to: string | null,
    speciesId: string | undefined,
    categoryId: string | undefined,
    familyId: string | undefined,
    unit: string | undefined,
    groupBy: string | undefined
  ) =>
    [
      'sales',
      'chart',
      tenantId ?? 'unknown',
      from,
      to,
      speciesId,
      categoryId,
      familyId,
      unit,
      groupBy,
    ] as const,
  transport: (tenantId: string | null | undefined, from: string, to: string) =>
    ['transport', 'chart', tenantId ?? 'unknown', from, to] as const,
};
