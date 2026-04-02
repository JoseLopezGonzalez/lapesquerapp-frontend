import { useState, useEffect, useCallback, useRef } from 'react'
import { isoToDate } from '@/helpers/production/dateFormatters'
import { getProcessId, getParentRecordId, getRecordNotes, getRecordField } from '@/helpers/production/recordHelpers'

/**
 * Hook para manejar el estado del formulario de record de producción
 */
export const useRecordFormData = (record, processes, isEditMode) => {
    const [formData, setFormData] = useState({
        process_id: 'none',
        parent_record_id: 'none',
        notes: '',
        started_at: '',
        finished_at: ''
    })

    /** Evita pisar el tipo de proceso cuando el mismo registro se refresca sin `process` en el snapshot (refetch intermedio). */
    const syncedRecordIdRef = useRef(null)

    // Inicializar formulario cuando se carga el record
    useEffect(() => {
        if (!record || !record.id || !isEditMode) {
            return
        }

        const recordId = record.id
        const isFirstSyncForThisRecord = syncedRecordIdRef.current !== recordId
        if (isFirstSyncForThisRecord) {
            syncedRecordIdRef.current = recordId
        }

        const processIdFromServer = getProcessId(record)

        const startedAt = getRecordField(record, 'startedAt')
        const finishedAt = getRecordField(record, 'finishedAt')
        const startedAtFormatted = startedAt ? isoToDate(startedAt) : ''
        const finishedAtFormatted = finishedAt ? isoToDate(finishedAt) : ''
        const parentRecordId = getParentRecordId(record)
        const notes = getRecordNotes(record)

        setFormData((prev) => {
            let finalProcessId = 'none'

            if (processIdFromServer != null && processIdFromServer !== '') {
                if (processes.length > 0) {
                    const matchingProcess = processes.find((p) => {
                        const pValue = (p.value ?? p.id)?.toString()
                        const rValue = processIdFromServer?.toString()
                        return pValue && rValue && pValue === rValue
                    })
                    finalProcessId = matchingProcess
                        ? (matchingProcess.value ?? matchingProcess.id).toString()
                        : String(processIdFromServer)
                } else {
                    finalProcessId = String(processIdFromServer)
                }
            } else if (!isFirstSyncForThisRecord && prev.process_id !== 'none') {
                // Mismo registro, refetch sin proceso resuelto aún: no deseleccionar
                finalProcessId = prev.process_id
            }

            return {
                process_id: finalProcessId,
                parent_record_id: parentRecordId ? parentRecordId.toString() : 'none',
                notes: notes || '',
                started_at: startedAtFormatted,
                finished_at: finishedAtFormatted
            }
        })
    }, [record, processes, isEditMode])

    const updateFormData = useCallback((updates) => {
        setFormData(prev => ({ ...prev, ...updates }))
    }, [])

    const resetFormData = useCallback(() => {
        setFormData({
            process_id: 'none',
            parent_record_id: 'none',
            notes: '',
            started_at: '',
            finished_at: ''
        })
    }, [])

    return {
        formData,
        setFormData,
        updateFormData,
        resetFormData
    }
}

