'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
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
import { getConsumedWeight, getConsumedBoxes } from '@/helpers/production/formatters'
import { getRecordField } from '@/helpers/production/recordHelpers'
import { useProductionRecordContextOptional } from '@/context/ProductionRecordContext'
import { useProductOptions } from '@/hooks/useProductOptions'
import { useShowBoxesPreference } from './useShowBoxesPreference'
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant'
import { productionQueryKeys } from '@/lib/routes/queryKeys'

const roundManageBaseline = (value) =>
    Math.round((parseFloat(value || 0) + Number.EPSILON) * 100) / 100

function normalizeSourceForManageBaseline(source) {
    if (!source) {
        return {
            source_type: null,
            product_id: null,
            production_output_consumption_id: null,
            contributed_weight_kg: null,
            contribution_percentage: null,
        }
    }
    const wc = source.contributed_weight_kg
    const pct = source.contribution_percentage
    return {
        source_type: source.source_type || null,
        product_id: source.product_id != null && source.product_id !== '' ? String(source.product_id) : null,
        production_output_consumption_id:
            source.production_output_consumption_id != null && source.production_output_consumption_id !== ''
                ? String(source.production_output_consumption_id)
                : null,
        contributed_weight_kg:
            wc === null || wc === undefined || wc === '' ? null : roundManageBaseline(wc),
        contribution_percentage:
            pct === null || pct === undefined || pct === '' ? null : roundManageBaseline(pct),
    }
}

function normalizeRowForManageBaseline(row) {
    const w = row.weight_kg
    const b = row.boxes
    return {
        id: String(row.id),
        product_id: row.product_id != null ? String(row.product_id) : '',
        boxes: b === null || b === undefined || b === '' ? '' : String(parseInt(b, 10) || 0),
        weight_kg: w === null || w === undefined || w === '' ? '' : String(roundManageBaseline(w)),
        isNew: !!row.isNew,
        source_priority: Array.isArray(row.source_priority) ? [...row.source_priority] : [],
        sources: (row.sources || []).map(normalizeSourceForManageBaseline),
    }
}

function serializeManageDialogState(editableOutputs, newRows) {
    return JSON.stringify([...editableOutputs, ...newRows].map(normalizeRowForManageBaseline))
}

/**
 * Hook con toda la lógica de ProductionOutputsManager: estado, carga de outputs/products,
 * diálogos (gestión múltiple, selección de fuente, productos disponibles, breakdown),
 * crear/editar/eliminar/sincronizar outputs.
 * @param {{ productionRecordId: number, initialOutputsProp?: array, onRefresh?: function }} options
 */
