'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
    getProductionRecord,
    getAvailableOutputs,
    getProductionOutputConsumptions,
    createProductionOutputConsumption,
    updateProductionOutputConsumption,
    deleteProductionOutputConsumption
} from '@/services/productionService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit, ArrowDown } from 'lucide-react'
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

    useEffect(() => {
        if (session?.user?.accessToken && productionRecordId) {
            loadData()
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

            // Solo cargar consumos si el proceso tiene padre
            if (record.parent_record_id) {
                // Los consumos vienen en el record
                if (record.parentOutputConsumptions) {
                    setConsumptions(record.parentOutputConsumptions)
                } else {
                    // Si no vienen en el record, cargarlos directamente
                    const consumptionsResponse = await getProductionOutputConsumptions(token, {
                        production_record_id: productionRecordId
                    })
                    setConsumptions(consumptionsResponse.data || [])
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

    const handleOpenDialog = async () => {
        setAddDialogOpen(true)
        await loadAvailableOutputs()
        
        // Si ya existe un consumo, cargar sus datos para edición
        if (consumptions.length > 0) {
            const existingConsumption = consumptions[0]
            setFormData({
                production_output_id: existingConsumption.production_output_id?.toString() || '',
                consumed_weight_kg: existingConsumption.consumed_weight_kg?.toString() || '',
                consumed_boxes: existingConsumption.consumed_boxes?.toString() || '',
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

        // Validar disponibilidad
        const selectedOutput = availableOutputs.find(
            o => o.output.id.toString() === formData.production_output_id
        )
        if (!selectedOutput) {
            alert('Output seleccionado no encontrado')
            return
        }

        if (weight > selectedOutput.availableWeight) {
            alert(`Solo hay ${selectedOutput.availableWeight.toFixed(2)}kg disponible`)
            return
        }

        const boxes = formData.consumed_boxes 
            ? parseInt(formData.consumed_boxes) 
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
                production_output_id: parseInt(formData.production_output_id),
                consumed_weight_kg: weight,
                consumed_boxes: boxes,
                notes: formData.notes || undefined
            }

            // Si ya existe un consumo de este output, actualizarlo
            const existingConsumption = consumptions.find(
                c => c.production_output_id?.toString() === formData.production_output_id
            )

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
        if (!weight) return '0 kg'
        return `${parseFloat(weight).toFixed(2)} kg`
    }

    // Si no tiene padre, no mostrar nada
    if (!loading && productionRecord && !productionRecord.parent_record_id) {
        return null
    }

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
                                        const existingConsumption = consumptions.find(
                                            c => c.production_output_id?.toString() === value
                                        )
                                        if (!existingConsumption) {
                                            setFormData(prev => ({
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
                            {formData.production_output_id && (() => {
                                const selectedOutput = availableOutputs.find(
                                    o => o.output.id.toString() === formData.production_output_id
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
                                    max={formData.production_output_id ? availableOutputs.find(
                                        o => o.output.id.toString() === formData.production_output_id
                                    )?.availableWeight || 0 : undefined}
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
                                    max={formData.production_output_id ? availableOutputs.find(
                                        o => o.output.id.toString() === formData.production_output_id
                                    )?.availableBoxes || 0 : undefined}
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
                                ) : consumptions.find(
                                    c => c.production_output_id?.toString() === formData.production_output_id
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

    const headerButton = (
        <Button
            onClick={handleOpenDialog}
        >
            {consumptions.length > 0 ? (
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
    )

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

            {consumptions.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                    <EmptyState
                        icon={<ArrowDown className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                        title="No hay consumos del padre"
                        description="Consume outputs del proceso padre para utilizarlos en este proceso"
                    />
                </div>
            ) : (
                <div className="space-y-3">
                    {consumptions.map((consumption) => (
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
                                            setFormData({
                                                production_output_id: consumption.production_output_id?.toString() || '',
                                                consumed_weight_kg: consumption.consumed_weight_kg?.toString() || '',
                                                consumed_boxes: consumption.consumed_boxes?.toString() || '',
                                                notes: consumption.notes || ''
                                            })
                                            handleOpenDialog()
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
        </>
    )

    if (renderInCard) {
        return (
            <>
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
            {dialog}
            {mainContent}
        </>
    )
}

export default ProductionOutputConsumptionsManager

