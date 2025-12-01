'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
    getProductionInputs, 
    createMultipleProductionInputs, 
    deleteProductionInput,
    getProductionRecord,
    getAvailableOutputs,
    getProductionOutputConsumptions,
    createProductionOutputConsumption,
    updateProductionOutputConsumption,
    deleteProductionOutputConsumption
} from '@/services/productionService'
import { getPallet } from '@/services/palletService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Package, Search, X, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Calculator, CheckCircle, Box, Scan, Scale, Hand, Target, Edit, Layers, Weight, Info, Tag, Unlink, ArrowDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/Utilities/EmptyState'
import Loader from '@/components/Utilities/Loader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const ProductionInputsManager = ({ productionRecordId, onRefresh, hideTitle = false, renderInCard = false, cardTitle, cardDescription }) => {
    const { data: session } = useSession()
    const [inputs, setInputs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [addDialogOpen, setAddDialogOpen] = useState(false)

    // Estados para el diálogo de agregar cajas
    const [palletSearch, setPalletSearch] = useState('')
    const [loadedPallets, setLoadedPallets] = useState([]) // Array de palets cargados
    const [selectedBoxes, setSelectedBoxes] = useState([]) // Array de {boxId, palletId}
    const [loadingPallet, setLoadingPallet] = useState(false)
    const [savingInputs, setSavingInputs] = useState(false)
    const [selectionMode, setSelectionMode] = useState('manual') // 'manual', 'weight', 'scanner', 'weight-search'
    const [targetWeight, setTargetWeight] = useState({}) // {palletId: weight}
    const [selectedPalletId, setSelectedPalletId] = useState(null) // Palet actualmente seleccionado para ver sus cajas

    // Estados para el lector GS1-128
    const [scannedCode, setScannedCode] = useState('')

    // Estados para búsqueda por peso
    const [weightSearch, setWeightSearch] = useState('')
    const [weightSearchResults, setWeightSearchResults] = useState([]) // Array de {box, palletId, matchedWeight}
    const [weightTolerance, setWeightTolerance] = useState(0.01) // Tolerancia en kg para búsqueda por peso

    // Estados para peso total objetivo
    const [targetWeightResults, setTargetWeightResults] = useState([]) // Array de {box, palletId, totalWeight}

    // Estado para el diálogo de lotes
    const [lotsDialogOpen, setLotsDialogOpen] = useState(false)
    const [selectedProductLots, setSelectedProductLots] = useState(null) // {productName, lots, boxes}

    // Estados para consumos de outputs del padre
    const [productionRecord, setProductionRecord] = useState(null)
    const [parentOutputConsumptions, setParentOutputConsumptions] = useState([])
    const [availableOutputs, setAvailableOutputs] = useState([])
    const [addConsumptionDialogOpen, setAddConsumptionDialogOpen] = useState(false)
    const [consumptionFormData, setConsumptionFormData] = useState({
        production_output_id: '',
        consumed_weight_kg: '',
        consumed_boxes: '',
        notes: ''
    })
    const [savingConsumption, setSavingConsumption] = useState(false)
    const [loadingAvailableOutputs, setLoadingAvailableOutputs] = useState(false)

    // Helper function to check if box is available
    const isBoxAvailable = (box) => {
        return box.isAvailable !== false;
    };

    // Obtener todas las cajas de todos los palets cargados
    const getAllBoxes = () => {
        return loadedPallets.flatMap(pallet =>
            (pallet.boxes || []).map(box => ({ ...box, palletId: pallet.id }))
        )
    }

    useEffect(() => {
        if (session?.user?.accessToken && productionRecordId) {
            loadInputs()
            loadProductionRecord()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.accessToken, productionRecordId])

    const loadInputs = async () => {
        try {
            setLoading(true)
            setError(null)
            const token = session.user.accessToken
            const response = await getProductionInputs(token, { production_record_id: productionRecordId })
            setInputs(response.data || [])
        } catch (err) {
            console.error('Error loading inputs:', err)
            setError(err.message || 'Error al cargar las entradas')
        } finally {
            setLoading(false)
        }
    }

    const loadProductionRecord = async () => {
        try {
            const token = session.user.accessToken
            const record = await getProductionRecord(productionRecordId, token)
            setProductionRecord(record)
            
            // Cargar consumos del padre si existen
            if (record.parentOutputConsumptions) {
                setParentOutputConsumptions(record.parentOutputConsumptions)
            } else {
                setParentOutputConsumptions([])
            }
        } catch (err) {
            console.error('Error loading production record:', err)
        }
    }

    const loadAvailableOutputs = async () => {
        if (!productionRecord?.parent_record_id) {
            return
        }

        try {
            setLoadingAvailableOutputs(true)
            const token = session.user.accessToken
            const response = await getAvailableOutputs(productionRecordId, token)
            setAvailableOutputs(response.data || [])
        } catch (err) {
            console.error('Error loading available outputs:', err)
            alert(err.message || 'Error al cargar los outputs disponibles')
        } finally {
            setLoadingAvailableOutputs(false)
        }
    }

    const loadExistingDataForEdit = async () => {
        if (inputs.length === 0) {
            return // No hay datos que cargar
        }

        try {
            setLoadingPallet(true)
            const token = session.user.accessToken

            // Extraer palet IDs únicos de los inputs existentes
            const palletIds = [...new Set(inputs.map(input => input.box?.palletId).filter(Boolean))]

            if (palletIds.length === 0) {
                setLoadingPallet(false)
                return
            }

            // Cargar todos los palets en paralelo
            const palletsPromises = palletIds.map(palletId => getPallet(palletId, token))
            const loadedPalletsData = await Promise.all(palletsPromises)

            // Establecer los palets cargados
            setLoadedPallets(loadedPalletsData)

            // Seleccionar el primer palet
            if (loadedPalletsData.length > 0) {
                setSelectedPalletId(loadedPalletsData[0].id)
            }

            // Preseleccionar las cajas que ya están en los inputs
            const existingBoxSelections = inputs
                .filter(input => input.box?.id && input.box?.palletId)
                .map(input => ({
                    boxId: input.box.id,
                    palletId: input.box.palletId
                }))

            setSelectedBoxes(existingBoxSelections)
        } catch (err) {
            console.error('Error loading existing data:', err)
            alert(err.message || 'Error al cargar los datos existentes')
        } finally {
            setLoadingPallet(false)
        }
    }

    const handleSearchPallet = async () => {
        if (!palletSearch.trim()) {
            alert('Por favor ingresa un ID de palet')
            return
        }

        const palletId = palletSearch.trim()

        // Verificar si el palet ya está cargado
        if (loadedPallets.some(p => p.id.toString() === palletId)) {
            alert('Este palet ya está cargado')
            setPalletSearch('')
            return
        }

        try {
            setLoadingPallet(true)
            const token = session.user.accessToken
            const pallet = await getPallet(palletId, token)
            setLoadedPallets(prev => {
                // Si es el primer palet, seleccionarlo automáticamente
                if (prev.length === 0) {
                    setSelectedPalletId(pallet.id)
                }
                return [...prev, pallet]
            })
            setPalletSearch('')
        } catch (err) {
            console.error('Error loading pallet:', err)
            alert(err.message || 'Error al cargar el palet')
        } finally {
            setLoadingPallet(false)
        }
    }

    const handleRemovePallet = (palletId) => {
        setLoadedPallets(prev => prev.filter(p => p.id !== palletId))
        // Remover las cajas seleccionadas de ese palet
        setSelectedBoxes(prev => prev.filter(box => box.palletId !== palletId))
        // Si el palet eliminado era el seleccionado, seleccionar otro o null
        if (selectedPalletId === palletId) {
            const remainingPallets = loadedPallets.filter(p => p.id !== palletId)
            setSelectedPalletId(remainingPallets.length > 0 ? remainingPallets[0].id : null)
        }
    }

    // Obtener cajas de un palet específico
    const getPalletBoxes = (palletId) => {
        const pallet = loadedPallets.find(p => p.id === palletId)
        return pallet?.boxes || []
    }

    // Obtener cajas seleccionadas de un palet específico
    const getSelectedBoxesForPallet = (palletId) => {
        return selectedBoxes.filter(box => box.palletId === palletId)
    }

    const handleToggleBox = (boxId, palletId) => {
        setSelectedBoxes(prev => {
            const exists = prev.some(box => box.boxId === boxId && box.palletId === palletId)
            if (exists) {
                return prev.filter(box => !(box.boxId === boxId && box.palletId === palletId))
            } else {
                return [...prev, { boxId, palletId }]
            }
        })
    }

    const isBoxSelected = (boxId, palletId) => {
        return selectedBoxes.some(box => box.boxId === boxId && box.palletId === palletId)
    }

    const handleSelectAllBoxes = () => {
        const allBoxes = getAllBoxes()
        const availableBoxes = allBoxes.filter(box => isBoxAvailable(box) && !isBoxSelected(box.id, box.palletId))
        setSelectedBoxes(prev => [...prev, ...availableBoxes.map(box => ({ boxId: box.id, palletId: box.palletId }))])
    }

    const handleUnselectAllBoxes = () => {
        setSelectedBoxes([])
    }

    const handleAddInputs = async () => {
        if (selectedBoxes.length === 0) {
            alert('Por favor selecciona al menos una caja')
            return
        }

        try {
            setSavingInputs(true)
            const token = session.user.accessToken
            const boxIds = selectedBoxes.map(box => box.boxId)

            // Si hay inputs existentes, eliminarlos todos primero
            if (inputs.length > 0) {
                const deletePromises = inputs.map(input => deleteProductionInput(input.id, token))
                await Promise.all(deletePromises)
            }

            // Crear las nuevas cajas seleccionadas
            if (boxIds.length > 0) {
                await createMultipleProductionInputs(parseInt(productionRecordId), boxIds, token)
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
            loadInputs()
            if (onRefresh) onRefresh()
        } catch (err) {
            console.error('Error adding/editing inputs:', err)
            alert(err.message || 'Error al guardar las entradas')
        } finally {
            setSavingInputs(false)
        }
    }

    const handleDeleteInput = async (inputId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta entrada?')) {
            return
        }

        try {
            const token = session.user.accessToken
            await deleteProductionInput(inputId, token)
            loadInputs()
            if (onRefresh) onRefresh()
        } catch (err) {
            console.error('Error deleting input:', err)
            alert(err.message || 'Error al eliminar la entrada')
        }
    }

    // Funciones para manejar consumos de outputs del padre
    const handleOpenConsumptionDialog = async () => {
        setAddConsumptionDialogOpen(true)
        await loadAvailableOutputs()
        // Si ya existe un consumo, cargar sus datos para edición
        if (parentOutputConsumptions.length > 0) {
            const existingConsumption = parentOutputConsumptions[0]
            setConsumptionFormData({
                production_output_id: existingConsumption.production_output_id?.toString() || '',
                consumed_weight_kg: existingConsumption.consumed_weight_kg?.toString() || '',
                consumed_boxes: existingConsumption.consumed_boxes?.toString() || '',
                notes: existingConsumption.notes || ''
            })
        } else {
            setConsumptionFormData({
                production_output_id: '',
                consumed_weight_kg: '',
                consumed_boxes: '',
                notes: ''
            })
        }
    }

    const handleSaveConsumption = async () => {
        if (!consumptionFormData.production_output_id) {
            alert('Por favor selecciona un output')
            return
        }

        const weight = parseFloat(consumptionFormData.consumed_weight_kg)
        if (isNaN(weight) || weight <= 0) {
            alert('Por favor ingresa un peso válido mayor a 0')
            return
        }

        // Validar disponibilidad
        const selectedOutput = availableOutputs.find(
            o => o.output.id.toString() === consumptionFormData.production_output_id
        )
        if (!selectedOutput) {
            alert('Output seleccionado no encontrado')
            return
        }

        if (weight > selectedOutput.availableWeight) {
            alert(`Solo hay ${selectedOutput.availableWeight.toFixed(2)}kg disponible`)
            return
        }

        const boxes = consumptionFormData.consumed_boxes 
            ? parseInt(consumptionFormData.consumed_boxes) 
            : undefined

        if (boxes !== undefined && boxes > selectedOutput.availableBoxes) {
            alert(`Solo hay ${selectedOutput.availableBoxes} cajas disponibles`)
            return
        }

        try {
            setSavingConsumption(true)
            const token = session.user.accessToken

            const consumptionData = {
                production_record_id: parseInt(productionRecordId),
                production_output_id: parseInt(consumptionFormData.production_output_id),
                consumed_weight_kg: weight,
                consumed_boxes: boxes,
                notes: consumptionFormData.notes || undefined
            }

            // Si ya existe un consumo de este output, actualizarlo
            const existingConsumption = parentOutputConsumptions.find(
                c => c.production_output_id?.toString() === consumptionFormData.production_output_id
            )

            if (existingConsumption) {
                await updateProductionOutputConsumption(existingConsumption.id, {
                    consumed_weight_kg: weight,
                    consumed_boxes: boxes,
                    notes: consumptionFormData.notes || undefined
                }, token)
            } else {
                await createProductionOutputConsumption(consumptionData, token)
            }

            setAddConsumptionDialogOpen(false)
            setConsumptionFormData({
                production_output_id: '',
                consumed_weight_kg: '',
                consumed_boxes: '',
                notes: ''
            })
            await loadProductionRecord()
            if (onRefresh) onRefresh()
        } catch (err) {
            console.error('Error saving consumption:', err)
            alert(err.message || 'Error al guardar el consumo')
        } finally {
            setSavingConsumption(false)
        }
    }

    const handleDeleteConsumption = async (consumptionId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este consumo del padre?')) {
            return
        }

        try {
            const token = session.user.accessToken
            await deleteProductionOutputConsumption(consumptionId, token)
            await loadProductionRecord()
            if (onRefresh) onRefresh()
        } catch (err) {
            console.error('Error deleting consumption:', err)
            alert(err.message || 'Error al eliminar el consumo')
        }
    }

    const formatWeight = (weight) => {
        if (!weight) return '0 kg'
        return `${parseFloat(weight).toFixed(2)} kg`
    }

    // Calcular resumen agrupado por palet
    const calculateSummaryByPallet = () => {
        const summaryByPallet = {}

        inputs.forEach(input => {
            if (!input.box) return

            const palletId = input.box.palletId
            if (!palletId) return

            if (!summaryByPallet[palletId]) {
                summaryByPallet[palletId] = {
                    palletId,
                    boxes: [],
                    totalWeight: 0,
                    products: new Set(),
                    productsBreakdown: {} // Agregar desglose por producto
                }
            }

            const palletSummary = summaryByPallet[palletId]
            palletSummary.boxes.push(input.box.id)
            palletSummary.totalWeight += parseFloat(input.box?.netWeight || 0)

            // Agrupar por producto dentro del palet
            if (input.box.product?.name) {
                const productName = input.box.product.name
                palletSummary.products.add(productName)

                if (!palletSummary.productsBreakdown[productName]) {
                    palletSummary.productsBreakdown[productName] = {
                        name: productName,
                        boxesCount: 0,
                        totalWeight: 0,
                        lots: new Set(), // Agregar lotes
                        boxes: [] // Guardar referencias de cajas para lotes
                    }
                }

                palletSummary.productsBreakdown[productName].boxesCount += 1
                palletSummary.productsBreakdown[productName].totalWeight += parseFloat(input.box?.netWeight || 0)

                // Agregar lote si existe
                if (input.box.lot) {
                    palletSummary.productsBreakdown[productName].lots.add(input.box.lot)
                }

                // Guardar referencia de la caja para acceder a más detalles
                palletSummary.productsBreakdown[productName].boxes.push({
                    id: input.box.id,
                    lot: input.box.lot || null,
                    weight: parseFloat(input.box?.netWeight || 0)
                })
            }
        })

        // Convertir Sets a Arrays y estructurar el desglose de productos
        return Object.values(summaryByPallet).map(pallet => ({
            ...pallet,
            boxesCount: pallet.boxes.length,
            products: Array.from(pallet.products),
            productsBreakdown: Object.values(pallet.productsBreakdown).map(product => ({
                ...product,
                lots: Array.from(product.lots).sort() // Convertir Set a Array ordenado
            })).sort((a, b) => b.totalWeight - a.totalWeight)
        }))
    }

    // Calcular desglose de productos totales
    const calculateProductsBreakdown = () => {
        const productsMap = {}

        inputs.forEach(input => {
            if (!input.box?.product?.name) return

            const productName = input.box.product.name
            if (!productsMap[productName]) {
                productsMap[productName] = {
                    name: productName,
                    boxesCount: 0,
                    totalWeight: 0,
                    lots: new Set(), // Agregar lotes
                    boxes: [] // Guardar referencias de cajas para lotes
                }
            }

            productsMap[productName].boxesCount += 1
            productsMap[productName].totalWeight += parseFloat(input.box?.netWeight || 0)

            // Agregar lote si existe
            if (input.box.lot) {
                productsMap[productName].lots.add(input.box.lot)
            }

            // Guardar referencia de la caja para acceder a más detalles
            productsMap[productName].boxes.push({
                id: input.box.id,
                lot: input.box.lot || null,
                weight: parseFloat(input.box?.netWeight || 0),
                palletId: input.box.palletId
            })
        })

        return Object.values(productsMap).map(product => ({
            ...product,
            lots: Array.from(product.lots).sort() // Convertir Set a Array ordenado
        })).sort((a, b) => b.totalWeight - a.totalWeight)
    }

    // Calcular totales generales (incluyendo consumos del padre)
    const calculateTotalSummary = () => {
        const totalBoxes = inputs.filter(input => input.box?.id).length
        const totalWeightFromStock = inputs.reduce((sum, input) => {
            return sum + parseFloat(input.box?.netWeight || 0)
        }, 0)
        const totalWeightFromParent = parentOutputConsumptions.reduce((sum, consumption) => {
            return sum + parseFloat(consumption.consumed_weight_kg || 0)
        }, 0)
        const totalWeight = totalWeightFromStock + totalWeightFromParent
        
        const uniqueProducts = new Set()
        inputs.forEach(input => {
            if (input.box?.product?.name) {
                uniqueProducts.add(input.box.product.name)
            }
        })
        parentOutputConsumptions.forEach(consumption => {
            if (consumption.productionOutput?.product?.name) {
                uniqueProducts.add(consumption.productionOutput.product.name)
            }
        })

        return {
            totalBoxes,
            totalWeight,
            totalWeightFromStock,
            totalWeightFromParent,
            totalProducts: uniqueProducts.size,
            totalPallets: calculateSummaryByPallet().length
        }
    }

    // Calcular peso total de las cajas seleccionadas
    const calculateTotalWeight = () => {
        const allBoxes = getAllBoxes()
        return selectedBoxes.reduce((total, selectedBox) => {
            const box = allBoxes.find(b => b.id === selectedBox.boxId && b.palletId === selectedBox.palletId)
            return total + (parseFloat(box?.netWeight || 0))
        }, 0)
    }

    // Calcular cajas basándose en peso total objetivo para un palet específico
    const handleCalculateByWeight = (palletId) => {
        const pallet = loadedPallets.find(p => p.id === palletId)
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

        // Ordenar cajas del palet por peso (de mayor a menor para optimizar)
        // Filtrar solo cajas disponibles y no seleccionadas
        const availableBoxes = pallet.boxes
            .filter(box => isBoxAvailable(box) && !isBoxSelected(box.id, palletId))
            .map(box => ({
                ...box,
                weight: parseFloat(box.netWeight || 0),
                palletId: palletId
            }))
            .sort((a, b) => b.weight - a.weight)

        // Algoritmo voraz: seleccionar cajas hasta alcanzar o acercarse al peso objetivo sin excederlo
        const boxesToAdd = []
        let currentWeight = 0

        for (const box of availableBoxes) {
            if (currentWeight + box.weight <= target) {
                boxesToAdd.push({ boxId: box.id, palletId: palletId })
                currentWeight += box.weight
            }
        }

        // Si no alcanzamos el peso objetivo, agregar la caja más cercana que no lo exceda
        if (boxesToAdd.length === 0 && availableBoxes.length > 0) {
            const closestBox = availableBoxes.find(box => box.weight <= target)
            if (closestBox) {
                boxesToAdd.push({ boxId: closestBox.id, palletId: palletId })
                currentWeight = closestBox.weight
            }
        }

        if (boxesToAdd.length > 0) {
            // Convertir a formato de resultados similar a weightSearchResults
            const results = boxesToAdd.map((boxToAdd, idx) => {
                const box = availableBoxes.find(b => b.id === boxToAdd.boxId)
                const result = {
                    box,
                    palletId: palletId
                }
                // Agregar información del peso total solo al primer resultado
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

    // Seleccionar todas las cajas de los resultados del peso objetivo
    const handleSelectTargetWeightResults = () => {
        if (targetWeightResults.length === 0) {
            alert('No hay resultados para seleccionar')
            return
        }

        const boxesToAdd = targetWeightResults.map(result => ({
            boxId: result.box.id,
            palletId: result.palletId
        }))

        setSelectedBoxes(prev => {
            const newBoxes = [...prev]
            boxesToAdd.forEach(box => {
                if (!newBoxes.some(b => b.boxId === box.boxId && b.palletId === box.palletId)) {
                    newBoxes.push(box)
                }
            })
            return newBoxes
        })

        setTargetWeightResults([])
        setTargetWeight(prev => ({ ...prev, [selectedPalletId]: '' }))
    }

    // Calcular peso total por palet
    const calculateWeightByPallet = (palletId) => {
        const allBoxes = getAllBoxes()
        const selectedForPallet = getSelectedBoxesForPallet(palletId)
        return selectedForPallet.reduce((total, selectedBox) => {
            const box = allBoxes.find(b => b.id === selectedBox.boxId && b.palletId === palletId)
            return total + (parseFloat(box?.netWeight || 0))
        }, 0)
    }

    // Calcular peso total por producto
    const calculateWeightByProduct = () => {
        const allBoxes = getAllBoxes()
        const productWeights = {}

        selectedBoxes.forEach(selectedBox => {
            const box = allBoxes.find(b => b.id === selectedBox.boxId && b.palletId === selectedBox.palletId)
            if (box && box.product) {
                const productId = box.product.id
                const productName = box.product.name || 'Sin producto'
                if (!productWeights[productId]) {
                    productWeights[productId] = {
                        name: productName,
                        weight: 0
                    }
                }
                productWeights[productId].weight += parseFloat(box.netWeight || 0)
            }
        })

        return Object.values(productWeights)
    }

    // Convertir código escaneado a formato GS1-128
    const convertScannedCodeToGs1128 = (scannedCode) => {
        // Remover paréntesis si existen
        const cleaned = scannedCode.replace(/[()]/g, '')

        // Intentar primero con 3100 - kg
        let match = cleaned.match(/01(\d{14})3100(\d{6})10(.+)/);
        if (match) {
            const [, gtin, weightStr, lot] = match;
            return `(01)${gtin}(3100)${weightStr}(10)${lot}`;
        }

        // Si no coincide, intentar con 3200 - libras
        match = cleaned.match(/01(\d{14})3200(\d{6})10(.+)/);
        if (match) {
            const [, gtin, weightStr, lot] = match;
            return `(01)${gtin}(3200)${weightStr}(10)${lot}`;
        }

        // Intentar con formato con paréntesis
        match = scannedCode.match(/\(01\)(\d{14})\(3100\)(\d{6})\(10\)(.+)/);
        if (match) {
            const [, gtin, weightStr, lot] = match;
            return `(01)${gtin}(3100)${weightStr}(10)${lot}`;
        }

        match = scannedCode.match(/\(01\)(\d{14})\(3200\)(\d{6})\(10\)(.+)/);
        if (match) {
            const [, gtin, weightStr, lot] = match;
            return `(01)${gtin}(3200)${weightStr}(10)${lot}`;
        }

        return null;
    }

    // Buscar caja por código GS1-128
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

        // Buscar la caja solo en el palet seleccionado (solo cajas disponibles)
        const palletBoxes = getPalletBoxes(selectedPalletId)
        const foundBox = palletBoxes.find(box => isBoxAvailable(box) && box.gs1128 === gs1128Code)

        if (!foundBox) {
            alert(`No se encontró ninguna caja disponible con ese código GS1-128 en el palet #${selectedPalletId}`)
            setScannedCode('')
            return
        }

        // Verificar si ya está seleccionada
        if (isBoxSelected(foundBox.id, selectedPalletId)) {
            alert('Esta caja ya está seleccionada')
            setScannedCode('')
            return
        }

        // Seleccionar la caja
        handleToggleBox(foundBox.id, selectedPalletId)
        setScannedCode('')
    }

    // Buscar cajas por peso
    const handleSearchByWeight = () => {
        if (!weightSearch.trim()) {
            alert('Por favor ingresa un peso')
            return
        }

        if (!selectedPalletId) {
            alert('Por favor selecciona un palet primero')
            return
        }

        const targetWeight = parseFloat(weightSearch.trim())

        if (isNaN(targetWeight) || targetWeight <= 0) {
            alert('Por favor ingresa un peso válido mayor a 0')
            return
        }

        // Buscar cajas que coincidan con el peso objetivo solo en el palet seleccionado (solo cajas disponibles)
        const palletBoxes = getPalletBoxes(selectedPalletId)
        const results = []

        palletBoxes.forEach(box => {
            // Solo buscar en cajas disponibles
            if (!isBoxAvailable(box)) return
            
            const boxWeight = parseFloat(box.netWeight || 0)
            const difference = Math.abs(boxWeight - targetWeight)

            // Solo agregar si está dentro de la tolerancia y no está ya seleccionada
            if (difference <= weightTolerance && !isBoxSelected(box.id, selectedPalletId)) {
                results.push({
                    box,
                    palletId: selectedPalletId,
                    matchedWeight: targetWeight,
                    difference: difference
                })
            }
        })

        // Ordenar por diferencia (más cercano primero)
        results.sort((a, b) => a.difference - b.difference)

        setWeightSearchResults(results)

        if (results.length === 0) {
            alert(`No se encontraron cajas que coincidan con el peso ingresado en el palet #${selectedPalletId} (tolerancia: ±${weightTolerance} kg)`)
        }
    }

    // Seleccionar todas las cajas de los resultados de búsqueda por peso
    const handleSelectWeightSearchResults = () => {
        if (weightSearchResults.length === 0) {
            alert('No hay resultados para seleccionar')
            return
        }

        const boxesToAdd = weightSearchResults.map(result => ({
            boxId: result.box.id,
            palletId: result.palletId
        }))

        setSelectedBoxes(prev => {
            const newBoxes = [...prev]
            boxesToAdd.forEach(box => {
                if (!newBoxes.some(b => b.boxId === box.boxId && b.palletId === box.palletId)) {
                    newBoxes.push(box)
                }
            })
            return newBoxes
        })

        setWeightSearchResults([])
        setWeightSearch('')
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Error</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const dialog = (
        <Dialog open={addDialogOpen} onOpenChange={(open) => {
            setAddDialogOpen(open)
            if (open) {
                loadExistingDataForEdit()
            } else {
                // Reset al cerrar
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
        }}>
            <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0">
                <div className="relative flex-1 flex flex-col min-h-0 p-6">
                    {/* Loader overlay */}
                    {(loadingPallet || savingInputs) && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                            <Loader />
                        </div>
                    )}
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>
                            {inputs.length > 0 ? 'Editar materia prima' : 'Agregar materia prima'}
                        </DialogTitle>
                        <DialogDescription>
                            {inputs.length > 0
                                ? 'Modifica la materia prima que se consumirá desde el stock en este proceso'
                                : 'Busca un palet y selecciona las cajas de materia prima que se consumirán desde el stock en este proceso'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
                        {/* Columna izquierda: Listado de palets y buscador */}
                        <div className="col-span-3 flex flex-col border rounded-lg overflow-hidden">
                            <div className="p-3 border-b bg-muted/50 flex-shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="pallet-search"
                                        placeholder="Buscar por ID del palet..."
                                        value={palletSearch}
                                        onChange={(e) => setPalletSearch(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearchPallet()
                                            }
                                        }}
                                        className="pl-9 pr-9 h-9"
                                    />
                                    {palletSearch && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1 h-7 w-7"
                                            onClick={() => setPalletSearch("")}
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Limpiar búsqueda</span>
                                        </Button>
                                    )}
                                </div>
                                {palletSearch && (
                                    <Button
                                        onClick={handleSearchPallet}
                                        disabled={loadingPallet || !palletSearch.trim()}
                                        className="w-full mt-2 h-9"
                                        size="sm"
                                    >
                                        {loadingPallet ? 'Buscando...' : 'Buscar Palet'}
                                    </Button>
                                )}
                            </div>

                            {/* Lista de palets cargados */}
                            <ScrollArea className="flex-1 min-h-0">
                                <div className="p-2 space-y-2">
                                    {loadedPallets.map((pallet) => {
                                        const selectedCount = getSelectedBoxesForPallet(pallet.id).length
                                        const isSelected = selectedPalletId === pallet.id
                                        const totalWeight = (pallet.boxes || []).reduce((sum, box) => sum + parseFloat(box.netWeight || 0), 0)

                                        return (
                                            <div
                                                key={pallet.id}
                                                className={`flex items-start space-x-3 border rounded-md p-3 cursor-pointer hover:bg-accent transition-colors ${isSelected ? 'border-primary bg-accent' : ''
                                                    }`}
                                                onClick={() => setSelectedPalletId(pallet.id)}
                                            >
                                                <div className="flex h-5 w-5 items-center justify-center mt-1">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => setSelectedPalletId(pallet.id)}
                                                        className="pointer-events-none"
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                                                            <span className="font-medium">Palet #{pallet.id}</span>
                                                            {selectedCount > 0 && (
                                                                <Badge variant="default" className="ml-2 text-xs">
                                                                    {selectedCount} seleccionadas
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 hover:bg-destructive/20"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleRemovePallet(pallet.id)
                                                            }}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    {/* Productos y lotes */}
                                                    {pallet.boxes && pallet.boxes.length > 0 && (() => {
                                                        const productsMap = {}
                                                        pallet.boxes.forEach(box => {
                                                            if (box.product) {
                                                                const productId = box.product.id
                                                                if (!productsMap[productId]) {
                                                                    productsMap[productId] = {
                                                                        name: box.product.name,
                                                                        lots: new Set()
                                                                    }
                                                                }
                                                                if (box.lot) {
                                                                    productsMap[productId].lots.add(box.lot)
                                                                }
                                                            }
                                                        })
                                                        const productsArray = Object.values(productsMap)

                                                        return (
                                                            <div className="mt-1.5 space-y-1">
                                                                {productsArray.slice(0, 2).map((product, idx) => (
                                                                    <div key={idx} className="text-xs">
                                                                        <span className="font-medium text-foreground">{product.name}</span>
                                                                        {product.lots.size > 0 && (
                                                                            <span className="text-muted-foreground ml-1">
                                                                                (Lotes: {Array.from(product.lots).slice(0, 2).join(', ')}{product.lots.size > 2 ? '...' : ''})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {productsArray.length > 2 && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        +{productsArray.length - 2} producto{productsArray.length - 2 > 1 ? 's' : ''} más
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )
                                                    })()}

                                                    <div className="mt-1.5 flex items-center text-xs text-muted-foreground">
                                                        <span>Total: {formatWeight(totalWeight)}</span>
                                                        <span className="mx-1.5">|</span>
                                                        <span>
                                                            {pallet.boxes?.length || 0} {pallet.boxes?.length === 1 ? 'caja' : 'cajas'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {loadedPallets.length === 0 && (
                                        <div className="flex items-center justify-center h-full py-8">
                                            <EmptyState
                                                icon={<Package className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                                title="No hay palets cargados"
                                                description="Busca un palet por su ID para comenzar a registrar el consumo de materia prima"
                                            />
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Columna central: Cajas del palet seleccionado */}
                        <div className="col-span-6 flex flex-col flex-1 min-h-0 overflow-hidden ">

                            {/* Tabs para modo de selección */}
                            {selectedPalletId && (
                                <Tabs value={selectionMode} onValueChange={setSelectionMode} className="flex flex-col flex-1 min-h-0 w-full overflow-hidden ">
                                    <TabsList className="grid w-full grid-cols-4 flex-shrink-0 mb-2">
                                        <TabsTrigger value="manual">
                                            <Hand className="h-4 w-4 mr-1" />
                                            Manual
                                        </TabsTrigger>
                                        <TabsTrigger value="weight">
                                            <Target className="h-4 w-4 mr-1" />
                                            Peso Total Objetivo
                                        </TabsTrigger>
                                        <TabsTrigger value="scanner">
                                            <Scan className="h-4 w-4 mr-1" />
                                            GS1-128
                                        </TabsTrigger>
                                        <TabsTrigger value="weight-search">
                                            <Scale className="h-4 w-4 mr-1" />
                                            Búsqueda Peso Caja
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Transfer List - Solo mostrar en modo manual */}
                                    <TabsContent value="manual" className="data-[state=inactive]:hidden flex flex-col flex-1 min-h-0 overflow-hidden ">
                                        {selectedPalletId && getPalletBoxes(selectedPalletId).length > 0 && (
                                            <div className="grid grid-cols-11 gap-4 flex-1 min-h-0 overflow-hidden ">
                                                {/* Cajas disponibles del palet seleccionado */}
                                                <div className="col-span-5 flex flex-col border rounded-lg overflow-hidden h-full">
                                                    <div className="p-2 border-b bg-muted/50 flex-shrink-0">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="font-semibold text-sm">
                                                                Disponibles
                                                            </Label>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {getPalletBoxes(selectedPalletId).filter(box => isBoxAvailable(box) && !isBoxSelected(box.id, selectedPalletId)).length}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <ScrollArea className="flex-1 min-h-0">
                                                        <div className="p-2 space-y-1">
                                                            {getPalletBoxes(selectedPalletId)
                                                                .filter(box => isBoxAvailable(box) && !isBoxSelected(box.id, selectedPalletId))
                                                                .map((box) => (
                                                                    <div
                                                                        key={`${selectedPalletId}-${box.id}`}
                                                                        className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer border"
                                                                        onClick={() => handleToggleBox(box.id, selectedPalletId)}
                                                                    >
                                                                        <Checkbox
                                                                            checked={false}
                                                                            onCheckedChange={() => handleToggleBox(box.id, selectedPalletId)}
                                                                        />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-medium truncate">
                                                                                {box.product?.name || 'Sin producto'}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground truncate">
                                                                                Lote: {box.lot || 'N/A'}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                Peso Neto: {formatWeight(box.netWeight)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            {getPalletBoxes(selectedPalletId).filter(box => isBoxAvailable(box) && !isBoxSelected(box.id, selectedPalletId)).length === 0 && (
                                                                <div className="flex items-center justify-center h-full py-8">
                                                                    <EmptyState
                                                                        icon={<CheckCircle className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                                                        title="Todas las cajas seleccionadas"
                                                                        description="Todas las cajas de este palet ya están en la lista de seleccionadas"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </ScrollArea>
                                                </div>

                                                {/* Botones de transferencia */}
                                                <div className="col-span-1 flex flex-col items-center justify-center gap-2 flex-shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            const availableBoxes = getPalletBoxes(selectedPalletId)
                                                                .filter(box => isBoxAvailable(box) && !isBoxSelected(box.id, selectedPalletId))
                                                            if (availableBoxes.length > 0) {
                                                                handleToggleBox(availableBoxes[0].id, selectedPalletId)
                                                            }
                                                        }}
                                                        disabled={getPalletBoxes(selectedPalletId).filter(box => isBoxAvailable(box) && !isBoxSelected(box.id, selectedPalletId)).length === 0}
                                                        title="Mover seleccionada"
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            const availableBoxes = getPalletBoxes(selectedPalletId)
                                                                .filter(box => isBoxAvailable(box) && !isBoxSelected(box.id, selectedPalletId))
                                                                .map(box => ({ boxId: box.id, palletId: selectedPalletId }))
                                                            setSelectedBoxes(prev => [...prev, ...availableBoxes])
                                                        }}
                                                        disabled={getPalletBoxes(selectedPalletId).filter(box => isBoxAvailable(box) && !isBoxSelected(box.id, selectedPalletId)).length === 0}
                                                        title="Mover todas"
                                                    >
                                                        <ChevronsRight className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            const selectedForPallet = getSelectedBoxesForPallet(selectedPalletId)
                                                            if (selectedForPallet.length > 0) {
                                                                setSelectedBoxes(prev => prev.filter(box => !(box.palletId === selectedPalletId && box.boxId === selectedForPallet[selectedForPallet.length - 1].boxId)))
                                                            }
                                                        }}
                                                        disabled={getSelectedBoxesForPallet(selectedPalletId).length === 0}
                                                        title="Quitar seleccionada"
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedBoxes(prev => prev.filter(box => box.palletId !== selectedPalletId))
                                                        }}
                                                        disabled={getSelectedBoxesForPallet(selectedPalletId).length === 0}
                                                        title="Quitar todas"
                                                    >
                                                        <ChevronsLeft className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* Cajas seleccionadas del palet seleccionado */}
                                                <div className="col-span-5 flex flex-col border rounded-lg overflow-hidden h-full">
                                                    <div className="p-2 border-b bg-muted/50 flex-shrink-0">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="font-semibold text-sm">
                                                                Seleccionadas
                                                            </Label>
                                                            <Badge variant="default" className="text-xs">
                                                                {getSelectedBoxesForPallet(selectedPalletId).length}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <ScrollArea className="flex-1 min-h-0">
                                                        <div className="p-2 space-y-1">
                                                            {getSelectedBoxesForPallet(selectedPalletId).map((selectedBox) => {
                                                                const box = getPalletBoxes(selectedPalletId).find(b => b.id === selectedBox.boxId)
                                                                if (!box) return null
                                                                return (
                                                                    <div
                                                                        key={`${selectedPalletId}-${selectedBox.boxId}`}
                                                                        className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer border bg-primary/5"
                                                                        onClick={() => handleToggleBox(box.id, selectedPalletId)}
                                                                    >
                                                                        <Checkbox
                                                                            checked={true}
                                                                            onCheckedChange={() => handleToggleBox(box.id, selectedPalletId)}
                                                                        />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-medium truncate">
                                                                                {box.product?.name || 'Sin producto'}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground truncate">
                                                                                Lote: {box.lot || 'N/A'}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                Peso Neto: {formatWeight(box.netWeight)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                            {getSelectedBoxesForPallet(selectedPalletId).length === 0 && (
                                                                <div className="flex items-center justify-center h-full py-8">
                                                                    <EmptyState
                                                                        icon={<Box className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                                                        title="No hay cajas seleccionadas"
                                                                        description="Selecciona cajas del palet para agregarlas a la producción"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </ScrollArea>
                                                </div>
                                            </div>
                                        )}
                                        {selectedPalletId && getPalletBoxes(selectedPalletId).length === 0 && (
                                            <div className="flex items-center justify-center h-full py-8">
                                                <EmptyState
                                                    icon={<Package className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                                    title="Palet sin cajas"
                                                    description="Este palet no contiene cajas disponibles"
                                                />
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Modo por peso */}
                                    <TabsContent value="weight" className="data-[state=inactive]:hidden flex flex-col flex-1 min-h-0 overflow-hidden ">
                                        {selectedPalletId && (
                                            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                                <Card className="p-4 flex-shrink-0 mb-2">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <Label htmlFor={`target-weight-${selectedPalletId}`} className="text-sm font-semibold">
                                                                Peso Objetivo Total (kg) - Palet #{selectedPalletId}
                                                            </Label>
                                                            <Input
                                                                id={`target-weight-${selectedPalletId}`}
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="Ej: 100.50"
                                                                value={targetWeight[selectedPalletId] || ''}
                                                                onChange={(e) => setTargetWeight(prev => ({ ...prev, [selectedPalletId]: e.target.value }))}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        handleCalculateByWeight(selectedPalletId)
                                                                    }
                                                                }}
                                                                className="mt-1"
                                                            />
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Ingresa un peso objetivo total y el sistema calculará las cajas del palet #{selectedPalletId} cuya suma se acerque lo más posible al peso objetivo sin excederlo.
                                                            </p>
                                                        </div>
                                                        <Button
                                                            onClick={() => handleCalculateByWeight(selectedPalletId)}
                                                            disabled={!targetWeight[selectedPalletId] || parseFloat(targetWeight[selectedPalletId]) <= 0}
                                                            className="w-full"
                                                            size="sm"
                                                        >
                                                            <Calculator className="h-4 w-4 mr-2" />
                                                            Calcular
                                                        </Button>
                                                    </div>
                                                </Card>

                                                {/* Resultados del cálculo de peso objetivo */}
                                                {targetWeightResults.length > 0 && (
                                                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden border rounded-lg">
                                                        <div className="p-2 border-b bg-muted/50 flex-shrink-0">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div>
                                                                    <Label className="font-semibold text-sm">
                                                                        Resultados ({targetWeightResults.length} cajas)
                                                                    </Label>
                                                                    {targetWeightResults.length > 0 && targetWeightResults[0].totalWeight !== undefined && (
                                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                                            Peso total: {formatWeight(targetWeightResults[0].totalWeight)} | Objetivo: {formatWeight(targetWeightResults[0].targetWeight)} | Diferencia: {formatWeight(targetWeightResults[0].difference)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        onClick={handleSelectTargetWeightResults}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 text-xs"
                                                                    >
                                                                        Seleccionar Todas
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6"
                                                                        onClick={() => {
                                                                            setTargetWeightResults([])
                                                                            setTargetWeight(prev => ({ ...prev, [selectedPalletId]: '' }))
                                                                        }}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <ScrollArea className="flex-1 min-h-0">
                                                            <div className="p-2 space-y-1">
                                                                {targetWeightResults.map((result, idx) => {
                                                                    const box = result.box
                                                                    return (
                                                                        <div
                                                                            key={`target-weight-result-${box.id}-${result.palletId}-${idx}`}
                                                                            className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer border"
                                                                            onClick={() => {
                                                                                setSelectedPalletId(result.palletId)
                                                                                handleToggleBox(box.id, result.palletId)
                                                                            }}
                                                                        >
                                                                            <Checkbox
                                                                                checked={isBoxSelected(box.id, result.palletId)}
                                                                                onCheckedChange={() => {
                                                                                    setSelectedPalletId(result.palletId)
                                                                                    handleToggleBox(box.id, result.palletId)
                                                                                }}
                                                                            />
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center justify-between">
                                                                                    <p className="text-sm font-medium truncate">
                                                                                        {box.product?.name || 'Sin producto'}
                                                                                    </p>
                                                                                    <Badge variant="outline" className="text-xs ml-2">
                                                                                        Palet #{result.palletId}
                                                                                    </Badge>
                                                                                </div>
                                                                                <p className="text-xs text-muted-foreground truncate">
                                                                                    Lote: {box.lot || 'N/A'}
                                                                                </p>
                                                                                <div className="flex items-center gap-2 text-xs mt-1">
                                                                                    <span className="text-muted-foreground">
                                                                                        Peso: {formatWeight(box.netWeight)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </ScrollArea>
                                                    </div>
                                                )}
                                                {targetWeightResults.length === 0 && (
                                                    <div className="flex items-center justify-center h-full py-8">
                                                        <EmptyState
                                                            icon={<Target className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                                            title="Calcula el peso objetivo"
                                                            description="Ingresa un peso objetivo y haz clic en Calcular para ver las cajas que se ajustan"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Modo lector GS1-128 */}
                                    <TabsContent value="scanner" className="data-[state=inactive]:hidden flex flex-col flex-1 min-h-0 overflow-hidden ">
                                        <Card className="p-4 flex-shrink-0 mb-2">
                                            <div className="space-y-3">
                                                <div>
                                                    <Label htmlFor="gs1-scanner" className="text-sm font-semibold">
                                                        Escanear código GS1-128
                                                    </Label>
                                                    <Input
                                                        id="gs1-scanner"
                                                        type="text"
                                                        placeholder="Escanea aquí o pega el código..."
                                                        value={scannedCode}
                                                        onChange={(e) => setScannedCode(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleScanGS1Code()
                                                            }
                                                        }}
                                                        className="font-mono mt-1"
                                                        autoFocus
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Escanea o pega un código GS1-128 para buscar y seleccionar automáticamente la caja correspondiente en el palet #{selectedPalletId}. El sistema reconocerá códigos con peso en kilogramos (3100) o libras (3200).
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={handleScanGS1Code}
                                                    disabled={!scannedCode.trim()}
                                                    className="w-full"
                                                    size="sm"
                                                >
                                                    <Scan className="h-4 w-4 mr-2" />
                                                    Buscar y Seleccionar
                                                </Button>
                                            </div>
                                        </Card>
                                    </TabsContent>

                                    {/* Modo búsqueda por peso */}
                                    <TabsContent value="weight-search" className="data-[state=inactive]:hidden flex flex-col flex-1 min-h-0 overflow-hidden ">
                                        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                            <Card className="p-4 flex-shrink-0 mb-2">
                                                <div className="space-y-3">
                                                    <div>
                                                        <Label htmlFor="weight-search-input" className="text-sm font-semibold">
                                                            Buscar cajas por peso (kg)
                                                        </Label>
                                                        <Input
                                                            id="weight-search-input"
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Ej: 10.50"
                                                            value={weightSearch}
                                                            onChange={(e) => setWeightSearch(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleSearchByWeight()
                                                                }
                                                            }}
                                                            className="mt-1"
                                                        />
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Ingresa un peso para encontrar cajas del palet #{selectedPalletId} que coincidan con ese peso. Puedes ajustar la tolerancia de búsqueda para controlar la precisión de coincidencia.
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Label htmlFor="weight-tolerance" className="text-xs text-muted-foreground">
                                                                Tolerancia (kg):
                                                            </Label>
                                                            <Input
                                                                id="weight-tolerance"
                                                                type="number"
                                                                step="0.01"
                                                                min="0.01"
                                                                value={weightTolerance}
                                                                onChange={(e) => setWeightTolerance(parseFloat(e.target.value) || 0.01)}
                                                                className="w-20 h-8"
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={handleSearchByWeight}
                                                        disabled={!weightSearch.trim()}
                                                        className="w-full"
                                                        size="sm"
                                                    >
                                                        Buscar
                                                    </Button>
                                                </div>
                                            </Card>

                                            {/* Resultados de búsqueda por peso */}
                                            {weightSearchResults.length > 0 && (
                                                <div className="flex flex-col flex-1 min-h-0 overflow-hidden border rounded-lg">
                                                    <div className="p-2 border-b bg-muted/50 flex-shrink-0">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="font-semibold text-sm">
                                                                Resultados ({weightSearchResults.length})
                                                            </Label>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    onClick={handleSelectWeightSearchResults}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 text-xs"
                                                                >
                                                                    Seleccionar Todas
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6"
                                                                    onClick={() => {
                                                                        setWeightSearchResults([])
                                                                        setWeightSearch('')
                                                                    }}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ScrollArea className="flex-1 min-h-0">
                                                        <div className="p-2 space-y-1">
                                                            {weightSearchResults.map((result, idx) => {
                                                                const box = result.box
                                                                return (
                                                                    <div
                                                                        key={`weight-result-${box.id}-${result.palletId}-${idx}`}
                                                                        className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer border"
                                                                        onClick={() => {
                                                                            setSelectedPalletId(result.palletId)
                                                                            handleToggleBox(box.id, result.palletId)
                                                                        }}
                                                                    >
                                                                        <Checkbox
                                                                            checked={isBoxSelected(box.id, result.palletId)}
                                                                            onCheckedChange={() => {
                                                                                setSelectedPalletId(result.palletId)
                                                                                handleToggleBox(box.id, result.palletId)
                                                                            }}
                                                                        />
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center justify-between">
                                                                                <p className="text-sm font-medium truncate">
                                                                                    {box.product?.name || 'Sin producto'}
                                                                                </p>
                                                                                <Badge variant="outline" className="text-xs ml-2">
                                                                                    Palet #{result.palletId}
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-xs mt-1">
                                                                                <span className="text-muted-foreground">
                                                                                    Peso: {formatWeight(box.netWeight)}
                                                                                </span>
                                                                                <Badge variant="secondary" className="text-xs">
                                                                                    Diferencia: {result.difference.toFixed(3)} kg
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </ScrollArea>
                                                </div>
                                            )}
                                            {weightSearchResults.length === 0 && (
                                                <div className="flex items-center justify-center h-full py-8">
                                                    <EmptyState
                                                        icon={<Scale className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                                        title="Busca cajas por peso"
                                                        description="Ingresa uno o más pesos para encontrar cajas que coincidan"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                </Tabs>
                            )}

                            {!selectedPalletId && loadedPallets.length > 0 && (
                                <div className="flex items-center justify-center h-full py-8">
                                    <EmptyState
                                        icon={<Package className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                        title="Selecciona un palet"
                                        description="Haz clic en un palet de la lista para ver y seleccionar sus cajas"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Columna derecha: Selección total de todos los palets */}
                        <div className="col-span-3 flex flex-col border rounded-lg overflow-hidden">
                            <div className="p-3 border-b bg-muted/50 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <Label className="font-semibold text-sm">Selección Total</Label>
                                    <Badge variant="default" className="text-xs">
                                        {selectedBoxes.length} {selectedBoxes.length === 1 ? 'caja' : 'cajas'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Resumen compacto */}
                            {selectedBoxes.length > 0 && (
                                <div className="p-3 border-b bg-primary/5">
                                    <div className="space-y-1 text-xs">
                                        {/* <div className="flex justify-between">
                                                <span className="text-muted-foreground">Cajas:</span>
                                                <span className="font-semibold">{selectedBoxes.length}</span>
                                            </div> */}

                                        <div className="pb-2 mb-2 border-b">
                                            {/* <p className="text-muted-foreground mb-1 font-semibold">Por Producto:</p> */}
                                            {calculateWeightByProduct().map((product, idx) => (
                                                <div key={idx} className="flex justify-between">
                                                    <span className="text-muted-foreground truncate">{product.name}</span>
                                                    <span className="font-semibold ml-2">{formatWeight(product.weight)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Peso Total</span>
                                            <span className="font-semibold">{formatWeight(calculateTotalWeight())}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Lista de todas las cajas seleccionadas agrupadas por palet */}
                            <ScrollArea className="flex-1 min-h-0" style={{ maxHeight: 'calc(90vh - 300px)' }}>
                                <div className="p-2 space-y-2">
                                    {loadedPallets.map((pallet) => {
                                        const selectedForPallet = getSelectedBoxesForPallet(pallet.id)
                                        if (selectedForPallet.length === 0) return null

                                        return (
                                            <div key={pallet.id} className="space-y-1">
                                                <div className="flex items-center justify-between gap-2 px-2 py-1 bg-muted rounded-md">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs font-semibold">
                                                            Palet #{pallet.id}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {selectedForPallet.length} cajas
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-semibold">
                                                        {formatWeight(calculateWeightByPallet(pallet.id))}
                                                    </span>
                                                </div>
                                                <div className="space-y-1 pl-2 border-l-2 border-muted">
                                                    {selectedForPallet.map((selectedBox) => {
                                                        const box = getPalletBoxes(pallet.id).find(b => b.id === selectedBox.boxId)
                                                        if (!box) return null
                                                        return (
                                                            <div
                                                                key={`${pallet.id}-${selectedBox.boxId}`}
                                                                className="group flex items-center gap-2 p-2 hover:bg-muted rounded border text-xs cursor-pointer"
                                                                onClick={() => handleToggleBox(box.id, pallet.id)}
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium truncate">{box.product?.name || 'Sin producto'}</p>
                                                                    <p className="text-muted-foreground truncate">Lote: {box.lot || 'N/A'}</p>
                                                                    <p className="text-muted-foreground truncate">Peso Neto: {formatWeight(box.netWeight)}</p>
                                                                </div>
                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                                                                    <Unlink className="h-3.5 w-3.5 text-destructive" />
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {selectedBoxes.length === 0 && (
                                        <div className="flex items-center justify-center h-full py-8">
                                            <EmptyState
                                                icon={<Box className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                                title="No hay cajas seleccionadas"
                                                description="Selecciona cajas de los palets para verlas aquí"
                                            />
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end gap-2 pt-2 border-t flex-shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => {
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
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAddInputs}
                            disabled={selectedBoxes.length === 0}
                        >
                            {inputs.length > 0 ? 'Guardar' : 'Agregar'} {selectedBoxes.length > 0 && `(${selectedBoxes.length})`}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )

    // Diálogo para consumir outputs del padre
    const consumptionDialog = (
        <Dialog open={addConsumptionDialogOpen} onOpenChange={(open) => {
            setAddConsumptionDialogOpen(open)
            if (!open) {
                setConsumptionFormData({
                    production_output_id: '',
                    consumed_weight_kg: '',
                    consumed_boxes: '',
                    notes: ''
                })
            }
        }}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Consumir Output del Proceso Padre</DialogTitle>
                    <DialogDescription>
                        Selecciona un output del proceso padre para consumir en este proceso hijo
                    </DialogDescription>
                </DialogHeader>
                {loadingAvailableOutputs ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader />
                    </div>
                ) : availableOutputs.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                        <EmptyState
                            icon={<ArrowDown className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                            title="No hay outputs disponibles"
                            description="El proceso padre no tiene outputs disponibles para consumir"
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="production_output_id">Output del Padre</Label>
                            <Select
                                value={consumptionFormData.production_output_id}
                                onValueChange={(value) => {
                                    setConsumptionFormData(prev => ({ ...prev, production_output_id: value }))
                                    const selectedOutput = availableOutputs.find(o => o.output.id.toString() === value)
                                    if (selectedOutput) {
                                        // Prellenar con el máximo disponible si no hay consumo existente
                                        const existingConsumption = parentOutputConsumptions.find(
                                            c => c.production_output_id?.toString() === value
                                        )
                                        if (!existingConsumption) {
                                            setConsumptionFormData(prev => ({
                                                ...prev,
                                                consumed_weight_kg: selectedOutput.availableWeight.toFixed(2),
                                                consumed_boxes: selectedOutput.availableBoxes.toString()
                                            }))
                                        }
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un output" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableOutputs.map((available) => (
                                        <SelectItem key={available.output.id} value={available.output.id.toString()}>
                                            {available.output.product?.name || 'Sin nombre'} - 
                                            Disponible: {available.availableWeight.toFixed(2)}kg / {available.totalWeight.toFixed(2)}kg
                                            {available.hasExistingConsumption && ' (Ya consumido)'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {consumptionFormData.production_output_id && (() => {
                                const selectedOutput = availableOutputs.find(
                                    o => o.output.id.toString() === consumptionFormData.production_output_id
                                )
                                if (!selectedOutput) return null
                                return (
                                    <div className="mt-2 p-3 bg-muted/30 rounded-lg space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Total:</span>
                                            <span className="font-semibold">{selectedOutput.totalWeight.toFixed(2)} kg</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Consumido:</span>
                                            <span className="font-semibold">{selectedOutput.consumedWeight.toFixed(2)} kg</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Disponible:</span>
                                            <span className="font-semibold text-primary">{selectedOutput.availableWeight.toFixed(2)} kg</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2 mt-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all"
                                                style={{ width: `${(selectedOutput.consumedWeight / selectedOutput.totalWeight) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="consumed_weight_kg">Peso Consumido (kg) *</Label>
                                <Input
                                    id="consumed_weight_kg"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={consumptionFormData.production_output_id ? availableOutputs.find(
                                        o => o.output.id.toString() === consumptionFormData.production_output_id
                                    )?.availableWeight || 0 : undefined}
                                    value={consumptionFormData.consumed_weight_kg}
                                    onChange={(e) => setConsumptionFormData(prev => ({ ...prev, consumed_weight_kg: e.target.value }))}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <Label htmlFor="consumed_boxes">Cajas Consumidas</Label>
                                <Input
                                    id="consumed_boxes"
                                    type="number"
                                    min="0"
                                    max={consumptionFormData.production_output_id ? availableOutputs.find(
                                        o => o.output.id.toString() === consumptionFormData.production_output_id
                                    )?.availableBoxes || 0 : undefined}
                                    value={consumptionFormData.consumed_boxes}
                                    onChange={(e) => setConsumptionFormData(prev => ({ ...prev, consumed_boxes: e.target.value }))}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="consumption_notes">Notas (opcional)</Label>
                            <Textarea
                                id="consumption_notes"
                                value={consumptionFormData.notes}
                                onChange={(e) => setConsumptionFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Notas sobre este consumo..."
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setAddConsumptionDialogOpen(false)}
                                disabled={savingConsumption}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveConsumption}
                                disabled={savingConsumption || !consumptionFormData.production_output_id || !consumptionFormData.consumed_weight_kg}
                            >
                                {savingConsumption ? (
                                    <>
                                        <Loader className="mr-2" />
                                        Guardando...
                                    </>
                                ) : parentOutputConsumptions.find(
                                    c => c.production_output_id?.toString() === consumptionFormData.production_output_id
                                ) ? (
                                    'Actualizar Consumo'
                                ) : (
                                    'Crear Consumo'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )

    // Botón para el header (sin Dialog wrapper)
    const headerButton = (
        <Button
            onClick={() => {
                setAddDialogOpen(true)
                loadExistingDataForEdit()
            }}
        >
            {inputs.length > 0 ? (
                <>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Consumo
                </>
            ) : (
                <>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Consumo
                </>
            )}
        </Button>
    )

    const mainContent = (
        <>
            {!hideTitle && !renderInCard && (
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Consumo de Materia Prima</h3>
                        <p className="text-sm text-muted-foreground">
                            Materia prima consumida desde el stock en este proceso
                        </p>
                    </div>
                </div>
            )}
            {!renderInCard && (
                <div className={`flex items-center ${hideTitle ? 'justify-end' : 'justify-between'}`}>
                    <Dialog open={addDialogOpen} onOpenChange={(open) => {
                        setAddDialogOpen(open)
                        if (open) {
                            loadExistingDataForEdit()
                        } else {
                            // Reset al cerrar
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
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                {inputs.length > 0 ? (
                                    <>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar Consumo
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Agregar Consumo
                                    </>
                                )}
                            </Button>
                        </DialogTrigger>
                        {dialog.props.children}
                    </Dialog>
                </div>
            )}

            {/* Sección: Inputs desde Stock */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-base font-semibold flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Inputs desde Stock
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Materia prima consumida desde el stock en este proceso
                        </p>
                    </div>
                    {!renderInCard && (
                        <Dialog open={addDialogOpen} onOpenChange={(open) => {
                            setAddDialogOpen(open)
                            if (open) {
                                loadExistingDataForEdit()
                            } else {
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
                        }}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    {inputs.length > 0 ? (
                                        <>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Editar
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Agregar
                                        </>
                                    )}
                                </Button>
                            </DialogTrigger>
                            {dialog.props.children}
                        </Dialog>
                    )}
                </div>

                {inputs.length === 0 ? (
                    <div className="flex items-center justify-center py-8 border rounded-lg">
                        <EmptyState
                            icon={<Box className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                            title="No hay consumo desde stock"
                            description="Agrega cajas desde un palet para comenzar a registrar el consumo de materia prima"
                        />
                    </div>
                ) : (
                <div className="space-y-4">
                    {/* Totales generales */}
                    <div className="border rounded-lg overflow-hidden">
                        {/* Sección de totales principales */}
                        <div className="bg-muted/30 p-5 border-b">
                            <div className="grid grid-cols-4 gap-6 text-center">
                                <div className="flex flex-col items-center justify-center">
                                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-semibold">Palets</p>
                                    <p className="text-2xl font-bold text-foreground">{calculateTotalSummary().totalPallets}</p>
                                </div>
                                <div className="flex flex-col items-center justify-center">
                                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-semibold">Cajas</p>
                                    <p className="text-2xl font-bold text-foreground">{calculateTotalSummary().totalBoxes}</p>
                                </div>
                                <div className="flex flex-col items-center justify-center">
                                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-semibold">Productos</p>
                                    <p className="text-2xl font-bold text-foreground">{calculateTotalSummary().totalProducts}</p>
                                </div>
                                <div className="flex flex-col items-center justify-center">
                                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-semibold">Peso Total</p>
                                    <p className="text-2xl font-bold text-foreground">{formatWeight(calculateTotalSummary().totalWeight)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Desglose por producto */}
                        {calculateProductsBreakdown().length > 0 && (
                            <div className="bg-background p-4">
                                <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
                                    <Layers className="h-3.5 w-3.5" />
                                    Desglose por Artículo
                                </p>
                                <div className="space-y-1.5">
                                    {calculateProductsBreakdown().map((product, idx) => (
                                        <div key={idx} className="py-2 px-3 bg-muted/30 rounded border hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <Badge variant="secondary" className="text-xs font-medium shrink-0">
                                                        {product.name}
                                                    </Badge>
                                                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                                                        {product.boxesCount} {product.boxesCount === 1 ? 'caja' : 'cajas'}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-semibold text-foreground shrink-0 ml-3 whitespace-nowrap">
                                                    {formatWeight(product.totalWeight)}
                                                </span>
                                            </div>
                                            {/* Lotes */}
                                            {product.lots && product.lots.length > 0 && (
                                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                    <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {product.lots.slice(0, 3).map((lot, lotIdx) => (
                                                            <Badge key={lotIdx} variant="outline" className="text-xs font-normal py-0.5 px-1.5">
                                                                {lot}
                                                            </Badge>
                                                        ))}
                                                        {product.lots.length > 3 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-5 text-xs px-1.5 py-0"
                                                                onClick={() => {
                                                                    setSelectedProductLots({
                                                                        productName: product.name,
                                                                        lots: product.lots,
                                                                        boxes: product.boxes || []
                                                                    })
                                                                    setLotsDialogOpen(true)
                                                                }}
                                                            >
                                                                +{product.lots.length - 3} más
                                                            </Button>
                                                        )}
                                                        {product.lots.length <= 3 && product.lots.length > 1 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-5 text-xs px-1.5 py-0"
                                                                onClick={() => {
                                                                    setSelectedProductLots({
                                                                        productName: product.name,
                                                                        lots: product.lots,
                                                                        boxes: product.boxes || []
                                                                    })
                                                                    setLotsDialogOpen(true)
                                                                }}
                                                            >
                                                                <Info className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Resumen por palet */}
                    <div className="pt-2 pb-0">
                        {!hideTitle && (
                            <p className="text-sm font-medium text-muted-foreground mb-2">Detalle por Palet</p>
                        )}
                        {(() => {
                            const pallets = calculateSummaryByPallet()
                            const palletCount = pallets.length

                            // Calcular altura dinámica: mínimo 1 card, máximo 2 cards
                            // Si hay 1 pallet: altura mínima equivalente a ~140px (1 card)
                            // Si hay 2+ pallets: altura máxima de ~280px (2 cards) con scroll
                            const scrollHeight = palletCount === 1 ? 'h-[106px]' : 'h-[218px]'

                            return (
                                <ScrollArea className={scrollHeight}>
                                    <div className="pr-4">
                                        {pallets.map((pallet, idx) => (
                                            <div key={pallet.palletId} className={`border rounded-lg ${idx < pallets.length - 1 ? 'mb-2' : ''}`}>
                                                <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">Palet #{pallet.palletId}</span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {pallet.boxesCount} {pallet.boxesCount === 1 ? 'caja' : 'cajas'}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-sm font-semibold">{formatWeight(pallet.totalWeight)}</span>
                                                </div>

                                                {/* Desglose por producto en el palet */}
                                                {pallet.productsBreakdown && pallet.productsBreakdown.length > 0 && (
                                                    <div className="p-3 space-y-1.5">
                                                        {pallet.productsBreakdown.map((product, idx) => (
                                                            <div key={idx} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {product.name}
                                                                    </Badge>
                                                                    <span className="text-muted-foreground">
                                                                        {product.boxesCount} {product.boxesCount === 1 ? 'caja' : 'cajas'}
                                                                    </span>
                                                                </div>
                                                                <span className="font-medium">{formatWeight(product.totalWeight)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )
                        })()}
                    </div>
                </div>
                )}

            {/* Sección: Consumos del Proceso Padre */}
            {productionRecord?.parent_record_id && (
                <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-base font-semibold flex items-center gap-2">
                                <ArrowDown className="h-4 w-4" />
                                Consumos del Proceso Padre
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Outputs consumidos del proceso padre en este proceso hijo
                            </p>
                        </div>
                        {!renderInCard && (
                            <Dialog open={addConsumptionDialogOpen} onOpenChange={(open) => {
                                if (open) {
                                    handleOpenConsumptionDialog()
                                } else {
                                    setAddConsumptionDialogOpen(false)
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                        {parentOutputConsumptions.length > 0 ? (
                                            <>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Editar Consumo
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Consumir Output
                                            </>
                                        )}
                                    </Button>
                                </DialogTrigger>
                                {consumptionDialog.props.children}
                            </Dialog>
                        )}
                    </div>

                    {parentOutputConsumptions.length === 0 ? (
                        <div className="flex items-center justify-center py-8 border rounded-lg">
                            <EmptyState
                                icon={<ArrowDown className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                title="No hay consumos del padre"
                                description="Consume outputs del proceso padre para utilizarlos en este proceso"
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {parentOutputConsumptions.map((consumption) => (
                                <div key={consumption.id} className="border rounded-lg p-4 bg-muted/30">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="secondary" className="text-sm">
                                                    {consumption.productionOutput?.product?.name || 'Sin nombre'}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    Output #{consumption.production_output_id}
                                                </span>
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Peso consumido:</span>
                                                    <span className="font-semibold">{formatWeight(consumption.consumed_weight_kg)}</span>
                                                </div>
                                                {consumption.consumed_boxes && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-muted-foreground">Cajas consumidas:</span>
                                                        <span className="font-semibold">{consumption.consumed_boxes}</span>
                                                    </div>
                                                )}
                                                {consumption.notes && (
                                                    <div className="mt-2 pt-2 border-t">
                                                        <p className="text-xs text-muted-foreground">{consumption.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setConsumptionFormData({
                                                        production_output_id: consumption.production_output_id?.toString() || '',
                                                        consumed_weight_kg: consumption.consumed_weight_kg?.toString() || '',
                                                        consumed_boxes: consumption.consumed_boxes?.toString() || '',
                                                        notes: consumption.notes || ''
                                                    })
                                                    handleOpenConsumptionDialog()
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteConsumption(consumption.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Totales Generales */}
            {(inputs.length > 0 || parentOutputConsumptions.length > 0) && (
                <div className="mt-6 border rounded-lg overflow-hidden">
                    <div className="bg-muted/30 p-5 border-b">
                        <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide">Totales Generales</h4>
                        <div className="grid grid-cols-4 gap-6 text-center">
                            <div className="flex flex-col items-center justify-center">
                                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-semibold">Palets</p>
                                <p className="text-2xl font-bold text-foreground">{calculateTotalSummary().totalPallets}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-semibold">Cajas</p>
                                <p className="text-2xl font-bold text-foreground">{calculateTotalSummary().totalBoxes}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-semibold">Productos</p>
                                <p className="text-2xl font-bold text-foreground">{calculateTotalSummary().totalProducts}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-semibold">Peso Total</p>
                                <p className="text-2xl font-bold text-foreground">{formatWeight(calculateTotalSummary().totalWeight)}</p>
                            </div>
                        </div>
                        {(calculateTotalSummary().totalWeightFromStock > 0 || calculateTotalSummary().totalWeightFromParent > 0) && (
                            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Desde Stock</p>
                                    <p className="text-lg font-semibold">{formatWeight(calculateTotalSummary().totalWeightFromStock)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Desde Padre</p>
                                    <p className="text-lg font-semibold">{formatWeight(calculateTotalSummary().totalWeightFromParent)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            </div>
        </>
    )

    // Diálogo para ver detalles de lotes (separado para que esté disponible en ambos renders)
    const lotsDialog = (
        <Dialog open={lotsDialogOpen} onOpenChange={setLotsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Lotes - {selectedProductLots?.productName}</DialogTitle>
                    <DialogDescription>
                        {selectedProductLots?.palletId
                            ? `Palet #${selectedProductLots.palletId}`
                            : 'Todos los palets'}
                    </DialogDescription>
                </DialogHeader>
                {selectedProductLots && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Tag className="h-4 w-4" />
                            <span>{selectedProductLots.lots.length} {selectedProductLots.lots.length === 1 ? 'lote único' : 'lotes diferentes'}</span>
                        </div>

                        {/* Lista de lotes con detalles */}
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-3">
                                {selectedProductLots.lots.map((lot, idx) => {
                                    // Agrupar cajas por lote
                                    const boxesInLot = selectedProductLots.boxes.filter(box => box.lot === lot)
                                    const totalWeightInLot = boxesInLot.reduce((sum, box) => sum + (box.weight || 0), 0)

                                    return (
                                        <div key={idx} className="border rounded-lg p-3 bg-muted/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-sm">
                                                        {lot}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {boxesInLot.length} {boxesInLot.length === 1 ? 'caja' : 'cajas'}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-semibold">
                                                    {formatWeight(totalWeightInLot)}
                                                </span>
                                            </div>
                                            {/* Detalles de cajas individuales si hay múltiples */}
                                            {boxesInLot.length > 1 && (
                                                <div className="mt-2 pt-2 border-t space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground mb-1">Cajas:</p>
                                                    {boxesInLot.map((box, boxIdx) => (
                                                        <div key={boxIdx} className="flex items-center justify-between text-xs py-1 px-2 bg-background rounded">
                                                            <span className="text-muted-foreground">
                                                                Caja #{box.id}
                                                                {selectedProductLots.palletId && ` (Palet #${selectedProductLots.palletId})`}
                                                            </span>
                                                            <span className="font-medium">{formatWeight(box.weight)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )

    // Si renderInCard es true, envolver en Card con botón en header
    if (renderInCard) {
        return (
            <>
                {dialog}
                {consumptionDialog}
                {lotsDialog}
                <Card className="h-fit">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{cardTitle || 'Consumo de Materia prima desde stock'}</CardTitle>
                                <CardDescription>
                                    {cardDescription || 'Materia prima consumida desde el stock en este proceso'}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {headerButton}
                                {productionRecord?.parent_record_id && (
                                    <Dialog open={addConsumptionDialogOpen} onOpenChange={(open) => {
                                        if (open) {
                                            handleOpenConsumptionDialog()
                                        } else {
                                            setAddConsumptionDialogOpen(false)
                                        }
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline">
                                                {parentOutputConsumptions.length > 0 ? (
                                                    <>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Editar Consumo Padre
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Consumir del Padre
                                                    </>
                                                )}
                                            </Button>
                                        </DialogTrigger>
                                        {consumptionDialog.props.children}
                                    </Dialog>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="">
                        {mainContent}
                    </CardContent>
                </Card>
            </>
        )
    }

    // Render normal
    return (
        <>
            {consumptionDialog}
            {lotsDialog}
            {mainContent}
        </>
    )
}

export default ProductionInputsManager
