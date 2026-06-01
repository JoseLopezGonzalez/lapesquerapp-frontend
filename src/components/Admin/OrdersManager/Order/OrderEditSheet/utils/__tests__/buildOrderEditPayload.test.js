import { describe, expect, it } from 'vitest';
import { buildOrderEditPayload } from '../buildOrderEditPayload';

describe('buildOrderEditPayload', () => {
  it('includes only dirty fields', () => {
    const payload = buildOrderEditPayload(
      {
        salesperson: '12',
        buyerReference: 'REF-1',
      },
      {
        buyerReference: true,
      }
    );

    expect(payload).toEqual({ buyerReference: 'REF-1' });
  });

  it('formats dirty date fields as API dates', () => {
    const payload = buildOrderEditPayload(
      {
        entryDate: new Date('2026-04-26T10:30:00Z'),
        loadDate: '2026-04-27',
      },
      {
        entryDate: true,
        loadDate: true,
      }
    );

    expect(payload).toEqual({
      entryDate: '2026-04-26',
      loadDate: '2026-04-27',
    });
  });

  it('normalizes fieldOperator to integer or null', () => {
    expect(buildOrderEditPayload({ fieldOperator: '42' }, { fieldOperator: true })).toEqual({
      fieldOperator: 42,
    });

    expect(buildOrderEditPayload({ fieldOperator: '' }, { fieldOperator: true })).toEqual({
      fieldOperator: null,
    });
  });
});
