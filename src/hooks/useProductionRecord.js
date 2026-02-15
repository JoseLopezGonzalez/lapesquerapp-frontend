'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
    getProductionRecord,
    createProductionRecord,
    updateProductionRecord,
    getProductionRecordsOptions,
    getProduction
} from '@/services/productionService';
import { dateToIso } from '@/helpers/production/dateFormatters';
import { useProduction } from '@/hooks/production/useProduction';
import { useProcessOptions } from '@/hooks/production/useProcessOptions';

/**
 * Hook personalizado para gestionar production records con React Query.
 * Mantiene la misma API que antes para ProductionRecordContext y ProductionRecordEditor.
 */
export function useProductionRecord(productionId, recordId = null, onRefresh = null) {
    const { data: session } = useSession();
    const token = session?.user?.accessToken;
    const queryClient = useQueryClient();

    const { production, isLoading: productionLoading, refetch: refetchProduction } = useProduction(productionId);
    const { processes, isLoading: processesLoading } = useProcessOptions();

    const [record, setRecord] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const isEditMode = recordId !== null || (record?.id != null);

    const recordQuery = useQuery({
        queryKey: ['productionRecords', recordId],
        queryFn: () => getProductionRecord(recordId, token),
        enabled: !!token && !!recordId,
    });

    const existingRecordsQuery = useQuery({
        queryKey: ['productionRecords', 'options', productionId, recordId ?? record?.id],
        queryFn: () => getProductionRecordsOptions(token, productionId, recordId || record?.id),
        enabled: !!token && !!productionId,
    });

    const existingRecords = existingRecordsQuery.data ?? [];

    useEffect(() => {
        if (recordId && recordQuery.data !== undefined) {
            setRecord(recordQuery.data);
        } else if (!recordId) {
            setRecord(null);
        }
    }, [recordId, recordQuery.data]);

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
                return updateProductionRecord(recordId, recordData, token);
            }
            return createProductionRecord(recordData, token);
        },
        onSuccess: async (response, { formData, isEdit }) => {
            setError(null);
            if (isEdit) {
                const updated = await getProductionRecord(recordId, token);
                setRecord(updated);
            } else {
                const createdId = response?.data?.id ?? response?.id;
                if (createdId) {
                    const newRecord = await getProductionRecord(createdId, token);
                    setRecord(newRecord);
                }
            }
            queryClient.invalidateQueries({ queryKey: ['productionRecords'] });
            queryClient.invalidateQueries({ queryKey: ['productions'] });
            if (onRefresh) onRefresh();
        },
        onError: (err) => {
            const msg = err?.userMessage ?? err?.data?.userMessage ?? err?.response?.data?.userMessage ?? err?.message ?? `Error al ${recordId ? 'actualizar' : 'crear'} el proceso`;
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
            await saveMutation.mutateAsync({
                formData,
                isEdit: !!recordId,
            });
        } catch (e) {
            setSaving(false);
            throw e;
        }
    }, [token, productionId, recordId, saveMutation]);

    const refresh = useCallback(() => {
        refetchProduction();
        recordQuery.refetch();
        existingRecordsQuery.refetch();
    }, [refetchProduction, recordQuery, existingRecordsQuery]);

    const loadInitialData = useCallback(() => {
        refetchProduction();
        recordQuery.refetch();
        existingRecordsQuery.refetch();
    }, [refetchProduction, recordQuery, existingRecordsQuery]);

    const loading = productionLoading || processesLoading || (!!recordId && recordQuery.isLoading) || existingRecordsQuery.isLoading;

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
