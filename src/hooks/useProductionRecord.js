import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
    getProductionRecord,
    createProductionRecord,
    updateProductionRecord,
    getProductionRecords,
    getProduction
} from '@/services/productionService'
import { fetchWithTenant } from '@/lib/fetchWithTenant'
import { API_URL_V2 } from '@/configs/config'

/**
 * Hook personalizado para gestionar production records
 * @param {string|number} productionId - ID de la producción
 * @param {string|number|null} recordId - ID del record (null para crear nuevo)
 * @param {Function} onRefresh - Callback cuando se actualiza el record
 * @returns {object} - Estado y funciones del hook
 */
export function useProductionRecord(productionId, recordId = null, onRefresh = null) {
    const { data: session } = useSession()
    const token = session?.user?.accessToken

    const [record, setRecord] = useState(null)
    const [production, setProduction] = useState(null)
    const [processes, setProcesses] = useState([])
    const [existingRecords, setExistingRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const isEditMode = recordId !== null

    // Cargar procesos disponibles
    const loadProcesses = useCallback(async () => {
        if (!token) return
        
        try {
            const response = await fetchWithTenant(`${API_URL_V2}processes/options`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'User-Agent': navigator.userAgent,
                },
            })
            
            if (response.ok) {
                const data = await response.json()
                setProcesses(data.data || data || [])
            }
        } catch (err) {
            console.warn('No se pudieron cargar los tipos de proceso:', err)
            setProcesses([])
        }
    }, [token])

    // Cargar records existentes
    const loadExistingRecords = useCallback(async () => {
        if (!token || !productionId) return
        
        try {
            const response = await getProductionRecords(token, { production_id: productionId })
            setExistingRecords(response.data || [])
        } catch (err) {
            console.warn('Error loading existing records:', err)
            setExistingRecords([])
        }
    }, [token, productionId])

    // Cargar datos iniciales
    const loadInitialData = useCallback(async () => {
        if (!token || !productionId) return

        try {
            setLoading(true)
            setError(null)

            // Cargar información de la producción
            try {
                const productionData = await getProduction(productionId, token)
                setProduction(productionData)
            } catch (err) {
                console.warn('Error loading production data:', err)
            }

            // Cargar procesos y records en paralelo
            await Promise.all([
                loadProcesses(),
                loadExistingRecords()
            ])

            // Si es modo edición, cargar el record
            if (isEditMode && recordId) {
                try {
                    const recordData = await getProductionRecord(recordId, token)
                    setRecord(recordData)
                } catch (err) {
                    console.error('Error loading record:', err)
                    setError(err.message || 'Error al cargar el proceso')
                }
            }
        } catch (err) {
            console.error('Error loading data:', err)
            setError(err.message || 'Error al cargar los datos')
        } finally {
            setLoading(false)
        }
    }, [token, productionId, recordId, isEditMode, loadProcesses, loadExistingRecords])

    // Guardar record (crear o actualizar)
    const saveRecord = useCallback(async (formData) => {
        if (!token || !productionId) {
            throw new Error('Token o productionId no disponible')
        }

        // Validar que process_id sea obligatorio
        if (!formData.process_id || formData.process_id === 'none') {
            throw new Error('El tipo de proceso es obligatorio')
        }

        setSaving(true)
        setError(null)

        try {
            // Convertir started_at de datetime-local a ISO si existe
            let startedAtISO = null
            if (formData.started_at && formData.started_at.trim() !== '') {
                const localDate = new Date(formData.started_at)
                // Convertir a ISO string (YYYY-MM-DDTHH:mm:ssZ)
                startedAtISO = localDate.toISOString()
            }
            
            // Convertir finished_at de datetime-local a ISO si existe (solo en edición)
            let finishedAtISO = null
            if (isEditMode && formData.finished_at && formData.finished_at.trim() !== '') {
                const localDate = new Date(formData.finished_at)
                // Convertir a ISO string (YYYY-MM-DDTHH:mm:ssZ)
                finishedAtISO = localDate.toISOString()
            }
            
            const recordData = {
                production_id: parseInt(productionId),
                process_id: parseInt(formData.process_id),
                parent_record_id: formData.parent_record_id && formData.parent_record_id !== 'none' 
                    ? parseInt(formData.parent_record_id) 
                    : null,
                started_at: startedAtISO,
                ...(isEditMode && finishedAtISO !== null && { finished_at: finishedAtISO }),
                notes: formData.notes || null
            }

            let response
            if (isEditMode) {
                response = await updateProductionRecord(recordId, recordData, token)
                // Recargar el record actualizado
                const updatedRecord = await getProductionRecord(recordId, token)
                setRecord(updatedRecord)
            } else {
                response = await createProductionRecord(recordData, token)
                const createdRecordId = response?.data?.id || response?.id

                if (createdRecordId) {
                    const newRecord = await getProductionRecord(createdRecordId, token)
                    setRecord(newRecord)
                }
            }

            // Recargar records para actualizar el select de proceso padre
            await loadExistingRecords()

            // Llamar callback si existe
            if (onRefresh) {
                onRefresh()
            }

            return response
        } catch (err) {
            console.error('Error saving record:', err)
            const errorMessage = err.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el proceso`
            setError(errorMessage)
            throw err
        } finally {
            setSaving(false)
        }
    }, [token, productionId, recordId, isEditMode, loadExistingRecords, onRefresh])

    // Recargar datos
    const refresh = useCallback(() => {
        loadInitialData()
    }, [loadInitialData])

    // Efecto para cargar datos cuando cambian las dependencias
    useEffect(() => {
        if (token && productionId) {
            loadInitialData()
        }
    }, [token, productionId, recordId, loadInitialData])

    return {
        // Datos
        record,
        production,
        processes,
        existingRecords,
        
        // Estados
        loading,
        saving,
        error,
        isEditMode,
        
        // Funciones
        saveRecord,
        refresh,
        loadInitialData
    }
}

