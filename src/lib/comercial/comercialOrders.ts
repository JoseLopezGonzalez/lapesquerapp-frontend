type Category = {
  label: string;
  name: string;
  current?: boolean;
};

type CommercialOrder = Record<string, unknown> & {
  id: number | string;
  offerId?: unknown;
  status?: string | null;
  loadDate?: string | null;
  customer?: {
    name?: string | null;
  } | null;
};

function getDateOnly(value: unknown) {
  if (!value) return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function buildCommercialReferenceDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return { today, tomorrow };
}

type OfferReference = {
  id?: number | string;
  orderId?: number | string | null;
};

export function enrichOrdersWithOffers(orders: CommercialOrder[] = [], offers: OfferReference[] = []) {
  const offerByOrderId = new Map(
    (offers ?? []).filter((offer) => offer?.orderId != null).map((offer) => [String(offer.orderId), offer])
  );

  return orders.map((order) => {
    if (order.offerId) return order;
    const linkedOffer = offerByOrderId.get(String(order.id));
    return linkedOffer ? { ...order, offerId: linkedOffer.id } : order;
  });
}

export function buildVisibleCommercialOrderCategories(enrichedOrders: CommercialOrder[] = []) {
  const { today, tomorrow } = buildCommercialReferenceDates();
  const hasOrdersToday = enrichedOrders.some((order) => getDateOnly(order.loadDate)?.getTime() === today.getTime());
  const hasOrdersTomorrow = enrichedOrders.some((order) => getDateOnly(order.loadDate)?.getTime() === tomorrow.getTime());

  const result: Category[] = [{ label: 'Todos', name: 'all' }];
  if (hasOrdersToday) result.push({ label: 'Hoy', name: 'today' });
  if (hasOrdersTomorrow) result.push({ label: 'Mañana', name: 'tomorrow' });
  result.push(
    { label: 'En producción', name: 'pending' },
    { label: 'Terminados', name: 'finished' }
  );

  return result;
}

export function filterAndSortCommercialOrders(
  enrichedOrders: CommercialOrder[] = [],
  {
    searchText = '',
    activeCategoryName = 'all',
  }: {
    searchText?: string;
    activeCategoryName?: string;
  } = {}
) {
  const { today, tomorrow } = buildCommercialReferenceDates();
  const normalizedSearch = searchText.trim().toLowerCase();

  return enrichedOrders
    .filter((order) => {
      const loadDateOnly = getDateOnly(order.loadDate);
      const matchesSearch =
        !normalizedSearch ||
        String(order.customer?.name ?? '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(order.id).includes(normalizedSearch);

      let matchesCategory = true;
      if (activeCategoryName === 'today') {
        matchesCategory = loadDateOnly?.getTime() === today.getTime();
      } else if (activeCategoryName === 'tomorrow') {
        matchesCategory = loadDateOnly?.getTime() === tomorrow.getTime();
      } else if (activeCategoryName !== 'all') {
        matchesCategory = activeCategoryName === order.status;
      }

      const isOldFinishedOrder = order.status === 'finished' && loadDateOnly && loadDateOnly < today;
      return matchesSearch && matchesCategory && !isOldFinishedOrder;
    })
    .sort((left, right) => {
      const leftDate = new Date(String(left.loadDate ?? ''));
      const rightDate = new Date(String(right.loadDate ?? ''));
      return leftDate.getTime() - rightDate.getTime();
    });
}
