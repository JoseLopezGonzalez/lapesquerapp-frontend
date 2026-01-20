/**
 * Hook compartido para manejar datos de producción (inputs, outputs, consumptions)
 * Elimina duplicación de código entre los diferentes managers
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Hook genérico para manejar datos de producción
 * @param {object} config - Configuración del hook
 * @param {Function} config.loadData - Función para cargar datos desde API
 * @param {Array} config.initialData - Datos iniciales (del contexto o props)
 * @param {Function} config.updateContext - Función para actualizar el contexto
 * @param {Function} config.updateRecord - Función para actualizar el record completo
 * @param {string|number} config.recordId - ID del record
 * @param {boolean} config.enabled - Si está habilitado (default: true)
 * @returns {object} - Estado y funciones del hook
 */
export const useProductionData = ({
    loadData,
    initialData = [],
    updateContext = null,
    updateRecord = null,
    recordId = null,
    enabled = true,
}) => {
    const { data: session } = useSession()
    const token = session?.user?.accessToken

    const [data, setData] = useState(initialData)
    const [loading, setLoading] = useState(initialData.length === 0 && enabled)
    const [error, setError] = useState(null)

    // Flags para prevenir cargas múltiples
    const hasInitializedRef = useRef(false)
    const previousDataIdsRef = useRef(null)

    // Crear una clave única basada en los IDs para comparación profunda
    const dataKey = useMemo(() => {
        if (!initialData || !Array.isArray(initialData) || initialData.length === 0) {
            return null
        }
        return initialData
            .map(item => item.id || JSON.stringify(item))
            .sort()
            .join(',')
    }, [initialData])

    // Efecto 1: Carga inicial (solo una vez)
    useEffect(() => {
        if (!enabled || hasInitializedRef.current) return
        if (!token || !recordId) return

        if (initialData && Array.isArray(initialData) && initialData.length > 0) {
            // Tenemos datos iniciales
            setData(initialData)
            setLoading(false)
            hasInitializedRef.current = true
            previousDataIdsRef.current = dataKey
            return
        }

        // No hay datos iniciales, cargar desde API
        loadDataFromApi().finally(() => {
            hasInitializedRef.current = true
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, recordId, enabled])

    // Efecto 2: Sincronizar con datos iniciales (solo cuando realmente cambian)
    useEffect(() => {
        if (!enabled || !hasInitializedRef.current) return

        if (!initialData || !Array.isArray(initialData) || initialData.length === 0) {
            if (data.length > 0) {
                setData([])
            }
            return
        }

        // Solo actualizar si realmente cambió el contenido
        if (dataKey !== previousDataIdsRef.current) {
            setData(initialData)
            if (initialData.length > 0) {
                setLoading(false)
            }
            previousDataIdsRef.current = dataKey
        }
    }, [dataKey, initialData, enabled, data.length])

    /**
     * Carga datos desde la API
     */
    const loadDataFromApi = useCallback(async (showLoading = true) => {
        if (!token || !recordId || !loadData) return

        try {
            if (showLoading) {
                setLoading(true)
            }
            setError(null)

            const response = await loadData(token, recordId)
            const newData = response.data || response || []

            setData(newData)
            return newData
        } catch (err) {
            console.error('Error loading data:', err)
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al cargar los datos';
            setError(errorMessage)
            return []
        } finally {
            if (showLoading) {
                setLoading(false)
            }
        }
    }, [token, recordId, loadData])

    /**
     * Actualiza los datos localmente y en el contexto
     */
    const updateData = useCallback(async (newData, shouldRefresh = false) => {
        // Actualizar estado local inmediatamente
        setData(newData)

        // Actualizar contexto si está disponible
        if (updateContext) {
            await updateContext(newData, shouldRefresh)
        } else if (updateRecord) {
            await updateRecord()
        }

        return newData
    }, [updateContext, updateRecord])

    /**
     * Recarga los datos desde el servidor
     */
    const refresh = useCallback(async () => {
        return await loadDataFromApi(true)
    }, [loadDataFromApi])

    /**
     * Recarga solo los datos sin mostrar loading
     */
    const refreshSilent = useCallback(async () => {
        return await loadDataFromApi(false)
    }, [loadDataFromApi])

    return {
        data,
        loading,
        error,
        setData,
        updateData,
        refresh,
        refreshSilent,
        loadDataFromApi,
    }
}

