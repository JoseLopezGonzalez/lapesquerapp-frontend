/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOrderCreateFormConfig } from '@/hooks/useOrderCreateFormConfig';

const mockUseOrderFormOptions = vi.fn();

vi.mock('@/hooks/useOrderFormOptions', () => ({
  useOrderFormOptions: (...args: unknown[]) => mockUseOrderFormOptions(...args),
}));

function findField(
  formGroups: ReturnType<typeof useOrderCreateFormConfig>['formGroups'],
  groupName: string,
  fieldName: string
) {
  return formGroups.find((group) => group.group === groupName)?.fields.find(
    (field) => field.name === fieldName
  );
}

describe('useOrderCreateFormConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOrderFormOptions.mockReturnValue({
      options: {
        salespeople: [{ id: 1, name: 'Ana' }],
        fieldOperators: [{ id: 2, name: 'Luis' }],
        incoterms: [{ id: 3, name: 'FOB' }],
        paymentTerms: [{ id: 4, name: '30 días' }],
        transports: [{ id: 5, name: 'Transportes Rías' }],
        externalProcessors: [{ value: '6', label: 'Maquilador A' }],
        customers: [{ id: 7, name: 'Cliente A' }],
      },
      loading: false,
    });
  });

  it('requests customer options by calling useOrderFormOptions with includeCustomers: true', () => {
    renderHook(() => useOrderCreateFormConfig());

    expect(mockUseOrderFormOptions).toHaveBeenCalledWith({ includeCustomers: true });
  });

  it('injects customers, salespeople, transports and external processors into their fields', () => {
    const { result } = renderHook(() => useOrderCreateFormConfig());

    expect(findField(result.current.formGroups, 'Cliente', 'customer')?.options).toEqual([
      { value: '7', label: 'Cliente A' },
    ]);
    expect(findField(result.current.formGroups, 'Información Comercial', 'salesperson')?.options).toEqual([
      { value: '1', label: 'Ana' },
    ]);
    expect(findField(result.current.formGroups, 'Información Comercial', 'fieldOperator')?.options).toEqual([
      { value: '2', label: 'Luis' },
    ]);
    expect(findField(result.current.formGroups, 'Información Comercial', 'payment')?.options).toEqual([
      { value: '4', label: '30 días' },
    ]);
    expect(findField(result.current.formGroups, 'Información Comercial', 'incoterm')?.options).toEqual([
      { value: '3', label: 'FOB' },
    ]);
    expect(
      findField(result.current.formGroups, 'Información Comercial', 'externalProcessor')?.options
    ).toEqual([{ value: '6', label: 'Maquilador A' }]);
    expect(findField(result.current.formGroups, 'Transporte', 'transport')?.options).toEqual([
      { value: '5', label: 'Transportes Rías' },
    ]);
  });

  it('accepts value/label options from autocomplete endpoints without rendering undefined', () => {
    mockUseOrderFormOptions.mockReturnValue({
      options: {
        salespeople: [{ value: 1, label: 'Ana' }],
        fieldOperators: [{ value: 2, label: 'Luis' }],
        incoterms: [{ value: 3, label: 'FOB' }],
        paymentTerms: [{ value: 4, label: '30 días' }],
        transports: [{ value: 5, label: 'Transportes Rías' }],
        externalProcessors: [{ value: '6', label: 'Maquilador A' }],
        customers: [
          { value: 7, label: 'Cliente A' },
          { value: 7, label: 'Cliente A duplicado' },
          { value: null, label: 'Sin valor' },
        ],
      },
      loading: false,
    });

    const { result } = renderHook(() => useOrderCreateFormConfig());

    expect(findField(result.current.formGroups, 'Cliente', 'customer')?.options).toEqual([
      { value: '7', label: 'Cliente A' },
    ]);
    expect(findField(result.current.formGroups, 'Información Comercial', 'salesperson')?.options).toEqual([
      { value: '1', label: 'Ana' },
    ]);
    expect(findField(result.current.formGroups, 'Transporte', 'transport')?.options).toEqual([
      { value: '5', label: 'Transportes Rías' },
    ]);
  });

  it('returns today for both entryDate and loadDate defaults, and an empty plannedProducts list', () => {
    const { result } = renderHook(() => useOrderCreateFormConfig());

    expect(result.current.defaultValues.entryDate).toBeInstanceOf(Date);
    expect(result.current.defaultValues.loadDate).toBeInstanceOf(Date);
    expect(result.current.defaultValues.customer).toBe('');
    expect(result.current.defaultValues.plannedProducts).toEqual([]);
  });

  it('leaves unrelated groups (Fechas) untouched when options are empty', () => {
    mockUseOrderFormOptions.mockReturnValue({
      options: {
        salespeople: [],
        fieldOperators: [],
        incoterms: [],
        paymentTerms: [],
        transports: [],
        externalProcessors: [],
        customers: [],
      },
      loading: false,
    });

    const { result } = renderHook(() => useOrderCreateFormConfig());

    const fechasGroup = result.current.formGroups.find((group) => group.group === 'Fechas');
    expect(fechasGroup?.fields.map((field) => field.name)).toEqual(['entryDate', 'loadDate']);
  });
});
