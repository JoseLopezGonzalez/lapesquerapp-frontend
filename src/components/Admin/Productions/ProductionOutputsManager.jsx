'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { getProductionOutputs, createProductionOutput, updateProductionOutput, deleteProductionOutput, syncProductionOutputs, getProductionRecord, getProductionOutputConsumptions, getAvailableProductsForOutputs, getProductionInputs, getProductionRecordSourcesData } from '@/services/productionService'
import { getProductOptions } from '@/services/productService'
import { formatWeight, getWeight, formatAverageWeight, getConsumedWeight, getConsumedBoxes, getProductName } from '@/helpers/production/formatters'
import { formatDecimal } from '@/helpers/formats/numbers/formatNumbers'
import CostDisplay from './CostDisplay'
import CostBreakdownView from './CostBreakdownView'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, Package, Edit, Save, X, Loader2, ArrowUp, Sparkles, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import { EmptyState } from '@/components/Utilities/EmptyState'
import Loader from '@/components/Utilities/Loader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/Shadcn/Combobox'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useProductionRecordContextOptional } from '@/context/ProductionRecordContext'
import { getRecordField } from '@/helpers/production/recordHelpers'

const ProductionOutputsManager = ({ productionRecordId, initialOutputs: initialOutputsProp = [], onRefresh, hideTitle = false, renderInCard = false, cardTitle, cardDescription }) => {
    const { data: session } = useSession()
    
    // Obtener del contexto (opcional), si no está disponible usar props
    const contextData = useProductionRecordContextOptional()

    // Usar datos del contexto si está disponible, sino usar props
    const contextOutputs = contextData?.recordOutputs || []
    const initialOutputs = contextOutputs.length > 0 ? contextOutputs : initialOutputsProp
    const updateOutputs = contextData?.updateOutputs
    const updateRecord = contextData?.updateRecord

    const [outputs, setOutputs] = useState(initialOutputs)
    const [products, setProducts] = useState([])
    const [productsLoading, setProductsLoading] = useState(true)
    const [loading, setLoading] = useState(initialOutputs.length === 0)
    const [error, setError] = useState(null)
    // Estados de diálogos simples eliminados - solo se usa el diálogo de gestión múltiple
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
    const [sourcesData, setSourcesData] = useState(null) // Datos completos de sources del backend
    // Estado para el dialog de gestión múltiple
    const [manageDialogOpen, setManageDialogOpen] = useState(false)
    const [editableOutputs, setEditableOutputs] = useState([])
    const [newRows, setNewRows] = useState([])
    const [saving, setSaving] = useState(false)
    const [copyingFromConsumption, setCopyingFromConsumption] = useState(false)
    
    // Estado para el diálogo de selección de fuente
    const [sourceSelectionDialogOpen, setSourceSelectionDialogOpen] = useState(false)
    const [fromParentConsumption, setFromParentConsumption] = useState(false)
    const [fromRawMaterialStock, setFromRawMaterialStock] = useState(false)
    
    // Estado para el diálogo de productos disponibles
    const [availableProductsDialogOpen, setAvailableProductsDialogOpen] = useState(false)
    const [availableProducts, setAvailableProducts] = useState([])
    const [loadingAvailableProducts, setLoadingAvailableProducts] = useState(false)
    const [selectedProducts, setSelectedProducts] = useState(new Set())
    const [wasManageDialogOpen, setWasManageDialogOpen] = useState(false)
    
    // Estado para mostrar/ocultar cajas (con localStorage)
    const [showBoxes, setShowBoxes] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('production_show_boxes')
            return saved !== null ? saved === 'true' : true
        }
        return true
    })

    // Flags para prevenir cargas múltiples
    const hasInitializedRef = useRef(false)
    const previousOutputsIdsRef = useRef(null)

    // Crear una clave única basada en los IDs de los outputs para comparación profunda
    const outputsKey = useMemo(() => {
        const currentOutputs = contextOutputs.length > 0 ? contextOutputs : initialOutputsProp
        if (!currentOutputs || currentOutputs.length === 0) return null
        // Crear una clave única basada en los IDs de los outputs (ordenados para consistencia)
        return currentOutputs
            .map(output => output.id || JSON.stringify(output))
            .sort()
            .join(',')
    }, [contextOutputs, initialOutputsProp])

    // Efecto 1: Carga inicial (solo una vez)
    useEffect(() => {
        if (hasInitializedRef.current) return
        if (!session?.user?.accessToken || !productionRecordId) return

        const currentOutputs = contextOutputs.length > 0 ? contextOutputs : initialOutputsProp

        if (currentOutputs && Array.isArray(currentOutputs) && currentOutputs.length > 0) {
            // Tenemos datos iniciales del contexto o props
            setOutputs(currentOutputs)
            setLoading(false)
            hasInitializedRef.current = true
            // Guardar IDs para comparación futura
            previousOutputsIdsRef.current = outputsKey
            // Cargar productos (necesarios para el componente)
            loadProducts()
            return
        }

        // No hay datos iniciales, cargar desde API (solo una vez)
        loadOutputs().finally(() => {
            hasInitializedRef.current = true
        })
        loadProducts()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.accessToken, productionRecordId])

    // Efecto 2: Sincronizar con contexto (solo cuando realmente cambian los datos)
    useEffect(() => {
        if (!hasInitializedRef.current) return // No sincronizar hasta que haya inicializado

        const currentOutputs = contextOutputs.length > 0 ? contextOutputs : initialOutputsProp

        if (!currentOutputs || !Array.isArray(currentOutputs) || currentOutputs.length === 0) {
            // Si los datos se vuelven vacíos, actualizar
            if (outputs.length > 0) {
                setOutputs([])
            }
            return
        }

        // Solo actualizar si realmente cambió el contenido (comparación profunda)
        if (outputsKey !== previousOutputsIdsRef.current) {
            setOutputs(currentOutputs)
            if (currentOutputs.length > 0) {
                setLoading(false)
            }
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
            const token = session.user.accessToken
            const response = await getProductionOutputs(token, { 
                production_record_id: productionRecordId,
                with_sources: true // Incluir sources en la respuesta
            })
            const updatedOutputs = response.data || []
            
            // Actualizar estado local inmediatamente
            setOutputs(updatedOutputs)
            
            // Actualizar el contexto con actualización optimista (sin recarga completa inmediata)
            if (updateOutputs) {
                await updateOutputs(updatedOutputs, false) // Actualización optimista, sin recargar completo
            } else if (updateRecord) {
                await updateRecord()
            }
            
            return updatedOutputs
        } catch (err) {
            console.warn('Error loading outputs:', err)
            return []
        }
    }

    const loadOutputs = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true)
            }
            setError(null)
            const token = session.user.accessToken
            const response = await getProductionOutputs(token, { 
                production_record_id: productionRecordId,
                with_sources: true // Incluir sources en la respuesta
            })
            setOutputs(response.data || [])
        } catch (err) {
            console.error('Error loading outputs:', err)
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al cargar las salidas';
            setError(errorMessage)
        } finally {
            if (showLoading) {
                setLoading(false)
            }
        }
    }

    const loadProducts = async () => {
        setProductsLoading(true)
        try {
            const token = session.user.accessToken
            const response = await getProductOptions(token)
            // Manejar tanto array directo como objeto con propiedad data
            const productsData = Array.isArray(response) ? response : (response.data || response || [])
            // Mapear a formato { value, label } para el Combobox
            const formattedProducts = productsData.map(product => ({
                value: product.id?.toString() || '',
                label: product.name || `Producto #${product.id}`
            }))
            setProducts(formattedProducts)
            // console.log('Productos cargados:', formattedProducts.length, formattedProducts)
        } catch (err) {
            console.error('Error loading products:', err)
        } finally {
            setProductsLoading(false)
        }
    }

    const handleCreateOutput = async (e) => {
        e.preventDefault()
        try {
            const token = session.user.accessToken
            
            // Formatear sources correctamente para el backend
            const formattedSources = formData.sources && formData.sources.length > 0 
                ? formData.sources.map(source => {
                    const formatted = {
                        source_type: source.source_type
                    };
                    
                    // Añadir el ID correcto según el tipo
                    if (source.source_type === 'stock_box') {
                        formatted.production_input_id = parseInt(source.production_input_id);
                    } else if (source.source_type === 'parent_output') {
                        formatted.production_output_consumption_id = parseInt(source.production_output_consumption_id);
                    }
                    
                    // Añadir O bien weight O bien percentage (no ambos)
                    if (source.contributed_weight_kg !== null && source.contributed_weight_kg !== undefined && source.contributed_weight_kg !== '') {
                        formatted.contributed_weight_kg = parseFloat(source.contributed_weight_kg);
                    } else if (source.contribution_percentage !== null && source.contribution_percentage !== undefined && source.contribution_percentage !== '') {
                        formatted.contribution_percentage = parseFloat(source.contribution_percentage);
                    }
                    
                    return formatted;
                })
                : undefined;
            
            const outputData = {
                production_record_id: parseInt(productionRecordId),
                product_id: parseInt(formData.product_id),
                lot_id: formData.lot_id || null,
                boxes: parseInt(formData.boxes) || 0,
                weight_kg: parseFloat(formData.weight_kg) || 0,
                sources: formattedSources
            }

            await createProductionOutput(outputData, token)
            
            // Recargar outputs y actualizar contexto
            await loadOutputsOnly()
            
            resetForm()
        } catch (err) {
            console.error('Error creating output:', err)
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al crear la salida';
            alert(errorMessage)
        }
    }

    // Función handleEditOutput eliminada - la edición se hace desde el diálogo de gestión múltiple

    const handleDeleteOutput = async (outputId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta salida?')) {
            return
        }

        try {
            const token = session.user.accessToken
            await deleteProductionOutput(outputId, token)
            
            // Recargar outputs y actualizar contexto
            await loadOutputsOnly()
        } catch (err) {
            console.error('Error deleting output:', err)
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al eliminar la salida';
            alert(errorMessage)
        }
    }

    const handleEditClick = (output) => {
        // Abrir el diálogo de gestión múltiple con este output preseleccionado
        openManageDialog()
        // El output ya estará en editableOutputs cuando se abra el diálogo
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


    // Funciones para el dialog de gestión múltiple
    const openManageDialog = async () => {
        // Asegurar que los productos estén cargados
        if (products.length === 0) {
            await loadProducts()
        }
        
        // Cargar datos de sources disponibles desde el nuevo endpoint
        try {
            const token = session.user.accessToken
            const sourcesDataResponse = await getProductionRecordSourcesData(productionRecordId, token)
            setSourcesData(sourcesDataResponse)
            
            // Mapear los datos a los formatos que esperan los componentes existentes
            if (sourcesDataResponse?.stockBoxes) {
                setAvailableInputs(sourcesDataResponse.stockBoxes.map(box => ({
                    id: box.productionInputId,
                    box: {
                        id: box.boxId,
                        netWeight: box.netWeight,
                        product: box.product,
                        lot: box.lot,
                        costPerKg: box.costPerKg,
                        totalCost: box.totalCost
                    }
                })))
            }
            
            if (sourcesDataResponse?.parentOutputs) {
                setAvailableConsumptions(sourcesDataResponse.parentOutputs.map(output => ({
                    id: output.productionOutputConsumptionId,
                    productionOutputId: output.productionOutputId,
                    consumedWeightKg: output.consumedWeightKg,
                    consumedBoxes: output.consumedBoxes,
                    product: output.product,
                    lotId: output.lotId,
                    costPerKg: output.costPerKg,
                    totalCost: output.totalCost
                })))
            }
        } catch (err) {
            console.warn('Error loading sources data:', err)
            // Si falla, intentar cargar con el método anterior
            try {
                const [inputsData, consumptionsData] = await Promise.all([
                    getProductionInputs(session.user.accessToken, { production_record_id: productionRecordId }),
                    getProductionOutputConsumptions(session.user.accessToken, { production_record_id: productionRecordId })
                ])
                setAvailableInputs(inputsData.data || [])
                setAvailableConsumptions(consumptionsData.data || [])
            } catch (fallbackErr) {
                console.error('Error loading sources with fallback method:', fallbackErr)
            }
        }
        
        // Recargar outputs con sources incluidos antes de abrir el diálogo
        let outputsWithSources = outputs
        try {
            const token = session.user.accessToken
            const response = await getProductionOutputs(token, { 
                production_record_id: productionRecordId,
                with_sources: true // Incluir sources en la respuesta
            })
            outputsWithSources = response.data || outputs
            // Actualizar el estado local con los outputs que incluyen sources
            setOutputs(outputsWithSources)
        } catch (err) {
            console.warn('Error loading outputs with sources:', err)
            // Si falla, usar los outputs que ya tenemos
        }
        
        // Inicializar con las salidas existentes (ahora con sources)
        setEditableOutputs(outputsWithSources.map(output => {
            // Manejar tanto camelCase como snake_case
            const weight = output.weightKg || output.weight_kg || 0
            
            // Normalizar sources - pueden venir en diferentes formatos (camelCase o snake_case)
            let normalizedSources = []
            if (output.sources) {
                if (Array.isArray(output.sources) && output.sources.length > 0) {
                    normalizedSources = output.sources.map(source => {
                        if (!source) return null
                        // Convertir de camelCase a snake_case para el formulario
                        return {
                            source_type: source.source_type || source.sourceType || null,
                            production_input_id: source.production_input_id || source.productionInputId || null,
                            production_output_consumption_id: source.production_output_consumption_id || source.productionOutputConsumptionId || null,
                            contributed_weight_kg: source.contributed_weight_kg !== undefined && source.contributed_weight_kg !== null 
                                ? source.contributed_weight_kg 
                                : (source.contributedWeightKg !== undefined && source.contributedWeightKg !== null 
                                    ? source.contributedWeightKg 
                                    : null),
                            contribution_percentage: source.contribution_percentage !== undefined && source.contribution_percentage !== null
                                ? source.contribution_percentage
                                : (source.contributionPercentage !== undefined && source.contributionPercentage !== null
                                    ? source.contributionPercentage
                                    : null),
                        }
                    }).filter(s => s !== null) // Filtrar nulls
                }
            }
            
            // Debug: verificar sources
            console.log(`Output ${output.id}:`, {
                hasSources: !!output.sources,
                sourcesType: Array.isArray(output.sources) ? 'array' : typeof output.sources,
                sourcesLength: Array.isArray(output.sources) ? output.sources.length : 'N/A',
                normalizedSourcesLength: normalizedSources.length,
                normalizedSources: normalizedSources
            })
            
            return {
                id: output.id,
                product_id: output.product?.id?.toString() || '',
                boxes: output.boxes?.toString() || '',
                weight_kg: weight.toString(),
                sources: normalizedSources,
                isNew: false
            }
        }))
        setNewRows([])
        setManageDialogOpen(true)
    }

    const addNewRow = () => {
        setNewRows([...newRows, {
            id: `new-${Date.now()}`,
            product_id: '',
            boxes: '',
            weight_kg: '',
            sources: [],
            isNew: true
        }])
    }

    // Función para abrir el diálogo de selección de fuente
    const handleOpenSourceSelectionDialog = () => {
        setSourceSelectionDialogOpen(true)
        setFromParentConsumption(false)
        setFromRawMaterialStock(false)
    }

    // Función principal que copia desde las fuentes seleccionadas
    const handleCopyFromConsumptions = async (useParent = false, useStock = false) => {
        try {
            setCopyingFromConsumption(true)
            const token = session.user.accessToken
            
            // Obtener los IDs de productos que ya están en outputs existentes o en nuevas líneas
            const existingProductIds = new Set()
            
            // Agregar IDs de outputs existentes
            editableOutputs.forEach(output => {
                if (output.product_id) {
                    existingProductIds.add(output.product_id.toString())
                }
            })
            
            // Agregar IDs de nuevas líneas ya añadidas
            newRows.forEach(row => {
                if (row.product_id) {
                    existingProductIds.add(row.product_id.toString())
                }
            })

            const allNewRows = []

            // Copiar desde consumo de proceso padre
            if (useParent) {
                // Obtener el record para verificar si tiene padre
                const record = await getProductionRecord(productionRecordId, token)
                const hasParent = record.parent_record_id || record.parentRecordId
                
                if (!hasParent) {
                    alert('Este proceso no tiene un proceso padre. No se pueden copiar consumos del proceso padre.')
                } else {
                    // Obtener los consumos del padre
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
                        // Filtrar consumos que no están ya añadidos
                        const consumptionsToAdd = consumptions.filter(consumption => {
                            const productId = consumption.productionOutput?.product?.id || 
                                             consumption.productionOutput?.productId ||
                                             consumption.production_output?.product?.id ||
                                             consumption.production_output?.product_id
                            
                            if (!productId) return false
                            return !existingProductIds.has(productId.toString())
                        })

                        // Crear nuevas líneas para cada consumo
                        const parentRows = consumptionsToAdd.map((consumption, index) => {
                            const productId = consumption.productionOutput?.product?.id || 
                                             consumption.productionOutput?.productId ||
                                             consumption.production_output?.product?.id ||
                                             consumption.production_output?.product_id
                            
                            const weight = getConsumedWeight(consumption)
                            const boxes = getConsumedBoxes(consumption)
                            
                            // Agregar a existingProductIds para evitar duplicados con stock
                            existingProductIds.add(productId.toString())
                            
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

            // Copiar desde materia prima en stock (inputs del record)
            if (useStock) {
                try {
                    // Obtener los inputs (consumos de materia prima) del record actual
                    const inputsResponse = await getProductionInputs(token, {
                        production_record_id: productionRecordId
                    })
                    const inputs = inputsResponse.data || []
                    
                    if (inputs.length === 0) {
                        alert('Este proceso no tiene consumos de materia prima desde stock registrados.')
                    } else {
                        // Agrupar inputs por producto
                        const productsMap = {}
                        
                        inputs.forEach(input => {
                            const product = input.box?.product || input.box?.productId
                            if (!product) return
                            
                            const productId = product.id?.toString() || product.toString()
                            if (!productId) return
                            
                            if (!productsMap[productId]) {
                                productsMap[productId] = {
                                    productId: productId,
                                    boxes: 0,
                                    weight: 0
                                }
                            }
                            
                            // Contar cajas (cada input es una caja)
                            productsMap[productId].boxes += 1
                            
                            // Sumar peso neto
                            const weight = parseFloat(input.box?.netWeight || 0)
                            productsMap[productId].weight += weight
                        })
                        
                        // Filtrar productos que no están ya añadidos y crear líneas
                        const stockRows = Object.values(productsMap)
                            .filter(product => {
                                if (!product.productId) return false
                                return !existingProductIds.has(product.productId)
                            })
                            .map((product, index) => {
                                const productId = product.productId
                                
                                // Agregar a existingProductIds para evitar duplicados
                                existingProductIds.add(productId)
                                
                                return {
                                    id: `new-stock-${Date.now()}-${index}-${productId}`,
                                    product_id: productId,
                                    boxes: product.boxes.toString(),
                                    weight_kg: product.weight > 0 ? parseFloat(product.weight).toFixed(2) : '',
                                    isNew: true
                                }
                            })
                        
                        if (stockRows.length > 0) {
                            allNewRows.push(...stockRows)
                        } else {
                            alert('Todos los productos de los consumos de materia prima ya están añadidos como salidas.')
                        }
                    }
                } catch (err) {
                    console.error('Error loading raw material inputs:', err)
                    alert('Error al cargar los consumos de materia prima desde stock.')
                }
            }

            if (allNewRows.length === 0) {
                if (useParent && useStock) {
                    alert('No se encontraron productos nuevos para agregar desde las fuentes seleccionadas.')
                } else if (useParent) {
                    alert('Todos los productos de los consumos del padre ya están añadidos como salidas.')
                } else if (useStock) {
                    alert('No hay productos disponibles en stock o todos ya están añadidos como salidas.')
                }
                return
            }

            // Añadir todas las nuevas líneas
            setNewRows([...newRows, ...allNewRows])
            setSourceSelectionDialogOpen(false)
        } catch (err) {
            console.error('Error copying from consumptions:', err)
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al copiar desde las fuentes seleccionadas';
            alert(errorMessage)
        } finally {
            setCopyingFromConsumption(false)
        }
    }

    // Función para confirmar y ejecutar la copia desde las fuentes seleccionadas
    const handleConfirmSourceSelection = () => {
        if (!fromParentConsumption && !fromRawMaterialStock) {
            alert('Por favor selecciona al menos una fuente.')
            return
        }
        handleCopyFromConsumptions(fromParentConsumption, fromRawMaterialStock)
    }

    const removeRow = (id) => {
        if (id.toString().startsWith('new-')) {
            setNewRows(newRows.filter(row => row.id !== id))
        } else {
            setEditableOutputs(editableOutputs.filter(row => row.id !== id))
        }
    }

    const updateRow = (id, field, value) => {
        if (id.toString().startsWith('new-')) {
            setNewRows(newRows.map(row => 
                row.id === id ? { ...row, [field]: value } : row
            ))
        } else {
            setEditableOutputs(editableOutputs.map(row => 
                row.id === id ? { ...row, [field]: value } : row
            ))
        }
    }

    const handleSaveAll = async () => {
        try {
            setSaving(true)
            const token = session.user.accessToken

            // Preparar el array de outputs para sincronización
            // Incluir tanto las salidas existentes (con ID) como las nuevas (sin ID)
            const allOutputs = [
                ...editableOutputs.filter(row => row.product_id && row.weight_kg),
                ...newRows.filter(row => row.product_id && row.weight_kg)
            ].map(row => {
            const output = {
                product_id: parseInt(row.product_id),
                lot_id: null, // Por ahora no se usa lot_id en el dialog masivo
                boxes: parseInt(row.boxes) || 0,
                weight_kg: parseFloat(row.weight_kg) || 0
            }
            
            // Añadir sources si existen y están formateados correctamente
            if (row.sources && Array.isArray(row.sources) && row.sources.length > 0) {
                const formattedSources = row.sources.map(source => {
                    const formatted = {
                        source_type: source.source_type
                    };
                    
                    if (source.source_type === 'stock_box') {
                        formatted.production_input_id = parseInt(source.production_input_id);
                    } else if (source.source_type === 'parent_output') {
                        formatted.production_output_consumption_id = parseInt(source.production_output_consumption_id);
                    }
                    
                    if (source.contributed_weight_kg !== null && source.contributed_weight_kg !== undefined && source.contributed_weight_kg !== '') {
                        formatted.contributed_weight_kg = parseFloat(source.contributed_weight_kg);
                    } else if (source.contribution_percentage !== null && source.contribution_percentage !== undefined && source.contribution_percentage !== '') {
                        formatted.contribution_percentage = parseFloat(source.contribution_percentage);
                    }
                    
                    return formatted;
                });
                output.sources = formattedSources;
            }
            
            // Si tiene ID (es una salida existente), incluir el ID para actualizar
            if (row.id && !row.id.toString().startsWith('new-')) {
                output.id = row.id
            }
            
            return output
            })

            // Usar el endpoint de sincronización que maneja crear, actualizar y eliminar en una sola petición
            const response = await syncProductionOutputs(productionRecordId, {
                outputs: allOutputs
            }, token)

            // Resetear estados antes de cerrar el diálogo
            setEditableOutputs([])
            setNewRows([])
            setSaving(false)
            
            // Cerrar el dialog
            setManageDialogOpen(false)
            
            // Actualizar el estado con los outputs sincronizados del servidor
            if (response.data && response.data.outputs) {
                const updatedOutputs = response.data.outputs
                setOutputs(updatedOutputs)
                
                // Actualizar el contexto con actualización optimista (sin recarga completa inmediata)
                if (updateOutputs) {
                    await updateOutputs(updatedOutputs, false) // Actualización optimista, sin recargar completo
                } else if (updateRecord) {
                    await updateRecord()
                }
            } else {
                // Si no vienen en la respuesta, recargar outputs y actualizar contexto
                await loadOutputsOnly()
            }
            
        } catch (err) {
            console.error('Error saving outputs:', err)
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al guardar las salidas';
            alert(errorMessage)
            // Asegurar que el estado se resetee incluso si hay error
            setSaving(false)
        }
    }

    const getAllRows = () => {
        return [...editableOutputs, ...newRows]
    }

    // Función para obtener el productionId del record
    const getProductionId = () => {
        if (contextData?.record) {
            return getRecordField(contextData.record, 'productionId')
        }
        return null
    }

    // Función para cargar productos disponibles
    const loadAvailableProducts = async () => {
        try {
            setLoadingAvailableProducts(true)
            const token = session.user.accessToken
            const productionId = getProductionId()
            
            if (!productionId) {
                alert('No se pudo obtener el ID de la producción')
                return
            }

            const products = await getAvailableProductsForOutputs(productionId, token)
            setAvailableProducts(products || [])
        } catch (err) {
            console.error('Error loading available products:', err)
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al cargar los productos disponibles';
            alert(errorMessage)
        } finally {
            setLoadingAvailableProducts(false)
        }
    }

    // Función para abrir el diálogo de productos disponibles
    const handleOpenAvailableProductsDialog = async () => {
        // Guardar si el diálogo de gestión múltiple estaba abierto
        setWasManageDialogOpen(manageDialogOpen)
        // Cerrar el diálogo de gestión múltiple temporalmente
        setManageDialogOpen(false)
        setAvailableProductsDialogOpen(true)
        setSelectedProducts(new Set())
        await loadAvailableProducts()
    }

    // Función para alternar selección de producto
    const toggleProductSelection = (productId) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev)
            if (newSet.has(productId)) {
                newSet.delete(productId)
            } else {
                newSet.add(productId)
            }
            return newSet
        })
    }

    // Función para agregar productos seleccionados a las salidas
    const handleAddSelectedProducts = async () => {
        if (selectedProducts.size === 0) {
            alert('Por favor selecciona al menos un producto')
            return
        }

        try {
            const productsToAdd = availableProducts.filter(p => selectedProducts.has(p.product.id))
            
            // Si el diálogo de gestión múltiple estaba abierto, agregar como nuevas filas
            if (wasManageDialogOpen) {
                // Obtener IDs de productos que ya están en la lista
                const existingProductIds = new Set()
                getAllRows().forEach(row => {
                    if (row.product_id) {
                        existingProductIds.add(row.product_id.toString())
                    }
                })
                
                // Filtrar productos que no están ya en la lista
                const newProductsToAdd = productsToAdd.filter(product => 
                    !existingProductIds.has(product.product.id.toString())
                )
                
                if (newProductsToAdd.length === 0) {
                    alert('Todos los productos seleccionados ya están en la lista.')
                    setAvailableProductsDialogOpen(false)
                    setSelectedProducts(new Set())
                    setWasManageDialogOpen(false)
                    return
                }
                
                // Agregar como nuevas filas
                const newRowsToAdd = newProductsToAdd.map((product, index) => ({
                    id: `new-${Date.now()}-${index}-${product.product.id}`,
                    product_id: product.product.id.toString(),
                    boxes: (product.totalBoxes || 0).toString(),
                    weight_kg: product.totalWeight > 0 ? parseFloat(product.totalWeight).toFixed(2) : '0.00',
                    isNew: true
                }))
                
                setNewRows([...newRows, ...newRowsToAdd])
                
                // Cerrar el diálogo de productos disponibles
                setAvailableProductsDialogOpen(false)
                setSelectedProducts(new Set())
                setWasManageDialogOpen(false)
                
                // Reabrir el diálogo de gestión múltiple
                setManageDialogOpen(true)
            } else {
                // Si no está en el diálogo de gestión múltiple, crear las salidas directamente
                const token = session.user.accessToken
                
                // Crear las salidas para cada producto seleccionado
                const createPromises = productsToAdd.map(product => {
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
                
                // Recargar outputs y actualizar contexto
                await loadOutputsOnly()
                
                // Cerrar el diálogo y resetear
                setAvailableProductsDialogOpen(false)
                setSelectedProducts(new Set())
                setWasManageDialogOpen(false)
                setAddDialogOpen(false)
                resetForm()
            }
        } catch (err) {
            console.error('Error adding selected products:', err)
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al agregar los productos seleccionados';
            alert(errorMessage)
        }
    }


    if (loading) {
        return (
            <div className="space-y-4 flex items-center justify-center py-12">
                <Loader />
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

    // Diálogo simple eliminado - ya no se usa

    // Diálogo de selección de fuente
    const sourceSelectionDialog = (
        <Dialog open={sourceSelectionDialogOpen} onOpenChange={setSourceSelectionDialogOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Seleccionar Fuente de Datos</DialogTitle>
                    <DialogDescription>
                        Selecciona desde dónde deseas añadir automáticamente las salidas
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                        <Checkbox
                            id="from-parent-consumption"
                            checked={fromParentConsumption}
                            onCheckedChange={setFromParentConsumption}
                        />
                        <div className="flex-1 space-y-1">
                            <label
                                htmlFor="from-parent-consumption"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Consumo de proceso padre
                            </label>
                            <p className="text-xs text-muted-foreground">
                                Añade productos, pesos y cajas desde los consumos del proceso padre
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                        <Checkbox
                            id="from-raw-material-stock"
                            checked={fromRawMaterialStock}
                            onCheckedChange={setFromRawMaterialStock}
                        />
                        <div className="flex-1 space-y-1">
                            <label
                                htmlFor="from-raw-material-stock"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Consumo de materia prima desde stock
                            </label>
                            <p className="text-xs text-muted-foreground">
                                Añade productos desde los consumos de materia prima registrados en este proceso
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button
                        variant="outline"
                        onClick={() => setSourceSelectionDialogOpen(false)}
                        disabled={copyingFromConsumption}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmSourceSelection}
                        disabled={copyingFromConsumption || (!fromParentConsumption && !fromRawMaterialStock)}
                    >
                        {copyingFromConsumption ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Añadiendo...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Añadir
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )

    // Diálogo de productos disponibles
    const availableProductsDialog = (
        <Dialog open={availableProductsDialogOpen} onOpenChange={(open) => {
            setAvailableProductsDialogOpen(open)
            if (!open) {
                setSelectedProducts(new Set())
                // Si se cierra sin agregar y el diálogo de gestión estaba abierto, reabrirlo
                if (wasManageDialogOpen && !selectedProducts.size) {
                    setManageDialogOpen(true)
                }
                setWasManageDialogOpen(false)
            }
        }}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Productos Disponibles para Salidas</DialogTitle>
                    <DialogDescription>
                        Selecciona los productos que deseas agregar automáticamente. Estos productos tienen cajas y pesos registrados en ventas, stock y reprocesados.
                    </DialogDescription>
                </DialogHeader>
                
                {loadingAvailableProducts ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : availableProducts.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-muted-foreground">
                            No hay productos disponibles para agregar como salidas.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <ScrollArea className="h-[500px] border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={selectedProducts.size === availableProducts.length && availableProducts.length > 0}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedProducts(new Set(availableProducts.map(p => p.product.id)))
                                                    } else {
                                                        setSelectedProducts(new Set())
                                                    }
                                                }}
                                            />
                                        </TableHead>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-right">Cajas Totales</TableHead>
                                        <TableHead className="text-right">Peso Total (kg)</TableHead>
                                        <TableHead>Fuentes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {availableProducts.map((item) => {
                                        const isSelected = selectedProducts.has(item.product.id)
                                        return (
                                            <TableRow 
                                                key={item.product.id}
                                                className={isSelected ? 'bg-muted/50' : ''}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleProductSelection(item.product.id)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {item.product.name}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.totalBoxes || 0}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatWeight(item.totalWeight || 0)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                        {item.sources?.sales && (item.sources.sales.boxes > 0 || item.sources.sales.weight > 0) && (
                                                            <span>Ventas: {item.sources.sales.boxes} cajas, {formatWeight(item.sources.sales.weight)}</span>
                                                        )}
                                                        {item.sources?.stock && (item.sources.stock.boxes > 0 || item.sources.stock.weight > 0) && (
                                                            <span>Stock: {item.sources.stock.boxes} cajas, {formatWeight(item.sources.stock.weight)}</span>
                                                        )}
                                                        {item.sources?.reprocessed && (item.sources.reprocessed.boxes > 0 || item.sources.reprocessed.weight > 0) && (
                                                            <span>Reprocesados: {item.sources.reprocessed.boxes} cajas, {formatWeight(item.sources.reprocessed.weight)}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        
                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setAvailableProductsDialogOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleAddSelectedProducts}
                                disabled={selectedProducts.size === 0}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar {selectedProducts.size > 0 ? `${selectedProducts.size} ` : ''}Producto{selectedProducts.size !== 1 ? 's' : ''}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )

    // Diálogo de edición eliminado - toda la edición se hace desde el diálogo de gestión múltiple

    const mainContent = (
        <>
            {!hideTitle && !renderInCard && (
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Salidas Lógicas</h3>
                        <p className="text-sm text-muted-foreground">
                            Productos producidos en este proceso
                        </p>
                    </div>
                </div>
            )}
            {!renderInCard && (
                <div className={`flex items-center ${hideTitle ? 'justify-end' : 'justify-between'}`}>
                    {addButton}
                </div>
            )}

            {/* Lista de outputs existentes */}
            {outputs.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed rounded-lg bg-muted/30">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="rounded-full bg-primary/10 p-4">
                            <Package className="h-10 w-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-foreground">
                                No hay salidas registradas
                            </h4>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Agrega una salida para registrar los productos producidos en este proceso
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {!hideTitle && !renderInCard && (
                        <div>
                            <h4 className="text-sm font-semibold">Salidas Registradas ({outputs.length})</h4>
                            <p className="text-xs text-muted-foreground">
                                Productos producidos en este proceso
                            </p>
                        </div>
                    )}
                        <ScrollArea className={hideTitle ? "h-64" : "h-96"}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        {showBoxes && <TableHead>Cajas</TableHead>}
                                        <TableHead>Peso Total</TableHead>
                                        {showBoxes && <TableHead>Peso Promedio</TableHead>}
                                        <TableHead>Coste</TableHead>
                                        <TableHead>Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {outputs.map((output) => {
                                        const weight = getWeight(output)
                                        const avgWeight = formatAverageWeight(weight, output.boxes)
                                        return (
                                            <TableRow key={output.id}>
                                                <TableCell className="font-medium">
                                                    {output.product?.name || 'N/A'}
                                                </TableCell>
                                                {showBoxes && <TableCell>{output.boxes || 0}</TableCell>}
                                                <TableCell>{formatWeight(weight)}</TableCell>
                                                {showBoxes && <TableCell>{avgWeight}</TableCell>}
                                                <TableCell>
                                                    <CostDisplay output={output} showDetails={false} size="sm" />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setBreakdownOutputId(output.id)
                                                                setBreakdownDialogOpen(true)
                                                            }}
                                                        >
                                                            Ver Desglose
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditClick(output)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteOutput(output.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                </div>
            )}
        </>
    )

    // Botón para el header (sin Dialog wrapper)
    const hasOutputs = outputs.length > 0
    const headerButton = (
        <Button
            onClick={openManageDialog}
        >
            {hasOutputs ? (
                <>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Salidas
                </>
            ) : (
                <>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Salidas
                </>
            )}
        </Button>
    )

    // Dialog de gestión múltiple
    const manageDialog = (
        <Dialog open={manageDialogOpen} onOpenChange={(open) => {
            if (!open && !saving) {
                // Resetear estados al cerrar sin guardar
                setEditableOutputs([])
                setNewRows([])
            }
            setManageDialogOpen(open)
        }}>
            <DialogContent className="max-w-5xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Gestionar Salidas</DialogTitle>
                    <DialogDescription>
                        Agrega, edita o elimina múltiples salidas de forma rápida
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="show-boxes-outputs-dialog"
                                checked={showBoxes}
                                onCheckedChange={handleToggleBoxes}
                            />
                            <label
                                htmlFor="show-boxes-outputs-dialog"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Mostrar Cajas
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={handleOpenAvailableProductsDialog}
                                            variant="default"
                                            size="sm"
                                        >
                                            <Zap className="h-4 w-4 mr-2" />
                                            Agregar desde productos disponibles
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p className="text-sm">
                                            Agrega automáticamente productos con cajas y pesos registrados en ventas, stock y reprocesados.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={handleOpenSourceSelectionDialog}
                                            variant="default"
                                            size="sm"
                                            disabled={copyingFromConsumption}
                                        >
                                            {copyingFromConsumption ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Añadiendo...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="h-4 w-4 mr-2" />
                                                    Añadir automáticamente desde consumo
                                                </>
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p className="text-sm">
                                            Añade automáticamente líneas de salida desde consumo de proceso padre o materia prima en stock. Puedes seleccionar una o ambas fuentes.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Button
                                onClick={addNewRow}
                                variant="outline"
                                size="sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Línea
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="h-[500px] border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[300px]">Producto</TableHead>
                                {showBoxes && <TableHead className="w-[120px]">Cajas</TableHead>}
                                <TableHead className="w-[120px]">Peso (kg)</TableHead>
                                {showBoxes && <TableHead className="w-[100px]">Peso Prom.</TableHead>}
                                <TableHead className="w-[100px]">Fuentes</TableHead>
                                <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getAllRows().map((row) => {
                                    const avgWeight = row.boxes && parseFloat(row.boxes) > 0 && row.weight_kg
                                        ? formatDecimal(parseFloat(row.weight_kg) / parseFloat(row.boxes))
                                        : '0,00'
                                    
                                    const isValid = row.product_id && row.boxes && parseFloat(row.boxes) > 0 && row.weight_kg && parseFloat(row.weight_kg) > 0
                                    
                                    return (
                                        <>
                                            <TableRow 
                                                key={row.id}
                                                className={!isValid && (row.product_id || row.boxes || row.weight_kg) ? 'bg-muted/50' : ''}
                                            >
                                                <TableCell>
                                                    <div className={!row.product_id ? '[&_button]:border-destructive' : ''}>
                                                        <Combobox
                                                            options={products}
                                                            value={row.product_id}
                                                            onChange={(value) => updateRow(row.id, 'product_id', value)}
                                                            placeholder="Buscar producto..."
                                                            searchPlaceholder="Buscar producto..."
                                                            notFoundMessage="No se encontraron productos"
                                                            loading={productsLoading}
                                                        />
                                                    </div>
                                                </TableCell>
                                                {showBoxes && (
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={row.boxes}
                                                        onChange={(e) => updateRow(row.id, 'boxes', e.target.value)}
                                                        placeholder="0"
                                                        className="h-9"
                                                    />
                                                </TableCell>
                                                )}
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={row.weight_kg}
                                                        onChange={(e) => updateRow(row.id, 'weight_kg', e.target.value)}
                                                        placeholder="0.00"
                                                        className={`h-9 ${!row.weight_kg || parseFloat(row.weight_kg) <= 0 ? 'border-destructive' : ''}`}
                                                    />
                                                </TableCell>
                                                {showBoxes && (
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatWeight(avgWeight)}
                                                    </span>
                                                </TableCell>
                                                )}
                                                <TableCell>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const newExpanded = new Set(expandedSourcesRows)
                                                            if (expandedSourcesRows.has(row.id)) {
                                                                newExpanded.delete(row.id)
                                                            } else {
                                                                newExpanded.add(row.id)
                                                            }
                                                            setExpandedSourcesRows(newExpanded)
                                                        }}
                                                        className="h-8 text-xs"
                                                    >
                                                        <span className="flex items-center gap-1">
                                                        {row.sources && Array.isArray(row.sources) && row.sources.length > 0 ? (
                                                            <>
                                                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                                {row.sources.length} fuente{row.sources.length !== 1 ? 's' : ''}
                                                            </>
                                                        ) : (
                                                            'Configurar'
                                                        )}
                                                            {expandedSourcesRows.has(row.id) ? (
                                                                <ChevronDown className="h-4 w-4 ml-1" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4 ml-1" />
                                                            )}
                                                        </span>
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeRow(row.id)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {expandedSourcesRows.has(row.id) && (
                                                <TableRow key={`${row.id}-sources`} className="bg-gray-50/50">
                                                <TableCell colSpan={showBoxes ? 6 : 5} className="p-4 pl-8">
                                                    <div className="space-y-3">
                                                        <div className="text-sm font-semibold text-gray-700">
                                                            Fuentes de Materia Prima
                                                        </div>
                                                        {row.sources && Array.isArray(row.sources) && row.sources.length > 0 ? (
                                                            <div className="space-y-2">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead className="h-8 text-xs">Tipo</TableHead>
                                                                            <TableHead className="h-8 text-xs">Origen</TableHead>
                                                                            <TableHead className="h-8 text-xs">Peso (kg)</TableHead>
                                                                            <TableHead className="h-8 text-xs">%</TableHead>
                                                                            <TableHead className="h-8 text-xs w-[40px]"></TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {row.sources.map((source, sourceIndex) => {
                                                                            // Obtener el peso disponible del source específico (origen real, incluyendo merma/rendimiento)
                                                                            const sourceTotalWeight = (() => {
                                                                                if (source.source_type === 'stock_box') {
                                                                                    // Buscar el input en availableInputs o sourcesData
                                                                                    const input = availableInputs.find(i => i.id === source.production_input_id)
                                                                                    const stockBox = sourcesData?.stockBoxes?.find(b => b.productionInputId === source.production_input_id)
                                                                                    // El peso disponible es el netWeight del source (ya incluye merma si aplica)
                                                                                    return stockBox?.netWeight || input?.box?.netWeight || 0
                                                                                } else {
                                                                                    // Buscar el consumo en availableConsumptions o sourcesData
                                                                                    const consumption = availableConsumptions.find(c => c.id === source.production_output_consumption_id)
                                                                                    const parentOutput = sourcesData?.parentOutputs?.find(o => o.productionOutputConsumptionId === source.production_output_consumption_id)
                                                                                    // El peso disponible es el consumedWeightKg del source (ya incluye merma si aplica)
                                                                                    return parentOutput?.consumedWeightKg || consumption?.consumedWeightKg || 0
                                                                                }
                                                                            })()
                                                                            
                                                                            // Calcular cuánto se ha usado de este source en otros sources del mismo output
                                                                            const usedInSameOutput = row.sources
                                                                                .filter((s, idx) => idx !== sourceIndex && 
                                                                                    ((source.source_type === 'stock_box' && s.production_input_id === source.production_input_id) ||
                                                                                     (source.source_type === 'parent_output' && s.production_output_consumption_id === source.production_output_consumption_id)))
                                                                                .reduce((sum, s) => sum + (parseFloat(s.contributed_weight_kg) || 0), 0)
                                                                            
                                                                            // Calcular el peso disponible restante (total - ya usado en otros sources del mismo output)
                                                                            const sourceAvailableWeight = Math.max(0, sourceTotalWeight - usedInSameOutput)
                                                                            
                                                                            return (
                                                                                <TableRow key={sourceIndex}>
                                                                                    <TableCell className="py-1 px-2">
                                                                                        <Badge variant="outline" className="text-xs">
                                                                                            {source.source_type === 'stock_box' ? 'Stock' : 'Padre'}
                                                                                        </Badge>
                                                                                    </TableCell>
                                                                                    <TableCell className="py-1 px-2 text-xs">
                                                                                        {(() => {
                                                                                            if (source.source_type === 'stock_box') {
                                                                                                // Buscar el input en availableInputs o sourcesData
                                                                                                const input = availableInputs.find(i => i.id === source.production_input_id)
                                                                                                const stockBox = sourcesData?.stockBoxes?.find(b => b.productionInputId === source.production_input_id)
                                                                                                const productName = stockBox?.product?.name || input?.box?.product?.name || 'N/A'
                                                                                                const weight = stockBox?.netWeight || input?.box?.netWeight || 0
                                                                                                return `Input #${source.production_input_id} - ${productName} (${formatWeight(weight)})`
                                                                                            } else {
                                                                                                // Buscar el consumo en availableConsumptions o sourcesData
                                                                                                const consumption = availableConsumptions.find(c => c.id === source.production_output_consumption_id)
                                                                                                const parentOutput = sourcesData?.parentOutputs?.find(o => o.productionOutputConsumptionId === source.production_output_consumption_id)
                                                                                                const productName = parentOutput?.product?.name || consumption?.product?.name || 'N/A'
                                                                                                const weight = parentOutput?.consumedWeightKg || consumption?.consumedWeightKg || 0
                                                                                                return `Consumo #${source.production_output_consumption_id} - ${productName} (${formatWeight(weight)})`
                                                                                            }
                                                                                        })()}
                                                                                    </TableCell>
                                                                                    <TableCell className="py-1 px-2">
                                                                                        <Input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            value={source.contributed_weight_kg || ''}
                                                                                            onChange={(e) => {
                                                                                                const updated = [...(row.sources || [])]
                                                                                                let weight = parseFloat(e.target.value) || 0
                                                                                                
                                                                                                // Validar que no exceda lo disponible del source
                                                                                                if (weight > sourceAvailableWeight) {
                                                                                                    weight = sourceAvailableWeight
                                                                                                    console.warn(
                                                                                                        `El peso ${e.target.value}kg excede lo disponible del source (${sourceAvailableWeight.toFixed(2)}kg). ` +
                                                                                                        `Ajustado automáticamente a ${weight.toFixed(2)}kg`
                                                                                                    )
                                                                                                }
                                                                                                
                                                                                                const outputWeight = parseFloat(row.weight_kg) || 0
                                                                                                
                                                                                                updated[sourceIndex] = {
                                                                                                    ...updated[sourceIndex],
                                                                                                    contributed_weight_kg: e.target.value === '' ? null : weight,
                                                                                                    // Calcular porcentaje sobre el OUTPUT FINAL, no sobre el source (redondeado a 2 decimales)
                                                                                                    contribution_percentage: outputWeight > 0 ? parseFloat(((weight / outputWeight) * 100).toFixed(2)) : null
                                                                                                }
                                                                                                updateRow(row.id, 'sources', updated)
                                                                                            }}
                                                                                            className="h-7 text-xs w-24"
                                                                                            placeholder="0.00"
                                                                                        />
                                                                                    </TableCell>
                                                                                    <TableCell className="py-1 px-2">
                                                                                        <Input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            min="0"
                                                                                            max="100"
                                                                                            value={source.contribution_percentage !== null && source.contribution_percentage !== undefined 
                                                                                                ? source.contribution_percentage 
                                                                                                : ''}
                                                                                            onChange={(e) => {
                                                                                                const updated = [...(row.sources || [])]
                                                                                                const inputValue = e.target.value
                                                                                                
                                                                                                // Permitir escribir libremente (sin formatear inmediatamente)
                                                                                                if (inputValue === '') {
                                                                                                    updated[sourceIndex] = {
                                                                                                        ...updated[sourceIndex],
                                                                                                        contribution_percentage: null,
                                                                                                        contributed_weight_kg: null
                                                                                                    }
                                                                                                    updateRow(row.id, 'sources', updated)
                                                                                                    return
                                                                                                }
                                                                                                
                                                                                                let percentage = parseFloat(inputValue) || 0
                                                                                                
                                                                                                // El porcentaje se refiere al OUTPUT FINAL, no al source
                                                                                                const outputWeight = parseFloat(row.weight_kg) || 0
                                                                                                
                                                                                                // Calcular el peso que resultaría de este porcentaje del OUTPUT
                                                                                                const calculatedWeightFromOutput = outputWeight > 0 ? (percentage / 100) * outputWeight : 0
                                                                                                
                                                                                                // Si el peso calculado excede lo disponible del source, ajustar automáticamente
                                                                                                let finalWeight = calculatedWeightFromOutput
                                                                                                let finalPercentage = percentage
                                                                                                
                                                                                                if (calculatedWeightFromOutput > sourceAvailableWeight) {
                                                                                                    // Ajustar al máximo disponible del source
                                                                                                    finalWeight = sourceAvailableWeight
                                                                                                    // Recalcular el porcentaje basado en el output final (redondeado a 2 decimales)
                                                                                                    finalPercentage = outputWeight > 0 ? parseFloat(((sourceAvailableWeight / outputWeight) * 100).toFixed(2)) : 0
                                                                                                    // Mostrar advertencia
                                                                                                    console.warn(
                                                                                                        `El porcentaje ${percentage}% del output (${calculatedWeightFromOutput.toFixed(2)}kg) excede lo disponible del source (${sourceAvailableWeight.toFixed(2)}kg). ` +
                                                                                                        `Ajustado automáticamente a ${finalPercentage.toFixed(2)}% (${finalWeight.toFixed(2)}kg)`
                                                                                                    )
                                                                                                }
                                                                                                
                                                                                                updated[sourceIndex] = {
                                                                                                    ...updated[sourceIndex],
                                                                                                    contribution_percentage: finalPercentage,
                                                                                                    // Calcular peso basado en el peso disponible del source específico (origen real, incluyendo merma/rendimiento)
                                                                                                    contributed_weight_kg: finalWeight
                                                                                                }
                                                                                                updateRow(row.id, 'sources', updated)
                                                                                            }}
                                                                                            onBlur={(e) => {
                                                                                                // Formatear a 2 decimales cuando pierde el foco
                                                                                                if (e.target.value !== '' && source.contribution_percentage !== null) {
                                                                                                    const formatted = parseFloat(source.contribution_percentage.toFixed(2))
                                                                                                    const updated = [...(row.sources || [])]
                                                                                                    updated[sourceIndex] = {
                                                                                                        ...updated[sourceIndex],
                                                                                                        contribution_percentage: formatted
                                                                                                    }
                                                                                                    updateRow(row.id, 'sources', updated)
                                                                                                }
                                                                                            }}
                                                                                            className={`h-7 text-xs w-24 ${
                                                                                                source.contribution_percentage && parseFloat(row.weight_kg) > 0 && sourceAvailableWeight > 0 && 
                                                                                                ((source.contribution_percentage / 100) * parseFloat(row.weight_kg)) > sourceAvailableWeight 
                                                                                                    ? 'border-yellow-500' 
                                                                                                    : ''
                                                                                            }`}
                                                                                            placeholder="0.00"
                                                                                        />
                                                                                    </TableCell>
                                                                                <TableCell className="py-1 px-2">
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => {
                                                                                            const updated = row.sources.filter((_, i) => i !== sourceIndex)
                                                                                            updateRow(row.id, 'sources', updated)
                                                                                        }}
                                                                                        className="h-7 w-7 p-0"
                                                                                    >
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                            )
                                                                        })}
                                                                    </TableBody>
                                                                </Table>
                                                                {(() => {
                                                                    const totalPercentage = row.sources.reduce((sum, s) => {
                                                                        return sum + (parseFloat(s.contribution_percentage) || 0)
                                                                    }, 0)
                                                                    const isValid = Math.abs(totalPercentage - 100) < 0.01
                                                                    return (
                                                                        <div className={`text-xs ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                                                                            Total: {formatDecimal(totalPercentage, 2)}% / 100%
                                                                        </div>
                                                                    )
                                                                })()}
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-gray-500 py-2">
                                                                No hay fuentes configuradas. Se calcularán automáticamente de forma proporcional.
                                                            </div>
                                                        )}
                                                        <div className="flex gap-2">
                                                            <Select
                                                                onValueChange={(value) => {
                                                                    const [type, id] = value.split('-')
                                                                    const newSource = {
                                                                        source_type: type,
                                                                        [type === 'stock_box' ? 'production_input_id' : 'production_output_consumption_id']: parseInt(id),
                                                                        contributed_weight_kg: null,
                                                                        contribution_percentage: null,
                                                                    }
                                                                    const updated = [...(row.sources || []), newSource]
                                                                    updateRow(row.id, 'sources', updated)
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-8 text-xs w-64">
                                                                    <SelectValue placeholder="Añadir fuente" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {availableInputs.length > 0 && (
                                                                        <>
                                                                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Materias Primas</div>
                                                                            {availableInputs.map(input => (
                                                                                <SelectItem key={`stock_box-${input.id}`} value={`stock_box-${input.id}`} className="text-xs">
                                                                                    Input #{input.id} - {formatWeight(input.box?.netWeight)}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </>
                                                                    )}
                                                                    {availableConsumptions.length > 0 && (
                                                                        <>
                                                                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Outputs Padre</div>
                                                                            {availableConsumptions.map(consumption => (
                                                                                <SelectItem 
                                                                                    key={`parent_output-${consumption.id}`} 
                                                                                    value={`parent_output-${consumption.id}`}
                                                                                    className="text-xs"
                                                                                >
                                                                                    Consumo #{consumption.id} - {formatWeight(consumption.consumedWeightKg)}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </>
                                                                    )}
                                                                    {availableInputs.length === 0 && availableConsumptions.length === 0 && (
                                                                        <SelectItem value="none" disabled className="text-xs">No hay fuentes disponibles</SelectItem>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        </>
                                    )
                                })}
                                {getAllRows().length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="p-0">
                                            <div className="py-12">
                                                <EmptyState
                                                    icon={<Package className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                                    title="No hay salidas agregadas"
                                                    description="Haz clic en 'Agregar Línea' para comenzar a agregar salidas al proceso"
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setManageDialogOpen(false)}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveAll}
                            disabled={saving || getAllRows().some(row => 
                                (row.product_id || row.boxes || row.weight_kg) && 
                                (!row.product_id || !row.weight_kg || parseFloat(row.weight_kg) <= 0)
                            )}
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Guardar
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )

    // Dialog de desglose de costes
    const breakdownDialog = (
        <Dialog open={breakdownDialogOpen} onOpenChange={setBreakdownDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Desglose de Costes</DialogTitle>
                    <DialogDescription>
                        Desglose detallado de todos los costes asociados a esta salida
                    </DialogDescription>
                </DialogHeader>
                {breakdownOutputId && (
                    <CostBreakdownView outputId={breakdownOutputId} />
                )}
            </DialogContent>
        </Dialog>
    )

    // Si renderInCard es true, envolver en Card con botón en header
    if (renderInCard) {
        return (
            <>
                {manageDialog}
                {sourceSelectionDialog}
                {availableProductsDialog}
                {breakdownDialog}
                <Card className="h-fit">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <ArrowUp className="h-5 w-5 text-primary" />
                                    {cardTitle || 'Salidas Lógicas'}
                                </CardTitle>
                                <CardDescription>
                                    {cardDescription || 'Productos producidos en este proceso'}
                                </CardDescription>
                            </div>
                            {headerButton}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {mainContent}
                    </CardContent>
                </Card>
            </>
        )
    }

    // Render normal
    return (
        <div className="space-y-4">
            {manageDialog}
            {sourceSelectionDialog}
            {availableProductsDialog}
            {breakdownDialog}
            {mainContent}
        </div>
    )
}

export default ProductionOutputsManager

