'use client'

import React from 'react'
import { formatWeight } from '@/helpers/production/formatters'
import { formatDecimal } from '@/helpers/formats/numbers/formatNumbers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Package, Search, X, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Calculator, CheckCircle, Box, Scan, Scale, Hand, Target, Edit, Layers, Weight, Info, Tag, Unlink, ChevronRight as ChevronRightIcon, Warehouse, Eye } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/Utilities/EmptyState'
import Loader from '@/components/Utilities/Loader'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useProductionInputsManager } from '@/hooks/production/useProductionInputsManager'
import ProductionInputsAddDialog from './ProductionInputsAddDialog'

const ProductionInputsManager = ({ productionRecordId, initialInputs: initialInputsProp = [], onRefresh, hideTitle = false, renderInCard = false, cardTitle, cardDescription }) => {
    const api = useProductionInputsManager({ productionRecordId, initialInputsProp, onRefresh })
    const {
        inputs,
        loading,
        error,
        addDialogOpen,
        setAddDialogOpen,
        loadExistingDataForEdit,
        resetAddDialog,
        handleDeleteAllInputs,
        calculateSummaryByPallet,
        calculateProductsBreakdown,
        lotsDialogOpen,
        setLotsDialogOpen,
        selectedProductLots,
        setSelectedProductLots,
        palletsDialogOpen,
        setPalletsDialogOpen
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

    const dialog = (
        <Dialog open={addDialogOpen} onOpenChange={(open) => {
            setAddDialogOpen(open)
            if (open) {
                loadExistingDataForEdit()
            } else {
                resetAddDialog()
            }
        }}>
            <ProductionInputsAddDialog api={api} />
        </Dialog>
    )

    // Botón para el header (sin Dialog wrapper)
    const headerButton = (
        <div className="flex items-center gap-2">
            {(() => {
                const pallets = calculateSummaryByPallet()
                const palletCount = pallets.length
                if (palletCount === 0) return null
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-9 w-9"
                                    onClick={() => setPalletsDialogOpen(true)}
                                >
                                    <Info className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Ver detalle de {palletCount} {palletCount === 1 ? 'palet' : 'palets'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            })()}
            {inputs.length > 0 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-9 w-9"
                                onClick={handleDeleteAllInputs}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Eliminar todo el consumo</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
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
        </div>
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
                            resetAddDialog()
                        }
                    }}>
                        <div className="flex items-center gap-2">
                            {(() => {
                                const pallets = calculateSummaryByPallet()
                                const palletCount = pallets.length
                                if (palletCount === 0) return null
                                return (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="h-9 w-9"
                                                    onClick={() => setPalletsDialogOpen(true)}
                                                >
                                                    <Info className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Ver detalle de {palletCount} {palletCount === 1 ? 'palet' : 'palets'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )
                            })()}
                            {inputs.length > 0 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-9 w-9"
                                                onClick={handleDeleteAllInputs}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Eliminar todo el consumo</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
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
                        </div>
                        {dialog.props.children}
                    </Dialog>
                </div>
            )}

            {/* Sección: Inputs desde Stock */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    
                    {!renderInCard && (
                        <div className="flex items-center gap-2">
                            {inputs.length > 0 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={handleDeleteAllInputs}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Eliminar Todo
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Eliminar todo el consumo</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            <Dialog open={addDialogOpen} onOpenChange={(open) => {
                                setAddDialogOpen(open)
                                if (open) {
                                    loadExistingDataForEdit()
                                } else {
                                    resetAddDialog()
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
                        </div>
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
                        {/* Desglose por producto */}
                        {calculateProductsBreakdown().length > 0 && (
                        <ScrollArea className="h-64">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Artículo</TableHead>
                                        <TableHead>Cajas</TableHead>
                                        <TableHead>Peso Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {calculateProductsBreakdown().map((product, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">
                                                        {product.name}
                                            </TableCell>
                                            <TableCell>
                                                {product.boxesCount}
                                            </TableCell>
                                            <TableCell>
                                                    {formatWeight(product.totalWeight)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                                </ScrollArea>
                    )}
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

    // Dialog de palets (disponible en ambos renders)
    const palletsDialog = (() => {
        const pallets = calculateSummaryByPallet()
        const palletCount = pallets.length
        if (palletCount === 0) return null
        return (
            <Dialog open={palletsDialogOpen} onOpenChange={setPalletsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
                        <DialogTitle>Detalle de Palets</DialogTitle>
                        <DialogDescription>
                            {palletCount} {palletCount === 1 ? 'palet' : 'palets'} utilizados en este proceso
                        </DialogDescription>
                    </DialogHeader>
                    
                    <ScrollArea className="h-[calc(85vh-180px)] px-6 py-4">
                        <div className="space-y-4 pr-4">
                            {pallets.map((pallet, idx) => (
                                <Card key={pallet.palletId}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">Palet #{pallet.palletId}</CardTitle>
                                            <div className="text-sm text-muted-foreground">
                                                {pallet.boxesCount} {pallet.boxesCount === 1 ? 'caja' : 'cajas'} • {formatWeight(pallet.totalWeight)}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {pallet.productsBreakdown && pallet.productsBreakdown.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Producto</TableHead>
                                                        <TableHead>Cajas</TableHead>
                                                        <TableHead>Peso</TableHead>
                                                        <TableHead>Lotes</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {pallet.productsBreakdown.map((product, productIdx) => (
                                                        <TableRow key={productIdx}>
                                                            <TableCell className="font-medium">
                                                                {product.name}
                                                            </TableCell>
                                                            <TableCell>
                                                                {product.boxesCount}
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatWeight(product.totalWeight)}
                                                            </TableCell>
                                                            <TableCell>
                                                                {product.lots && product.lots.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {product.lots.map((lot, lotIdx) => (
                                                                            <span key={lotIdx} className="text-xs text-muted-foreground">
                                                                                {lot}{lotIdx < product.lots.length - 1 ? ',' : ''}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">-</span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No hay productos registrados</p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        )
    })()

    // Si renderInCard es true, envolver en Card con botón en header
    if (renderInCard) {
        return (
            <>
                {dialog}
                {lotsDialog}
                {palletsDialog}
                <Card className="h-fit">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    {cardTitle || 'Consumo de Materia prima desde stock'}
                                </CardTitle>
                                <CardDescription>
                                    {cardDescription || 'Materia prima consumida desde el stock en este proceso'}
                                </CardDescription>
                            </div>
                            {headerButton}
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
            {lotsDialog}
            {palletsDialog}
            {mainContent}
        </>
    )
}

export default ProductionInputsManager
