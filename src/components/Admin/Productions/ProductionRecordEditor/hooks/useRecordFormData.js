import { useState, useEffect, useCallback } from 'react'
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

    // Inicializar formulario cuando se carga el record
    useEffect(() => {
        if (!record || !record.id || !isEditMode) {
            return
        }

        // Determinar process_id usando helper que maneja ambos formatos
        const processId = getProcessId(record)
        
        // Buscar el proceso coincidente en la lista de procesos (si están disponibles)
        let finalProcessId = 'none'
        if (processes.length > 0 && processId) {
            const matchingProcess = processes.find(p => {
                const pValue = p.value?.toString()
                const rValue = processId?.toString()
                return pValue && rValue && pValue === rValue
            })
            
            finalProcessId = matchingProcess 
                ? matchingProcess.value.toString() 
                : processId.toString()
        } else if (processId) {
            // Si los procesos no están cargados aún, usar el ID directamente
            finalProcessId = processId.toString()
        }
        
        // Obtener fechas usando helper que maneja ambos formatos
        const startedAt = getRecordField(record, 'startedAt')
        const finishedAt = getRecordField(record, 'finishedAt')
        
        // Convertir fechas de ISO a date (solo fecha, sin hora)
        const startedAtFormatted = startedAt ? isoToDate(startedAt) : ''
        const finishedAtFormatted = finishedAt ? isoToDate(finishedAt) : ''
        
        // Obtener parent_record_id usando helper
        const parentRecordId = getParentRecordId(record)
        
        // Obtener notas usando helper
        const notes = getRecordNotes(record)
        
        setFormData({
            process_id: finalProcessId,
            parent_record_id: parentRecordId ? parentRecordId.toString() : 'none',
            notes: notes || '',
            started_at: startedAtFormatted,
            finished_at: finishedAtFormatted
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

