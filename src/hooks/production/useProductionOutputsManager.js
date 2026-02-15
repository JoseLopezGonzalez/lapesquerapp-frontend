'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
    getProductionOutputs,
    createProductionOutput,
    deleteProductionOutput,
    syncProductionOutputs,
    getProductionRecord,
    getProductionOutputConsumptions,
    getAvailableProductsForOutputs,
    getProductionInputs,
    getProductionRecordSourcesData
} from '@/services/productionService'
import { getProductOptions } from '@/services/productService'
import { getConsumedWeight, getConsumedBoxes } from '@/helpers/production/formatters'
import { getRecordField } from '@/helpers/production/recordHelpers'
import { useProductionRecordContextOptional } from '@/context/ProductionRecordContext'

/**
 * Hook con toda la lógica de ProductionOutputsManager: estado, carga de outputs/products,
 * diálogos (gestión múltiple, selección de fuente, productos disponibles, breakdown),
 * crear/editar/eliminar/sincronizar outputs.
 * @param {{ productionRecordId: number, initialOutputsProp?: array, onRefresh?: function }} options
 */
export function useProductionOutputsManager({ productionRecordId, initialOutputsProp = [], onRefresh }) {
    const { data: session } = useSession()
    const contextData = useProductionRecordContextOptional()
    const contextOutputs = contextData?.recordOutputs || []
    const initialOutputs = contextOutputs.length > 0 ? contextOutputs : initialOutputsProp
    const updateOutputs = contextData?.updateOutputs
    const updateRecord = contextData?.updateRecord

    const [outputs, setOutputs] = useState(initialOutputs)
    const [products, setProducts] = useState([])
    const [productsLoading, setProductsLoading] = useState(true)
    const [loading, setLoading] = useState(initialOutputs.length === 0)
    const [error, setError] = useState(null)
    const [formData, setFormData] = useState({
        product_id: '',
        lot_id: '',
        boxes: '',
        weight_kg: '',
        sources: []
    })
    const [breakdownOutputId, setBreakdownOutputId] = useState(null)
    const [breakdownDialogOpen, setBreakdownDialogOpen] = useState(false)
    const [expandedSourcesRows, setExpandedSourcesRows] = useState(new Set())
    const [availableInputs, setAvailableInputs] = useState([])
    const [availableConsumptions, setAvailableConsumptions] = useState([])
    const [sourcesLoading, setSourcesLoading] = useState(false)
    const [sourcesData, setSourcesData] = useState(null)
    const [manageDialogOpen, setManageDialogOpen] = useState(false)
    const [editableOutputs, setEditableOutputs] = useState([])
    const [newRows, setNewRows] = useState([])
    const [saving, setSaving] = useState(false)
    const [copyingFromConsumption, setCopyingFromConsumption] = useState(false)
    const [sourceSelectionDialogOpen, setSourceSelectionDialogOpen] = useState(false)
    const [fromParentConsumption, setFromParentConsumption] = useState(false)
    const [fromRawMaterialStock, setFromRawMaterialStock] = useState(false)
    const [availableProductsDialogOpen, setAvailableProductsDialogOpen] = useState(false)
    const [availableProducts, setAvailableProducts] = useState([])
    const [loadingAvailableProducts, setLoadingAvailableProducts] = useState(false)
    const [selectedProducts, setSelectedProducts] = useState(new Set())
    const [wasManageDialogOpen, setWasManageDialogOpen] = useState(false)
    const [showBoxes, setShowBoxes] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('production_show_boxes')
            return saved !== null ? saved === 'true' : true
        }
        return true
    })

    const hasInitializedRef = useRef(false)
    const previousOutputsIdsRef = useRef(null)

    const outputsKey = useMemo(() => {
        const currentOutputs = contextOutputs.length > 0 ? contextOutputs : initialOutputsProp
        if (!currentOutputs || currentOutputs.length === 0) return null
        return currentOutputs.map((output) => output.id || JSON.stringify(output)).sort().join(',')
    }, [contextOutputs, initialOutputsProp])

    useEffect(() => {
        if (hasInitializedRef.current) return
        if (!session?.user?.accessToken || !productionRecordId) return
        const currentOutputs = contextOutputs.length > 0 ? contextOutputs : initialOutputsProp
        if (currentOutputs && Array.isArray(currentOutputs) && currentOutputs.length > 0) {
            setOutputs(currentOutputs)
            setLoading(false)
            hasInitializedRef.current = true
            previousOutputsIdsRef.current = outputsKey
            loadProducts()
            return
        }
        loadOutputs().finally(() => {
            hasInitializedRef.current = true
        })
        loadProducts()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.accessToken, productionRecordId])

    useEffect(() => {
        if (!hasInitializedRef.current) return
        const currentOutputs = contextOutputs.length > 0 ? contextOutputs : initialOutputsProp
        if (!currentOutputs || !Array.isArray(currentOutputs) || currentOutputs.length === 0) {
            if (outputs.length > 0) setOutputs([])
            return
        }
        if (outputsKey !== previousOutputsIdsRef.current) {
            setOutputs(currentOutputs)
            if (currentOutputs.length > 0) setLoading(false)
            previousOutputsIdsRef.current = outputsKey
        }
    }, [outputsKey, contextOutputs, initialOutputsProp, outputs.length])

    const handleToggleBoxes = (checked) => {
        setShowBoxes(checked)
        if (typeof window !== 'undefined') {
            localStorage.setItem('production_show_boxes', checked.toString())
        }
    }

    const loadOutputsOnly = async () => {
        try {
            const token = session?.user?.accessToken
            if (!token) return []
            const response = await getProductionOutputs(token, {
                production_record_id: productionRecordId,
                with_sources: true
            })
            const updatedOutputs = response.data || []
            setOutputs(updatedOutputs)
            if (updateOutputs) await updateOutputs(updatedOutputs, false)
            else if (updateRecord) await updateRecord()
            return updatedOutputs
        } catch (err) {
            console.warn('Error loading outputs:', err)
            return []
        }
    }

    const loadOutputs = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true)
            setError(null)
            const token = session?.user?.accessToken
            if (!token) return
            const response = await getProductionOutputs(token, {
                production_record_id: productionRecordId,
                with_sources: true
            })
            setOutputs(response.data || [])
        } catch (err) {
            console.error('Error loading outputs:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al cargar las salidas'
            setError(errorMessage)
        } finally {
            if (showLoading) setLoading(false)
        }
    }

    const loadProducts = async () => {
        setProductsLoading(true)
        try {
            const token = session?.user?.accessToken
            if (!token) return
            const response = await getProductOptions(token)
            const productsData = Array.isArray(response) ? response : (response.data || response || [])
            const formattedProducts = productsData.map((product) => ({
                value: product.id?.toString() || '',
                label: product.name || `Producto #${product.id}`
            }))
            setProducts(formattedProducts)
        } catch (err) {
            console.error('Error loading products:', err)
        } finally {
            setProductsLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            product_id: '',
            lot_id: '',
            boxes: '',
            weight_kg: '',
            sources: []
        })
    }

    const handleCreateOutput = async (e) => {
        e.preventDefault()
        try {
            const token = session?.user?.accessToken
            if (!token) return
            const formattedSources =
                formData.sources && formData.sources.length > 0
                    ? formData.sources.map((source) => {
                          const formatted = { source_type: source.source_type }
                          if (source.source_type === 'stock_box') {
                              formatted.production_input_id = parseInt(source.production_input_id)
                          } else if (source.source_type === 'parent_output') {
                              formatted.production_output_consumption_id = parseInt(
                                  source.production_output_consumption_id
                              )
                          }
                          if (
                              source.contributed_weight_kg !== null &&
                              source.contributed_weight_kg !== undefined &&
                              source.contributed_weight_kg !== ''
                          ) {
                              formatted.contributed_weight_kg = parseFloat(source.contributed_weight_kg)
                          } else if (
                              source.contribution_percentage !== null &&
                              source.contribution_percentage !== undefined &&
                              source.contribution_percentage !== ''
                          ) {
                              formatted.contribution_percentage = parseFloat(source.contribution_percentage)
                          }
                          return formatted
                      })
                    : undefined
            const outputData = {
                production_record_id: parseInt(productionRecordId),
                product_id: parseInt(formData.product_id),
                lot_id: formData.lot_id || null,
                boxes: parseInt(formData.boxes) || 0,
                weight_kg: parseFloat(formData.weight_kg) || 0,
                sources: formattedSources
            }
            await createProductionOutput(outputData, token)
            await loadOutputsOnly()
            resetForm()
        } catch (err) {
            console.error('Error creating output:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al crear la salida'
            alert(errorMessage)
        }
    }

    const handleDeleteOutput = async (outputId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta salida?')) return
        try {
            const token = session?.user?.accessToken
            if (!token) return
            await deleteProductionOutput(outputId, token)
            await loadOutputsOnly()
        } catch (err) {
            console.error('Error deleting output:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al eliminar la salida'
            alert(errorMessage)
        }
    }

    const openManageDialog = async () => {
        if (products.length === 0) await loadProducts()
        setSourcesLoading(true)
        try {
            const token = session?.user?.accessToken
            if (!token) return
            const sourcesDataResponse = await getProductionRecordSourcesData(productionRecordId, token)
            setSourcesData(sourcesDataResponse)
            if (sourcesDataResponse?.stockBoxes) {
                setAvailableInputs(
                    sourcesDataResponse.stockBoxes.map((box) => ({
                        id: box.productionInputId,
                        box: {
                            id: box.boxId,
                            netWeight: box.netWeight,
                            product: box.product,
                            lot: box.lot,
                            costPerKg: box.costPerKg,
                            totalCost: box.totalCost
                        }
                    }))
                )
            }
            if (sourcesDataResponse?.parentOutputs) {
                setAvailableConsumptions(
                    sourcesDataResponse.parentOutputs.map((output) => ({
                        id: output.productionOutputConsumptionId,
                        productionOutputId: output.productionOutputId,
                        consumedWeightKg: output.consumedWeightKg,
                        consumedBoxes: output.consumedBoxes,
                        product: output.product,
                        lotId: output.lotId,
                        costPerKg: output.costPerKg,
                        totalCost: output.totalCost
                    }))
                )
            }
        } catch (err) {
            console.warn('Error loading sources data:', err)
            try {
                const token = session?.user?.accessToken
                if (!token) return
                const [inputsData, consumptionsData] = await Promise.all([
                    getProductionInputs(token, { production_record_id: productionRecordId }),
                    getProductionOutputConsumptions(token, { production_record_id: productionRecordId })
                ])
                setAvailableInputs(inputsData.data || [])
                setAvailableConsumptions(consumptionsData.data || [])
            } catch (fallbackErr) {
                console.error('Error loading sources with fallback method:', fallbackErr)
            }
        } finally {
            setSourcesLoading(false)
        }

        let outputsWithSources = outputs
        try {
            const token = session?.user?.accessToken
            if (token) {
                const response = await getProductionOutputs(token, {
                    production_record_id: productionRecordId,
                    with_sources: true
                })
                outputsWithSources = response.data || outputs
                setOutputs(outputsWithSources)
            }
        } catch (err) {
            console.warn('Error loading outputs with sources:', err)
        }

        setEditableOutputs(
            outputsWithSources.map((output) => {
                const weight = output.weightKg || output.weight_kg || 0
                let normalizedSources = []
                if (output.sources && Array.isArray(output.sources) && output.sources.length > 0) {
                    normalizedSources = output.sources
                        .map((source) => {
                            if (!source) return null
                            return {
                                source_type: source.source_type || source.sourceType || null,
                                production_input_id:
                                    source.production_input_id || source.productionInputId || null,
                                production_output_consumption_id:
                                    source.production_output_consumption_id ||
                                    source.productionOutputConsumptionId ||
                                    null,
                                contributed_weight_kg:
                                    source.contributed_weight_kg !== undefined &&
                                    source.contributed_weight_kg !== null
                                        ? source.contributed_weight_kg
                                        : source.contributedWeightKg !== undefined &&
                                            source.contributedWeightKg !== null
                                          ? source.contributedWeightKg
                                          : null,
                                contribution_percentage:
                                    source.contribution_percentage !== undefined &&
                                    source.contribution_percentage !== null
                                        ? source.contribution_percentage
                                        : source.contributionPercentage !== undefined &&
                                            source.contributionPercentage !== null
                                          ? source.contributionPercentage
                                          : null
                            }
                        })
                        .filter((s) => s !== null)
                }
                return {
                    id: output.id,
                    product_id: output.product?.id?.toString() || '',
                    boxes: output.boxes?.toString() || '',
                    weight_kg: weight.toString(),
                    sources: normalizedSources,
                    isNew: false
                }
            })
        )
        setNewRows([])
        setManageDialogOpen(true)
    }

    const addNewRow = () => {
        setNewRows((prev) => [
            ...prev,
            {
                id: `new-${Date.now()}`,
                product_id: '',
                boxes: '',
                weight_kg: '',
                sources: [],
                isNew: true
            }
        ])
    }

    const handleOpenSourceSelectionDialog = () => {
        setSourceSelectionDialogOpen(true)
        setFromParentConsumption(false)
        setFromRawMaterialStock(false)
    }

    const handleCopyFromConsumptions = async (useParent = false, useStock = false) => {
        try {
            setCopyingFromConsumption(true)
            const token = session?.user?.accessToken
            if (!token) return
            const existingProductIds = new Set()
            editableOutputs.forEach((output) => {
                if (output.product_id) existingProductIds.add(output.product_id.toString())
            })
            newRows.forEach((row) => {
                if (row.product_id) existingProductIds.add(row.product_id.toString())
            })
            const allNewRows = []

            if (useParent) {
                const record = await getProductionRecord(productionRecordId, token)
                const hasParent = record.parent_record_id || record.parentRecordId
                if (!hasParent) {
                    alert(
                        'Este proceso no tiene un proceso padre. No se pueden copiar consumos del proceso padre.'
                    )
                } else {
                    let consumptions = []
                    if (record.parentOutputConsumptions) {
                        consumptions = record.parentOutputConsumptions
                    } else {
                        try {
                            const consumptionsResponse = await getProductionOutputConsumptions(token, {
                                production_record_id: productionRecordId
                            })
                            consumptions = consumptionsResponse.data || []
                        } catch (err) {
                            console.warn('Error loading consumptions:', err)
                            alert('Error al cargar los consumos del proceso padre.')
                        }
                    }
                    if (consumptions.length > 0) {
                        const consumptionsToAdd = consumptions.filter((consumption) => {
                            const productId =
                                consumption.productionOutput?.product?.id ||
                                consumption.productionOutput?.productId ||
                                consumption.production_output?.product?.id ||
                                consumption.production_output?.product_id
                            if (!productId) return false
                            return !existingProductIds.has(productId.toString())
                        })
                        const parentRows = consumptionsToAdd.map((consumption, index) => {
                            const productId =
                                consumption.productionOutput?.product?.id ||
                                consumption.productionOutput?.productId ||
                                consumption.production_output?.product?.id ||
                                consumption.production_output?.product_id
                            const weight = getConsumedWeight(consumption)
                            const boxes = getConsumedBoxes(consumption)
                            existingProductIds.add(productId?.toString())
                            return {
                                id: `new-parent-${Date.now()}-${index}-${productId}`,
                                product_id: productId?.toString() || '',
                                boxes: boxes > 0 ? boxes.toString() : '',
                                weight_kg: weight > 0 ? parseFloat(weight).toFixed(2) : '',
                                isNew: true
                            }
                        })
                        allNewRows.push(...parentRows)
                    }
                }
            }

            if (useStock) {
                try {
                    const inputsResponse = await getProductionInputs(token, {
                        production_record_id: productionRecordId
                    })
                    const inputs = inputsResponse.data || []
                    if (inputs.length === 0) {
                        alert('Este proceso no tiene consumos de materia prima desde stock registrados.')
                    } else {
                        const productsMap = {}
                        inputs.forEach((input) => {
                            const product = input.box?.product || input.box?.productId
                            if (!product) return
                            const productId = product.id?.toString() || product.toString()
                            if (!productId) return
                            if (!productsMap[productId]) {
                                productsMap[productId] = { productId, boxes: 0, weight: 0 }
                            }
                            productsMap[productId].boxes += 1
                            productsMap[productId].weight += parseFloat(input.box?.netWeight || 0)
                        })
                        const stockRows = Object.values(productsMap)
                            .filter((p) => p.productId && !existingProductIds.has(p.productId))
                            .map((product, index) => {
                                existingProductIds.add(product.productId)
                                return {
                                    id: `new-stock-${Date.now()}-${index}-${product.productId}`,
                                    product_id: product.productId,
                                    boxes: product.boxes.toString(),
                                    weight_kg:
                                        product.weight > 0 ? parseFloat(product.weight).toFixed(2) : '',
                                    isNew: true
                                }
                            })
                        if (stockRows.length > 0) allNewRows.push(...stockRows)
                        else
                            alert(
                                'Todos los productos de los consumos de materia prima ya están añadidos como salidas.'
                            )
                    }
                } catch (err) {
                    console.error('Error loading raw material inputs:', err)
                    alert('Error al cargar los consumos de materia prima desde stock.')
                }
            }

            if (allNewRows.length === 0) {
                if (useParent && useStock)
                    alert('No se encontraron productos nuevos para agregar desde las fuentes seleccionadas.')
                else if (useParent)
                    alert('Todos los productos de los consumos del padre ya están añadidos como salidas.')
                else if (useStock)
                    alert('No hay productos disponibles en stock o todos ya están añadidos como salidas.')
                return
            }
            setNewRows((prev) => [...prev, ...allNewRows])
            setSourceSelectionDialogOpen(false)
        } catch (err) {
            console.error('Error copying from consumptions:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al copiar desde las fuentes seleccionadas'
            alert(errorMessage)
        } finally {
            setCopyingFromConsumption(false)
        }
    }

    const handleConfirmSourceSelection = () => {
        if (!fromParentConsumption && !fromRawMaterialStock) {
            alert('Por favor selecciona al menos una fuente.')
            return
        }
        handleCopyFromConsumptions(fromParentConsumption, fromRawMaterialStock)
    }

    const removeRow = (id) => {
        if (id.toString().startsWith('new-')) {
            setNewRows((prev) => prev.filter((row) => row.id !== id))
        } else {
            setEditableOutputs((prev) => prev.filter((row) => row.id !== id))
        }
    }

    const updateRow = (id, field, value) => {
        if (id.toString().startsWith('new-')) {
            setNewRows((prev) =>
                prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
            )
        } else {
            setEditableOutputs((prev) =>
                prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
            )
        }
    }

    const handleSaveAll = async () => {
        try {
            setSaving(true)
            const token = session?.user?.accessToken
            if (!token) return
            const allOutputs = [
                ...editableOutputs.filter((row) => row.product_id && row.weight_kg),
                ...newRows.filter((row) => row.product_id && row.weight_kg)
            ].map((row) => {
                const output = {
                    product_id: parseInt(row.product_id),
                    lot_id: null,
                    boxes: parseInt(row.boxes) || 0,
                    weight_kg: parseFloat(row.weight_kg) || 0
                }
                if (row.sources && Array.isArray(row.sources) && row.sources.length > 0) {
                    output.sources = row.sources.map((source) => {
                        const formatted = { source_type: source.source_type }
                        if (source.source_type === 'stock_box') {
                            formatted.production_input_id = parseInt(source.production_input_id)
                        } else if (source.source_type === 'parent_output') {
                            formatted.production_output_consumption_id = parseInt(
                                source.production_output_consumption_id
                            )
                        }
                        if (
                            source.contributed_weight_kg !== null &&
                            source.contributed_weight_kg !== undefined &&
                            source.contributed_weight_kg !== ''
                        ) {
                            formatted.contributed_weight_kg = parseFloat(source.contributed_weight_kg)
                        } else if (
                            source.contribution_percentage !== null &&
                            source.contribution_percentage !== undefined &&
                            source.contribution_percentage !== ''
                        ) {
                            formatted.contribution_percentage = parseFloat(source.contribution_percentage)
                        }
                        return formatted
                    })
                }
                if (row.id && !row.id.toString().startsWith('new-')) {
                    output.id = row.id
                }
                return output
            })

            const response = await syncProductionOutputs(productionRecordId, { outputs: allOutputs }, token)
            setEditableOutputs([])
            setNewRows([])
            setSaving(false)
            setManageDialogOpen(false)

            if (response.data && response.data.outputs) {
                const updatedOutputs = response.data.outputs
                setOutputs(updatedOutputs)
                if (updateOutputs) await updateOutputs(updatedOutputs, false)
                else if (updateRecord) await updateRecord()
            } else {
                await loadOutputsOnly()
            }
        } catch (err) {
            console.error('Error saving outputs:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al guardar las salidas'
            alert(errorMessage)
            setSaving(false)
        }
    }

    const getAllRows = () => [...editableOutputs, ...newRows]

    const getProductionId = () => {
        if (contextData?.record) return getRecordField(contextData.record, 'productionId')
        return null
    }

    const loadAvailableProducts = async () => {
        try {
            setLoadingAvailableProducts(true)
            const token = session?.user?.accessToken
            if (!token) return
            const productionId = getProductionId()
            if (!productionId) {
                alert('No se pudo obtener el ID de la producción')
                return
            }
            const productsList = await getAvailableProductsForOutputs(productionId, token)
            setAvailableProducts(productsList || [])
        } catch (err) {
            console.error('Error loading available products:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al cargar los productos disponibles'
            alert(errorMessage)
        } finally {
            setLoadingAvailableProducts(false)
        }
    }

    const handleOpenAvailableProductsDialog = async () => {
        setWasManageDialogOpen(manageDialogOpen)
        setManageDialogOpen(false)
        setAvailableProductsDialogOpen(true)
        setSelectedProducts(new Set())
        await loadAvailableProducts()
    }

    const toggleProductSelection = (productId) => {
        setSelectedProducts((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(productId)) newSet.delete(productId)
            else newSet.add(productId)
            return newSet
        })
    }

    const handleAddSelectedProducts = async () => {
        if (selectedProducts.size === 0) {
            alert('Por favor selecciona al menos un producto')
            return
        }
        try {
            const productsToAdd = availableProducts.filter((p) => selectedProducts.has(p.product.id))
            if (wasManageDialogOpen) {
                const existingProductIds = new Set()
                getAllRows().forEach((row) => {
                    if (row.product_id) existingProductIds.add(row.product_id.toString())
                })
                const newProductsToAdd = productsToAdd.filter(
                    (product) => !existingProductIds.has(product.product.id.toString())
                )
                if (newProductsToAdd.length === 0) {
                    alert('Todos los productos seleccionados ya están en la lista.')
                    setAvailableProductsDialogOpen(false)
                    setSelectedProducts(new Set())
                    setWasManageDialogOpen(false)
                    return
                }
                const newRowsToAdd = newProductsToAdd.map((product, index) => ({
                    id: `new-${Date.now()}-${index}-${product.product.id}`,
                    product_id: product.product.id.toString(),
                    boxes: (product.totalBoxes || 0).toString(),
                    weight_kg: product.totalWeight > 0 ? parseFloat(product.totalWeight).toFixed(2) : '0.00',
                    isNew: true
                }))
                setNewRows((prev) => [...prev, ...newRowsToAdd])
                setAvailableProductsDialogOpen(false)
                setSelectedProducts(new Set())
                setWasManageDialogOpen(false)
                setManageDialogOpen(true)
            } else {
                const token = session?.user?.accessToken
                if (!token) return
                const createPromises = productsToAdd.map((product) => {
                    const outputData = {
                        production_record_id: parseInt(productionRecordId),
                        product_id: product.product.id,
                        lot_id: null,
                        boxes: product.totalBoxes || 0,
                        weight_kg: product.totalWeight || 0
                    }
                    return createProductionOutput(outputData, token)
                })
                await Promise.all(createPromises)
                await loadOutputsOnly()
                setAvailableProductsDialogOpen(false)
                setSelectedProducts(new Set())
                setWasManageDialogOpen(false)
            }
        } catch (err) {
            console.error('Error adding selected products:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al agregar los productos seleccionados'
            alert(errorMessage)
        }
    }

    return {
        outputs,
        setOutputs,
        products,
        productsLoading,
        loading,
        error,
        formData,
        setFormData,
        breakdownOutputId,
        setBreakdownOutputId,
        breakdownDialogOpen,
        setBreakdownDialogOpen,
        expandedSourcesRows,
        setExpandedSourcesRows,
        availableInputs,
        availableConsumptions,
        sourcesLoading,
        sourcesData,
        manageDialogOpen,
        setManageDialogOpen,
        editableOutputs,
        setEditableOutputs,
        newRows,
        setNewRows,
        saving,
        copyingFromConsumption,
        sourceSelectionDialogOpen,
        setSourceSelectionDialogOpen,
        fromParentConsumption,
        setFromParentConsumption,
        fromRawMaterialStock,
        setFromRawMaterialStock,
        availableProductsDialogOpen,
        setAvailableProductsDialogOpen,
        availableProducts,
        loadingAvailableProducts,
        selectedProducts,
        setSelectedProducts,
        wasManageDialogOpen,
        setWasManageDialogOpen,
        showBoxes,
        setShowBoxes,
        handleToggleBoxes,
        loadOutputsOnly,
        loadOutputs,
        loadProducts,
        handleCreateOutput,
        handleDeleteOutput,
        openManageDialog,
        addNewRow,
        handleOpenSourceSelectionDialog,
        handleCopyFromConsumptions,
        handleConfirmSourceSelection,
        removeRow,
        updateRow,
        handleSaveAll,
        getAllRows,
        getProductionId,
        loadAvailableProducts,
        handleOpenAvailableProductsDialog,
        toggleProductSelection,
        handleAddSelectedProducts,
        resetForm,
        handleEditClick: () => openManageDialog()
    }
}
