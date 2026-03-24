'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
    createProductionRecord,
    getProductionRecord,
    getProductionRecordsOptions,
    updateProductionRecord
} from '@/services/productionService';
import { dateToIso } from '@/helpers/production/dateFormatters';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { productionQueryKeys } from '@/lib/routes/queryKeys';
import { useProduction } from '@/hooks/production/useProduction';
import { useProcessOptions } from '@/hooks/production/useProcessOptions';

/**
 * Hook personalizado para gestionar production records con React Query.
 * Mantiene la misma API que antes para ProductionRecordContext y ProductionRecordEditor.
 */
export function useProductionRecord(productionId, recordId = null, onRefresh = null) {
    const { data: session } = useSession();
    const token = session?.user?.accessToken;
    const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
    const queryClient = useQueryClient();
    const [activeRecordId, setActiveRecordId] = useState(recordId);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const { production, isLoading: productionLoading, refetch: refetchProduction } = useProduction(productionId);
    const { processes, isLoading: processesLoading } = useProcessOptions();

    const currentRecordId = activeRecordId ?? null;
    const recordDetailKey = productionQueryKeys.recordDetail(tenantId, currentRecordId);
    const recordOptionsKey = productionQueryKeys.recordOptions(tenantId, productionId, currentRecordId);
    const productionDetailKey = productionQueryKeys.detail(tenantId, productionId);
    const productionTotalsKey = productionQueryKeys.totals(tenantId, productionId);
    const productionProcessTreeKey = productionQueryKeys.processTree(tenantId, productionId);

    const recordQuery = useQuery({
        queryKey: recordDetailKey,
        queryFn: () => getProductionRecord(currentRecordId, token),
        enabled: !!token && !!currentRecordId,
        staleTime: 30 * 1000,
    });

    const existingRecordsQuery = useQuery({
        queryKey: recordOptionsKey,
        queryFn: () => getProductionRecordsOptions(token, productionId, currentRecordId),
        enabled: !!token && !!productionId,
    });

    const record = useMemo(() => recordQuery.data ?? null, [recordQuery.data]);
    const existingRecords = existingRecordsQuery.data ?? [];
    const isEditMode = currentRecordId !== null || (record?.id != null);

    const setRecord = useCallback((updater) => {
        const targetRecordId = activeRecordId ?? recordId ?? record?.id ?? null;
        if (!targetRecordId) return null;

        const targetKey = productionQueryKeys.recordDetail(tenantId, targetRecordId);
        queryClient.setQueryData(targetKey, (previous) =>
            typeof updater === 'function' ? updater(previous) : updater
        );

        if (targetRecordId !== activeRecordId) {
            setActiveRecordId(targetRecordId);
        }

        return queryClient.getQueryData(targetKey) ?? null;
    }, [activeRecordId, queryClient, record?.id, recordId, tenantId]);

    const saveMutation = useMutation({
        mutationFn: async ({ formData, isEdit }) => {
            const startedAtISO = dateToIso(formData.started_at);
            const finishedAtISO = dateToIso(formData.finished_at);
            const recordData = {
                production_id: parseInt(productionId),
                process_id: parseInt(formData.process_id),
                parent_record_id: formData.parent_record_id && formData.parent_record_id !== 'none'
                    ? parseInt(formData.parent_record_id)
                    : null,
                started_at: startedAtISO,
                ...(finishedAtISO !== null && { finished_at: finishedAtISO }),
                notes: formData.notes || null,
            };

            if (isEdit) {
                return updateProductionRecord(currentRecordId, recordData, token);
            }

            return createProductionRecord(recordData, token);
        },
        onSuccess: async (response, { isEdit }) => {
            setError(null);

            let nextRecordId = currentRecordId;
            let nextRecord = null;

            if (isEdit) {
                nextRecord = await getProductionRecord(currentRecordId, token);
            } else {
                const createdId = response?.data?.id ?? response?.id;
                if (createdId) {
                    nextRecordId = createdId;
                    setActiveRecordId(createdId);
                    nextRecord = await getProductionRecord(createdId, token);
                }
            }

            if (nextRecordId && nextRecord) {
                queryClient.setQueryData(
                    productionQueryKeys.recordDetail(tenantId, nextRecordId),
                    nextRecord
                );
            }

            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: productionQueryKeys.recordOptions(tenantId, productionId, nextRecordId),
                }),
                queryClient.invalidateQueries({ queryKey: productionDetailKey }),
                queryClient.invalidateQueries({ queryKey: productionTotalsKey }),
                queryClient.invalidateQueries({ queryKey: productionProcessTreeKey }),
            ]);

            if (onRefresh) onRefresh();
        },
        onError: (err) => {
            const action = currentRecordId ? 'actualizar' : 'crear';
            const msg = err?.userMessage ?? err?.data?.userMessage ?? err?.response?.data?.userMessage ?? err?.message ?? `Error al ${action} el proceso`;
            setError(msg);
        },
        onSettled: () => setSaving(false),
    });

    const saveRecord = useCallback(async (formData) => {
        if (!token || !productionId) throw new Error('Token o productionId no disponible');
        if (!formData.process_id || formData.process_id === 'none') throw new Error('El tipo de proceso es obligatorio');

        setSaving(true);
        setError(null);

        try {
            return await saveMutation.mutateAsync({
                formData,
                isEdit: !!currentRecordId,
            });
        } catch (e) {
            setSaving(false);
            throw e;
        }
    }, [token, productionId, currentRecordId, saveMutation]);

    const refresh = useCallback(() => {
        refetchProduction();
        if (currentRecordId) {
            recordQuery.refetch();
        }
        existingRecordsQuery.refetch();
    }, [currentRecordId, existingRecordsQuery, recordQuery, refetchProduction]);

    const loadInitialData = useCallback(() => {
        refetchProduction();
        if (currentRecordId) {
            recordQuery.refetch();
        }
        existingRecordsQuery.refetch();
    }, [currentRecordId, existingRecordsQuery, recordQuery, refetchProduction]);

    const loading = productionLoading || processesLoading || (!!currentRecordId && recordQuery.isLoading) || existingRecordsQuery.isLoading;

    return {
        record,
        production,
        processes: processes ?? [],
        existingRecords,
        loading,
        saving,
        error,
        isEditMode,
        saveRecord,
        refresh,
        loadInitialData,
        setRecord,
    };
}
