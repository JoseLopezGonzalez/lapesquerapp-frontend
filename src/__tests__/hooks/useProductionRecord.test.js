/**
 * Tests for useProductionRecord hook
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProductionRecord } from '@/hooks/useProductionRecord';

const mockProduction = { id: 1, name: 'Producción' };
const mockProcesses = [{ id: 1, name: 'Proceso A' }];
const mockRecord = { id: 10, process_id: 1, started_at: '2025-01-01' };
const mockExistingRecords = [{ id: 10, process_id: 1 }];

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: { user: { accessToken: 'test-token' } } })),
}));

vi.mock('@/hooks/production/useProduction', () => ({
  useProduction: vi.fn(() => ({
    production: mockProduction,
    isLoading: false,
    refetch: vi.fn(),
  })),
}));

vi.mock('@/hooks/production/useProcessOptions', () => ({
  useProcessOptions: vi.fn(() => ({
    processes: mockProcesses,
    isLoading: false,
  })),
}));

vi.mock('@/services/productionService', () => ({
  getProductionRecord: vi.fn(),
  getProductionRecordsOptions: vi.fn(),
  createProductionRecord: vi.fn(),
  updateProductionRecord: vi.fn(),
}));

vi.mock('@/helpers/production/dateFormatters', () => ({
  dateToIso: vi.fn((d) => d),
}));

import {
  getProductionRecord,
  getProductionRecordsOptions,
  createProductionRecord,
  updateProductionRecord,
} from '@/services/productionService';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useProductionRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProductionRecordsOptions.mockResolvedValue(mockExistingRecords);
  });

  it('returns record, production, processes, existingRecords, loading, saveRecord, setRecord', async () => {
    const { result } = renderHook(
      () => useProductionRecord(1, null, null),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.production).toEqual(mockProduction);
    expect(result.current.processes).toEqual(mockProcesses);
    expect(result.current.existingRecords).toEqual(mockExistingRecords);
    expect(result.current.record).toBeNull();
    expect(typeof result.current.saveRecord).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
    expect(typeof result.current.loadInitialData).toBe('function');
    expect(typeof result.current.setRecord).toBe('function');
    expect(result.current.isEditMode).toBe(false);
    expect(getProductionRecordsOptions).toHaveBeenCalledWith('test-token', 1, undefined);
  });

  it('when recordId is set, fetches record and sets it', async () => {
    getProductionRecord.mockResolvedValue(mockRecord);

    const { result } = renderHook(
      () => useProductionRecord(1, 10, null),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.record).toEqual(mockRecord);
    });

    expect(getProductionRecord).toHaveBeenCalledWith(10, 'test-token');
    expect(result.current.isEditMode).toBe(true);
  });

  it('saveRecord calls createProductionRecord when not in edit mode', async () => {
    createProductionRecord.mockResolvedValue({ data: { id: 99 } });
    getProductionRecord.mockResolvedValue({ ...mockRecord, id: 99 });

    const { result } = renderHook(
      () => useProductionRecord(1, null, null),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.saveRecord({
        process_id: 1,
        started_at: '2025-01-01',
        finished_at: null,
        parent_record_id: 'none',
        notes: '',
      });
    });

    expect(createProductionRecord).toHaveBeenCalled();
    expect(updateProductionRecord).not.toHaveBeenCalled();
  });

  it('saveRecord calls updateProductionRecord when recordId is set', async () => {
    getProductionRecord.mockResolvedValue(mockRecord);
    updateProductionRecord.mockResolvedValue(mockRecord);

    const { result } = renderHook(
      () => useProductionRecord(1, 10, null),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.record).toEqual(mockRecord);
    });

    await act(async () => {
      await result.current.saveRecord({
        process_id: 1,
        started_at: '2025-01-01',
        finished_at: null,
        parent_record_id: 'none',
        notes: '',
      });
    });

    expect(updateProductionRecord).toHaveBeenCalledWith(10, expect.any(Object), 'test-token');
  });
});
