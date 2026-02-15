'use client'

import React from 'react'
import { formatWeight } from '@/helpers/production/formatters'
import { formatDecimal } from '@/helpers/formats/numbers/formatNumbers'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Package, Search, X, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Calculator, CheckCircle, Box, Scan, Scale, Hand, Target, Unlink } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/Utilities/EmptyState'
import Loader from '@/components/Utilities/Loader'

/**
 * Diálogo para agregar/editar materia prima (inputs) en un registro de producción.
 * Recibe el objeto api retornado por useProductionInputsManager.
 */
export default function ProductionInputsAddDialog({ api }) {
    const {
        inputs,
        loadingPallet,
        savingInputs,
        palletSearch,
        setPalletSearch,
        handleSearchPallet,
        loadedPallets,
        getSelectedBoxesForPallet,
        selectedPalletId,
        setSelectedPalletId,
        handleRemovePallet,
        getPalletBoxes,
        selectionMode,
        setSelectionMode,
        targetWeight,
        setTargetWeight,
        handleCalculateByWeight,
        targetWeightResults,
        handleSelectTargetWeightResults,
        setTargetWeightResults,
        scannedCode,
        setScannedCode,
        handleScanGS1Code,
        weightSearch,
        setWeightSearch,
        weightTolerance,
        setWeightTolerance,
        handleSearchByWeight,
        weightSearchResults,
        handleSelectWeightSearchResults,
        setWeightSearchResults,
        selectedBoxes,
        setSelectedBoxes,
        calculateWeightByProduct,
        calculateTotalWeight,
        calculateWeightByPallet,
        handleToggleBox,
        isBoxSelected,
        setAddDialogOpen,
        resetAddDialog,
        handleAddInputs,
        isBoxAvailable
    } = api

    return (
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
                                    placeholder="Buscar por ID del palet o lote..."
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
                                                                                Diferencia: {formatDecimal(result.difference)} kg
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
                            resetAddDialog()
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
    )
}
