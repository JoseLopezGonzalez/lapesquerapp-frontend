'use client'

import React from 'react'
import {
    formatWeight,
    formatNumber,
    getOutputId,
    getConsumedWeight,
    getConsumedBoxes,
    getProductName
} from '@/helpers/production/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit, ArrowDown, Save, Loader2, Sparkles } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/Utilities/EmptyState'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import Loader from '@/components/Utilities/Loader'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useProductionOutputConsumptionsManager } from '@/hooks/production/useProductionOutputConsumptionsManager'

const ProductionOutputConsumptionsManager = ({ productionRecordId, initialConsumptions: initialConsumptionsProp = [], hasParent: hasParentProp = false, onRefresh, hideTitle = false, renderInCard = false, cardTitle, cardDescription }) => {
    const api = useProductionOutputConsumptionsManager({
        productionRecordId,
        initialConsumptionsProp,
        hasParent: hasParentProp,
        onRefresh
    })
    const {
        consumptions,
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
        hasParent,
        handleToggleBoxes,
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
    } = api

    if (loading) {
        return (
            <div className="space-y-4 flex items-center justify-center py-12">
                <Loader />
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
                                <SelectTrigger loading={loadingAvailableOutputs}>
                                    <SelectValue placeholder="Selecciona un output" loading={loadingAvailableOutputs} />
                                </SelectTrigger>
                                <SelectContent loading={loadingAvailableOutputs}>
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
                                            const cOutputId = getOutputId(c)
                                            return cOutputId?.toString() === formData.production_output_id
                                        })
                                        const originalWeight = existingConsumption ? getConsumedWeight(existingConsumption) : 0
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
                                            const cOutputId = getOutputId(c)
                                            return cOutputId?.toString() === formData.production_output_id
                                        })
                                        const originalBoxes = existingConsumption ? getConsumedBoxes(existingConsumption) : 0
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
                                    const cOutputId = getOutputId(c)
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
                        <h3 className="text-lg font-semibold">Consumos de proceso anterior</h3>
                        <p className="text-sm text-muted-foreground">
                            Productos consumidos del proceso anterior
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
                    <ScrollArea className="h-64">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Peso Consumido</TableHead>
                                    {showBoxes && <TableHead>Cajas</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {consumptions.map((consumption) => (
                                    <TableRow key={consumption.id}>
                                        <TableCell className="font-medium">
                                            {getProductName(consumption.productionOutput)}
                                        </TableCell>
                                        <TableCell>
                                            {formatWeight(getConsumedWeight(consumption))}
                                        </TableCell>
                                        {showBoxes && <TableCell>{getConsumedBoxes(consumption)}</TableCell>}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
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
                    <DialogTitle>Gestionar consumos de proceso anterior</DialogTitle>
                    <DialogDescription>
                        Agrega, edita o elimina múltiples consumos de productos del proceso anterior de forma rápida
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="show-boxes-consumptions-dialog"
                                checked={showBoxes}
                                onCheckedChange={handleToggleBoxes}
                            />
                            <label
                                htmlFor="show-boxes-consumptions-dialog"
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
                                            onClick={handleAddAllFromParent}
                                            variant="default"
                                            size="sm"
                                            disabled={addingFromParent}
                                        >
                                            {addingFromParent ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Añadiendo...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="h-4 w-4 mr-2" />
                                                    Añadir automáticamente disponibles
                                                </>
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p className="text-sm">
                                            Añade automáticamente todas las líneas de consumo con los productos y disponibilidades del proceso padre. Solo se añaden los outputs que tienen disponibilidad y que no están ya en la lista.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Button
                                onClick={addNewConsumptionRow}
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
                                    <TableHead className="w-[140px]">Peso (kg)</TableHead>
                                    {showBoxes && <TableHead className="w-[120px]">Cajas</TableHead>}
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
                                                return String(outputId) === rowOutputId || Number(outputId) === Number(rowOutputId)
                                            }
                                          )
                                        : null
                                    
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
                                                            <SelectTrigger className={`h-9 ${!row.production_output_id ? 'border-destructive' : ''}`} loading={loadingAvailableOutputs}>
                                                                <SelectValue placeholder="Seleccionar output" loading={loadingAvailableOutputs} />
                                                            </SelectTrigger>
                                                            <SelectContent loading={loadingAvailableOutputs}>
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
                                                {showBoxes && (
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
                                                )}
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
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
                                <CardTitle className="flex items-center gap-2">
                                    <ArrowDown className="h-5 w-5 text-primary" />
                                    {cardTitle || 'Consumos de proceso anterior'}
                                </CardTitle>
                                <CardDescription>
                                    {cardDescription || 'Productos consumidos del proceso anterior'}
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

