'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
    getProductionInputs,
    createMultipleProductionInputs,
    deleteProductionInput,
    deleteMultipleProductionInputs
} from '@/services/productionService'
import { getPallet, searchPalletsByLot } from '@/services/palletService'
import { useProductionRecordContextOptional } from '@/context/ProductionRecordContext'

/**
 * Hook con toda la lógica de ProductionInputsManager: estado, carga de inputs,
 * diálogo de agregar (palets, selección manual/peso/GS1/búsqueda por peso),
 * eliminación y cálculos de resumen.
 * @param {{ productionRecordId: number, initialInputsProp?: array, onRefresh?: function }} options
 * @returns {object} API para el componente y subcomponentes (inputs, loading, handlers, etc.)
 */
export function useProductionInputsManager({ productionRecordId, initialInputsProp = [], onRefresh }) {
    const { data: session } = useSession()
    const contextData = useProductionRecordContextOptional()
    const contextInputs = contextData?.recordInputs || []
    const initialInputs = contextInputs.length > 0 ? contextInputs : initialInputsProp
    const updateInputs = contextData?.updateInputs
    const updateRecord = contextData?.updateRecord

    const [inputs, setInputs] = useState(initialInputs)
    const [loading, setLoading] = useState(initialInputs.length === 0)
    const [error, setError] = useState(null)
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

    const isBoxAvailable = (box) => box.isAvailable !== false

    const getAllBoxes = () =>
        loadedPallets.flatMap((pallet) =>
            (pallet.boxes || []).map((box) => ({ ...box, palletId: pallet.id }))
        )

    const hasInitializedRef = useRef(false)
    const previousInputsIdsRef = useRef(null)

    const inputsKey = useMemo(() => {
        const currentInputs = contextInputs.length > 0 ? contextInputs : initialInputsProp
        if (!currentInputs || currentInputs.length === 0) return null
        return currentInputs
            .map((input) => input.id || input.boxId || JSON.stringify(input))
            .sort()
            .join(',')
    }, [contextInputs, initialInputsProp])

    useEffect(() => {
        if (hasInitializedRef.current) return
        if (!session?.user?.accessToken || !productionRecordId) return
        const currentInputs = contextInputs.length > 0 ? contextInputs : initialInputsProp
        if (currentInputs && Array.isArray(currentInputs) && currentInputs.length > 0) {
            setInputs(currentInputs)
            setLoading(false)
            hasInitializedRef.current = true
            previousInputsIdsRef.current = inputsKey
            return
        }
        loadInputs().finally(() => {
            hasInitializedRef.current = true
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.accessToken, productionRecordId])

    useEffect(() => {
        if (!hasInitializedRef.current) return
        const currentInputs = contextInputs.length > 0 ? contextInputs : initialInputsProp
        if (!currentInputs || !Array.isArray(currentInputs) || currentInputs.length === 0) {
            if (inputs.length > 0) setInputs([])
            return
        }
        if (inputsKey !== previousInputsIdsRef.current) {
            setInputs(currentInputs)
            previousInputsIdsRef.current = inputsKey
        }
    }, [inputsKey, contextInputs, initialInputsProp, inputs.length])

    const loadInputsOnly = async () => {
        try {
            const token = session?.user?.accessToken
            if (!token) return
            const response = await getProductionInputs(token, { production_record_id: productionRecordId })
            setInputs(response.data || [])
        } catch (err) {
            console.warn('Error loading inputs:', err)
        }
    }

    const loadInputs = async () => {
        try {
            setLoading(true)
            setError(null)
            const token = session?.user?.accessToken
            if (!token) return
            const response = await getProductionInputs(token, { production_record_id: productionRecordId })
            setInputs(response.data || [])
        } catch (err) {
            console.error('Error loading inputs:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al cargar las entradas'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const loadExistingDataForEdit = async () => {
        if (inputs.length === 0) return
        try {
            setLoadingPallet(true)
            const token = session?.user?.accessToken
            if (!token) return
            const palletIds = [...new Set(inputs.map((input) => input.box?.palletId).filter(Boolean))]
            if (palletIds.length === 0) {
                setLoadingPallet(false)
                return
            }
            const palletsPromises = palletIds.map((palletId) => getPallet(palletId, token))
            const loadedPalletsData = await Promise.all(palletsPromises)
            setLoadedPallets(loadedPalletsData)
            if (loadedPalletsData.length > 0) setSelectedPalletId(loadedPalletsData[0].id)
            const existingBoxSelections = inputs
                .filter((input) => input.box?.id && input.box?.palletId)
                .map((input) => ({ boxId: input.box.id, palletId: input.box.palletId }))
            setSelectedBoxes(existingBoxSelections)
        } catch (err) {
            console.error('Error loading existing data:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al cargar los datos existentes'
            alert(errorMessage)
        } finally {
            setLoadingPallet(false)
        }
    }

    const handleSearchPallet = async () => {
        if (!palletSearch.trim()) {
            alert('Por favor ingresa un ID de palet o un lote')
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
                    alert(`No se encontraron palets con el lote "${searchTerm}"`)
                    setPalletSearch('')
                    return
                }
                const newPallets = pallets.filter(
                    (p) => !loadedPallets.some((loaded) => loaded.id === p.id)
                )
                if (newPallets.length === 0) {
                    alert('Todos los palets con este lote ya están cargados')
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
            alert(errorMessage)
        } finally {
            setLoadingPallet(false)
        }
    }

    const handleRemovePallet = (palletId) => {
        setLoadedPallets((prev) => prev.filter((p) => p.id !== palletId))
        setSelectedBoxes((prev) => prev.filter((box) => box.palletId !== palletId))
        if (selectedPalletId === palletId) {
            const remainingPallets = loadedPallets.filter((p) => p.id !== palletId)
            setSelectedPalletId(remainingPallets.length > 0 ? remainingPallets[0].id : null)
        }
    }

    const getPalletBoxes = (palletId) => {
        const pallet = loadedPallets.find((p) => p.id === palletId)
        return pallet?.boxes || []
    }

    const getSelectedBoxesForPallet = (palletId) =>
        selectedBoxes.filter((box) => box.palletId === palletId)

    const handleToggleBox = (boxId, palletId) => {
        setSelectedBoxes((prev) => {
            const exists = prev.some((box) => box.boxId === boxId && box.palletId === palletId)
            if (exists) return prev.filter((box) => !(box.boxId === boxId && box.palletId === palletId))
            return [...prev, { boxId, palletId }]
        })
    }

    const isBoxSelected = (boxId, palletId) =>
        selectedBoxes.some((box) => box.boxId === boxId && box.palletId === palletId)

    const handleSelectAllBoxes = () => {
        const allBoxes = getAllBoxes()
        const availableBoxes = allBoxes.filter(
            (box) => isBoxAvailable(box) && !isBoxSelected(box.id, box.palletId)
        )
        setSelectedBoxes((prev) => [
            ...prev,
            ...availableBoxes.map((box) => ({ boxId: box.id, palletId: box.palletId }))
        ])
    }

    const handleUnselectAllBoxes = () => setSelectedBoxes([])

    const handleAddInputs = async () => {
        if (selectedBoxes.length === 0) {
            alert('Por favor selecciona al menos una caja')
            return
        }
        try {
            setSavingInputs(true)
            const token = session?.user?.accessToken
            if (!token) return
            if (!productionRecordId || isNaN(productionRecordId)) {
                alert('Error: El ID del registro de producción no es válido')
                return
            }
            const boxIds = selectedBoxes
                .map((box) => box?.boxId)
                .filter((id) => id != null && id !== '' && !isNaN(id) && Number(id) > 0)
                .map((id) => Number(id))
            if (boxIds.length === 0) {
                alert('No se encontraron IDs válidos en las cajas seleccionadas.')
                return
            }
            if (inputs.length > 0) {
                const inputIds = inputs
                    .map((input) => input.id)
                    .filter((id) => id != null && !isNaN(id))
                    .map((id) => Number(id))
                if (inputIds.length > 0) {
                    await deleteMultipleProductionInputs(inputIds, token)
                }
            }
            try {
                await createMultipleProductionInputs(Number(productionRecordId), boxIds, token)
            } catch (err) {
                console.error('Error al crear múltiples inputs:', err)
                const errorMessage = err?.data?.message || err?.message || 'Error al guardar las entradas'
                alert(errorMessage)
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
            alert(errorMessage)
        } finally {
            setSavingInputs(false)
        }
    }

    const handleDeleteInput = async (inputId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta entrada?')) return
        try {
            const token = session?.user?.accessToken
            if (!token) return
            await deleteProductionInput(inputId, token)
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
            alert(errorMessage)
        }
    }

    const handleDeleteAllInputs = async () => {
        if (inputs.length === 0) return
        if (
            !confirm(
                `¿Estás seguro de que deseas eliminar todo el consumo?\n\nSe eliminarán ${inputs.length} ${inputs.length === 1 ? 'entrada' : 'entradas'} de materia prima.`
            )
        ) {
            return
        }
        try {
            const token = session?.user?.accessToken
            if (!token) return
            const inputIds = inputs.map((input) => input.id)
            await deleteMultipleProductionInputs(inputIds, token)
            const response = await getProductionInputs(token, { production_record_id: productionRecordId })
            const updatedInputs = response.data || []
            setInputs(updatedInputs)
            if (updateInputs) await updateInputs(updatedInputs, false)
            else if (updateRecord) await updateRecord()
            else if (onRefresh) onRefresh()
        } catch (err) {
            console.error('Error deleting all inputs:', err)
            const errorMessage =
                err.userMessage ||
                err.data?.userMessage ||
                err.response?.data?.userMessage ||
                err.message ||
                'Error al eliminar el consumo'
            alert(errorMessage)
        }
    }

    const calculateSummaryByPallet = () => {
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
    }

    const calculateProductsBreakdown = () => {
        const productsMap = {}
        inputs.forEach((input) => {
            if (!input.box?.product?.name) return
            const productName = input.box.product.name
            if (!productsMap[productName]) {
                productsMap[productName] = {
                    name: productName,
                    boxesCount: 0,
                    totalWeight: 0,
                    lots: new Set(),
                    boxes: []
                }
            }
            productsMap[productName].boxesCount += 1
            productsMap[productName].totalWeight += parseFloat(input.box?.netWeight || 0)
            if (input.box.lot) productsMap[productName].lots.add(input.box.lot)
            productsMap[productName].boxes.push({
                id: input.box.id,
                lot: input.box.lot || null,
                weight: parseFloat(input.box?.netWeight || 0),
                palletId: input.box.palletId
            })
        })
        return Object.values(productsMap).map((product) => ({
            ...product,
            lots: Array.from(product.lots).sort()
        })).sort((a, b) => b.totalWeight - a.totalWeight)
    }

    const calculateTotalSummary = () => {
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
            totalPallets: calculateSummaryByPallet().length
        }
    }

    const calculateTotalWeight = () => {
        const allBoxes = getAllBoxes()
        return selectedBoxes.reduce((total, selectedBox) => {
            const box = allBoxes.find(
                (b) => b.id === selectedBox.boxId && b.palletId === selectedBox.palletId
            )
            return total + parseFloat(box?.netWeight || 0)
        }, 0)
    }

    const handleCalculateByWeight = (palletId) => {
        const pallet = loadedPallets.find((p) => p.id === palletId)
        if (!pallet || !pallet.boxes || pallet.boxes.length === 0) {
            alert('El palet no tiene cajas')
            return
        }
        const weightValue = targetWeight[palletId]
        if (!weightValue) {
            alert('Por favor ingresa un peso objetivo para este palet')
            return
        }
        const target = parseFloat(weightValue)
        if (isNaN(target) || target <= 0) {
            alert('Por favor ingresa un peso válido mayor a 0')
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
            alert('No se pudieron encontrar cajas que se ajusten al peso objetivo')
        }
    }

    const handleSelectTargetWeightResults = () => {
        if (targetWeightResults.length === 0) {
            alert('No hay resultados para seleccionar')
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
    }

    const calculateWeightByPallet = (palletId) => {
        const allBoxes = getAllBoxes()
        const selectedForPallet = getSelectedBoxesForPallet(palletId)
        return selectedForPallet.reduce((total, selectedBox) => {
            const box = allBoxes.find(
                (b) => b.id === selectedBox.boxId && b.palletId === palletId
            )
            return total + parseFloat(box?.netWeight || 0)
        }, 0)
    }

    const calculateWeightByProduct = () => {
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
    }

    const convertScannedCodeToGs1128 = (code) => {
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
    }

    const handleScanGS1Code = () => {
        if (!scannedCode.trim()) {
            alert('Por favor escanea o ingresa un código GS1-128')
            return
        }
        if (!selectedPalletId) {
            alert('Por favor selecciona un palet primero')
            return
        }
        const gs1128Code = convertScannedCodeToGs1128(scannedCode.trim())
        if (!gs1128Code) {
            alert('Formato de código GS1-128 no válido')
            setScannedCode('')
            return
        }
        const palletBoxes = getPalletBoxes(selectedPalletId)
        const foundBox = palletBoxes.find((box) => isBoxAvailable(box) && box.gs1128 === gs1128Code)
        if (!foundBox) {
            alert(
                `No se encontró ninguna caja disponible con ese código GS1-128 en el palet #${selectedPalletId}`
            )
            setScannedCode('')
            return
        }
        if (isBoxSelected(foundBox.id, selectedPalletId)) {
            alert('Esta caja ya está seleccionada')
            setScannedCode('')
            return
        }
        handleToggleBox(foundBox.id, selectedPalletId)
        setScannedCode('')
    }

    const handleSearchByWeight = () => {
        if (!weightSearch.trim()) {
            alert('Por favor ingresa un peso')
            return
        }
        if (!selectedPalletId) {
            alert('Por favor selecciona un palet primero')
            return
        }
        const target = parseFloat(weightSearch.trim())
        if (isNaN(target) || target <= 0) {
            alert('Por favor ingresa un peso válido mayor a 0')
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
            alert(
                `No se encontraron cajas que coincidan con el peso ingresado en el palet #${selectedPalletId} (tolerancia: ±${weightTolerance} kg)`
            )
        }
    }

    const handleSelectWeightSearchResults = () => {
        if (weightSearchResults.length === 0) {
            alert('No hay resultados para seleccionar')
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
    }

    const resetAddDialog = () => {
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
    }

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
        targetWeightResults,
        setTargetWeightResults,
        lotsDialogOpen,
        setLotsDialogOpen,
        selectedProductLots,
        setSelectedProductLots,
        palletsDialogOpen,
        setPalletsDialogOpen,
        isBoxAvailable,
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
