'use client'

import React from 'react'
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
import { useProductionOutputsManager } from '@/hooks/production/useProductionOutputsManager'

const ProductionOutputsManager = ({ productionRecordId, initialOutputs: initialOutputsProp = [], onRefresh, hideTitle = false, renderInCard = false, cardTitle, cardDescription }) => {
    const api = useProductionOutputsManager({ productionRecordId, initialOutputsProp, onRefresh })
    const {
        outputs,
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
        newRows,
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
        wasManageDialogOpen,
        showBoxes,
        handleToggleBoxes,
        loadOutputsOnly,
        handleCreateOutput,
        handleDeleteOutput,
        handleEditClick,
        resetForm,
        openManageDialog,
        addNewRow,
        handleOpenSourceSelectionDialog,
        handleConfirmSourceSelection,
        removeRow,
        updateRow,
        handleSaveAll,
        getAllRows,
        loadAvailableProducts,
        handleOpenAvailableProductsDialog,
        toggleProductSelection,
        handleAddSelectedProducts
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
                                                                <SelectTrigger className="h-8 text-xs w-64" loading={sourcesLoading}>
                                                                    <SelectValue placeholder="Añadir fuente" loading={sourcesLoading} />
                                                                </SelectTrigger>
                                                                <SelectContent loading={sourcesLoading}>
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

