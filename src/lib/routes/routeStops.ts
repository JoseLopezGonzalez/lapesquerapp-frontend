import type { DeliveryRoute, RouteStop } from '@/types/field';
import { geocodeAddress } from '@/lib/maps/geocoding';

type RouteEntityDraft = {
  id?: number | string | null;
  name?: string | null;
  description?: string | null;
  routeDate?: string | null;
  fieldOperatorId?: number | string | null;
  routeTemplateId?: number | string | null;
  sourceMode?: 'manual' | 'template' | string;
  stopsEdited?: boolean;
  stops?: RouteStop[];
};

const geocodeCache = new Map<string, { lat: number; lng: number } | null>();
const pendingGeocodeRequests = new Map<string, Promise<{ lat: number; lng: number } | null>>();
const STOP_SIGNATURE_SEPARATOR = '::';
const MAX_GEOCODE_CACHE_SIZE = 500;
const GEOCODE_CONCURRENCY = 3;

function buildDraftId(prefix: string, index?: number) {
  return `${prefix}-${index ?? 'x'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildStableStopKey(stop: Partial<RouteStop>, index = 0) {
  return [
    'stop',
    stop.position ?? index + 1,
    stop.targetType ?? 'location',
    stop.customerId ?? '',
    stop.prospectId ?? '',
    String(stop.label ?? '').trim(),
    String(stop.address ?? '').trim(),
  ].join(STOP_SIGNATURE_SEPARATOR);
}

function resolveStopIdentity(stop: Partial<RouteStop>, index = 0) {
  if (stop.id != null && stop.id !== '') {
    return {
      id: stop.id,
      draftKey: stop.draftKey ?? null,
    };
  }

  const draftKey = stop.draftKey || buildStableStopKey(stop, index);
  return {
    id: draftKey,
    draftKey,
  };
}

export function normalizeRouteStop(stop: Partial<RouteStop> = {}, index = 0): RouteStop {
  const identity = resolveStopIdentity(stop, index);
  return {
    id: identity.id,
    draftKey: identity.draftKey,
    position: stop.position ?? index + 1,
    stopType: stop.stopType ?? 'obligatoria',
    targetType: stop.targetType ?? 'location',
    customerId: stop.customerId ?? null,
    prospectId: stop.prospectId ?? null,
    label: stop.label ?? '',
    address: stop.address ?? '',
    notes: stop.notes ?? '',
    status: stop.status ?? 'pending',
    resultType: stop.resultType ?? null,
    resultNotes: stop.resultNotes ?? null,
    completedAt: stop.completedAt ?? null,
    lat: stop.lat ?? null,
    lng: stop.lng ?? null,
  };
}

export function normalizeStops(stops: Partial<RouteStop>[] = []): RouteStop[] {
  return stops.map((stop, index) => normalizeRouteStop(stop, index));
}

export function createDraftStop(overrides: Partial<RouteStop> = {}): RouteStop {
  const draftKey = overrides.draftKey ?? buildDraftId('draft');
  return normalizeRouteStop(
    {
      id: overrides.id ?? draftKey,
      draftKey,
      ...overrides,
    },
    Math.max((Number(overrides.position) || 1) - 1, 0)
  );
}

export function createEmptyRouteDraft(overrides: RouteEntityDraft = {}) {
  return {
    id: null,
    name: '',
    description: '',
    routeDate: '',
    fieldOperatorId: '',
    routeTemplateId: '',
    sourceMode: 'manual',
    stopsEdited: false,
    stops: [],
    ...overrides,
  };
}

export function createEmptyTemplateDraft(overrides: RouteEntityDraft = {}) {
  return {
    id: null,
    name: '',
    description: '',
    fieldOperatorId: '',
    stops: [],
    ...overrides,
  };
}

export function createEmptyNewItemDraft(
  overrides: Partial<
    Pick<
      RouteEntityDraft,
      'name' | 'description' | 'routeDate' | 'fieldOperatorId' | 'sourceMode' | 'routeTemplateId'
    >
  > = {}
) {
  return {
    name: '',
    description: '',
    routeDate: '',
    fieldOperatorId: '',
    sourceMode: 'manual',
    routeTemplateId: '',
    ...overrides,
  };
}

export function reorderStops(stops: RouteStop[], fromId: string | number, toId: string | number) {
  const oldIndex = stops.findIndex((stop) => String(stop.id) === String(fromId));
  const newIndex = stops.findIndex((stop) => String(stop.id) === String(toId));
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return stops;

  const nextStops = [...stops];
  const [moved] = nextStops.splice(oldIndex, 1);
  nextStops.splice(newIndex, 0, moved);
  return nextStops.map((stop, index) =>
    normalizeRouteStop({ ...stop, position: index + 1 }, index)
  );
}

export function serializeStopsForWrite(stops: RouteStop[] = []) {
  return normalizeStops(stops).map((stop, index) => ({
    position: index + 1,
    stopType: stop.stopType,
    targetType: stop.targetType,
    customerId: stop.targetType === 'customer' ? stop.customerId || undefined : undefined,
    prospectId: stop.targetType === 'prospect' ? stop.prospectId || undefined : undefined,
    label: stop.label || undefined,
    address: stop.address || undefined,
    notes: stop.notes || undefined,
  }));
}

export function buildStopsCoordinateSignature(stops: Partial<RouteStop>[] = []) {
  return normalizeStops(stops)
    .map((stop, index) => `${index}:${stop.lat ?? 'x'}:${stop.lng ?? 'x'}`)
    .join('|');
}

async function geocodeStop(stop: RouteStop) {
  if (stop.lat != null && stop.lng != null) return stop;

  const query = String(stop.address || stop.label || '').trim();
  if (!query) return stop;

  if (geocodeCache.has(query)) {
    const cachedCoordinates = geocodeCache.get(query);
    return cachedCoordinates ? { ...stop, ...cachedCoordinates } : stop;
  }

  let requestPromise = pendingGeocodeRequests.get(query);
  if (!requestPromise) {
    requestPromise = geocodeAddress(query)
      .then((features) => {
        const feature = features?.[0];
        if (!feature?.center) {
          if (geocodeCache.size >= MAX_GEOCODE_CACHE_SIZE)
            geocodeCache.delete(geocodeCache.keys().next().value!);
          geocodeCache.set(query, null);
          return null;
        }
        const coordinates = { lng: feature.center[0], lat: feature.center[1] };
        if (geocodeCache.size >= MAX_GEOCODE_CACHE_SIZE)
          geocodeCache.delete(geocodeCache.keys().next().value!);
        geocodeCache.set(query, coordinates);
        return coordinates;
      })
      .catch(() => {
        geocodeCache.set(query, null);
        return null;
      })
      .finally(() => {
        pendingGeocodeRequests.delete(query);
      });
    pendingGeocodeRequests.set(query, requestPromise);
  }

  const coordinates = await requestPromise;
  return coordinates ? { ...stop, ...coordinates } : stop;
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
) {
  if (items.length === 0) return [] as R[];
  const result: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runner() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      result[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runner());
  await Promise.all(workers);
  return result;
}

export async function enrichStopsWithCoordinates(stops: Partial<RouteStop>[] = []) {
  const normalizedStops = normalizeStops(stops);
  return runWithConcurrency(normalizedStops, GEOCODE_CONCURRENCY, (stop) => geocodeStop(stop));
}

export function normalizeRouteEntity<T extends Partial<DeliveryRoute>>(
  route: T
): T & { stops: RouteStop[] } {
  return {
    ...route,
    stops: normalizeStops(route?.stops ?? []),
  };
}

export function normalizeRouteCollection<T extends Partial<DeliveryRoute>>(items: T[] = []) {
  return items.map((item) => normalizeRouteEntity(item));
}
