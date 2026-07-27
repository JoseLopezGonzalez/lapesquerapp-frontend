'use client';

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useProductionRecord } from '@/hooks/useProductionRecord';
import { getProductionRecord } from '@/services/productionService';
import { updateRecordWithCalculatedTotals } from '@/helpers/production/calculateTotals';
import { useSession } from 'next-auth/react';

const ProductionRecordContext = createContext();

export function ProductionRecordProvider({
  productionId,
  recordId = null,
  children,
  onRefresh = null,
}) {
  const { data: session } = useSession();
  const {
    record,
    production,
    processes,
    existingRecords,
    loading,
    saving,
    error,
    isEditMode,
    saveRecord,
    refresh,
    loadInitialData,
    setRecord,
  } = useProductionRecord(productionId, recordId, onRefresh);

  // Recarga el record completo desde el servidor y actualiza el estado
  const updateRecord = useCallback(async () => {
    const token = session?.user?.accessToken;
    const currentRecordId = recordId || record?.id;
    if (!token || !currentRecordId) return;

    try {
      const updatedRecord = await getProductionRecord(currentRecordId, token);
      if (setRecord) {
        setRecord(updatedRecord);
      } else {
        refresh();
      }
      return updatedRecord;
    } catch (err) {
      console.error('Error updating record:', err);
      throw err;
    }
  }, [session?.user?.accessToken, recordId, record?.id, setRecord, refresh]);

  const recordInputs = useMemo(() => record?.inputs || [], [record]);
  const recordOutputs = useMemo(() => record?.outputs || [], [record]);
  const recordConsumptions = useMemo(() => record?.parentOutputConsumptions || [], [record]);
  const hasParent = useMemo(() => !!record?.parentRecordId, [record]);
  const recordInputCostsSummary = useMemo(() => record?.inputCostsSummary || null, [record]);

  const updateInputs = useCallback(
    async (newInputs, shouldRefresh = false) => {
      if (setRecord) {
        // Recalcula totales/merma localmente para no depender de un refetch completo
        // (ver PL sobre useProductionOutputsManager.processTransformationFactor quedando obsoleto).
        setRecord((prev) =>
          updateRecordWithCalculatedTotals({ ...prev, inputs: newInputs }, newInputs)
        );
      }
      if (shouldRefresh) {
        await updateRecord();
      }
    },
    [setRecord, updateRecord]
  );

  const updateOutputs = useCallback(
    async (newOutputs, shouldRefresh = false) => {
      if (setRecord) {
        setRecord((prev) =>
          updateRecordWithCalculatedTotals({ ...prev, outputs: newOutputs }, null, null, newOutputs)
        );
      }
      if (shouldRefresh) {
        await updateRecord();
      }
    },
    [setRecord, updateRecord]
  );

  const updateConsumptions = useCallback(
    async (newConsumptions, shouldRefresh = false) => {
      if (setRecord) {
        setRecord((prev) =>
          updateRecordWithCalculatedTotals(
            { ...prev, parentOutputConsumptions: newConsumptions },
            null,
            newConsumptions
          )
        );
      }
      if (shouldRefresh) {
        await updateRecord();
      }
    },
    [setRecord, updateRecord]
  );

  const recordDataSlice = useMemo(
    () => ({
      record,
      production,
      processes,
      existingRecords,
      isEditMode,
      recordInputs,
      recordOutputs,
      recordConsumptions,
      hasParent,
      recordInputCostsSummary,
    }),
    [
      record,
      production,
      processes,
      existingRecords,
      isEditMode,
      recordInputs,
      recordOutputs,
      recordConsumptions,
      hasParent,
      recordInputCostsSummary,
    ]
  );

  const recordStateSlice = useMemo(
    () => ({
      loading,
      saving,
      error,
      saveRecord,
      refresh,
      loadInitialData,
      updateRecord,
    }),
    [loading, saving, error, saveRecord, refresh, loadInitialData, updateRecord]
  );

  const recordMutationsSlice = useMemo(
    () => ({
      setRecord,
      updateInputs,
      updateOutputs,
      updateConsumptions,
    }),
    [setRecord, updateInputs, updateOutputs, updateConsumptions]
  );

  const contextValue = useMemo(
    () => ({
      ...recordDataSlice,
      ...recordStateSlice,
      ...recordMutationsSlice,
    }),
    [recordDataSlice, recordStateSlice, recordMutationsSlice]
  );

  return (
    <ProductionRecordContext.Provider value={contextValue}>
      {children}
    </ProductionRecordContext.Provider>
  );
}

export function useProductionRecordContext() {
  const context = useContext(ProductionRecordContext);
  if (!context) {
    throw new Error('useProductionRecordContext must be used within a ProductionRecordProvider');
  }
  return context;
}

export function useProductionRecordContextOptional() {
  return useContext(ProductionRecordContext);
}
