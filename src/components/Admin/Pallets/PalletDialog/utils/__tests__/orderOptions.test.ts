import { describe, expect, it } from 'vitest';
import { normalizeOrderOptions } from '../orderOptions';

describe('normalizeOrderOptions', () => {
  it('keeps value/label order options without rendering undefined', () => {
    expect(
      normalizeOrderOptions([
        { value: 12, label: 'Pedido #00012 — Cliente A' },
        { value: 12, label: 'Duplicado' },
        { value: null, label: 'Sin valor' },
      ])
    ).toEqual([{ value: '12', label: 'Pedido #00012 — Cliente A' }]);
  });

  it('supports the legacy id/name/load_date option shape', () => {
    const [option] = normalizeOrderOptions([{ id: 34, name: '00034', load_date: '2026-01-15' }]);

    expect(option.value).toBe('34');
    expect(option.label).toContain('#00034');
    expect(option.label).not.toContain('undefined');
  });
});
