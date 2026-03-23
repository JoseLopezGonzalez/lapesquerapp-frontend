type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;

function normalizeQueryParams(params: QueryParams = {}) {
  return Object.entries(params)
    .filter(([, value]) => value != null && value !== '' && (!Array.isArray(value) || value.length > 0))
    .sort(([left], [right]) => left.localeCompare(right))
    .reduce<Record<string, QueryValue | QueryValue[]>>((accumulator, [key, value]) => {
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
  all: (tenantId: string | null | undefined) => ['field', 'routes', tenantId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, params: QueryParams = {}) =>
    ['field', 'routes', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
  detail: (tenantId: string | null | undefined, routeId: number | string | null | undefined) =>
    ['field', 'routes', 'detail', tenantId ?? 'unknown', routeId] as const,
};

export const fieldOrderKeys = {
  all: (tenantId: string | null | undefined) => ['field', 'orders', tenantId ?? 'unknown'] as const,
  list: (tenantId: string | null | undefined, params: QueryParams = {}) =>
    ['field', 'orders', tenantId ?? 'unknown', normalizeQueryParams(params)] as const,
  detail: (tenantId: string | null | undefined, orderId: number | string | null | undefined) =>
    ['field', 'orders', 'detail', tenantId ?? 'unknown', orderId] as const,
};
