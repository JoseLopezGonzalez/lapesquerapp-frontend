'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getProductionInputs, createMultipleProductionInputs, deleteProductionInput } from '@/services/productionService'
import { getPallet } from '@/services/palletService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Package, Search, X, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Calculator } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const ProductionInputsManager = ({ productionRecordId, onRefresh, hideTitle = false }) => {
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
    const [selectionMode, setSelectionMode] = useState('manual') // 'manual' o 'weight'
    const [targetWeight, setTargetWeight] = useState('')
    
    // Obtener todas las cajas de todos los palets cargados
    const getAllBoxes = () => {
        return loadedPallets.flatMap(pallet => 
            (pallet.boxes || []).map(box => ({ ...box, palletId: pallet.id }))
        )
    }

    useEffect(() => {
        if (session?.user?.accessToken && productionRecordId) {
            loadInputs()
        }
    }, [session, productionRecordId])

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
            setLoadedPallets(prev => [...prev, pallet])
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
        const availableBoxes = allBoxes.filter(box => !isBoxSelected(box.id, box.palletId))
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
            const token = session.user.accessToken
            const inputsData = selectedBoxes.map(box => ({
                production_record_id: parseInt(productionRecordId),
                box_id: box.boxId
            }))

            await createMultipleProductionInputs(inputsData, token)
            setAddDialogOpen(false)
            setPalletSearch('')
            setLoadedPallets([])
            setSelectedBoxes([])
            setTargetWeight('')
            setSelectionMode('manual')
            loadInputs()
            if (onRefresh) onRefresh()
        } catch (err) {
            console.error('Error adding inputs:', err)
            alert(err.message || 'Error al agregar las entradas')
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

    const formatWeight = (weight) => {
        if (!weight) return '0 kg'
        return `${parseFloat(weight).toFixed(2)} kg`
    }

    // Calcular peso total de las cajas seleccionadas
    const calculateTotalWeight = () => {
        const allBoxes = getAllBoxes()
        return selectedBoxes.reduce((total, selectedBox) => {
            const box = allBoxes.find(b => b.id === selectedBox.boxId && b.palletId === selectedBox.palletId)
            return total + (parseFloat(box?.netWeight || 0))
        }, 0)
    }

    // Seleccionar cajas basándose en peso total objetivo
    const handleSelectByWeight = () => {
        const allBoxes = getAllBoxes()
        if (allBoxes.length === 0 || !targetWeight) {
            alert('Por favor ingresa un peso objetivo y carga al menos un palet')
            return
        }

        const target = parseFloat(targetWeight)
        if (isNaN(target) || target <= 0) {
            alert('Por favor ingresa un peso válido mayor a 0')
            return
        }

        // Ordenar cajas por peso (de mayor a menor para optimizar)
        const availableBoxes = allBoxes
            .filter(box => !isBoxSelected(box.id, box.palletId))
            .map(box => ({
                ...box,
                weight: parseFloat(box.netWeight || 0)
            }))
            .sort((a, b) => b.weight - a.weight)

        // Algoritmo voraz: seleccionar cajas hasta alcanzar o acercarse al peso objetivo
        let currentWeight = calculateTotalWeight()
        const boxesToAdd = []
        
        for (const box of availableBoxes) {
            if (currentWeight + box.weight <= target) {
                boxesToAdd.push({ boxId: box.id, palletId: box.palletId })
                currentWeight += box.weight
            }
        }

        // Si no alcanzamos el peso objetivo, agregar la caja más cercana que no lo exceda demasiado
        if (boxesToAdd.length === 0 && availableBoxes.length > 0) {
            const closestBox = availableBoxes.find(box => box.weight <= target)
            if (closestBox) {
                boxesToAdd.push({ boxId: closestBox.id, palletId: closestBox.palletId })
            }
        }

        if (boxesToAdd.length > 0) {
            setSelectedBoxes(prev => [...prev, ...boxesToAdd])
            setTargetWeight('')
        } else {
            alert('No se pudieron encontrar cajas que se ajusten al peso objetivo')
        }
    }


    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
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

    return (
        <div className="space-y-4">
            {!hideTitle && (
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Entradas de Cajas</h3>
                        <p className="text-sm text-muted-foreground">
                            Cajas consumidas en este proceso
                        </p>
                    </div>
                </div>
            )}
            <div className={`flex items-center ${hideTitle ? 'justify-end' : 'justify-between'}`}>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Cajas
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>Agregar Cajas desde Palet</DialogTitle>
                            <DialogDescription>
                                Busca un palet y selecciona las cajas que se consumirán en este proceso
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* Búsqueda de palet */}
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label htmlFor="pallet-search">ID del Palet</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            id="pallet-search"
                                            placeholder="Ingresa el ID del palet"
                                            value={palletSearch}
                                            onChange={(e) => setPalletSearch(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSearchPallet()
                                                }
                                            }}
                                        />
                                        <Button
                                            onClick={handleSearchPallet}
                                            disabled={loadingPallet || !palletSearch.trim()}
                                        >
                                            <Search className="h-4 w-4 mr-2" />
                                            Buscar
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Resumen de selección - Compacto */}
                            {selectedBoxes.length > 0 && (
                                <div className="flex items-center gap-4 text-sm px-3 py-2 bg-muted/50 rounded-md border">
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Cajas:</span>
                                        <span className="font-semibold">{selectedBoxes.length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Peso Total:</span>
                                        <span className="font-semibold">{formatWeight(calculateTotalWeight())}</span>
                                    </div>
                                    {loadedPallets.length > 0 && (
                                        <div className="flex items-center gap-2 ml-auto">
                                            <span className="text-muted-foreground">Palets:</span>
                                            <span className="font-semibold">{loadedPallets.length}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Lista de palets cargados */}
                            {loadedPallets.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {loadedPallets.map((pallet) => (
                                        <Badge key={pallet.id} variant="secondary" className="gap-2 pr-1">
                                            <span>Palet #{pallet.id}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 hover:bg-destructive/20"
                                                onClick={() => handleRemovePallet(pallet.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Tabs para modo de selección */}
                            {loadedPallets.length > 0 && getAllBoxes().length > 0 && (
                                <Tabs value={selectionMode} onValueChange={setSelectionMode} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="manual">Selección Manual</TabsTrigger>
                                        <TabsTrigger value="weight">Por Peso Total</TabsTrigger>
                                    </TabsList>
                                    
                                    {/* Modo por peso */}
                                    <TabsContent value="weight" className="space-y-3 mt-4">
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Label htmlFor="target-weight">Peso Neto Objetivo (kg)</Label>
                                                <Input
                                                    id="target-weight"
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Ej: 100.50"
                                                    value={targetWeight}
                                                    onChange={(e) => setTargetWeight(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleSelectByWeight()
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <Button
                                                    onClick={handleSelectByWeight}
                                                    disabled={!targetWeight || parseFloat(targetWeight) <= 0}
                                                >
                                                    <Calculator className="h-4 w-4 mr-2" />
                                                    Calcular
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            El sistema seleccionará automáticamente las cajas que mejor se ajusten al peso objetivo
                                        </p>
                                    </TabsContent>
                                    
                                    {/* Transfer List - Solo mostrar en modo manual */}
                                    <TabsContent value="manual" className="mt-4">
                                        {getAllBoxes().length > 0 && (
                                <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(90vh - 380px)', minHeight: '350px', maxHeight: '500px' }}>
                                    {/* Columna izquierda: Cajas disponibles */}
                                    <div className="col-span-5 flex flex-col border rounded-lg overflow-hidden">
                                        <div className="p-2 border-b bg-muted/50 flex-shrink-0">
                                            <div className="flex items-center justify-between">
                                                <Label className="font-semibold text-sm">
                                                    Cajas Disponibles
                                                </Label>
                                                <Badge variant="secondary" className="text-xs">
                                                    {getAllBoxes().filter(box => !isBoxSelected(box.id, box.palletId)).length}
                                                </Badge>
                                            </div>
                                        </div>
                                        <ScrollArea className="flex-1 min-h-0">
                                            <div className="p-2 space-y-1">
                                                {getAllBoxes()
                                                    .filter(box => !isBoxSelected(box.id, box.palletId))
                                                    .map((box) => (
                                                        <div
                                                            key={`${box.palletId}-${box.id}`}
                                                            className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer border"
                                                            onClick={() => handleToggleBox(box.id, box.palletId)}
                                                        >
                                                            <Checkbox
                                                                checked={false}
                                                                onCheckedChange={() => handleToggleBox(box.id, box.palletId)}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-medium truncate">
                                                                        Caja #{box.id}
                                                                    </p>
                                                                    <Badge variant="outline" className="text-xs">P{box.palletId}</Badge>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {box.product?.name || 'Sin producto'} | Lote: {box.lot || 'N/A'}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatWeight(box.netWeight)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                {getAllBoxes().filter(box => !isBoxSelected(box.id, box.palletId)).length === 0 && (
                                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                                        Todas las cajas están seleccionadas
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>

                                    {/* Botones de transferencia */}
                                    <div className="col-span-2 flex flex-col items-center justify-center gap-2 flex-shrink-0">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                const availableBoxes = getAllBoxes()
                                                    .filter(box => !isBoxSelected(box.id, box.palletId))
                                                if (availableBoxes.length > 0) {
                                                    handleToggleBox(availableBoxes[0].id, availableBoxes[0].palletId)
                                                }
                                            }}
                                            disabled={getAllBoxes().filter(box => !isBoxSelected(box.id, box.palletId)).length === 0}
                                            title="Mover seleccionada"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleSelectAllBoxes}
                                            disabled={getAllBoxes().filter(box => !isBoxSelected(box.id, box.palletId)).length === 0}
                                            title="Mover todas"
                                        >
                                            <ChevronsRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                if (selectedBoxes.length > 0) {
                                                    setSelectedBoxes(prev => prev.slice(0, -1))
                                                }
                                            }}
                                            disabled={selectedBoxes.length === 0}
                                            title="Quitar seleccionada"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleUnselectAllBoxes}
                                            disabled={selectedBoxes.length === 0}
                                            title="Quitar todas"
                                        >
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Columna derecha: Cajas seleccionadas */}
                                    <div className="col-span-5 flex flex-col border rounded-lg overflow-hidden">
                                        <div className="p-2 border-b bg-muted/50 flex-shrink-0">
                                            <div className="flex items-center justify-between">
                                                <Label className="font-semibold text-sm">
                                                    Cajas Seleccionadas
                                                </Label>
                                                <Badge variant="default" className="text-xs">
                                                    {selectedBoxes.length}
                                                </Badge>
                                            </div>
                                        </div>
                                        <ScrollArea className="flex-1 min-h-0">
                                            <div className="p-2 space-y-1">
                                                {selectedBoxes.map((selectedBox) => {
                                                    const box = getAllBoxes().find(b => b.id === selectedBox.boxId && b.palletId === selectedBox.palletId)
                                                    if (!box) return null
                                                    return (
                                                        <div
                                                            key={`${selectedBox.palletId}-${selectedBox.boxId}`}
                                                            className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer border bg-primary/5"
                                                            onClick={() => handleToggleBox(box.id, box.palletId)}
                                                        >
                                                            <Checkbox
                                                                checked={true}
                                                                onCheckedChange={() => handleToggleBox(box.id, box.palletId)}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-medium truncate">
                                                                        Caja #{box.id}
                                                                    </p>
                                                                    <Badge variant="outline" className="text-xs">P{box.palletId}</Badge>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {box.product?.name || 'Sin producto'} | Lote: {box.lot || 'N/A'}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatWeight(box.netWeight)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                {selectedBoxes.length === 0 && (
                                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                                        No hay cajas seleccionadas
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            )}

                            {loadedPallets.length > 0 && getAllBoxes().length === 0 && (
                                <div className="text-center py-8 border rounded-lg">
                                    <p className="text-sm text-muted-foreground">
                                        Los palets cargados no tienen cajas
                                    </p>
                                </div>
                            )}

                            {/* Botones de acción */}
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setAddDialogOpen(false)
                                        setPalletSearch('')
                                        setSelectedPallet(null)
                                        setSelectedBoxes([])
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleAddInputs}
                                    disabled={selectedBoxes.length === 0}
                                >
                                    Agregar {selectedBoxes.length > 0 && `(${selectedBoxes.length})`}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Lista de inputs existentes */}
            {inputs.length === 0 ? (
                <div className="py-8 text-center border rounded-lg">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                        No hay entradas registradas. Agrega cajas desde un palet para comenzar.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {!hideTitle && (
                        <div>
                            <h4 className="text-sm font-semibold">Entradas Registradas ({inputs.length})</h4>
                            <p className="text-xs text-muted-foreground">
                                Cajas asignadas a este proceso
                            </p>
                        </div>
                    )}
                    <div>
                        <ScrollArea className={hideTitle ? "h-64" : "h-96"}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID Caja</TableHead>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Lote</TableHead>
                                        <TableHead>Peso</TableHead>
                                        <TableHead>Palet</TableHead>
                                        <TableHead className="w-20"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inputs.map((input) => (
                                        <TableRow key={input.id}>
                                            <TableCell className="font-medium">{input.box?.id || 'N/A'}</TableCell>
                                            <TableCell>{input.box?.product?.name || 'N/A'}</TableCell>
                                            <TableCell>{input.box?.lot || 'N/A'}</TableCell>
                                            <TableCell>{formatWeight(input.box?.netWeight)}</TableCell>
                                            <TableCell>
                                                {input.box?.palletId ? (
                                                    <Badge variant="outline">#{input.box.palletId}</Badge>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteInput(input.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductionInputsManager

