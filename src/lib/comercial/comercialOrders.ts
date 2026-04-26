import { buildVisibleOrderCategories, filterAndSortOrders } from '@/lib/orders/orderListFilters';

type Category = {
  label: string;
  name: string;
  current?: boolean;
};

type CommercialOrder = Record<string, unknown> & {
  id: number | string;
  offerId?: unknown;
};

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
  return buildVisibleOrderCategories(enrichedOrders) as Category[];
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
  return filterAndSortOrders(enrichedOrders, { searchText, activeCategoryName });
}
