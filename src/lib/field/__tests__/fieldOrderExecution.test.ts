import { describe, expect, it } from 'vitest';
import {
  aggregateItemsFromBoxes,
  buildInitialItems,
  buildPlannedProductsPayload,
  calculateServedItemsTotal,
  validateServedItems,
} from '@/lib/field/fieldOrderExecution';

describe('fieldOrderExecution helpers', () => {
  const order = {
    plannedProductDetails: [
      {
        product: { id: 1, name: 'Merluza' },
        boxes: 2,
        quantity: 20,
        unitPrice: 5,
        tax: { id: 4 },
      },
    ],
  };

  it('builds initial items from planned product details', () => {
    expect(buildInitialItems(order)).toEqual([
      expect.objectContaining({
        productId: 1,
        productName: 'Merluza',
        boxesCount: 2,
        totalWeight: 20,
        unitPrice: 5,
        subtotal: 100,
      }),
    ]);
  });

  it('aggregates boxes into served items', () => {
    const items = aggregateItemsFromBoxes(
      [
        { productId: 1, productName: 'Merluza', netWeight: 10 },
        { productId: 1, productName: 'Merluza', netWeight: 12 },
      ],
      order
    );

    expect(items).toEqual([
      expect.objectContaining({
        productId: 1,
        boxesCount: 2,
        totalWeight: 22,
        subtotal: 110,
      }),
    ]);
  });

  it('validates served items and builds payload', () => {
    const items = [{ productId: 1, productName: 'Merluza', boxesCount: 2, totalWeight: 22, unitPrice: 5, subtotal: 110, tax: 4 }];

    expect(validateServedItems(items)).toBeNull();
    expect(calculateServedItemsTotal(items)).toBe(110);
    expect(buildPlannedProductsPayload(items)).toEqual([
      { product: 1, quantity: 22, boxes: 2, unitPrice: 5, tax: 4 },
    ]);
  });
});
