'use client'

import React, { useState, useEffect } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit, ArrowDown, Save } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/Utilities/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import Loader from '@/components/Utilities/Loader'

const ProductionOutputConsumptionsManager = ({ productionRecordId, onRefresh, hideTitle = false, renderInCard = false, cardTitle, cardDescription }) => {
    const { data: session } = useSession()
    const [productionRecord, setProductionRecord] = useState(null)
    const [consumptions, setConsumptions] = useState([])
    const [availableOutputs, setAvailableOutputs] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
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
    // Estados para el diálogo masivo
    const [manageDialogOpen, setManageDialogOpen] = useState(false)
    const [editableConsumptions, setEditableConsumptions] = useState([])
    const [newConsumptionRows, setNewConsumptionRows] = useState([])
    const [savingAll, setSavingAll] = useState(false)

    useEffect(() => {
        if (session?.user?.accessToken && productionRecordId) {
            loadData()
            loadProducts()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.accessToken, productionRecordId])

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)
            const token = session.user.accessToken
            
            // Cargar production record para verificar si tiene padre
            const record = await getProductionRecord(productionRecordId, token)
            setProductionRecord(record)

            // Cargar consumos si el proceso tiene padre
            const hasParent = record.parent_record_id || record.parentRecordId
            if (hasParent) {
                // Los consumos vienen en el record
                if (record.parentOutputConsumptions) {
                    setConsumptions(record.parentOutputConsumptions)
                } else {
                    // Si no vienen en el record, cargarlos directamente
                    try {
                        const consumptionsResponse = await getProductionOutputConsumptions(token, {
                            production_record_id: productionRecordId
                        })
                        setConsumptions(consumptionsResponse.data || [])
                    } catch (consumptionErr) {
                        // Si falla, simplemente dejar la lista vacía
                        console.warn('Error loading consumptions:', consumptionErr)
                        setConsumptions([])
                    }
                }
            } else {
                setConsumptions([])
            }
        } catch (err) {
            console.error('Error loading data:', err)
            setError(err.message || 'Error al cargar los datos')
        } finally {
            setLoading(false)
        }
    }

    const loadProducts = async () => {
        try {
            const token = session.user.accessToken
            const response = await getProductOptions(token)
            const productsData = Array.isArray(response) ? response : (response.data || response || [])
            setProducts(productsData)
        } catch (err) {
            console.error('Error loading products:', err)
        }
    }

    // Función helper para obtener el nombre del producto por ID
    const getProductNameById = (productId) => {
        if (!productId || !products.length) return null
        const product = products.find(p => p.id?.toString() === productId.toString())
        return product?.name || null
    }

    const loadAvailableOutputs = async () => {
        const hasParent = productionRecord?.parent_record_id || productionRecord?.parentRecordId
        if (!hasParent) {
            alert('Este proceso no tiene un proceso padre. Selecciona un proceso padre en el formulario primero.')
            return
        }

        try {
            setLoadingAvailableOutputs(true)
            const token = session.user.accessToken
            const response = await getAvailableOutputs(productionRecordId, token)
            const outputs = response.data || []
            // El backend ahora devuelve el producto completo, pero si no viene, lo enriquecemos
            const enrichedOutputs = outputs.map(output => {
                // Si el output ya tiene el producto con nombre, usarlo directamente
                if (output.output?.product?.name) {
                    return output
                }
                // Si no, enriquecer con el nombre del producto
                const productName = getProductNameById(output.output?.productId)
                return {
                    ...output,
                    output: {
                        ...output.output,
                        product: productName ? { name: productName } : (output.output?.product || null)
                    }
                }
            })
            // console.log('Available outputs loaded:', enrichedOutputs.length, enrichedOutputs)
            setAvailableOutputs(enrichedOutputs)
        } catch (err) {
            console.error('Error loading available outputs:', err)
            alert(err.message || 'Error al cargar los outputs disponibles')
            setAvailableOutputs([])
        } finally {
            setLoadingAvailableOutputs(false)
        }
    }

    const handleOpenDialog = async () => {
        // Asegurarse de que los productos estén cargados antes de cargar los outputs
        if (products.length === 0) {
            await loadProducts()
        }
        await loadAvailableOutputs()
        setAddDialogOpen(true)
        
        // Si ya existe un consumo, cargar sus datos para edición
        if (consumptions.length > 0) {
            const existingConsumption = consumptions[0]
            // Manejar tanto camelCase como snake_case
            const outputId = existingConsumption.productionOutputId || existingConsumption.production_output_id
            const weight = existingConsumption.consumedWeightKg || existingConsumption.consumed_weight_kg
            const boxes = existingConsumption.consumedBoxes || existingConsumption.consumed_boxes
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

        // Validar disponibilidad (ajustada si hay consumo existente)
        const selectedOutput = availableOutputs.find(
            o => o.output.id.toString() === formData.production_output_id
        )
        if (!selectedOutput) {
            alert('Output seleccionado no encontrado')
            return
        }

        // Si hay un consumo existente de este output, ajustar disponibilidad sumando el peso original
        const existingConsumption = consumptions.find(c => {
            const cOutputId = c.productionOutputId || c.production_output_id
            return cOutputId?.toString() === formData.production_output_id
        })
        const originalWeight = existingConsumption ? parseFloat(existingConsumption.consumedWeightKg || existingConsumption.consumed_weight_kg || 0) : 0
        const originalBoxes = existingConsumption ? (existingConsumption.consumedBoxes || existingConsumption.consumed_boxes || 0) : 0
        const adjustedAvailableWeight = parseFloat(selectedOutput.availableWeight || 0) + originalWeight
        const adjustedAvailableBoxes = (selectedOutput.availableBoxes || 0) + originalBoxes

        if (weight > adjustedAvailableWeight) {
            alert(`Solo hay ${formatNumber(adjustedAvailableWeight)}kg disponible`)
            return
        }

        const boxes = formData.consumed_boxes 
            ? parseInt(formData.consumed_boxes) 
            : undefined

        if (boxes !== undefined && boxes > adjustedAvailableBoxes) {
            alert(`Solo hay ${adjustedAvailableBoxes} cajas disponibles`)
            return
        }

        try {
            setSavingConsumption(true)
            const token = session.user.accessToken

            const consumptionData = {
                production_record_id: parseInt(productionRecordId),
                production_output_id: parseInt(formData.production_output_id),
                consumed_weight_kg: weight,
                consumed_boxes: boxes,
                notes: formData.notes || undefined
            }

            // Si ya existe un consumo de este output, actualizarlo
            // Manejar tanto camelCase como snake_case
            const existingConsumption = consumptions.find(c => {
                const cOutputId = c.productionOutputId || c.production_output_id
                return cOutputId?.toString() === formData.production_output_id
            })

            if (existingConsumption) {
                await updateProductionOutputConsumption(existingConsumption.id, {
                    consumed_weight_kg: weight,
                    consumed_boxes: boxes,
                    notes: formData.notes || undefined
                }, token)
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
            await loadData()
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
            await loadData()
            if (onRefresh) onRefresh()
        } catch (err) {
            console.error('Error deleting consumption:', err)
            alert(err.message || 'Error al eliminar el consumo')
        }
    }

    const formatWeight = (weight) => {
        if (!weight && weight !== 0) return '0 kg'
        const num = parseFloat(weight)
        if (isNaN(num)) return '0 kg'
        return `${num.toFixed(2)} kg`
    }

    const formatNumber = (value, decimals = 2) => {
        if (value === null || value === undefined) return '0'
        const num = parseFloat(value)
        if (isNaN(num)) return '0'
        return num.toFixed(decimals)
    }

    // Funciones para el diálogo masivo
    const openManageDialog = async () => {
        if (!hasParent) {
            alert('Este proceso no tiene un proceso padre. Selecciona un proceso padre en el formulario primero.')
            return
        }

        // Asegurarse de que los productos estén cargados antes de cargar los outputs
        if (products.length === 0) {
            await loadProducts()
        }

        // Siempre recargar los outputs disponibles para tener los datos más actualizados
        await loadAvailableOutputs()

        // Inicializar con los consumos existentes, guardando el peso original para ajustar disponibilidad
        setEditableConsumptions(consumptions.map(consumption => {
            const outputId = consumption.productionOutputId || consumption.production_output_id
            const weight = consumption.consumedWeightKg || consumption.consumed_weight_kg
            const boxes = consumption.consumedBoxes || consumption.consumed_boxes
            // Guardar también el nombre del producto del consumo para mostrarlo en el selector
            const productName = consumption.productionOutput?.product?.name || null
            return {
                id: consumption.id,
                production_output_id: outputId?.toString() || '',
                consumed_weight_kg: weight?.toString() || '',
                consumed_boxes: boxes?.toString() || '',
                notes: consumption.notes || '',
                isNew: false,
                originalWeight: parseFloat(weight || 0), // Guardar peso original para ajustar disponibilidad
                originalBoxes: boxes ? parseInt(boxes) : 0,
                productName: productName // Guardar nombre del producto para mostrar en el selector
            }
        }))
        setNewConsumptionRows([])
        setManageDialogOpen(true)
    }

    const addNewConsumptionRow = () => {
        setNewConsumptionRows([...newConsumptionRows, {
            id: `new-${Date.now()}`,
            production_output_id: '',
            consumed_weight_kg: '',
            consumed_boxes: '',
            notes: '',
            isNew: true
        }])
    }

    const removeConsumptionRow = (id) => {
        if (id.toString().startsWith('new-')) {
            setNewConsumptionRows(newConsumptionRows.filter(row => row.id !== id))
        } else {
            setEditableConsumptions(editableConsumptions.filter(row => row.id !== id))
        }
    }

    const updateConsumptionRow = (id, field, value) => {
        if (id.toString().startsWith('new-')) {
            setNewConsumptionRows(newConsumptionRows.map(row => 
                row.id === id ? { ...row, [field]: value } : row
            ))
        } else {
            setEditableConsumptions(editableConsumptions.map(row => 
                row.id === id ? { ...row, [field]: value } : row
            ))
        }
    }

    const getAllConsumptionRows = () => {
        return [...editableConsumptions, ...newConsumptionRows]
    }

    const handleSaveAllConsumptions = async () => {
        try {
            setSavingAll(true)
            const token = session.user.accessToken

            // Validar que haya al menos una fila válida
            const validRows = getAllConsumptionRows().filter(row => 
                row.production_output_id && row.consumed_weight_kg && parseFloat(row.consumed_weight_kg || 0) > 0
            )
            
            if (validRows.length === 0) {
                alert('Debe haber al menos un consumo válido para guardar')
                setSavingAll(false)
                return
            }

            // Preparar el array de consumos para sincronización
            // Incluir tanto los consumos existentes (con ID) como los nuevos (sin ID)
            const allConsumptions = validRows.map(row => {
                const weight = parseFloat(row.consumed_weight_kg)
                if (isNaN(weight) || weight <= 0) {
                    throw new Error(`El peso debe ser mayor a 0 para el output seleccionado`)
                }
                
                const consumption = {
                    production_output_id: parseInt(row.production_output_id),
                    consumed_weight_kg: weight,
                }
                
                // Agregar campos opcionales solo si tienen valor
                if (row.consumed_boxes && row.consumed_boxes.trim() !== '') {
                    const boxes = parseInt(row.consumed_boxes)
                    if (!isNaN(boxes) && boxes >= 0) {
                        consumption.consumed_boxes = boxes
                    }
                }
                
                if (row.notes && row.notes.trim() !== '') {
                    consumption.notes = row.notes.trim()
                }
                
                // Si tiene ID (es un consumo existente), incluir el ID para actualizar
                if (row.id && !row.id.toString().startsWith('new-')) {
                    consumption.id = row.id
                }
                
                return consumption
            })
            
            // Validar que haya al menos un consumo
            if (allConsumptions.length === 0) {
                alert('Debe haber al menos un consumo válido para guardar')
                setSavingAll(false)
                return
            }

            // Usar el endpoint de sincronización que maneja crear, actualizar y eliminar en una sola petición
            const response = await syncProductionOutputConsumptions(productionRecordId, {
                consumptions: allConsumptions
            }, token)

            // Actualizar el estado con los consumos sincronizados del servidor
            if (response.data && response.data.parentOutputConsumptions) {
                setConsumptions(response.data.parentOutputConsumptions)
            } else {
                // Si no vienen en la respuesta, recargar desde el servidor
                await loadData()
            }

            // Cerrar el diálogo
            setManageDialogOpen(false)
            
            // Resetear estados
            setEditableConsumptions([])
            setNewConsumptionRows([])
            
            // Notificar al componente padre si es necesario
            if (onRefresh) onRefresh()
            
        } catch (err) {
            console.error('Error saving consumptions:', err)
            console.error('Error details:', {
                message: err.message,
                stack: err.stack,
                response: err.response
            })
            alert(err.message || 'Error al guardar los consumos. Revisa la consola para más detalles.')
        } finally {
            setSavingAll(false)
        }
    }

    // Verificar si tiene padre
    const hasParent = productionRecord?.parent_record_id || productionRecord?.parentRecordId

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        )
    }

    if (error) {
        return (
            <Card>
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
            if (!open) {
                setFormData({
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
                                value={formData.production_output_id}
                                onValueChange={(value) => {
                                    setFormData(prev => ({ ...prev, production_output_id: value }))
                                    const selectedOutput = availableOutputs.find(o => o.output.id.toString() === value)
                                    if (selectedOutput) {
                                        // Prellenar con el máximo disponible si no hay consumo existente
                                        const existingConsumption = consumptions.find(c => {
                                            const cOutputId = c.productionOutputId || c.production_output_id
                                            return cOutputId?.toString() === value
                                        })
                                        if (!existingConsumption) {
                                            const availableWeight = parseFloat(selectedOutput.availableWeight || 0)
                                            const availableBoxes = parseInt(selectedOutput.availableBoxes || 0)
                                            setFormData(prev => ({
                                                ...prev,
                                                consumed_weight_kg: formatNumber(availableWeight),
                                                consumed_boxes: availableBoxes > 0 ? availableBoxes.toString() : ''
                                            }))
                                        }
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un output" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableOutputs.map((available) => {
                                        const availableWeight = parseFloat(available.availableWeight || 0)
                                        const totalWeight = parseFloat(available.totalWeight || 0)
                                        // Estructura correcta según el endpoint: available.output.product.name
                                        const productName = available.output?.product?.name || 'Sin nombre'
                                        return (
                                            <SelectItem key={available.output.id} value={available.output.id.toString()}>
                                                {productName}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                            {formData.production_output_id && (() => {
                                const selectedOutput = availableOutputs.find(
                                    o => o.output.id.toString() === formData.production_output_id
                                )
                                if (!selectedOutput) return null
                                
                                const totalWeight = parseFloat(selectedOutput.totalWeight || 0)
                                const consumedWeight = parseFloat(selectedOutput.consumedWeight || 0)
                                // Ajustar disponibilidad si hay consumo existente
                                const existingConsumption = consumptions.find(c => {
                                    const cOutputId = c.productionOutputId || c.production_output_id
                                    return cOutputId?.toString() === formData.production_output_id
                                })
                                const originalWeight = existingConsumption ? parseFloat(existingConsumption.consumedWeightKg || existingConsumption.consumed_weight_kg || 0) : 0
                                const availableWeight = parseFloat(selectedOutput.availableWeight || 0) + originalWeight
                                const consumptionPercentage = totalWeight > 0 ? (consumedWeight / totalWeight) * 100 : 0
                                
                                return (
                                    <div className="mt-2 p-2 bg-muted/30 rounded-md border">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-primary h-full rounded-full transition-all"
                                                        style={{ width: `${consumptionPercentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatNumber(consumedWeight)}/{formatNumber(totalWeight)}kg
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-bold text-primary whitespace-nowrap">
                                                    {formatNumber(availableWeight)}kg
                                                </span>
                                                {originalWeight > 0 && (
                                                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                                                        +{formatNumber(originalWeight)}
                                                    </Badge>
                                                )}
                                            </div>
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
                                    max={formData.production_output_id ? (() => {
                                        const output = availableOutputs.find(
                                            o => o.output.id.toString() === formData.production_output_id
                                        )
                                        if (!output) return 0
                                        // Ajustar disponibilidad si hay consumo existente
                                        const existingConsumption = consumptions.find(c => {
                                            const cOutputId = c.productionOutputId || c.production_output_id
                                            return cOutputId?.toString() === formData.production_output_id
                                        })
                                        const originalWeight = existingConsumption ? parseFloat(existingConsumption.consumedWeightKg || existingConsumption.consumed_weight_kg || 0) : 0
                                        return parseFloat(output.availableWeight || 0) + originalWeight
                                    })() : undefined}
                                    value={formData.consumed_weight_kg}
                                    onChange={(e) => setFormData(prev => ({ ...prev, consumed_weight_kg: e.target.value }))}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <Label htmlFor="consumed_boxes">Cajas Consumidas</Label>
                                <Input
                                    id="consumed_boxes"
                                    type="number"
                                    min="0"
                                    max={formData.production_output_id ? (() => {
                                        const output = availableOutputs.find(
                                            o => o.output.id.toString() === formData.production_output_id
                                        )
                                        if (!output) return 0
                                        // Ajustar disponibilidad si hay consumo existente
                                        const existingConsumption = consumptions.find(c => {
                                            const cOutputId = c.productionOutputId || c.production_output_id
                                            return cOutputId?.toString() === formData.production_output_id
                                        })
                                        const originalBoxes = existingConsumption ? (existingConsumption.consumedBoxes || existingConsumption.consumed_boxes || 0) : 0
                                        return (output.availableBoxes || 0) + originalBoxes
                                    })() : undefined}
                                    value={formData.consumed_boxes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, consumed_boxes: e.target.value }))}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="consumption_notes">Notas (opcional)</Label>
                            <Textarea
                                id="consumption_notes"
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Notas sobre este consumo..."
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setAddDialogOpen(false)}
                                disabled={savingConsumption}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveConsumption}
                                disabled={savingConsumption || !formData.production_output_id || !formData.consumed_weight_kg}
                            >
                                {savingConsumption ? (
                                    <>
                                        <Loader className="mr-2" />
                                        Guardando...
                                    </>
                                ) : consumptions.find(c => {
                                    const cOutputId = c.productionOutputId || c.production_output_id
                                    return cOutputId?.toString() === formData.production_output_id
                                }) ? (
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

    const headerButton = hasParent ? (
        <Button
            onClick={openManageDialog}
        >
            {consumptions.length > 0 ? (
                <>
                    <Edit className="h-4 w-4 mr-2" />
                    Gestionar Consumos
                </>
            ) : (
                <>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Consumos
                </>
            )}
        </Button>
    ) : null

    const mainContent = (
        <>
            {!hideTitle && !renderInCard && (
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Consumos del Proceso Padre</h3>
                        <p className="text-sm text-muted-foreground">
                            Outputs consumidos del proceso padre en este proceso hijo
                        </p>
                    </div>
                </div>
            )}
            {!renderInCard && (
                <div className={`flex items-center ${hideTitle ? 'justify-end' : 'justify-between'}`}>
                    <Dialog open={addDialogOpen} onOpenChange={(open) => {
                        if (open) {
                            handleOpenDialog()
                        } else {
                            setAddDialogOpen(false)
                        }
                    }}>
                        <DialogTrigger asChild>
                            {headerButton}
                        </DialogTrigger>
                        {dialog.props.children}
                    </Dialog>
                </div>
            )}

            {!hasParent ? (
                <div className="flex items-center justify-center py-8">
                    <EmptyState
                        icon={<ArrowDown className="h-12 w-12 text-muted-foreground" strokeWidth={1.5} />}
                        title="Este proceso no tiene padre"
                        description="Selecciona un proceso padre en el formulario de información del proceso para poder consumir sus outputs"
                    />
                </div>
            ) : consumptions.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                    <EmptyState
                        icon={<ArrowDown className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                        title="No hay consumos del padre"
                        description="Consume outputs del proceso padre para utilizarlos en este proceso"
                    />
                </div>
            ) : (
                <div>
                    <ScrollArea className="h-64">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Peso Consumido</TableHead>
                                    <TableHead>Cajas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {consumptions.map((consumption) => (
                                    <TableRow key={consumption.id}>
                                        <TableCell className="font-medium">
                                            {consumption.productionOutput?.product?.name || 'Sin nombre'}
                                        </TableCell>
                                        <TableCell>
                                            {formatWeight(consumption.consumedWeightKg || consumption.consumed_weight_kg)}
                                        </TableCell>
                                        <TableCell>
                                            {consumption.consumedBoxes || consumption.consumed_boxes || 0}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            )}
        </>
    )

    // Diálogo masivo de gestión
    const manageDialog = (
        <Dialog open={manageDialogOpen} onOpenChange={(open) => {
            if (!open && !savingAll) {
                setEditableConsumptions([])
                setNewConsumptionRows([])
            }
            setManageDialogOpen(open)
        }}>
            <DialogContent className="max-w-5xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Gestionar Consumos del Proceso Padre</DialogTitle>
                    <DialogDescription>
                        Agrega, edita o elimina múltiples consumos de outputs del proceso padre de forma rápida
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="flex justify-end items-center">
                        <Button
                            onClick={addNewConsumptionRow}
                            variant="outline"
                            size="sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Línea
                        </Button>
                    </div>

                    <ScrollArea className="h-[500px] border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Output del Padre</TableHead>
                                    <TableHead className="w-[140px]">Peso Consumido (kg)</TableHead>
                                    <TableHead className="w-[120px]">Cajas</TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getAllConsumptionRows().map((row) => {
                                    // Buscar el output seleccionado usando la estructura correcta
                                    const rowOutputId = row.production_output_id ? String(row.production_output_id).trim() : null
                                    const selectedOutput = rowOutputId 
                                        ? availableOutputs.find(
                                            o => {
                                                const outputId = o.output?.id
                                                if (!outputId) return false
                                                // Comparar tanto como string como number para evitar problemas de tipo
                                                const matches = String(outputId) === rowOutputId || Number(outputId) === Number(rowOutputId)
                                                return matches
                                            }
                                          )
                                        : null
                                    
                                    // Debug temporal para verificar que se encuentra el output
                                    if (rowOutputId && availableOutputs.length > 0) {
                                        // console.log('Buscando output:', {
                                        //     rowOutputId,
                                        //     availableOutputsCount: availableOutputs.length,
                                        //     availableIds: availableOutputs.map(o => o.output?.id),
                                        //     found: !!selectedOutput,
                                        //     selectedOutputData: selectedOutput ? {
                                        //         availableWeight: selectedOutput.availableWeight,
                                        //         totalWeight: selectedOutput.totalWeight,
                                        //         productName: selectedOutput.output?.product?.name
                                        //     } : null
                                        // })
                                    }
                                    
                                    // Si es una edición (no es nueva), ajustar disponibilidad sumando el peso original
                                    // porque ese consumo se va a reemplazar
                                    const isEditing = !row.isNew && row.originalWeight !== undefined
                                    const originalWeight = isEditing ? (row.originalWeight || 0) : 0
                                    const originalBoxes = isEditing ? (row.originalBoxes || 0) : 0
                                    
                                    // Disponibilidad ajustada: disponible + peso original si estamos editando
                                    const baseAvailableWeight = selectedOutput ? parseFloat(selectedOutput.availableWeight || 0) : 0
                                    const adjustedAvailableWeight = baseAvailableWeight + originalWeight
                                    
                                    const baseAvailableBoxes = selectedOutput ? (selectedOutput.availableBoxes || 0) : 0
                                    const adjustedAvailableBoxes = baseAvailableBoxes + originalBoxes
                                    
                                    const totalWeight = selectedOutput ? parseFloat(selectedOutput.totalWeight || 0) : 0
                                    const consumedWeight = selectedOutput ? parseFloat(selectedOutput.consumedWeight || 0) : 0
                                    const rowWeight = parseFloat(row.consumed_weight_kg || 0)
                                    
                                    const isValid = row.production_output_id && row.consumed_weight_kg && rowWeight > 0
                                    const exceedsAvailable = rowWeight > adjustedAvailableWeight
                                    
                                    return (
                                        <React.Fragment key={row.id}>
                                            <TableRow 
                                                className={!isValid && (row.production_output_id || row.consumed_weight_kg) ? 'bg-muted/50' : ''}
                                            >
                                                <TableCell className="align-top">
                                                    <div className="space-y-2 py-1">
                                                        <Select
                                                            value={row.production_output_id || undefined}
                                                            onValueChange={(value) => {
                                                                updateConsumptionRow(row.id, 'production_output_id', value)
                                                                // Buscar el output usando la estructura correcta
                                                                const output = availableOutputs.find(o => {
                                                                    const outputId = o.output?.id
                                                                    return outputId && (String(outputId) === String(value) || Number(outputId) === Number(value))
                                                                })
                                                                if (output) {
                                                                    // Si es edición, ajustar disponibilidad sumando el peso original
                                                                    const isEditing = !row.isNew && row.originalWeight !== undefined
                                                                    const originalWeight = isEditing ? (row.originalWeight || 0) : 0
                                                                    const originalBoxes = isEditing ? (row.originalBoxes || 0) : 0
                                                                    // availableWeight viene directamente en el objeto, no en output
                                                                    const adjustedAvailable = parseFloat(output.availableWeight || 0) + originalWeight
                                                                    const adjustedBoxes = parseInt(output.availableBoxes || 0) + originalBoxes
                                                                    
                                                                    // Guardar también el nombre del producto
                                                                    const productName = output.output?.product?.name || null
                                                                    
                                                                    updateConsumptionRow(row.id, 'consumed_weight_kg', formatNumber(adjustedAvailable))
                                                                    if (adjustedBoxes > 0) {
                                                                        updateConsumptionRow(row.id, 'consumed_boxes', adjustedBoxes.toString())
                                                                    }
                                                                    if (productName) {
                                                                        updateConsumptionRow(row.id, 'productName', productName)
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className={`h-9 ${!row.production_output_id ? 'border-destructive' : ''}`}>
                                                                <SelectValue placeholder="Seleccionar output" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableOutputs.length === 0 ? (
                                                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                                        No hay outputs disponibles
                                                                    </div>
                                                                ) : (
                                                                    availableOutputs.map((available) => {
                                                                        const outputId = available.output?.id
                                                                        if (!outputId) return null
                                                                        
                                                                        const outputIdStr = String(outputId)
                                                                        const isUsed = getAllConsumptionRows().some(r => 
                                                                            r.id !== row.id && 
                                                                            String(r.production_output_id) === outputIdStr
                                                                        )
                                                                        // Estructura correcta: available.output.product.name
                                                                        const productName = available.output?.product?.name || 'Sin nombre'
                                                                        return (
                                                                            <SelectItem 
                                                                                key={outputId} 
                                                                                value={outputIdStr}
                                                                                disabled={isUsed}
                                                                            >
                                                                                {productName}
                                                                            </SelectItem>
                                                                        )
                                                                    })
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        
                                                        {/* Panel de disponibilidad compacto */}
                                                        {row.production_output_id && row.production_output_id.trim() !== '' ? (
                                                            selectedOutput ? (
                                                                // Panel de disponibilidad cuando se encuentra el output
                                                                <div className="p-2 bg-muted/30 rounded-md border mt-2" key={`panel-${row.id}-${row.production_output_id}`}>
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                                                                <div
                                                                                    className="bg-primary h-full rounded-full transition-all"
                                                                                    style={{ 
                                                                                        width: `${totalWeight > 0 ? Math.min((consumedWeight / totalWeight) * 100, 100) : 0}%` 
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                                {formatNumber(consumedWeight)}/{formatNumber(totalWeight)}kg
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-sm font-bold text-primary whitespace-nowrap">
                                                                                {formatNumber(adjustedAvailableWeight)}kg
                                                                            </span>
                                                                            {isEditing && originalWeight > 0 && (
                                                                                <Badge variant="outline" className="text-[9px] h-4 px-1">
                                                                                    +{formatNumber(originalWeight)}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {exceedsAvailable && (
                                                                        <p className="text-[10px] text-destructive mt-1">
                                                                            ⚠ Excede disponible
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800 mt-2">
                                                                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                                                        ⚠ Output no encontrado (ID: {row.production_output_id}). {availableOutputs.length === 0 ? 'No hay outputs disponibles cargados.' : `Hay ${availableOutputs.length} outputs disponibles.`}
                                                                    </p>
                                                                </div>
                                                            )
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <div className="py-1">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max={adjustedAvailableWeight}
                                                            value={row.consumed_weight_kg}
                                                            onChange={(e) => updateConsumptionRow(row.id, 'consumed_weight_kg', e.target.value)}
                                                            placeholder="0.00"
                                                            className={`h-9 w-full ${exceedsAvailable || (!row.consumed_weight_kg || rowWeight <= 0) ? 'border-destructive' : ''}`}
                                                        />
                                                        {selectedOutput && (
                                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                                Máx: {formatNumber(adjustedAvailableWeight)}kg
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <div className="py-1">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={adjustedAvailableBoxes}
                                                            value={row.consumed_boxes}
                                                            onChange={(e) => updateConsumptionRow(row.id, 'consumed_boxes', e.target.value)}
                                                            placeholder="0"
                                                            className="h-9 w-full"
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <div className="py-1 flex items-start">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeConsumptionRow(row.id)}
                                                            className="h-9 w-9"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                        </React.Fragment>
                    )
                                })}
                                {getAllConsumptionRows().length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="p-0">
                                            <div className="py-12">
                                                <EmptyState
                                                    icon={<ArrowDown className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                                    title="No hay consumos agregados"
                                                    description="Haz clic en 'Agregar Línea' para comenzar a agregar consumos del proceso padre"
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
                            disabled={savingAll}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveAllConsumptions}
                            disabled={savingAll || getAllConsumptionRows().length === 0 || getAllConsumptionRows().some(row => {
                                // Si la fila tiene algún dato, debe estar completa y válida
                                const hasData = row.production_output_id || row.consumed_weight_kg
                                if (!hasData) return false // Fila vacía, no bloquea
                                
                                // Si tiene datos, debe tener todos los campos requeridos y válidos
                                const hasOutput = row.production_output_id && row.production_output_id.trim() !== ''
                                const hasWeight = row.consumed_weight_kg && parseFloat(row.consumed_weight_kg || 0) > 0
                                
                                return !hasOutput || !hasWeight
                            })}
                        >
                            {savingAll ? (
                                <>
                                    <Loader className="mr-2" />
                                    Guardando...
                                </>
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

    if (renderInCard) {
        return (
            <>
                {manageDialog}
                {dialog}
                <Card className="h-fit">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{cardTitle || 'Consumos del Proceso Padre'}</CardTitle>
                                <CardDescription>
                                    {cardDescription || 'Outputs consumidos del proceso padre en este proceso hijo'}
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

    return (
        <>
            {manageDialog}
            {dialog}
            {mainContent}
        </>
    )
}

export default ProductionOutputConsumptionsManager

