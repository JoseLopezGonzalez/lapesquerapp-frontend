'use client'

import React, { createContext, useContext, useCallback, useMemo } from 'react'
import { useProductionRecord } from '@/hooks/useProductionRecord'
import { getProductionRecord } from '@/services/productionService'
import { useSession } from 'next-auth/react'
import { getRecordField } from '@/helpers/production/recordHelpers'

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

    // Función para actualizar el record completo (después de cambios)
    const updateRecord = useCallback(async () => {
        const token = session?.user?.accessToken
        const currentRecordId = recordId || recordData.record?.id
        if (!token || !currentRecordId) return

        try {
            const updatedRecord = await getProductionRecord(currentRecordId, token)
            if (recordData.setRecord) {
                recordData.setRecord(updatedRecord)
            } else {
                // Si no está disponible setRecord, usar refresh
                recordData.refresh()
            }
            return updatedRecord
        } catch (err) {
            console.error('Error updating record:', err)
            throw err
        }
    }, [session?.user?.accessToken, recordId, recordData])

    // Funciones helper para obtener datos del record
    const recordInputs = useMemo(() => {
        if (!recordData.record) return []
        return getRecordField(recordData.record, 'inputs') || []
    }, [recordData.record])

    const recordOutputs = useMemo(() => {
        if (!recordData.record) return []
        return getRecordField(recordData.record, 'outputs') || []
    }, [recordData.record])

    const recordConsumptions = useMemo(() => {
        if (!recordData.record) return []
        return getRecordField(recordData.record, 'parentOutputConsumptions') || []
    }, [recordData.record])

    const hasParent = useMemo(() => {
        return !!(getRecordField(recordData.record, 'parentRecordId'))
    }, [recordData.record])

    // Función para actualizar inputs (actualización optimista)
    const updateInputs = useCallback(async (newInputs, shouldRefresh = false) => {
        const currentRecordId = recordId || recordData.record?.id
        if (!currentRecordId) return

        if (recordData.setRecord && recordData.record) {
            // Actualización optimista inmediata
            recordData.setRecord(prev => ({
                ...prev,
                inputs: newInputs
            }))
        }
        
        // Si se solicita, recargar el record completo del servidor
        if (shouldRefresh) {
            await updateRecord()
        }
    }, [recordData, recordId, updateRecord])

    // Función para actualizar outputs (actualización optimista)
    const updateOutputs = useCallback(async (newOutputs, shouldRefresh = false) => {
        const currentRecordId = recordId || recordData.record?.id
        if (!currentRecordId) return

        if (recordData.setRecord && recordData.record) {
            // Actualización optimista inmediata
            recordData.setRecord(prev => ({
                ...prev,
                outputs: newOutputs
            }))
        }
        
        // Si se solicita, recargar el record completo del servidor
        if (shouldRefresh) {
            await updateRecord()
        }
    }, [recordData, recordId, updateRecord])

    // Función para actualizar consumptions (actualización optimista)
    const updateConsumptions = useCallback(async (newConsumptions, shouldRefresh = false) => {
        const currentRecordId = recordId || recordData.record?.id
        if (!currentRecordId) return

        if (recordData.setRecord && recordData.record) {
            // Actualización optimista inmediata
            recordData.setRecord(prev => ({
                ...prev,
                parentOutputConsumptions: newConsumptions
            }))
        }
        
        // Si se solicita, recargar el record completo del servidor
        if (shouldRefresh) {
            await updateRecord()
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
