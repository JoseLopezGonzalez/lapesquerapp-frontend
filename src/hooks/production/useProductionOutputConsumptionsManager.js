'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
    getProductionRecord,
    getAvailableOutputs,
    getProductionOutputConsumptions,
    createProductionOutputConsumption,
    updateProductionOutputConsumption,
    deleteProductionOutputConsumption,
    syncProductionOutputConsumptions
} from '@/services/productionService'
import { getProductOptions } from '@/services/productService'
import {
    formatNumber,
    getOutputId,
    getConsumedWeight,
    getConsumedBoxes,
    getProductName
} from '@/helpers/production/formatters'
import { useProductionRecordContextOptional } from '@/context/ProductionRecordContext'

/**
 * Hook con toda la lógica de ProductionOutputConsumptionsManager: estado, carga de consumptions/outputs/products,
 * diálogos (agregar consumo, gestión múltiple), crear/editar/eliminar/sincronizar consumptions.
 * @param {{ productionRecordId: number, initialConsumptionsProp?: array, hasParent?: boolean, onRefresh?: function }} options
 */
export function useProductionOutputConsumptionsManager({
    productionRecordId,
    initialConsumptionsProp = [],
    hasParent: hasParentProp = false,
    onRefresh
}) {
    const { data: session } = useSession()
    const contextData = useProductionRecordContextOptional()
    const contextConsumptions = contextData?.recordConsumptions || []
    const contextHasParent = contextData?.hasParent ?? hasParentProp
    const initialConsumptions = contextConsumptions.length > 0 ? contextConsumptions : initialConsumptionsProp
    const hasParent = contextHasParent
    const updateConsumptions = contextData?.updateConsumptions
    const updateRecord = contextData?.updateRecord

    const [consumptions, setConsumptions] = useState(initialConsumptions)
    const [availableOutputs, setAvailableOutputs] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(
        !hasParent || initialConsumptions.length === 0 ? false : true
    )
    const [error, setError] = useState(null)
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [savingConsumption, setSavingConsumption] = useState(false)
    const [loadingAvailableOutputs, setLoadingAvailableOutputs] = useState(false)
    const [formData, setFormData] = useState({
        production_output_id: '',
        consumed_weight_kg: '',
        consumed_boxes: '',
        notes: ''
    })
    const [manageDialogOpen, setManageDialogOpen] = useState(false)
    const [editableConsumptions, setEditableConsumptions] = useState([])
    const [newConsumptionRows, setNewConsumptionRows] = useState([])
    const [savingAll, setSavingAll] = useState(false)
    const [addingFromParent, setAddingFromParent] = useState(false)
    const [showBoxes, setShowBoxes] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('production_show_boxes')
            return saved !== null ? saved === 'true' : true
        }
        return true
    })

    const hasInitializedRef = useRef(false)
    const previousConsumptionsIdsRef = useRef(null)
    const previousHasParentRef = useRef(hasParent)

    const consumptionsKey = useMemo(() => {
        if (!hasParent) return 'no-parent'
        const current =
            contextConsumptions.length > 0 ? contextConsumptions : initialConsumptionsProp
        if (!current || current.length === 0) return 'empty'
        return current.map((c) => c.id || JSON.stringify(c)).sort().join(',')
    }, [contextConsumptions, initialConsumptionsProp, hasParent])

    useEffect(() => {
        if (hasInitializedRef.current) return
        if (!session?.user?.accessToken || !productionRecordId) return
        if (!hasParent) {
            setConsumptions([])
            setLoading(false)
            hasInitializedRef.current = true
            previousHasParentRef.current = hasParent
            loadProducts()
            return
        }
        const current =
            contextConsumptions.length > 0 ? contextConsumptions : initialConsumptionsProp
        if (current && Array.isArray(current) && current.length > 0) {
            setConsumptions(current)
            setLoading(false)
            hasInitializedRef.current = true
            previousConsumptionsIdsRef.current = consumptionsKey
            previousHasParentRef.current = hasParent
            loadProducts()
            return
        }
        loadData().finally(() => {
            hasInitializedRef.current = true
            previousHasParentRef.current = hasParent
        })
        loadProducts()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.accessToken, productionRecordId])

    useEffect(() => {
        if (!hasInitializedRef.current) return
        if (hasParent !== previousHasParentRef.current) {
            if (!hasParent) {
                setConsumptions([])
                setLoading(false)
            } else {
                const current =
                    contextConsumptions.length > 0 ? contextConsumptions : initialConsumptionsProp
                if (current && current.length > 0) {
                    setConsumptions(current)
                    setLoading(false)
                } else {
                    loadData()
                }
            }
            previousHasParentRef.current = hasParent
            previousConsumptionsIdsRef.current = consumptionsKey
            return
        }
        if (!hasParent) return
        const current =
            contextConsumptions.length > 0 ? contextConsumptions : initialConsumptionsProp
        if (!current || !Array.isArray(current)) {
            if (consumptions.length > 0) setConsumptions([])
            return
        }
        if (consumptionsKey !== previousConsumptionsIdsRef.current) {
            setConsumptions(current)
            setLoading(false)
            previousConsumptionsIdsRef.current = consumptionsKey
        }
    }, [consumptionsKey, contextConsumptions, initialConsumptionsProp, hasParent, consumptions.length])

    const handleToggleBoxes = (checked) => {
        setShowBoxes(checked)
        if (typeof window !== 'undefined') {
            localStorage.setItem('production_show_boxes', checked.toString())
        }
    }

    const loadConsumptionsOnly = async () => {
        try {
            const token = session?.user?.accessToken
            if (!token) return []
            const consumptionsResponse = await getProductionOutputConsumptions(token, {
                production_record_id: productionRecordId
            })
            const updatedConsumptions = consumptionsResponse.data || []
            setConsumptions(updatedConsumptions)
            if (updateConsumptions) await updateConsumptions(updatedConsumptions, false)
            else if (updateRecord) await updateRecord()
            return updatedConsumptions
        } catch (consumptionErr) {
            console.warn('Error loading consumptions:', consumptionErr)
            try {
                const token = session?.user?.accessToken
                if (!token) return []
                const record = await getProductionRecord(productionRecordId, token)
                if (record.parentOutputConsumptions) {
                    const updatedConsumptions = record.parentOutputConsumptions
                    setConsumptions(updatedConsumptions)
                    if (updateConsumptions) await updateConsumptions(updatedConsumptions, false)
                    return updatedConsumptions
                }
            } catch (err) {
                setConsumptions([])
                return []
            }
            return []
        }
    }

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)
            const token = session?.user?.accessToken
            if (!token) return
            if (initialConsumptions.length > 0) {
                setConsumptions(initialConsumptions)
                setLoading(false)
                return
            }
            if (!hasParent) {
                setConsumptions([])
                setLoading(false)
                return
            }
            try {
                const consumptionsResponse = await getProductionOutputConsumptions(token, {
                    production_record_id: productionRecordId
                })
                setConsumptions(consumptionsResponse.data || [])
            } catch (consumptionErr) {
                console.warn('Error loading consumptions:', consumptionErr)
                setConsumptions([])
            }
        } catch (err) {
            console.error('Error loading data:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al cargar los datos'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const loadProducts = async () => {
        try {
            const token = session?.user?.accessToken
            if (!token) return
            const response = await getProductOptions(token)
            const productsData = Array.isArray(response) ? response : (response.data || response || [])
            setProducts(productsData)
        } catch (err) {
            console.error('Error loading products:', err)
        }
    }

    const getProductNameById = (productId) => {
        if (!productId || !products.length) return null
        const product = products.find((p) => p.id?.toString() === productId.toString())
        return product?.name || null
    }

    const loadAvailableOutputs = async () => {
        if (!hasParent) {
            alert(
                'Este proceso no tiene un proceso padre. Selecciona un proceso padre en el formulario primero.'
            )
            return []
        }
        try {
            setLoadingAvailableOutputs(true)
            const token = session?.user?.accessToken
            if (!token) return []
            const response = await getAvailableOutputs(productionRecordId, token)
            const outputs = Array.isArray(response) ? response : (response?.data || response || [])
            const enrichedOutputs = outputs.map((output) => {
                if (output.output?.product?.name) return output
                const productName = getProductNameById(output.output?.productId)
                return {
                    ...output,
                    output: {
                        ...output.output,
                        product: productName ? { name: productName } : (output.output?.product || null)
                    }
                }
            })
            setAvailableOutputs(enrichedOutputs)
            return enrichedOutputs
        } catch (err) {
            console.error('Error loading available outputs:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al cargar los outputs disponibles'
            alert(errorMessage)
            setAvailableOutputs([])
            return []
        } finally {
            setLoadingAvailableOutputs(false)
        }
    }

    const handleOpenDialog = async () => {
        if (products.length === 0) await loadProducts()
        await loadAvailableOutputs()
        setAddDialogOpen(true)
        if (consumptions.length > 0) {
            const existingConsumption = consumptions[0]
            const outputId =
                existingConsumption.productionOutputId || existingConsumption.production_output_id
            const weight =
                existingConsumption.consumedWeightKg || existingConsumption.consumed_weight_kg
            const boxes =
                existingConsumption.consumedBoxes || existingConsumption.consumed_boxes
            setFormData({
                production_output_id: outputId?.toString() || '',
                consumed_weight_kg: weight?.toString() || '',
                consumed_boxes: boxes?.toString() || '',
                notes: existingConsumption.notes || ''
            })
        } else {
            setFormData({
                production_output_id: '',
                consumed_weight_kg: '',
                consumed_boxes: '',
                notes: ''
            })
        }
    }

    const handleSaveConsumption = async () => {
        if (!formData.production_output_id) {
            alert('Por favor selecciona un output')
            return
        }
        const weight = parseFloat(formData.consumed_weight_kg)
        if (isNaN(weight) || weight <= 0) {
            alert('Por favor ingresa un peso válido mayor a 0')
            return
        }
        const selectedOutput = availableOutputs.find(
            (o) => o.output.id.toString() === formData.production_output_id
        )
        if (!selectedOutput) {
            alert('Output seleccionado no encontrado')
            return
        }
        const existingConsumption = consumptions.find((c) => {
            const cOutputId = getOutputId(c)
            return cOutputId?.toString() === formData.production_output_id
        })
        const originalWeight = existingConsumption ? getConsumedWeight(existingConsumption) : 0
        const originalBoxes = existingConsumption ? getConsumedBoxes(existingConsumption) : 0
        const adjustedAvailableWeight =
            parseFloat(selectedOutput.availableWeight || 0) + originalWeight
        const adjustedAvailableBoxes = (selectedOutput.availableBoxes || 0) + originalBoxes
        if (weight > adjustedAvailableWeight) {
            alert(`Solo hay ${formatNumber(adjustedAvailableWeight)}kg disponible`)
            return
        }
        const boxes = formData.consumed_boxes ? parseInt(formData.consumed_boxes) : undefined
        if (boxes !== undefined && boxes > adjustedAvailableBoxes) {
            alert(`Solo hay ${adjustedAvailableBoxes} cajas disponibles`)
            return
        }
        try {
            setSavingConsumption(true)
            const token = session?.user?.accessToken
            if (!token) return
            const consumptionData = {
                production_record_id: parseInt(productionRecordId),
                production_output_id: parseInt(formData.production_output_id),
                consumed_weight_kg: weight,
                consumed_boxes: boxes,
                notes: formData.notes || undefined
            }
            const existing = consumptions.find((c) => {
                const cOutputId = getOutputId(c)
                return cOutputId?.toString() === formData.production_output_id
            })
            if (existing) {
                await updateProductionOutputConsumption(
                    existing.id,
                    {
                        consumed_weight_kg: weight,
                        consumed_boxes: boxes,
                        notes: formData.notes || undefined
                    },
                    token
                )
            } else {
                await createProductionOutputConsumption(consumptionData, token)
            }
            setAddDialogOpen(false)
            setFormData({
                production_output_id: '',
                consumed_weight_kg: '',
                consumed_boxes: '',
                notes: ''
            })
            await loadConsumptionsOnly()
        } catch (err) {
            console.error('Error saving consumption:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al guardar el consumo'
            alert(errorMessage)
        } finally {
            setSavingConsumption(false)
        }
    }

    const handleDeleteConsumption = async (consumptionId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este consumo del padre?')) return
        try {
            const token = session?.user?.accessToken
            if (!token) return
            await deleteProductionOutputConsumption(consumptionId, token)
            await loadConsumptionsOnly()
        } catch (err) {
            console.error('Error deleting consumption:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al eliminar el consumo'
            alert(errorMessage)
        }
    }

    const openManageDialog = async () => {
        if (!hasParent) {
            alert(
                'Este proceso no tiene un proceso padre. Selecciona un proceso padre en el formulario primero.'
            )
            return
        }
        if (products.length === 0) await loadProducts()
        await loadAvailableOutputs()
        setEditableConsumptions(
            consumptions.map((consumption) => {
                const outputId = getOutputId(consumption)
                const weight = getConsumedWeight(consumption)
                const boxes = getConsumedBoxes(consumption)
                const productName = getProductName(consumption.productionOutput)
                return {
                    id: consumption.id,
                    production_output_id: outputId?.toString() || '',
                    consumed_weight_kg: weight?.toString() || '',
                    consumed_boxes: boxes?.toString() || '',
                    notes: consumption.notes || '',
                    isNew: false,
                    originalWeight: weight,
                    originalBoxes: boxes,
                    productName: productName
                }
            })
        )
        setNewConsumptionRows([])
        setManageDialogOpen(true)
    }

    const addNewConsumptionRow = () => {
        setNewConsumptionRows((prev) => [
            ...prev,
            {
                id: `new-${Date.now()}`,
                production_output_id: '',
                consumed_weight_kg: '',
                consumed_boxes: '',
                notes: '',
                isNew: true
            }
        ])
    }

    const handleAddAllFromParent = async () => {
        if (!hasParent) {
            alert(
                'Este proceso no tiene un proceso padre. Selecciona un proceso padre en el formulario primero.'
            )
            return
        }
        try {
            setAddingFromParent(true)
            const loadedOutputs = await loadAvailableOutputs()
            if (!loadedOutputs || loadedOutputs.length === 0) {
                alert('No hay outputs disponibles del proceso padre.')
                return
            }
            const existingOutputIds = new Set()
            editableConsumptions.forEach((c) => {
                if (c.production_output_id) existingOutputIds.add(c.production_output_id.toString())
            })
            newConsumptionRows.forEach((row) => {
                if (row.production_output_id)
                    existingOutputIds.add(row.production_output_id.toString())
            })
            const outputsToAdd = loadedOutputs.filter((output) => {
                const outputId = output.output?.id?.toString()
                if (!outputId) return false
                if (existingOutputIds.has(outputId)) return false
                return parseFloat(output.availableWeight || 0) > 0
            })
            if (outputsToAdd.length === 0) {
                alert(
                    'Todos los outputs disponibles del proceso padre ya están añadidos o no tienen disponibilidad.'
                )
                return
            }
            const newRows = outputsToAdd.map((output, index) => {
                const outputId = output.output?.id
                const availableWeight = parseFloat(output.availableWeight || 0)
                const availableBoxes = output.availableBoxes || 0
                return {
                    id: `new-${Date.now()}-${index}-${outputId}`,
                    production_output_id: outputId?.toString() || '',
                    consumed_weight_kg: availableWeight > 0 ? availableWeight.toString() : '',
                    consumed_boxes: availableBoxes > 0 ? availableBoxes.toString() : '',
                    notes: '',
                    isNew: true
                }
            })
            setNewConsumptionRows((prev) => [...prev, ...newRows])
        } catch (err) {
            console.error('Error adding all lines from parent:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al añadir las líneas del proceso padre'
            alert(errorMessage)
        } finally {
            setAddingFromParent(false)
        }
    }

    const removeConsumptionRow = (id) => {
        if (id.toString().startsWith('new-')) {
            setNewConsumptionRows((prev) => prev.filter((row) => row.id !== id))
        } else {
            setEditableConsumptions((prev) => prev.filter((row) => row.id !== id))
        }
    }

    const updateConsumptionRow = (id, field, value) => {
        if (id.toString().startsWith('new-')) {
            setNewConsumptionRows((prev) =>
                prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
            )
        } else {
            setEditableConsumptions((prev) =>
                prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
            )
        }
    }

    const getAllConsumptionRows = () => [...editableConsumptions, ...newConsumptionRows]

    const handleSaveAllConsumptions = async () => {
        try {
            setSavingAll(true)
            const token = session?.user?.accessToken
            if (!token) return
            const allRows = getAllConsumptionRows()
            const validRows = allRows.filter(
                (row) =>
                    row.production_output_id &&
                    row.consumed_weight_kg &&
                    parseFloat(row.consumed_weight_kg || 0) > 0
            )
            if (validRows.length === 0) {
                alert('Debe haber al menos un consumo válido para guardar')
                setSavingAll(false)
                return
            }
            const allConsumptions = validRows.map((row) => {
                const weight = parseFloat(row.consumed_weight_kg)
                if (isNaN(weight) || weight <= 0) {
                    throw new Error('El peso debe ser mayor a 0 para el output seleccionado')
                }
                const consumption = {
                    production_output_id: parseInt(row.production_output_id),
                    consumed_weight_kg: weight
                }
                if (row.consumed_boxes && row.consumed_boxes.trim() !== '') {
                    const boxes = parseInt(row.consumed_boxes)
                    if (!isNaN(boxes) && boxes >= 0) consumption.consumed_boxes = boxes
                }
                if (row.notes && row.notes.trim() !== '') consumption.notes = row.notes.trim()
                if (row.id && !row.id.toString().startsWith('new-')) consumption.id = row.id
                return consumption
            })
            const newConsumptions = allConsumptions.filter((c) => !c.id)
            const existingConsumptions = allConsumptions.filter((c) => c.id)
            const existingIds = existingConsumptions.map((c) => c.id)
            const consumptionsToDelete = consumptions
                .filter((c) => !existingIds.includes(c.id))
                .map((c) => c.id)
            let response
            let useFallback = false
            try {
                response = await syncProductionOutputConsumptions(
                    productionRecordId,
                    { consumptions: allConsumptions },
                    token
                )
            } catch (syncError) {
                useFallback = true
            }
            if (useFallback) {
                try {
                    for (const consumption of newConsumptions) {
                        await createProductionOutputConsumption(
                            {
                                production_record_id: parseInt(productionRecordId),
                                production_output_id: consumption.production_output_id,
                                consumed_weight_kg: consumption.consumed_weight_kg,
                                consumed_boxes: consumption.consumed_boxes,
                                notes: consumption.notes
                            },
                            token
                        )
                    }
                    for (const consumption of existingConsumptions) {
                        await updateProductionOutputConsumption(
                            consumption.id,
                            {
                                consumed_weight_kg: consumption.consumed_weight_kg,
                                consumed_boxes: consumption.consumed_boxes,
                                notes: consumption.notes
                            },
                            token
                        )
                    }
                    for (const id of consumptionsToDelete) {
                        await deleteProductionOutputConsumption(id, token)
                    }
                    setEditableConsumptions([])
                    setNewConsumptionRows([])
                    setSavingAll(false)
                    setManageDialogOpen(false)
                    await loadConsumptionsOnly()
                    return
                } catch (fallbackError) {
                    throw fallbackError
                }
            }
            setEditableConsumptions([])
            setNewConsumptionRows([])
            setSavingAll(false)
            setManageDialogOpen(false)
            if (response?.data?.parentOutputConsumptions) {
                const updatedConsumptions = response.data.parentOutputConsumptions
                setConsumptions(updatedConsumptions)
                if (updateConsumptions) await updateConsumptions(updatedConsumptions, false)
                else if (updateRecord) await updateRecord()
            } else {
                await loadConsumptionsOnly()
            }
        } catch (err) {
            const is404SyncError =
                err.message &&
                err.message.includes('404') &&
                err.message.includes('parent-output-consumptions')
            if (!is404SyncError) {
                console.error('Error saving consumptions:', err)
                const errorMessage =
                    err.userMessage ||
                    err.data?.userMessage ||
                    err.response?.data?.userMessage ||
                    err.message ||
                    'Error al guardar los consumos. Revisa la consola para más detalles.'
                alert(errorMessage)
            }
            setSavingAll(false)
        }
    }

    return {
        consumptions,
        setConsumptions,
        availableOutputs,
        products,
        loading,
        error,
        addDialogOpen,
        setAddDialogOpen,
        savingConsumption,
        loadingAvailableOutputs,
        formData,
        setFormData,
        manageDialogOpen,
        setManageDialogOpen,
        editableConsumptions,
        newConsumptionRows,
        savingAll,
        addingFromParent,
        showBoxes,
        setShowBoxes,
        hasParent,
        handleToggleBoxes,
        loadConsumptionsOnly,
        loadData,
        loadProducts,
        getProductNameById,
        loadAvailableOutputs,
        handleOpenDialog,
        handleSaveConsumption,
        handleDeleteConsumption,
        openManageDialog,
        addNewConsumptionRow,
        handleAddAllFromParent,
        removeConsumptionRow,
        updateConsumptionRow,
        getAllConsumptionRows,
        handleSaveAllConsumptions,
        getOutputId,
        getConsumedWeight,
        getConsumedBoxes,
        getProductName
    }
}
