'use client'

import React, { createContext, useContext, useCallback, useMemo, useRef } from 'react'
import { useProductionRecord } from '@/hooks/useProductionRecord'
import { getProductionRecord } from '@/services/productionService'
import { useSession } from 'next-auth/react'
import { updateRecordWithCalculatedTotals } from '@/helpers/production/calculateTotals'

// Creamos el contexto
const ProductionRecordContext = createContext()

/**
 * Provider del contexto de Production Record
 * Envuelve useProductionRecord y proporciona funciones para actualizar estado compartido
 */
export function ProductionRecordProvider({ productionId, recordId = null, children, onRefresh = null }) {
    const { data: session } = useSession()
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
        setRecord
    } = useProductionRecord(productionId, recordId, onRefresh)

    // Referencia para guardar estado anterior (para rollback)
    const previousStateRef = useRef(null)

    // Función para actualizar el record completo (después de cambios)
    const updateRecord = useCallback(async () => {
        const token = session?.user?.accessToken
        const currentRecordId = recordId || record?.id
        if (!token || !currentRecordId) return

        try {
            // Guardar estado anterior para rollback
            previousStateRef.current = record
            
            const updatedRecord = await getProductionRecord(currentRecordId, token)
            // El record ya viene normalizado desde el servicio
            
            if (setRecord) {
                setRecord(updatedRecord)
            } else {
                // Si no está disponible setRecord, usar refresh
                refresh()
            }
            return updatedRecord
        } catch (err) {
            console.error('Error updating record:', err)
            // Rollback en caso de error
            if (previousStateRef.current && setRecord) {
                setRecord(previousStateRef.current)
            }
            throw err
        }
    }, [session?.user?.accessToken, recordId, record, setRecord, refresh])

    // Funciones helper para obtener datos del record (ahora normalizados)
    // El record ya viene normalizado desde el servicio, así que accedemos directamente
    const recordInputs = useMemo(() => {
        if (!record) return []
        return record.inputs || []
    }, [record])

    const recordOutputs = useMemo(() => {
        if (!record) return []
        return record.outputs || []
    }, [record])

    const recordConsumptions = useMemo(() => {
        if (!record) return []
        return record.parentOutputConsumptions || []
    }, [record])

    const hasParent = useMemo(() => {
        if (!record) return false
        return !!(record.parentRecordId)
    }, [record])

    const recordInputCostsSummary = useMemo(() => {
        if (!record) return null
        return record.inputCostsSummary || null
    }, [record])

    // Función para actualizar inputs (actualización optimista con cálculo local de totales y rollback)
    const updateInputs = useCallback(async (newInputs, shouldRefresh = false) => {
        const currentRecordId = recordId || record?.id
        if (!currentRecordId) return

        if (setRecord && record) {
            // Guardar estado anterior para rollback
            const previousRecord = record
            previousStateRef.current = previousRecord
            
            try {
                // Actualización optimista inmediata con cálculo local de totales
                setRecord(prev => {
                    const updatedRecord = {
                        ...prev,
                        inputs: newInputs
                    }
                    // Calcular totales localmente basándose en los nuevos inputs y outputs actuales
                    return updateRecordWithCalculatedTotals(
                        updatedRecord,
                        newInputs,
                        prev.parentOutputConsumptions || [],
                        prev.outputs || []
                    )
                })
                
                // Si se solicita, recargar el record completo del servidor en segundo plano (solo para validación)
                if (shouldRefresh) {
                    // Recargar en segundo plano sin bloquear la UI
                    updateRecord().catch(err => {
                        console.warn('Error refreshing record after inputs update:', err)
                        // Rollback en caso de error
                        if (previousStateRef.current && setRecord) {
                            setRecord(previousStateRef.current)
                        }
                    })
                }
            } catch (err) {
                // Rollback en caso de error
                if (previousStateRef.current && setRecord) {
                    setRecord(previousStateRef.current)
                }
                throw err
            }
        }
    }, [recordId, record, setRecord, updateRecord])

    // Función para actualizar outputs (actualización optimista con cálculo local de totales y rollback)
    const updateOutputs = useCallback(async (newOutputs, shouldRefresh = false) => {
        const currentRecordId = recordId || record?.id
        if (!currentRecordId) return

        if (setRecord && record) {
            // Guardar estado anterior para rollback
            const previousRecord = record
            previousStateRef.current = previousRecord
            
            try {
                // Actualización optimista inmediata con cálculo local de totales
                setRecord(prev => {
                    const updatedRecord = {
                        ...prev,
                        outputs: newOutputs
                    }
                    // Calcular totales localmente basándose en los inputs y consumos actuales y los nuevos outputs
                    return updateRecordWithCalculatedTotals(
                        updatedRecord,
                        prev.inputs || [],
                        prev.parentOutputConsumptions || [],
                        newOutputs
                    )
                })
                
                // Si se solicita, recargar el record completo del servidor en segundo plano (solo para validación)
                if (shouldRefresh) {
                    // Recargar en segundo plano sin bloquear la UI
                    updateRecord().catch(err => {
                        console.warn('Error refreshing record after outputs update:', err)
                        // Rollback en caso de error
                        if (previousStateRef.current && setRecord) {
                            setRecord(previousStateRef.current)
                        }
                    })
                }
            } catch (err) {
                // Rollback en caso de error
                if (previousStateRef.current && setRecord) {
                    setRecord(previousStateRef.current)
                }
                throw err
            }
        }
    }, [recordId, record, setRecord, updateRecord])

    // Función para actualizar consumptions (actualización optimista con rollback)
    // Los consumos del proceso padre sí afectan los totales de entrada del record
    const updateConsumptions = useCallback(async (newConsumptions, shouldRefresh = false) => {
        const currentRecordId = recordId || record?.id
        if (!currentRecordId) return

        if (setRecord && record) {
            // Guardar estado anterior para rollback
            const previousRecord = record
            previousStateRef.current = previousRecord
            
            try {
                // Actualización optimista inmediata con recálculo de totales
                setRecord(prev => {
                    const updatedRecord = {
                        ...prev,
                        parentOutputConsumptions: newConsumptions
                    }

                    return updateRecordWithCalculatedTotals(
                        updatedRecord,
                        prev.inputs || [],
                        newConsumptions,
                        prev.outputs || []
                    )
                })
                
                // Si se solicita, recargar el record completo del servidor en segundo plano (solo para validación)
                if (shouldRefresh) {
                    // Recargar en segundo plano sin bloquear la UI
                    updateRecord().catch(err => {
                        console.warn('Error refreshing record after consumptions update:', err)
                        // Rollback en caso de error
                        if (previousStateRef.current && setRecord) {
                            setRecord(previousStateRef.current)
                        }
                    })
                }
            } catch (err) {
                // Rollback en caso de error
                if (previousStateRef.current && setRecord) {
                    setRecord(previousStateRef.current)
                }
                throw err
            }
        }
    }, [recordId, record, setRecord, updateRecord])

    const recordDataSlice = useMemo(() => ({
        record,
        production,
        processes,
        existingRecords,
        isEditMode,
        recordInputs,
        recordOutputs,
        recordConsumptions,
        hasParent,
        recordInputCostsSummary
    }), [
        record,
        production,
        processes,
        existingRecords,
        isEditMode,
        recordInputs,
        recordOutputs,
        recordConsumptions,
        hasParent,
        recordInputCostsSummary
    ])

    const recordStateSlice = useMemo(() => ({
        loading,
        saving,
        error,
        saveRecord,
        refresh,
        loadInitialData,
        updateRecord
    }), [
        loading,
        saving,
        error,
        saveRecord,
        refresh,
        loadInitialData,
        updateRecord
    ])

    const recordMutationsSlice = useMemo(() => ({
        setRecord,
        updateInputs,
        updateOutputs,
        updateConsumptions
    }), [
        setRecord,
        updateInputs,
        updateOutputs,
        updateConsumptions
    ])

    // Valor del contexto
    const contextValue = useMemo(() => ({
        ...recordDataSlice,
        ...recordStateSlice,
        ...recordMutationsSlice
    }), [
        recordDataSlice,
        recordStateSlice,
        recordMutationsSlice
    ])

    return (
        <ProductionRecordContext.Provider value={contextValue}>
            {children}
        </ProductionRecordContext.Provider>
    )
}

/**
 * Hook para consumir el contexto de Production Record
 * Debe usarse dentro de ProductionRecordProvider
 */
export function useProductionRecordContext() {
    const context = useContext(ProductionRecordContext)
    if (!context) {
        throw new Error('useProductionRecordContext must be used within a ProductionRecordProvider')
    }
    return context
}

/**
 * Hook opcional para consumir el contexto de Production Record
 * Retorna null si el contexto no está disponible (útil para componentes que pueden funcionar sin contexto)
 */
export function useProductionRecordContextOptional() {
    return useContext(ProductionRecordContext)
}
