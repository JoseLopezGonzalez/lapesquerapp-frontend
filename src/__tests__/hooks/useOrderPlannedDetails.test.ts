/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { parseTaxRate, useOrderPlannedDetails } from '@/hooks/orders/useOrderPlannedDetails';

describe('parseTaxRate', () => {
  it('keeps legitimate zero percent tax distinct from invalid fallbacks', () => {
    expect(parseTaxRate(0)).toBe(0);
    expect(parseTaxRate('0%')).toBe(0);
  });

  it('returns null for missing or non parseable tax rates', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(parseTaxRate(null)).toBeNull();
    expect(parseTaxRate('sin IVA cargado')).toBeNull();

    warnSpy.mockRestore();
  });

  it('rejects negative tax rates', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(parseTaxRate(-4)).toBeNull();
    expect(parseTaxRate('-10%')).toBeNull();

    warnSpy.mockRestore();
  });
});

describe('useOrderPlannedDetails', () => {
  it('normalizes initially loaded planned details without falling back invalid tax rates to zero', () => {
    const { result } = renderHook(() =>
      useOrderPlannedDetails({
        order: {
          id: 1,
          plannedProductDetails: [
            { id: 1, product: { id: 10, name: 'Merluza' }, tax: { id: 2, rate: '-4%' } },
            { id: 2, product: { id: 11, name: 'Rape' }, tax: { id: 3, rate: '0%' } },
          ],
        } as never,
        productOptions: [],
        taxOptions: [],
        onOrderUpdate: vi.fn(),
      })
    );

    expect(result.current.plannedProductDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, tax: { id: 2, rate: null } }),
        expect.objectContaining({ id: 2, tax: { id: 3, rate: 0 } }),
      ])
    );
  });

  it('keeps an unmatched missing tax rate as pending instead of zero percent', () => {
    const { result } = renderHook(() =>
      useOrderPlannedDetails({
        order: {
          id: 1,
          plannedProductDetails: [
            { id: 1, product: { id: 10, name: 'Merluza' }, tax: { id: 999 } },
          ],
        } as never,
        productOptions: [],
        taxOptions: [{ value: 2, label: '10%' }],
        onOrderUpdate: vi.fn(),
      })
    );

    expect(result.current.plannedProductDetails).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 1, tax: { id: 999, rate: null } })])
    );
  });
});