export function useProductionOutputsManager({ productionRecordId, initialOutputsProp = [], onRefresh }) {
    const { data: session } = useSession()
    const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null
    const queryClient = useQueryClient()
    const contextData = useProductionRecordContextOptional()
    const updateOutputs = contextData?.updateOutputs
    const updateRecord = contextData?.updateRecord
    const totalInputWeight = parseFloat(contextData?.record?.totalInputWeight || 0)
    const totalOutputWeight = parseFloat(contextData?.record?.totalOutputWeight || 0)
    const processTransformationFactor =
        totalInputWeight > 0 && totalOutputWeight > 0 ? totalOutputWeight / totalInputWeight : 1
    const { productOptions, loading: productsLoading, refetch: refetchProducts } = useProductOptions({
        enabled: !!productionRecordId
    })
    const { showBoxes, handleToggleBoxes } = useShowBoxesPreference()
    const [formData, setFormData] = useState({
        product_id: '',
        boxes: '',
        weight_kg: '',
        sources: []
    })
    const [breakdownOutputId, setBreakdownOutputId] = useState(null)
    const [breakdownDialogOpen, setBreakdownDialogOpen] = useState(false)
    const [expandedSourceRowId, setExpandedSourceRowId] = useState(null)
    const [availableInputs, setAvailableInputs] = useState([])
    const [availableConsumptions, setAvailableConsumptions] = useState([])
    const [sourcesLoading, setSourcesLoading] = useState(false)
    const [sourcesData, setSourcesData] = useState(null)
    const [manageDialogOpen, setManageDialogOpen] = useState(false)
    const [manageDialogBaselineJson, setManageDialogBaselineJson] = useState(null)
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
    const [deleteOutputConfirm, setDeleteOutputConfirm] = useState({ open: false, outputId: null })
    const products = productOptions

    const outputsQueryKey = productionQueryKeys.outputs(tenantId, productionRecordId, true)
    const outputsQuery = useQuery({
        queryKey: outputsQueryKey,
        queryFn: async () => {
            const token = session?.user?.accessToken
            if (!token) return []
            const response = await getProductionOutputs(token, {
                production_record_id: productionRecordId,
                with_sources: true
            })
            return response.data || []
        },
        enabled: !!session?.user?.accessToken && !!productionRecordId,
        initialData: Array.isArray(initialOutputsProp) ? initialOutputsProp : [],
        staleTime: 30 * 1000,
    })

    const outputs = outputsQuery.data ?? []
    const loading = outputsQuery.isLoading
    const error = outputsQuery.error?.message ?? null

    useEffect(() => {
        if (!manageDialogOpen) {
            setManageDialogBaselineJson(null)
        }
    }, [manageDialogOpen])

    const isManageDialogDirty = useMemo(() => {
        if (manageDialogBaselineJson === null || !manageDialogOpen) return false
        return serializeManageDialogState(editableOutputs, newRows) !== manageDialogBaselineJson
    }, [manageDialogOpen, manageDialogBaselineJson, editableOutputs, newRows])

    const manageDialogDataReady = manageDialogBaselineJson !== null && manageDialogOpen

    const setOutputs = useCallback((updater) => {
        queryClient.setQueryData(outputsQueryKey, (previous = []) =>
            typeof updater === 'function' ? updater(previous) : updater
        )
    }, [outputsQueryKey, queryClient])

    const loadOutputsOnly = async () => {
        try {
            const result = await outputsQuery.refetch()
            const updatedOutputs = result.data || []
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
            const result = await outputsQuery.refetch()
            return result.data || []
        } catch (err) {
            console.error('Error loading outputs:', err)
            return []
        }
    }

    const loadProducts = async () => {
        try {
            const result = await refetchProducts()
            return result.data ?? []
        } catch (err) {
            console.error('Error loading products:', err)
            return []
        }
    }

    const resetForm = () => {
        setFormData({
            product_id: '',
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
                          if (source.source_type === 'stock_product') {
                              formatted.product_id = parseInt(source.product_id)
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
            toast.error(errorMessage)
        }
    }

    const handleDeleteOutput = (outputId) => {
        setDeleteOutputConfirm({ open: true, outputId })
    }

    const confirmDeleteOutput = async () => {
        const { outputId } = deleteOutputConfirm
        setDeleteOutputConfirm({ open: false, outputId: null })
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
            toast.error(errorMessage)
        }
    }

    const openManageDialog = async () => {
        const loadStartedAt = performance.now()
        setManageDialogOpen(true)
        setSourcesLoading(true)
        if (products.length === 0) loadProducts()

        const token = session?.user?.accessToken
        if (!token) {
            setSourcesLoading(false)
            return
        }

        try {
        // Lanzar sourcesData y outputs(with_sources) en paralelo
        const [sourcesDataResponse, outputsResponse] = await Promise.all([
            getProductionRecordSourcesData(productionRecordId, token).catch((err) => {
                console.warn('Error loading sources data:', err)
                return null
            }),
            getProductionOutputs(token, {
                production_record_id: productionRecordId,
                with_sources: true
            }).catch((err) => {
                console.warn('Error loading outputs with sources:', err)
                return null
            })
        ])

        // Procesar sourcesData
        if (sourcesDataResponse) {
            setSourcesData(sourcesDataResponse)
            const stockProducts = sourcesDataResponse?.stockProducts || []
            if (stockProducts.length > 0) {
                setAvailableInputs(
                    stockProducts.map((productSource) => ({
                        id: productSource.productId || productSource.product_id,
                        product: productSource.product,
                        productId: productSource.productId || productSource.product_id,
                        totalBoxes:
                            parseFloat(
                                productSource.totalBoxes ??
                                productSource.total_boxes ??
                                productSource.boxesCount ??
                                productSource.boxes_count ??
                                productSource.consumedBoxes ??
                                productSource.consumed_boxes ??
                                0
                            ) || 0,
                        totalWeight:
                            parseFloat(
                                productSource.availableWeightKg ??
                                productSource.available_weight_kg ??
                                productSource.totalWeightKg ??
                                productSource.total_weight_kg ??
                                productSource.consumedWeightKg ??
                                productSource.consumed_weight_kg ??
                                productSource.weightKg ??
                                productSource.weight_kg ??
                                productSource.totalWeight ??
                                productSource.total_weight ??
                                0
                            ) || 0,
                        costPerKg:
                            productSource.costPerKg ??
                            productSource.cost_per_kg ??
                            productSource.sourceCostPerKg ??
                            productSource.source_cost_per_kg ??
                            null,
                        totalCost:
                            productSource.totalCost ??
                            productSource.total_cost ??
                            productSource.sourceTotalCost ??
                            productSource.source_total_cost ??
                            null,
                    }))
                )
            } else {
                setAvailableInputs([])
            }
            if (sourcesDataResponse?.parentOutputs) {
                setAvailableConsumptions(
                    sourcesDataResponse.parentOutputs.map((output) => ({
                        id: output.productionOutputConsumptionId,
                        productionOutputConsumptionId: output.productionOutputConsumptionId || output.production_output_consumption_id,
                        productionOutputId: output.productionOutputId,
                        consumedWeightKg: output.consumedWeightKg ?? output.consumed_weight_kg,
                        consumedBoxes: output.consumedBoxes ?? output.consumed_boxes,
                        totalBoxes: output.consumedBoxes ?? output.consumed_boxes ?? 0,
                        product: output.product,
                        costPerKg: output.costPerKg ?? output.cost_per_kg,
                        totalCost: output.totalCost ?? output.total_cost
                    }))
                )
            } else {
                setAvailableConsumptions([])
            }
        } else {
            // Fallback: cargar inputs y consumptions en paralelo
            try {
                const [inputsData, consumptionsData] = await Promise.all([
                    getProductionInputs(token, { production_record_id: productionRecordId }),
                    getProductionOutputConsumptions(token, { production_record_id: productionRecordId })
                ])
                const groupedInputs = {}
                ;(inputsData.data || []).forEach((input) => {
                    const product = input.box?.product
                    const productId = product?.id || input.box?.productId
                    if (!productId) return
                    if (!groupedInputs[productId]) {
                        groupedInputs[productId] = {
                            id: productId,
                            productId: productId,
                            product,
                            totalBoxes: 0,
                            totalWeight: 0,
                            costPerKg: null,
                            totalCost: 0,
                        }
                    }
                    groupedInputs[productId].totalBoxes += 1
                    groupedInputs[productId].totalWeight += parseFloat(input.box?.netWeight || 0) || 0
                })
                setAvailableInputs(Object.values(groupedInputs))
                setAvailableConsumptions(consumptionsData.data || [])
            } catch (fallbackErr) {
                console.error('Error loading sources with fallback method:', fallbackErr)
            }
        }

        // Procesar outputs con sources
        const outputsWithSources = outputsResponse?.data || outputs
        if (outputsResponse?.data) {
            setOutputs(outputsWithSources)
        }

        const nextEditableOutputs = outputsWithSources.map((output) => {
            const weight = output.weightKg || output.weight_kg || 0
            let normalizedSources = []
            if (output.sources && Array.isArray(output.sources) && output.sources.length > 0) {
                normalizedSources = output.sources
                    .map((source) => {
                        if (!source) return null
                        return {
                            source_type: source.source_type || source.sourceType || null,
                            product_id:
                                source.product_id ||
                                source.productId ||
                                source.product?.id ||
                                null,
                            production_output_consumption_id:
                                source.production_output_consumption_id ||
                                source.productionOutputConsumptionId ||
                                null,
                            product: source.product || null,
                            contributed_weight_kg: (() => {
                                if (source.contributed_weight_kg !== undefined && source.contributed_weight_kg !== null) {
                                    return source.contributed_weight_kg
                                }
                                if (source.contributedWeightKg !== undefined && source.contributedWeightKg !== null) {
                                    return source.contributedWeightKg
                                }
                                return null
                            })(),
                            contribution_percentage: (() => {
                                const contributedWeight =
                                    source.contributed_weight_kg !== undefined && source.contributed_weight_kg !== null
                                        ? source.contributed_weight_kg
                                        : source.contributedWeightKg !== undefined && source.contributedWeightKg !== null
                                            ? source.contributedWeightKg
                                            : null
                                if (contributedWeight === null || contributedWeight === undefined) return null
                                const transformedWeight = parseFloat(contributedWeight || 0) * processTransformationFactor
                                return parseFloat(weight || 0) > 0 ? (transformedWeight / parseFloat(weight || 0)) * 100 : null
                            })()
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
        setManageDialogBaselineJson(serializeManageDialogState(nextEditableOutputs, []))
        setEditableOutputs(nextEditableOutputs)
        setNewRows([])

        const minSpinnerMs = 400
        const elapsed = performance.now() - loadStartedAt
        if (elapsed < minSpinnerMs) {
            await new Promise((resolve) => setTimeout(resolve, minSpinnerMs - elapsed))
        }
        } catch (err) {
            console.error('Error preparing manage dialog:', err)
        } finally {
            setSourcesLoading(false)
        }
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
                    toast.error(
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
                            toast.error('Error al cargar los consumos del proceso padre.')
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
                        toast.error('Este proceso no tiene consumos de materia prima desde stock registrados.')
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
                            toast.error(
                                'Todos los productos de los consumos de materia prima ya están añadidos como salidas.'
                            )
                    }
                } catch (err) {
                    console.error('Error loading raw material inputs:', err)
                    toast.error('Error al cargar los consumos de materia prima desde stock.')
                }
            }

            if (allNewRows.length === 0) {
                if (useParent && useStock)
                    toast.error('No se encontraron productos nuevos para agregar desde las fuentes seleccionadas.')
                else if (useParent)
                    toast.error('Todos los productos de los consumos del padre ya están añadidos como salidas.')
                else if (useStock)
                    toast.error('No hay productos disponibles en stock o todos ya están añadidos como salidas.')
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
            toast.error(errorMessage)
        } finally {
            setCopyingFromConsumption(false)
        }
    }

    const handleConfirmSourceSelection = () => {
        if (!fromParentConsumption && !fromRawMaterialStock) {
            toast.error('Por favor selecciona al menos una fuente.')
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
                    boxes: parseInt(row.boxes) || 0,
                    weight_kg: parseFloat(row.weight_kg) || 0
                }
                if (row.sources && Array.isArray(row.sources) && row.sources.length > 0) {
                    const validSources = row.sources.filter((source) => {
                        if (!source?.source_type) return false
                        if (source.source_type === 'stock_product' && !source.product_id) return false
                        if (source.source_type === 'parent_output' && !source.production_output_consumption_id) return false
                        return (
                            (source.contributed_weight_kg !== null &&
                                source.contributed_weight_kg !== undefined &&
                                source.contributed_weight_kg !== '') ||
                            (source.contribution_percentage !== null &&
                                source.contribution_percentage !== undefined &&
                                source.contribution_percentage !== '')
                        )
                    })

                    if (validSources.length > 0) {
                        output.sources = validSources.map((source) => {
                            const formatted = { source_type: source.source_type }
                        if (source.source_type === 'stock_product') {
                            formatted.product_id = parseInt(source.product_id)
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
            toast.error(errorMessage)
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
                toast.error('No se pudo obtener el ID de la producción')
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
            toast.error(errorMessage)
        } finally {
            setLoadingAvailableProducts(false)
        }
    }

    const handleOpenAvailableProductsDialog = async () => {
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
            toast.error('Por favor selecciona al menos un producto')
            return
        }
        try {
            const productsToAdd = availableProducts.filter((p) => selectedProducts.has(p.product.id))
            const existingProductIds = new Set()
            getAllRows().forEach((row) => {
                if (row.product_id) existingProductIds.add(row.product_id.toString())
            })
            const newProductsToAdd = productsToAdd.filter(
                (product) => !existingProductIds.has(product.product.id.toString())
            )
            if (newProductsToAdd.length === 0) {
                toast.error('Todos los productos seleccionados ya están en la lista.')
                setAvailableProductsDialogOpen(false)
                setSelectedProducts(new Set())
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
        } catch (err) {
            console.error('Error adding selected products:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al agregar los productos seleccionados'
            toast.error(errorMessage)
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
        expandedSourceRowId,
        setExpandedSourceRowId,
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
        isManageDialogDirty,
        manageDialogDataReady,
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
        showBoxes,
        handleToggleBoxes,
        loadOutputsOnly,
        loadOutputs,
        loadProducts,
        handleCreateOutput,
        handleDeleteOutput,
        deleteOutputConfirm,
        setDeleteOutputConfirm,
        confirmDeleteOutput,
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
