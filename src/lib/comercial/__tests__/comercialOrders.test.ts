import { describe, expect, it } from 'vitest';
import {
  buildVisibleCommercialOrderCategories,
  enrichOrdersWithOffers,
  filterAndSortCommercialOrders,
} from '@/lib/comercial/comercialOrders';

describe('comercialOrders helpers', () => {
  it('enriches orders with linked offers', () => {
    const orders = [{ id: 10 }, { id: 20, offerId: 7 }];
    const offers = [{ id: 99, orderId: 10 }];

    const enriched = enrichOrdersWithOffers(orders, offers);

    expect(enriched[0].offerId).toBe(99);
    expect(enriched[1].offerId).toBe(7);
  });

  it('builds visible categories according to today and tomorrow orders', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const categories = buildVisibleCommercialOrderCategories([
      { id: 1, loadDate: today.toISOString() },
      { id: 2, loadDate: tomorrow.toISOString() },
    ]);

    expect(categories.map((category) => category.name)).toEqual(['all', 'today', 'tomorrow', 'pending', 'finished']);
  });

  it('filters and sorts commercial orders with business rules', () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const oldFinished = new Date(now);
    oldFinished.setDate(oldFinished.getDate() - 3);
    const later = new Date(now);
    later.setDate(later.getDate() + 2);

    const filtered = filterAndSortCommercialOrders(
      [
        { id: 1, status: 'finished', loadDate: oldFinished.toISOString(), customer: { name: 'Viejo' } },
        { id: 2, status: 'pending', loadDate: later.toISOString(), customer: { name: 'Cliente B' } },
        { id: 3, status: 'pending', loadDate: now.toISOString(), customer: { name: 'Cliente A' } },
      ],
      { searchText: 'cliente', activeCategoryName: 'pending' }
    );

    expect(filtered.map((order) => order.id)).toEqual([3, 2]);
  });
});
