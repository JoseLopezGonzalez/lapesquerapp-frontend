import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
    getProductionRecord,
    createProductionRecord,
    updateProductionRecord,
    getProductionRecordsOptions,
    getProduction
} from '@/services/productionService'
import { fetchWithTenant } from '@/lib/fetchWithTenant'
import { API_URL_V2 } from '@/configs/config'
import { dateToIso } from '@/helpers/production/dateFormatters'

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

    // isEditMode es true si hay un recordId inicial O si hay un record con ID (después de crear)
    const isEditMode = recordId !== null || (record?.id !== null && record?.id !== undefined)

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

    // Cargar records existentes en formato minimal (para select de proceso padre)
    const loadExistingRecords = useCallback(async () => {
        if (!token || !productionId) return
        
        try {
            // Usar recordId del parámetro o del record cargado
            const currentRecordId = recordId || (record?.id ? record.id : null)
            const records = await getProductionRecordsOptions(token, productionId, currentRecordId)
            setExistingRecords(records || [])
        } catch (err) {
            console.warn('Error loading existing records:', err)
            setExistingRecords([])
        }
    }, [token, productionId, recordId, record?.id])

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

            // Si es modo edición, cargar el record y datos relacionados en paralelo
            if (isEditMode && recordId) {
                try {
                    // Cargar record, procesos y existing records en paralelo para optimizar
                    const [recordData] = await Promise.all([
                        getProductionRecord(recordId, token),
                        loadProcesses() // Cargar procesos en paralelo
                    ])
                    setRecord(recordData)
                    
                    // Cargar existing records después de tener el record (para excluir el ID correcto)
                    // El endpoint ya excluye el record actual, así que solo necesita productionId
                    await loadExistingRecords()
                } catch (err) {
                    console.error('Error loading record:', err)
                    // Priorizar userMessage sobre message para mostrar errores en formato natural
                    const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al cargar el proceso';
                    setError(errorMessage)
                }
            } else {
                // Si es modo creación, cargar procesos y existing records en paralelo
                await Promise.all([
                    loadProcesses(),
                    loadExistingRecords()
                ])
            }
        } catch (err) {
            console.error('Error loading data:', err)
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al cargar los datos';
            setError(errorMessage)
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
            // Convertir fechas de date (YYYY-MM-DD) a ISO agregando hora por defecto (12:00:00)
            // La hora se agrega automáticamente en el backend, imperceptible para el usuario
            const startedAtISO = dateToIso(formData.started_at)
            const finishedAtISO = dateToIso(formData.finished_at)
            
            const recordData = {
                production_id: parseInt(productionId),
                process_id: parseInt(formData.process_id),
                parent_record_id: formData.parent_record_id && formData.parent_record_id !== 'none' 
                    ? parseInt(formData.parent_record_id) 
                    : null,
                started_at: startedAtISO,
                ...(finishedAtISO !== null && { finished_at: finishedAtISO }),
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
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el proceso`;
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

    // Función para actualizar el record directamente (para contexto)
    const setRecordDirect = useCallback((newRecord) => {
        setRecord(newRecord)
    }, [])

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
        loadInitialData,
        setRecord: setRecordDirect // Exponer setRecord para el contexto
    }
}

