'use client'

import React, { createContext, useContext, useCallback, useMemo, useRef } from 'react'
import { useProductionRecord } from '@/hooks/useProductionRecord'
import { getProductionRecord } from '@/services/productionService'
import { useSession } from 'next-auth/react'
import { normalizeProductionRecord } from '@/helpers/production/normalizers'
import { updateRecordWithCalculatedTotals } from '@/helpers/production/calculateTotals'

// Creamos el contexto
const ProductionRecordContext = createContext()

/**
 * Provider del contexto de Production Record
 * Envuelve useProductionRecord y proporciona funciones para actualizar estado compartido
 */
export function ProductionRecordProvider({ productionId, recordId = null, children, onRefresh = null }) {
    const { data: session } = useSession()
    
    // Usar el hook existente para gestionar el record
    const recordData = useProductionRecord(productionId, recordId, onRefresh)

    // Referencia para guardar estado anterior (para rollback)
    const previousStateRef = useRef(null)

    // Función para actualizar el record completo (después de cambios)
    const updateRecord = useCallback(async () => {
        const token = session?.user?.accessToken
        const currentRecordId = recordId || recordData.record?.id
        if (!token || !currentRecordId) return

        try {
            // Guardar estado anterior para rollback
            previousStateRef.current = recordData.record
            
            const updatedRecord = await getProductionRecord(currentRecordId, token)
            // El record ya viene normalizado desde el servicio
            
            if (recordData.setRecord) {
                recordData.setRecord(updatedRecord)
            } else {
                // Si no está disponible setRecord, usar refresh
                recordData.refresh()
            }
            return updatedRecord
        } catch (err) {
            console.error('Error updating record:', err)
            // Rollback en caso de error
            if (previousStateRef.current && recordData.setRecord) {
                recordData.setRecord(previousStateRef.current)
            }
            throw err
        }
    }, [session?.user?.accessToken, recordId, recordData])

    // Funciones helper para obtener datos del record (ahora normalizados)
    // El record ya viene normalizado desde el servicio, así que accedemos directamente
    const recordInputs = useMemo(() => {
        if (!recordData.record) return []
        return recordData.record.inputs || []
    }, [recordData.record])

    const recordOutputs = useMemo(() => {
        if (!recordData.record) return []
        return recordData.record.outputs || []
    }, [recordData.record])

    const recordConsumptions = useMemo(() => {
        if (!recordData.record) return []
        return recordData.record.parentOutputConsumptions || []
    }, [recordData.record])

    const hasParent = useMemo(() => {
        if (!recordData.record) return false
        return !!(recordData.record.parentRecordId)
    }, [recordData.record])

    // Función para actualizar inputs (actualización optimista con cálculo local de totales y rollback)
    const updateInputs = useCallback(async (newInputs, shouldRefresh = false) => {
        const currentRecordId = recordId || recordData.record?.id
        if (!currentRecordId) return

        if (recordData.setRecord && recordData.record) {
            // Guardar estado anterior para rollback
            const previousRecord = recordData.record
            previousStateRef.current = previousRecord
            
            try {
                // Actualización optimista inmediata con cálculo local de totales
                recordData.setRecord(prev => {
                    const updatedRecord = {
                        ...prev,
                        inputs: newInputs
                    }
                    // Calcular totales localmente basándose en los nuevos inputs y outputs actuales
                    return updateRecordWithCalculatedTotals(updatedRecord, newInputs, prev.outputs || [])
                })
                
                // Si se solicita, recargar el record completo del servidor en segundo plano (solo para validación)
                if (shouldRefresh) {
                    // Recargar en segundo plano sin bloquear la UI
                    updateRecord().catch(err => {
                        console.warn('Error refreshing record after inputs update:', err)
                        // Rollback en caso de error
                        if (previousStateRef.current && recordData.setRecord) {
                            recordData.setRecord(previousStateRef.current)
                        }
                    })
                }
            } catch (err) {
                // Rollback en caso de error
                if (previousStateRef.current && recordData.setRecord) {
                    recordData.setRecord(previousStateRef.current)
                }
                throw err
            }
        }
    }, [recordData, recordId, updateRecord])

    // Función para actualizar outputs (actualización optimista con cálculo local de totales y rollback)
    const updateOutputs = useCallback(async (newOutputs, shouldRefresh = false) => {
        const currentRecordId = recordId || recordData.record?.id
        if (!currentRecordId) return

        if (recordData.setRecord && recordData.record) {
            // Guardar estado anterior para rollback
            const previousRecord = recordData.record
            previousStateRef.current = previousRecord
            
            try {
                // Actualización optimista inmediata con cálculo local de totales
                recordData.setRecord(prev => {
                    const updatedRecord = {
                        ...prev,
                        outputs: newOutputs
                    }
                    // Calcular totales localmente basándose en los inputs actuales y los nuevos outputs
                    return updateRecordWithCalculatedTotals(updatedRecord, prev.inputs || [], newOutputs)
                })
                
                // Si se solicita, recargar el record completo del servidor en segundo plano (solo para validación)
                if (shouldRefresh) {
                    // Recargar en segundo plano sin bloquear la UI
                    updateRecord().catch(err => {
                        console.warn('Error refreshing record after outputs update:', err)
                        // Rollback en caso de error
                        if (previousStateRef.current && recordData.setRecord) {
                            recordData.setRecord(previousStateRef.current)
                        }
                    })
                }
            } catch (err) {
                // Rollback en caso de error
                if (previousStateRef.current && recordData.setRecord) {
                    recordData.setRecord(previousStateRef.current)
                }
                throw err
            }
        }
    }, [recordData, recordId, updateRecord])

    // Función para actualizar consumptions (actualización optimista con rollback)
    // Nota: Los consumptions no afectan los totales del record actual, solo se actualizan
    const updateConsumptions = useCallback(async (newConsumptions, shouldRefresh = false) => {
        const currentRecordId = recordId || recordData.record?.id
        if (!currentRecordId) return

        if (recordData.setRecord && recordData.record) {
            // Guardar estado anterior para rollback
            const previousRecord = recordData.record
            previousStateRef.current = previousRecord
            
            try {
                // Actualización optimista inmediata
                recordData.setRecord(prev => ({
                    ...prev,
                    parentOutputConsumptions: newConsumptions
                }))
                
                // Si se solicita, recargar el record completo del servidor en segundo plano (solo para validación)
                if (shouldRefresh) {
                    // Recargar en segundo plano sin bloquear la UI
                    updateRecord().catch(err => {
                        console.warn('Error refreshing record after consumptions update:', err)
                        // Rollback en caso de error
                        if (previousStateRef.current && recordData.setRecord) {
                            recordData.setRecord(previousStateRef.current)
                        }
                    })
                }
            } catch (err) {
                // Rollback en caso de error
                if (previousStateRef.current && recordData.setRecord) {
                    recordData.setRecord(previousStateRef.current)
                }
                throw err
            }
        }
    }, [recordData, recordId, updateRecord])

    // Valor del contexto
    const contextValue = useMemo(() => ({
        // Datos del hook original
        ...recordData,
        
        // Funciones adicionales para actualización
        updateRecord,
        updateInputs,
        updateOutputs,
        updateConsumptions,
        
        // Acceso directo a datos del record (helpers)
        recordInputs,
        recordOutputs,
        recordConsumptions,
        hasParent
    }), [
        recordData,
        updateRecord,
        updateInputs,
        updateOutputs,
        updateConsumptions,
        recordInputs,
        recordOutputs,
        recordConsumptions,
        hasParent
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
