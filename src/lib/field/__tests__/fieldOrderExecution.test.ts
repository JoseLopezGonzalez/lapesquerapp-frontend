import { describe, expect, it } from 'vitest';
import {
  aggregateItemsFromBoxes,
  buildInitialItems,
  buildBoxesSyncPayload,
  buildPlannedAdjustmentsPayload,
  buildPlannedExtrasPayload,
  calculateServedItemsTotal,
  detectExtraProductIds,
  validateServedItems,
} from '@/lib/field/fieldOrderExecution';

describe('fieldOrderExecution helpers', () => {
  const order = {
    plannedProductDetails: [
      {
        id: 10,
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
    const items = [{ plannedProductDetailId: 10, productId: 1, productName: 'Merluza', boxesCount: 2, totalWeight: 22, unitPrice: 5, subtotal: 110, taxId: 4 }];

    expect(validateServedItems(items)).toBeNull();
    expect(calculateServedItemsTotal(items)).toBe(110);
    expect(buildBoxesSyncPayload([{ id: 7, productId: 1, lot: 'L-1', netWeight: 10, gs1128: 'GS1' }])).toEqual([
      { id: 7, productId: 1, lot: 'L-1', netWeight: 10, grossWeight: undefined, gs1128: 'GS1' },
    ]);
    expect(detectExtraProductIds([{ productId: 99, netWeight: 1 }], order)).toEqual([99]);
    expect(buildPlannedExtrasPayload([{ productId: 99, productName: 'Extra', boxesCount: 1, totalWeight: 1, unitPrice: 12, subtotal: 12, taxId: 2 }], [99])).toEqual([
      { productId: 99, unitPrice: 12, taxId: 2 },
    ]);
    expect(buildPlannedAdjustmentsPayload(items, order)).toEqual([]);
  });
});
