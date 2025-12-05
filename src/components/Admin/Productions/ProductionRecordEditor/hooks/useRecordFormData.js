import { useState, useEffect, useCallback } from 'react'
import { isoToDateTimeLocal } from '@/helpers/production/dateFormatters'

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

    // Inicializar formulario cuando se carga el record
    useEffect(() => {
        if (record && record.id && isEditMode) {
            // Determinar process_id
            const processId = record.processId || record.process?.id || null
            const matchingProcess = processes.find(p => {
                const pValue = p.value?.toString()
                const rValue = processId?.toString()
                return pValue && rValue && pValue === rValue
            })
            
            const finalProcessId = matchingProcess 
                ? matchingProcess.value.toString() 
                : (processId ? processId.toString() : 'none')
            
            // Convertir fechas de ISO a datetime-local
            const startedAtFormatted = isoToDateTimeLocal(record.startedAt)
            const finishedAtFormatted = isoToDateTimeLocal(record.finishedAt)
            
            setFormData({
                process_id: finalProcessId,
                parent_record_id: record.parentRecordId ? record.parentRecordId.toString() : 'none',
                notes: record.notes || '',
                started_at: startedAtFormatted,
                finished_at: finishedAtFormatted
            })
        }
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

