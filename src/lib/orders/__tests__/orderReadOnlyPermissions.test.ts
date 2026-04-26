import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_IN_PROGRESS_BLOCKED_ORDER_SECTIONS,
  getBlockedOrderSectionsForReadOnly,
  isOrderPalletsReadOnly,
  isReadOnlyOrderInProgress,
} from '@/lib/orders/orderReadOnlyPermissions';

describe('orderReadOnlyPermissions', () => {
  it('blocks sensitive sections for read-only in-progress orders', () => {
    expect(
      getBlockedOrderSectionsForReadOnly({ readOnly: true, status: 'pending' })
    ).toEqual(COMMERCIAL_IN_PROGRESS_BLOCKED_ORDER_SECTIONS);

    expect(isOrderPalletsReadOnly({ readOnly: true, status: 'pending' })).toBe(true);
    expect(isReadOnlyOrderInProgress({ readOnly: true, status: 'incident' })).toBe(true);
  });

  it('allows sensitive sections for finished read-only orders', () => {
    expect(
      getBlockedOrderSectionsForReadOnly({ readOnly: true, status: 'finished' })
    ).toEqual([]);

    expect(isOrderPalletsReadOnly({ readOnly: true, status: 'finished' })).toBe(false);
  });

  it('does not restrict mutable admin orders', () => {
    expect(
      getBlockedOrderSectionsForReadOnly({ readOnly: false, status: 'pending' })
    ).toEqual([]);

    expect(isOrderPalletsReadOnly({ readOnly: false, status: 'pending' })).toBe(false);
  });
});
