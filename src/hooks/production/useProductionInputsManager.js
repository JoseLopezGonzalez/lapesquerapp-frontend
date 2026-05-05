'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import {
    getProductionInputs,
    syncMultipleProductionInputs,
    deleteProductionInput,
    deleteMultipleProductionInputs
} from '@/services/productionService'
import { getPallet, searchPalletsByLot } from '@/services/palletService'
import { useProductionRecordContextOptional } from '@/context/ProductionRecordContext'
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant'
import { productionQueryKeys } from '@/lib/routes/queryKeys'

const NO_PALLET_ID = '__no_pallet__'

/**
 * Hook con toda la lógica de ProductionInputsManager: estado, carga de inputs,
 * diálogo de agregar (palets, selección manual/peso/GS1/búsqueda por peso),
 * eliminación y cálculos de resumen.
 * @param {{ productionRecordId: number, initialInputsProp?: array, onRefresh?: function }} options
 * @returns {object} API para el componente y subcomponentes (inputs, loading, handlers, etc.)
 */
export function useProductionInputsManager({ productionRecordId, initialInputsProp = [], onRefresh }) {
    const { data: session } = useSession()
    const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null
    const queryClient = useQueryClient()
    const contextData = useProductionRecordContextOptional()
    const updateInputs = contextData?.updateInputs
    const updateRecord = contextData?.updateRecord
    const [addDialogOpen, setAddDialogOpen] = useState(false)

    const [palletSearch, setPalletSearch] = useState('')
    const [loadedPallets, setLoadedPallets] = useState([])
    const [selectedBoxes, setSelectedBoxes] = useState([])
    const [loadingPallet, setLoadingPallet] = useState(false)
    const [savingInputs, setSavingInputs] = useState(false)
    const [selectionMode, setSelectionMode] = useState('manual')
    const [targetWeight, setTargetWeight] = useState({})
    const [selectedPalletId, setSelectedPalletId] = useState(null)
    const [scannedCode, setScannedCode] = useState('')
    const [weightSearch, setWeightSearch] = useState('')
    const [weightSearchResults, setWeightSearchResults] = useState([])
    const [weightTolerance, setWeightTolerance] = useState(0.01)
    const [targetWeightResults, setTargetWeightResults] = useState([])
    const [lotsDialogOpen, setLotsDialogOpen] = useState(false)
    const [selectedProductLots, setSelectedProductLots] = useState(null)
    const [palletsDialogOpen, setPalletsDialogOpen] = useState(false)
    const [deleteInputConfirm, setDeleteInputConfirm] = useState({ open: false, inputId: null, mode: 'single' })

    const getAllBoxes = useCallback(() =>
        loadedPallets.flatMap((pallet) =>
            (pallet.boxes || []).map((box) => ({ ...box, palletId: pallet.id }))
        )
    , [loadedPallets])

    const inputsQueryKey = productionQueryKeys.inputs(tenantId, productionRecordId)
    const inputsQuery = useQuery({
        queryKey: inputsQueryKey,
        queryFn: async () => {
            const token = session?.user?.accessToken
            if (!token) return []
            const response = await getProductionInputs(token, { production_record_id: productionRecordId })
            return response.data || []
        },
        enabled: !!session?.user?.accessToken && !!productionRecordId,
        initialData: Array.isArray(initialInputsProp) ? initialInputsProp : [],
        staleTime: 30 * 1000,
    })

    const inputs = inputsQuery.data ?? []
    const loading = inputsQuery.isLoading
    const error = inputsQuery.error?.message ?? null

    const editableInputBoxIds = useMemo(() => new Set(
        inputs
            .map((input) => Number(input?.box?.id))
            .filter((id) => Number.isFinite(id) && id > 0)
    ), [inputs])

    const isBoxAvailable = useCallback((box) => {
        const boxId = Number(box?.id)
        if (Number.isFinite(boxId) && editableInputBoxIds.has(boxId)) {
            return true
        }
        return box?.isAvailable !== false
    }, [editableInputBoxIds])

    const wasPreviouslyConsumed = useCallback((boxId) => {
        const parsedBoxId = Number(boxId)
        return Number.isFinite(parsedBoxId) && editableInputBoxIds.has(parsedBoxId)
    }, [editableInputBoxIds])

    const setInputs = useCallback((updater) => {
        queryClient.setQueryData(inputsQueryKey, (previous = []) =>
            typeof updater === 'function' ? updater(previous) : updater
        )
    }, [inputsQueryKey, queryClient])

    const loadInputsOnly = useCallback(async () => {
        try {
            const result = await inputsQuery.refetch()
            const updatedInputs = result.data || []
            if (updateInputs) await updateInputs(updatedInputs, false)
            else if (updateRecord) await updateRecord()
            return updatedInputs
        } catch (err) {
            console.warn('Error loading inputs:', err)
            return []
        }
    }, [inputsQuery, updateInputs, updateRecord])

    const loadInputs = useCallback(async () => {
        try {
            const result = await inputsQuery.refetch()
            return result.data || []
        } catch (err) {
            console.error('Error loading inputs:', err)
            return []
        }
    }, [inputsQuery])

    const loadExistingDataForEdit = useCallback(async () => {
        if (inputs.length === 0) return
        try {
            setLoadingPallet(true)
            const token = session?.user?.accessToken
            if (!token) return
            const palletIds = [...new Set(inputs.map((input) => input.box?.palletId).filter(Boolean))]
            const loadedPalletsData = palletIds.length > 0
                ? await Promise.all(palletIds.map((palletId) => getPallet(palletId, token)))
                : []

            // En edición, el endpoint de palet puede no incluir cajas ya consumidas/no disponibles.
            // Mezclamos esas cajas desde los inputs existentes para no perderlas en el diálogo.
            const missingBoxesByPallet = inputs.reduce((acc, input) => {
                const box = input?.box
                const palletId = box?.palletId
                if (!box?.id || !palletId) return acc

                if (!acc[palletId]) acc[palletId] = []
                acc[palletId].push(box)
                return acc
            }, {})

            const noPalletBoxesMap = inputs.reduce((acc, input) => {
                const box = input?.box
                if (!box?.id || box?.palletId) return acc
                acc.set(Number(box.id), box)
                return acc
            }, new Map())

            const mergedPalletsData = loadedPalletsData.map((pallet) => {
                const existingBoxes = Array.isArray(pallet?.boxes) ? pallet.boxes : []
                const existingBoxIds = new Set(existingBoxes.map((box) => Number(box?.id)))
                const fallbackBoxes = (missingBoxesByPallet[pallet.id] || []).filter(
                    (box) => !existingBoxIds.has(Number(box?.id))
                )

                if (fallbackBoxes.length === 0) return pallet

                return {
                    ...pallet,
                    boxes: [...existingBoxes, ...fallbackBoxes.map((box) => ({ ...box, isAvailable: true }))]
                }
            })

            if (noPalletBoxesMap.size > 0) {
                mergedPalletsData.push({
                    id: NO_PALLET_ID,
                    isVirtualNoPallet: true,
                    boxes: Array.from(noPalletBoxesMap.values()).map((box) => ({
                        ...box,
                        palletId: NO_PALLET_ID,
                        isAvailable: true
                    }))
                })
            }

            setLoadedPallets(mergedPalletsData)
            if (mergedPalletsData.length > 0) setSelectedPalletId(mergedPalletsData[0].id)
            const existingBoxSelections = inputs
                .filter((input) => input.box?.id)
                .map((input) => ({ boxId: input.box.id, palletId: input.box.palletId || NO_PALLET_ID }))
            setSelectedBoxes(existingBoxSelections)
        } catch (err) {
            console.error('Error loading existing data:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al cargar los datos existentes'
            toast.error(errorMessage)
        } finally {
            setLoadingPallet(false)
        }
    }, [inputs, session?.user?.accessToken])

    const handleSearchPallet = useCallback(async () => {
        if (!palletSearch.trim()) {
            toast.error('Por favor ingresa un ID de palet o un lote')
            return
        }
        try {
            setLoadingPallet(true)
            const token = session?.user?.accessToken
            if (!token) return
            const searchTerm = palletSearch.trim()
            const isNumeric = /^\d+$/.test(searchTerm)
            if (isNumeric) {
                const palletId = parseInt(searchTerm, 10)
                const pallet = await getPallet(palletId, token)
                setLoadedPallets((prev) => {
                    if (prev.length === 0) setSelectedPalletId(pallet.id)
                    return [...prev, pallet]
                })
            } else {
                const searchResult = await searchPalletsByLot(searchTerm, token)
                const pallets = searchResult?.pallets || []
                if (pallets.length === 0) {
                    toast.error(`No se encontraron palets con el lote "${searchTerm}"`)
                    setPalletSearch('')
                    return
                }
                const newPallets = pallets.filter(
                    (p) => !loadedPallets.some((loaded) => loaded.id === p.id)
                )
                if (newPallets.length === 0) {
                    toast.error('Todos los palets con este lote ya están cargados')
                    setPalletSearch('')
                    return
                }
                setLoadedPallets((prev) => {
                    const updated = [...prev, ...newPallets]
                    if (prev.length === 0 && updated.length > 0) setSelectedPalletId(updated[0].id)
                    return updated
                })
                const boxesToSelect = []
                newPallets.forEach((pallet) => {
                    pallet.boxes?.forEach((box) => {
                        if (
                            box.lot &&
                            box.lot.toString().toLowerCase() === searchTerm.toLowerCase() &&
                            isBoxAvailable(box) &&
                            !selectedBoxes.some((b) => b.boxId === box.id && b.palletId === pallet.id)
                        ) {
                            boxesToSelect.push({ boxId: box.id, palletId: pallet.id })
                        }
                    })
                })
                if (boxesToSelect.length > 0) {
                    setSelectedBoxes((prev) => {
                        const newBoxes = [...prev]
                        boxesToSelect.forEach((box) => {
                            if (!newBoxes.some((b) => b.boxId === box.boxId && b.palletId === box.palletId)) {
                                newBoxes.push(box)
                            }
                        })
                        return newBoxes
                    })
                }
            }
            setPalletSearch('')
        } catch (err) {
            console.error('Error searching pallet:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al buscar palets'
            toast.error(errorMessage)
        } finally {
            setLoadingPallet(false)
        }
    }, [isBoxAvailable, loadedPallets, palletSearch, selectedBoxes, session?.user?.accessToken])

    const handleRemovePallet = useCallback((palletId) => {
        setLoadedPallets((prev) => prev.filter((p) => p.id !== palletId))
        setSelectedBoxes((prev) => prev.filter((box) => box.palletId !== palletId))
        if (selectedPalletId === palletId) {
            const remainingPallets = loadedPallets.filter((p) => p.id !== palletId)
            setSelectedPalletId(remainingPallets.length > 0 ? remainingPallets[0].id : null)
        }
    }, [loadedPallets, selectedPalletId])

    const getPalletBoxes = useCallback((palletId) => {
        const pallet = loadedPallets.find((p) => p.id === palletId)
        return pallet?.boxes || []
    }, [loadedPallets])

    const getSelectedBoxesForPallet = useCallback((palletId) =>
        selectedBoxes.filter((box) => box.palletId === palletId)
    , [selectedBoxes])

    const handleToggleBox = useCallback((boxId, palletId) => {
        setSelectedBoxes((prev) => {
            const exists = prev.some((box) => box.boxId === boxId && box.palletId === palletId)
            if (exists) return prev.filter((box) => !(box.boxId === boxId && box.palletId === palletId))
            return [...prev, { boxId, palletId }]
        })
    }, [])

    const isBoxSelected = useCallback((boxId, palletId) =>
        selectedBoxes.some((box) => box.boxId === boxId && box.palletId === palletId)
    , [selectedBoxes])

    const handleSelectAllBoxes = useCallback(() => {
        const allBoxes = getAllBoxes()
        const availableBoxes = allBoxes.filter(
            (box) => isBoxAvailable(box) && !isBoxSelected(box.id, box.palletId)
        )
        setSelectedBoxes((prev) => [
            ...prev,
            ...availableBoxes.map((box) => ({ boxId: box.id, palletId: box.palletId }))
        ])
    }, [getAllBoxes, isBoxAvailable, isBoxSelected])

    const handleUnselectAllBoxes = useCallback(() => setSelectedBoxes([]), [])

    const handleAddInputs = useCallback(async () => {
        if (selectedBoxes.length === 0) {
            toast.error('Por favor selecciona al menos una caja')
            return
        }
        try {
            setSavingInputs(true)
            const token = session?.user?.accessToken
            if (!token) return
            if (!productionRecordId || isNaN(productionRecordId)) {
                toast.error('Error: El ID del registro de producción no es válido')
                return
            }
            const boxIds = selectedBoxes
                .map((box) => box?.boxId)
                .filter((id) => id != null && id !== '' && !isNaN(id) && Number(id) > 0)
                .map((id) => Number(id))
            const uniqueBoxIds = [...new Set(boxIds)]
            if (uniqueBoxIds.length === 0) {
                toast.error('No se encontraron IDs válidos en las cajas seleccionadas.')
                return
            }
            try {
                await syncMultipleProductionInputs(Number(productionRecordId), uniqueBoxIds, token)
                toast.success('Inputs sincronizados correctamente.')
            } catch (err) {
                console.error('Error al sincronizar múltiples inputs:', err)
                const errorMessage = err?.data?.message || err?.message || 'Error al guardar las entradas'
                toast.error(errorMessage)
                throw err
            }
            setAddDialogOpen(false)
            setPalletSearch('')
            setLoadedPallets([])
            setSelectedBoxes([])
            setTargetWeight({})
            setSelectionMode('manual')
            setSelectedPalletId(null)
            setScannedCode('')
            setWeightSearch('')
            setWeightSearchResults([])
            setTargetWeightResults([])
            const response = await getProductionInputs(token, { production_record_id: productionRecordId })
            const updatedInputs = response.data || []
            setInputs(updatedInputs)
            if (updateInputs) {
                await updateInputs(updatedInputs, false)
            } else if (updateRecord) {
                await updateRecord()
            } else if (onRefresh) {
                onRefresh()
            }
        } catch (err) {
            console.error('Error adding/editing inputs:', err)
            const errorMessage =
                err?.data?.message || err?.data?.error || err?.message || 'Error al guardar las entradas'
            toast.error(errorMessage)
        } finally {
            setSavingInputs(false)
        }
    }, [onRefresh, productionRecordId, selectedBoxes, session?.user?.accessToken, updateInputs, updateRecord])

    const handleDeleteInput = useCallback((inputId) => {
        setDeleteInputConfirm({ open: true, inputId, mode: 'single' })
    }, [])

    const handleDeleteAllInputs = useCallback(() => {
        if (inputs.length === 0) return
        setDeleteInputConfirm({ open: true, inputId: null, mode: 'all' })
    }, [inputs.length])

    const confirmDeleteInput = useCallback(async () => {
        const { inputId, mode } = deleteInputConfirm
        setDeleteInputConfirm({ open: false, inputId: null, mode: 'single' })
        try {
            const token = session?.user?.accessToken
            if (!token) return
            if (mode === 'single') {
                await deleteProductionInput(inputId, token)
            } else {
                const inputIds = inputs.map((input) => input.id)
                await deleteMultipleProductionInputs(inputIds, token)
            }
            const response = await getProductionInputs(token, { production_record_id: productionRecordId })
            const updatedInputs = response.data || []
            setInputs(updatedInputs)
            if (updateInputs) await updateInputs(updatedInputs, false)
            else if (updateRecord) await updateRecord()
            else if (onRefresh) onRefresh()
        } catch (err) {
            console.error('Error deleting input:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al eliminar la entrada'
            toast.error(errorMessage)
        }
    }, [deleteInputConfirm, inputs, onRefresh, productionRecordId, session?.user?.accessToken, updateInputs, updateRecord])

    const summaryByPallet = useMemo(() => {
        const summaryByPallet = {}
        inputs.forEach((input) => {
            if (!input.box || !input.box.palletId) return
            const palletId = input.box.palletId
            if (!summaryByPallet[palletId]) {
                summaryByPallet[palletId] = {
                    palletId,
                    boxes: [],
                    totalWeight: 0,
                    products: new Set(),
                    productsBreakdown: {}
                }
            }
            const palletSummary = summaryByPallet[palletId]
            palletSummary.boxes.push(input.box.id)
            palletSummary.totalWeight += parseFloat(input.box?.netWeight || 0)
            if (input.box.product?.name) {
                const productName = input.box.product.name
                palletSummary.products.add(productName)
                if (!palletSummary.productsBreakdown[productName]) {
                    palletSummary.productsBreakdown[productName] = {
                        name: productName,
                        boxesCount: 0,
                        totalWeight: 0,
                        lots: new Set(),
                        boxes: []
                    }
                }
                palletSummary.productsBreakdown[productName].boxesCount += 1
                palletSummary.productsBreakdown[productName].totalWeight += parseFloat(
                    input.box?.netWeight || 0
                )
                if (input.box.lot) palletSummary.productsBreakdown[productName].lots.add(input.box.lot)
                palletSummary.productsBreakdown[productName].boxes.push({
                    id: input.box.id,
                    lot: input.box.lot || null,
                    weight: parseFloat(input.box?.netWeight || 0)
                })
            }
        })
        return Object.values(summaryByPallet).map((pallet) => ({
            ...pallet,
            boxesCount: pallet.boxes.length,
            products: Array.from(pallet.products),
            productsBreakdown: Object.values(pallet.productsBreakdown).map((product) => ({
                ...product,
                lots: Array.from(product.lots).sort()
            })).sort((a, b) => b.totalWeight - a.totalWeight)
        }))
    }, [inputs])

    const productsBreakdown = useMemo(() => {
        const productsMap = {}
        inputs.forEach((input) => {
            if (!input.box?.product?.name) return
            const productName = input.box.product.name
            const inputWeight = parseFloat(input.box?.netWeight || 0)
            const inputCostPerKg = input.costPerKg ?? input.cost_per_kg ?? input.box?.costPerKg ?? input.box?.cost_per_kg ?? null
            const inputTotalCost = input.totalCost ?? input.total_cost ?? (
                inputCostPerKg != null ? (parseFloat(inputCostPerKg) || 0) * inputWeight : 0
            )
            if (!productsMap[productName]) {
                productsMap[productName] = {
                    name: productName,
                    boxesCount: 0,
                    totalWeight: 0,
                    totalCost: 0,
                    costWeightBase: 0,
                    costPerKg: null,
                    lots: new Set(),
                    boxes: []
                }
            }
            productsMap[productName].boxesCount += 1
            productsMap[productName].totalWeight += inputWeight
            productsMap[productName].totalCost += parseFloat(inputTotalCost || 0) || 0
            if (inputCostPerKg !== null && inputCostPerKg !== undefined) {
                productsMap[productName].costWeightBase += inputWeight
                if (productsMap[productName].totalWeight > 0) {
                    productsMap[productName].costPerKg = productsMap[productName].totalCost / productsMap[productName].totalWeight
                }
            }
            if (input.box.lot) productsMap[productName].lots.add(input.box.lot)
            productsMap[productName].boxes.push({
                id: input.box.id,
                lot: input.box.lot || null,
                weight: inputWeight,
                costPerKg: inputCostPerKg,
                totalCost: inputTotalCost,
                palletId: input.box.palletId
            })
        })
        return Object.values(productsMap).map((product) => ({
            ...product,
            lots: Array.from(product.lots).sort()
        })).sort((a, b) => b.totalWeight - a.totalWeight)
    }, [inputs])

    const totalSummary = useMemo(() => {
        const totalBoxes = inputs.filter((input) => input.box?.id).length
        const totalWeight = inputs.reduce((sum, input) => sum + parseFloat(input.box?.netWeight || 0), 0)
        const uniqueProducts = new Set()
        inputs.forEach((input) => {
            if (input.box?.product?.name) uniqueProducts.add(input.box.product.name)
        })
        return {
            totalBoxes,
            totalWeight,
            totalProducts: uniqueProducts.size,
            totalPallets: summaryByPallet.length
        }
    }, [inputs, summaryByPallet])

    const calculateSummaryByPallet = useCallback(() => summaryByPallet, [summaryByPallet])

    const calculateProductsBreakdown = useCallback(() => productsBreakdown, [productsBreakdown])

    const calculateTotalSummary = useCallback(() => totalSummary, [totalSummary])

    const calculateTotalWeight = useCallback(() => {
        const allBoxes = getAllBoxes()
        return selectedBoxes.reduce((total, selectedBox) => {
            const box = allBoxes.find(
                (b) => b.id === selectedBox.boxId && b.palletId === selectedBox.palletId
            )
            return total + parseFloat(box?.netWeight || 0)
        }, 0)
    }, [getAllBoxes, selectedBoxes])

    const handleCalculateByWeight = useCallback((palletId) => {
        const pallet = loadedPallets.find((p) => p.id === palletId)
        if (!pallet || !pallet.boxes || pallet.boxes.length === 0) {
            toast.error('El palet no tiene cajas')
            return
        }
        const weightValue = targetWeight[palletId]
        if (!weightValue) {
            toast.error('Por favor ingresa un peso objetivo para este palet')
            return
        }
        const target = parseFloat(weightValue)
        if (isNaN(target) || target <= 0) {
            toast.error('Por favor ingresa un peso válido mayor a 0')
            return
        }
        const availableBoxes = pallet.boxes
            .filter((box) => isBoxAvailable(box) && !isBoxSelected(box.id, palletId))
            .map((box) => ({ ...box, weight: parseFloat(box.netWeight || 0), palletId }))
            .sort((a, b) => b.weight - a.weight)
        const boxesToAdd = []
        let currentWeight = 0
        for (const box of availableBoxes) {
            if (currentWeight + box.weight <= target) {
                boxesToAdd.push({ boxId: box.id, palletId })
                currentWeight += box.weight
            }
        }
        if (boxesToAdd.length === 0 && availableBoxes.length > 0) {
            const closestBox = availableBoxes.find((box) => box.weight <= target)
            if (closestBox) {
                boxesToAdd.push({ boxId: closestBox.id, palletId })
                currentWeight = closestBox.weight
            }
        }
        if (boxesToAdd.length > 0) {
            const results = boxesToAdd.map((boxToAdd, idx) => {
                const box = availableBoxes.find((b) => b.id === boxToAdd.boxId)
                const result = { box, palletId }
                if (idx === 0) {
                    result.totalWeight = currentWeight
                    result.targetWeight = target
                    result.difference = Math.abs(currentWeight - target)
                }
                return result
            })
            setTargetWeightResults(results)
        } else {
            toast.error('No se pudieron encontrar cajas que se ajusten al peso objetivo')
        }
    }, [isBoxAvailable, isBoxSelected, loadedPallets, targetWeight])

    const handleSelectTargetWeightResults = useCallback(() => {
        if (targetWeightResults.length === 0) {
            toast.error('No hay resultados para seleccionar')
            return
        }
        const boxesToAdd = targetWeightResults.map((result) => ({
            boxId: result.box.id,
            palletId: result.palletId
        }))
        setSelectedBoxes((prev) => {
            const newBoxes = [...prev]
            boxesToAdd.forEach((box) => {
                if (!newBoxes.some((b) => b.boxId === box.boxId && b.palletId === box.palletId)) {
                    newBoxes.push(box)
                }
            })
            return newBoxes
        })
        setTargetWeightResults([])
        setTargetWeight((prev) => ({ ...prev, [selectedPalletId]: '' }))
    }, [selectedPalletId, targetWeightResults])

    const calculateWeightByPallet = useCallback((palletId) => {
        const allBoxes = getAllBoxes()
        const selectedForPallet = getSelectedBoxesForPallet(palletId)
        return selectedForPallet.reduce((total, selectedBox) => {
            const box = allBoxes.find(
                (b) => b.id === selectedBox.boxId && b.palletId === palletId
            )
            return total + parseFloat(box?.netWeight || 0)
        }, 0)
    }, [getAllBoxes, getSelectedBoxesForPallet])

    const calculateWeightByProduct = useCallback(() => {
        const allBoxes = getAllBoxes()
        const productWeights = {}
        selectedBoxes.forEach((selectedBox) => {
            const box = allBoxes.find(
                (b) => b.id === selectedBox.boxId && b.palletId === selectedBox.palletId
            )
            if (box?.product) {
                const productId = box.product.id
                const productName = box.product.name || 'Sin producto'
                if (!productWeights[productId]) {
                    productWeights[productId] = { name: productName, weight: 0 }
                }
                productWeights[productId].weight += parseFloat(box.netWeight || 0)
            }
        })
        return Object.values(productWeights)
    }, [getAllBoxes, selectedBoxes])

    const convertScannedCodeToGs1128 = useCallback((code) => {
        const cleaned = code.replace(/[()]/g, '')
        let match = cleaned.match(/01(\d{14})3100(\d{6})10(.+)/)
        if (match) {
            const [, gtin, weightStr, lot] = match
            return `(01)${gtin}(3100)${weightStr}(10)${lot}`
        }
        match = cleaned.match(/01(\d{14})3200(\d{6})10(.+)/)
        if (match) {
            const [, gtin, weightStr, lot] = match
            return `(01)${gtin}(3200)${weightStr}(10)${lot}`
        }
        match = code.match(/\(01\)(\d{14})\(3100\)(\d{6})\(10\)(.+)/)
        if (match) {
            const [, gtin, weightStr, lot] = match
            return `(01)${gtin}(3100)${weightStr}(10)${lot}`
        }
        match = code.match(/\(01\)(\d{14})\(3200\)(\d{6})\(10\)(.+)/)
        if (match) {
            const [, gtin, weightStr, lot] = match
            return `(01)${gtin}(3200)${weightStr}(10)${lot}`
        }
        return null
    }, [])

    const handleScanGS1Code = useCallback(() => {
        if (!scannedCode.trim()) {
            toast.error('Por favor escanea o ingresa un código GS1-128')
            return
        }
        if (!selectedPalletId) {
            toast.error('Por favor selecciona un palet primero')
            return
        }
        const gs1128Code = convertScannedCodeToGs1128(scannedCode.trim())
        if (!gs1128Code) {
            toast.error('Formato de código GS1-128 no válido')
            setScannedCode('')
            return
        }
        const palletBoxes = getPalletBoxes(selectedPalletId)
        const foundBox = palletBoxes.find((box) => isBoxAvailable(box) && box.gs1128 === gs1128Code)
        if (!foundBox) {
            toast.error(
                `No se encontró ninguna caja disponible con ese código GS1-128 en el palet #${selectedPalletId}`
            )
            setScannedCode('')
            return
        }
        if (isBoxSelected(foundBox.id, selectedPalletId)) {
            toast.error('Esta caja ya está seleccionada')
            setScannedCode('')
            return
        }
        handleToggleBox(foundBox.id, selectedPalletId)
        setScannedCode('')
    }, [convertScannedCodeToGs1128, getPalletBoxes, handleToggleBox, isBoxAvailable, isBoxSelected, scannedCode, selectedPalletId])

    const handleSearchByWeight = useCallback(() => {
        if (!weightSearch.trim()) {
            toast.error('Por favor ingresa un peso')
            return
        }
        if (!selectedPalletId) {
            toast.error('Por favor selecciona un palet primero')
            return
        }
        const target = parseFloat(weightSearch.trim())
        if (isNaN(target) || target <= 0) {
            toast.error('Por favor ingresa un peso válido mayor a 0')
            return
        }
        const palletBoxes = getPalletBoxes(selectedPalletId)
        const results = []
        palletBoxes.forEach((box) => {
            if (!isBoxAvailable(box)) return
            const boxWeight = parseFloat(box.netWeight || 0)
            const difference = Math.abs(boxWeight - target)
            if (
                difference <= weightTolerance &&
                !isBoxSelected(box.id, selectedPalletId)
            ) {
                results.push({ box, palletId: selectedPalletId, matchedWeight: target, difference })
            }
        })
        results.sort((a, b) => a.difference - b.difference)
        setWeightSearchResults(results)
        if (results.length === 0) {
            toast.error(
                `No se encontraron cajas que coincidan con el peso ingresado en el palet #${selectedPalletId} (tolerancia: ±${weightTolerance} kg)`
            )
        }
    }, [getPalletBoxes, isBoxAvailable, isBoxSelected, selectedPalletId, weightSearch, weightTolerance])

    const handleSelectWeightSearchResults = useCallback(() => {
        if (weightSearchResults.length === 0) {
            toast.error('No hay resultados para seleccionar')
            return
        }
        const boxesToAdd = weightSearchResults.map((result) => ({
            boxId: result.box.id,
            palletId: result.palletId
        }))
        setSelectedBoxes((prev) => {
            const newBoxes = [...prev]
            boxesToAdd.forEach((box) => {
                if (!newBoxes.some((b) => b.boxId === box.boxId && b.palletId === box.palletId)) {
                    newBoxes.push(box)
                }
            })
            return newBoxes
        })
        setWeightSearchResults([])
        setWeightSearch('')
    }, [weightSearchResults])

    const hasSelectionChanges = useMemo(() => {
        const currentBoxIds = new Set(
            inputs
                .map((input) => Number(input?.box?.id))
                .filter((id) => Number.isFinite(id) && id > 0)
        )
        const selectedBoxIds = new Set(
            selectedBoxes
                .map((box) => Number(box?.boxId))
                .filter((id) => Number.isFinite(id) && id > 0)
        )

        if (currentBoxIds.size !== selectedBoxIds.size) return true
        for (const selectedId of selectedBoxIds) {
            if (!currentBoxIds.has(selectedId)) return true
        }
        return false
    }, [inputs, selectedBoxes])

    const resetAddDialog = useCallback(() => {
        setPalletSearch('')
        setLoadedPallets([])
        setSelectedBoxes([])
        setTargetWeight({})
        setSelectionMode('manual')
        setSelectedPalletId(null)
        setScannedCode('')
        setWeightSearch('')
        setWeightSearchResults([])
        setTargetWeightResults([])
    }, [])

    return {
        inputs,
        setInputs,
        loading,
        error,
        addDialogOpen,
        setAddDialogOpen,
        loadExistingDataForEdit,
        resetAddDialog,
        palletSearch,
        setPalletSearch,
        loadedPallets,
        selectedBoxes,
        setSelectedBoxes,
        loadingPallet,
        savingInputs,
        selectionMode,
        setSelectionMode,
        targetWeight,
        setTargetWeight,
        selectedPalletId,
        setSelectedPalletId,
        scannedCode,
        setScannedCode,
        weightSearch,
        setWeightSearch,
        weightSearchResults,
        setWeightSearchResults,
        weightTolerance,
        setWeightTolerance,
        hasSelectionChanges,
        targetWeightResults,
        setTargetWeightResults,
        lotsDialogOpen,
        setLotsDialogOpen,
        selectedProductLots,
        setSelectedProductLots,
        palletsDialogOpen,
        setPalletsDialogOpen,
        isBoxAvailable,
        wasPreviouslyConsumed,
        getAllBoxes,
        getPalletBoxes,
        getSelectedBoxesForPallet,
        handleSearchPallet,
        handleRemovePallet,
        handleToggleBox,
        isBoxSelected,
        handleSelectAllBoxes,
        handleUnselectAllBoxes,
        handleAddInputs,
        handleDeleteInput,
        handleDeleteAllInputs,
        deleteInputConfirm,
        setDeleteInputConfirm,
        confirmDeleteInput,
        calculateSummaryByPallet,
        calculateProductsBreakdown,
        calculateTotalSummary,
        calculateTotalWeight,
        handleCalculateByWeight,
        handleSelectTargetWeightResults,
        calculateWeightByPallet,
        calculateWeightByProduct,
        handleScanGS1Code,
        handleSearchByWeight,
        handleSelectWeightSearchResults
    }
}
