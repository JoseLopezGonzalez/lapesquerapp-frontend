/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOrderFormConfig } from '@/hooks/useOrderFormConfig';

const EMPTY_OPTIONS = {
  salespeople: [],
  fieldOperators: [],
  incoterms: [],
  paymentTerms: [],
  transports: [],
  externalProcessors: [],
  customers: [],
};

const mockUseOrderFormOptions = vi.fn();

vi.mock('@/hooks/useOrderFormOptions', () => ({
  useOrderFormOptions: () => mockUseOrderFormOptions(),
}));

describe('useOrderFormConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOrderFormOptions.mockReturnValue({ options: EMPTY_OPTIONS, loading: false });
  });

  it('maps orderData into defaultValues, normalizing dates, order type, and ids to string', () => {
    const { result } = renderHook(() =>
      useOrderFormConfig({
        orderData: {
          order_type: 'autoventa',
          entryDate: '2026-01-15',
          loadDate: '2026-01-16',
          salesperson: { id: 3 },
          paymentTerm: { id: 5 },
          incoterm: { id: 7 },
          transport: { id: 9 },
        },
      })
    );

    expect(result.current.defaultValues).toEqual(
      expect.objectContaining({
        orderType: 'autoventa',
        entryDate: new Date('2026-01-15'),
        loadDate: new Date('2026-01-16'),
        salesperson: '3',
        payment: '5',
        incoterm: '7',
        transport: '9',
      })
    );
  });

  it('defaults orderType to standard when neither orderType nor order_type is autoventa', () => {
    const { result } = renderHook(() => useOrderFormConfig({ orderData: { orderType: 'standard' } }));

    expect(result.current.defaultValues.orderType).toBe('standard');
  });

  it('returns the initial default values when orderData is not provided', () => {
    const { result } = renderHook(() => useOrderFormConfig({}));

    expect(result.current.defaultValues.orderType).toBe('standard');
    expect(result.current.defaultValues.salesperson).toBe('');
  });

  it('injects the current external processor when it is inactive and missing from options', () => {
    mockUseOrderFormOptions.mockReturnValue({
      options: { ...EMPTY_OPTIONS, externalProcessors: [{ value: '1', label: 'Maquilador Activo' }] },
      loading: false,
    });

    const { result } = renderHook(() =>
      useOrderFormConfig({
        orderData: {
          externalProcessor: { id: 99, name: 'Maquilador Inactivo', isActive: false },
        },
      })
    );

    const commercialGroup = result.current.formGroups.find(
      (group) => group.group === 'Información Comercial'
    );
    const externalProcessorField = commercialGroup?.fields.find(
      (field) => field.name === 'externalProcessor'
    );

    expect(externalProcessorField?.options).toEqual(
      expect.arrayContaining([{ value: '99', label: 'Maquilador Inactivo (inactivo)' }])
    );
  });

  it('does not duplicate the current external processor when it already exists in options', () => {
    mockUseOrderFormOptions.mockReturnValue({
      options: { ...EMPTY_OPTIONS, externalProcessors: [{ value: '99', label: 'Maquilador Activo' }] },
      loading: false,
    });

    const { result } = renderHook(() =>
      useOrderFormConfig({
        orderData: { externalProcessor: { id: 99, name: 'Maquilador Activo', isActive: true } },
      })
    );

    const commercialGroup = result.current.formGroups.find(
      (group) => group.group === 'Información Comercial'
    );
    const externalProcessorField = commercialGroup?.fields.find(
      (field) => field.name === 'externalProcessor'
    );

    expect(externalProcessorField?.options).toHaveLength(1);
    expect(externalProcessorField?.options?.[0]).toEqual({ value: '99', label: 'Maquilador Activo' });
  });
});
