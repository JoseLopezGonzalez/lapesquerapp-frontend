'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { getProductionOutputs, createProductionOutput, updateProductionOutput, deleteProductionOutput, syncProductionOutputs, getProductionRecord, getProductionOutputConsumptions, getAvailableProductsForOutputs } from '@/services/productionService'
import { getProductOptions } from '@/services/productService'
import { formatWeight, getWeight, formatAverageWeight, getConsumedWeight, getConsumedBoxes, getProductName } from '@/helpers/production/formatters'
import { formatDecimal } from '@/helpers/formats/numbers/formatNumbers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, Package, Edit, Save, X, Loader2, ArrowUp, Sparkles, Zap } from 'lucide-react'
import { EmptyState } from '@/components/Utilities/EmptyState'
import Loader from '@/components/Utilities/Loader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/Shadcn/Combobox'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
    const [loading, setLoading] = useState(initialOutputs.length === 0)
    const [error, setError] = useState(null)
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingOutput, setEditingOutput] = useState(null)
    const [formData, setFormData] = useState({
        product_id: '',
        lot_id: '',
        boxes: '',
        weight_kg: ''
    })
    // Estado para el dialog de gestión múltiple
    const [manageDialogOpen, setManageDialogOpen] = useState(false)
    const [editableOutputs, setEditableOutputs] = useState([])
    const [newRows, setNewRows] = useState([])
    const [saving, setSaving] = useState(false)
    const [copyingFromConsumption, setCopyingFromConsumption] = useState(false)
    
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
            const response = await getProductionOutputs(token, { production_record_id: productionRecordId })
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
            const response = await getProductionOutputs(token, { production_record_id: productionRecordId })
            setOutputs(response.data || [])
        } catch (err) {
            console.error('Error loading outputs:', err)
            setError(err.message || 'Error al cargar las salidas')
        } finally {
            if (showLoading) {
                setLoading(false)
            }
        }
    }

    const loadProducts = async () => {
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
        }
    }

    const handleCreateOutput = async (e) => {
        e.preventDefault()
        try {
            const token = session.user.accessToken
            const outputData = {
                production_record_id: parseInt(productionRecordId),
                product_id: parseInt(formData.product_id),
                lot_id: formData.lot_id || null,
                boxes: parseInt(formData.boxes) || 0,
                weight_kg: parseFloat(formData.weight_kg) || 0
            }

            await createProductionOutput(outputData, token)
            
            // Recargar outputs y actualizar contexto
            await loadOutputsOnly()
            
            setAddDialogOpen(false)
            resetForm()
        } catch (err) {
            console.error('Error creating output:', err)
            alert(err.message || 'Error al crear la salida')
        }
    }

    const handleEditOutput = async (e) => {
        e.preventDefault()
        if (!editingOutput) return

        try {
            const token = session.user.accessToken
            const outputData = {
                product_id: parseInt(formData.product_id),
                lot_id: formData.lot_id || null,
                boxes: parseInt(formData.boxes) || 0,
                weight_kg: parseFloat(formData.weight_kg) || 0
            }

            await updateProductionOutput(editingOutput.id, outputData, token)
            
            // Recargar outputs y actualizar contexto
            await loadOutputsOnly()
            
            setEditDialogOpen(false)
            setEditingOutput(null)
            resetForm()
        } catch (err) {
            console.error('Error updating output:', err)
            alert(err.message || 'Error al actualizar la salida')
        }
    }

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
            alert(err.message || 'Error al eliminar la salida')
        }
    }

    const handleEditClick = (output) => {
        setEditingOutput(output)
        setFormData({
            product_id: output.product?.id?.toString() || '',
            lot_id: output.lot_id || '',
            boxes: output.boxes?.toString() || '',
            weight_kg: (output.weightKg || output.weight_kg || 0).toString()
        })
        setEditDialogOpen(true)
    }

    const resetForm = () => {
        setFormData({
            product_id: '',
            lot_id: '',
            boxes: '',
            weight_kg: ''
        })
    }


    // Funciones para el dialog de gestión múltiple
    const openManageDialog = async () => {
        // Asegurar que los productos estén cargados
        if (products.length === 0) {
            await loadProducts()
        }
        
        // Inicializar con las salidas existentes
        setEditableOutputs(outputs.map(output => {
            // Manejar tanto camelCase como snake_case
            const weight = output.weightKg || output.weight_kg || 0
            return {
                id: output.id,
                product_id: output.product?.id?.toString() || '',
                boxes: output.boxes?.toString() || '',
                weight_kg: weight.toString(),
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
            isNew: true
        }])
    }

    const handleCopyFromParentConsumptions = async () => {
        try {
            setCopyingFromConsumption(true)
            const token = session.user.accessToken
            
            // Obtener el record para verificar si tiene padre
            const record = await getProductionRecord(productionRecordId, token)
            const hasParent = record.parent_record_id || record.parentRecordId
            
            if (!hasParent) {
                alert('Este proceso no tiene un proceso padre. No se pueden copiar consumos.')
                return
            }

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
                    return
                }
            }

            if (consumptions.length === 0) {
                alert('El proceso padre no tiene consumos para copiar.')
                return
            }

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

            // Filtrar consumos que no están ya añadidos
            const consumptionsToAdd = consumptions.filter(consumption => {
                const productId = consumption.productionOutput?.product?.id || 
                                 consumption.productionOutput?.productId ||
                                 consumption.production_output?.product?.id ||
                                 consumption.production_output?.product_id
                
                if (!productId) return false
                return !existingProductIds.has(productId.toString())
            })

            if (consumptionsToAdd.length === 0) {
                alert('Todos los productos de los consumos del padre ya están añadidos como salidas.')
                return
            }

            // Crear nuevas líneas para cada consumo
            const newRowsToAdd = consumptionsToAdd.map((consumption, index) => {
                const productId = consumption.productionOutput?.product?.id || 
                                 consumption.productionOutput?.productId ||
                                 consumption.production_output?.product?.id ||
                                 consumption.production_output?.product_id
                
                const weight = getConsumedWeight(consumption)
                const boxes = getConsumedBoxes(consumption)
                
                return {
                    id: `new-${Date.now()}-${index}-${productId}`,
                    product_id: productId?.toString() || '',
                    boxes: boxes > 0 ? boxes.toString() : '',
                    weight_kg: weight > 0 ? weight.toString() : '',
                    isNew: true
                }
            })

            // Añadir las nuevas líneas
            setNewRows([...newRows, ...newRowsToAdd])
        } catch (err) {
            console.error('Error copying from parent consumptions:', err)
            alert(err.message || 'Error al copiar los consumos del proceso padre')
        } finally {
            setCopyingFromConsumption(false)
        }
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
            alert(err.message || 'Error al guardar las salidas')
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
            alert(err.message || 'Error al cargar los productos disponibles')
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
                    weight_kg: (product.totalWeight || 0).toString(),
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
            alert(err.message || 'Error al agregar los productos seleccionados')
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

    const addDialogContent = (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Agregar Salida Lógica</DialogTitle>
                <DialogDescription>
                    Registra la salida de este proceso (producto producido)
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOutput} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="product_id">Producto *</Label>
                        <Select
                            value={formData.product_id}
                            onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un producto" />
                            </SelectTrigger>
                            <SelectContent>
                                {products
                                    .filter(product => product?.id != null)
                                    .map(product => (
                                        <SelectItem key={product.id} value={product.id.toString()}>
                                            {product.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lot_id">Lote</Label>
                        <Input
                            id="lot_id"
                            placeholder="Ej. LOT-2025-001"
                            value={formData.lot_id}
                            onChange={(e) => setFormData({ ...formData, lot_id: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Lote del producto producido (opcional)
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="boxes">Cantidad de Cajas</Label>
                            <Input
                                id="boxes"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={formData.boxes}
                                onChange={(e) => setFormData({ ...formData, boxes: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="weight_kg">Peso Total (kg) *</Label>
                            <Input
                                id="weight_kg"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={formData.weight_kg}
                                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setAddDialogOpen(false)
                                resetForm()
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!formData.product_id || !formData.weight_kg}>
                            Crear Salida
                        </Button>
                    </div>
                </form>
        </DialogContent>
    )

    const addDialog = (
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            {addDialogContent}
        </Dialog>
    )

    const addButton = (
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Salida
                </Button>
            </DialogTrigger>
            {addDialogContent}
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

    const editDialog = (
        <Dialog open={editDialogOpen} onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) {
                setEditingOutput(null)
                resetForm()
            }
        }}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Editar Salida Lógica</DialogTitle>
                    <DialogDescription>
                        Modifica los datos de la salida
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditOutput} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit_product_id">Producto *</Label>
                            <Select
                                value={formData.product_id}
                                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products
                                        .filter(product => product?.id != null)
                                        .map(product => (
                                            <SelectItem key={product.id} value={product.id.toString()}>
                                                {product.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit_lot_id">Lote</Label>
                            <Input
                                id="edit_lot_id"
                                placeholder="Ej. LOT-2025-001"
                                value={formData.lot_id}
                                onChange={(e) => setFormData({ ...formData, lot_id: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_boxes">Cantidad de Cajas</Label>
                                <Input
                                    id="edit_boxes"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.boxes}
                                    onChange={(e) => setFormData({ ...formData, boxes: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_weight_kg">Peso Total (kg) *</Label>
                                <Input
                                    id="edit_weight_kg"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={formData.weight_kg}
                                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                                    required
                                />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setEditDialogOpen(false)
                                setEditingOutput(null)
                                resetForm()
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!formData.product_id || !formData.weight_kg}>
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )

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
                                            onClick={handleCopyFromParentConsumptions}
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
                                            Añade automáticamente todas las líneas de salida copiando los productos, pesos y cajas de los consumos del proceso padre. Solo se añaden los productos que no están ya en la lista.
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
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeRow(row.id)}
                                                    className="h-8 w-8"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
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

    // Si renderInCard es true, envolver en Card con botón en header
    if (renderInCard) {
        return (
            <>
                {manageDialog}
                {addDialog}
                {editDialog}
                {availableProductsDialog}
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
            {addButton}
            {editDialog}
            {availableProductsDialog}
            {mainContent}
        </div>
    )
}

export default ProductionOutputsManager

