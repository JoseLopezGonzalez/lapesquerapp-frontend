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
    const [targetWeight, setTargetWeight] = useState({}) // {palletId: weight}
    const [selectedPalletId, setSelectedPalletId] = useState(null) // Palet actualmente seleccionado para ver sus cajas
    
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
            setTargetWeight({})
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

    // Seleccionar cajas basándose en peso total objetivo para un palet específico
    const handleSelectByWeight = (palletId) => {
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
        const availableBoxes = pallet.boxes
            .filter(box => !isBoxSelected(box.id, palletId))
            .map(box => ({
                ...box,
                weight: parseFloat(box.netWeight || 0),
                palletId: palletId
            }))
            .sort((a, b) => b.weight - a.weight)

        // Algoritmo voraz: seleccionar cajas hasta alcanzar o acercarse al peso objetivo
        const boxesToAdd = []
        let currentWeight = 0
        
        for (const box of availableBoxes) {
            if (currentWeight + box.weight <= target) {
                boxesToAdd.push({ boxId: box.id, palletId: palletId })
                currentWeight += box.weight
            }
        }

        // Si no alcanzamos el peso objetivo, agregar la caja más cercana que no lo exceda demasiado
        if (boxesToAdd.length === 0 && availableBoxes.length > 0) {
            const closestBox = availableBoxes.find(box => box.weight <= target)
            if (closestBox) {
                boxesToAdd.push({ boxId: closestBox.id, palletId: palletId })
            }
        }

        if (boxesToAdd.length > 0) {
            setSelectedBoxes(prev => [...prev, ...boxesToAdd])
            setTargetWeight(prev => ({ ...prev, [palletId]: '' }))
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
                    <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Agregar Cajas desde Palet</DialogTitle>
                            <DialogDescription>
                                Busca un palet y selecciona las cajas que se consumirán en este proceso
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
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
                                                    className={`flex items-start space-x-3 border rounded-md p-3 cursor-pointer hover:bg-accent transition-colors ${
                                                        isSelected ? 'border-primary bg-accent' : ''
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
                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                                Busca y agrega palets para comenzar
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                            
                            {/* Columna central: Cajas del palet seleccionado */}
                            <div className="col-span-6 flex flex-col space-y-4 min-h-0">

                                {/* Tabs para modo de selección */}
                                {selectedPalletId && (
                                    <Tabs value={selectionMode} onValueChange={setSelectionMode} className="w-full flex-1 flex flex-col min-h-0">
                                        <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                                            <TabsTrigger value="manual">Selección Manual</TabsTrigger>
                                            <TabsTrigger value="weight">Por Peso Total</TabsTrigger>
                                        </TabsList>
                                        
                                        {/* Modo por peso */}
                                        <TabsContent value="weight" className="space-y-3 mt-4 flex-1 flex flex-col min-h-0">
                                            {selectedPalletId && (
                                                <Card className="p-3 flex-shrink-0">
                                                    <div className="flex gap-2 items-end">
                                                        <div className="flex-1">
                                                            <Label htmlFor={`target-weight-${selectedPalletId}`} className="text-sm">
                                                                Peso Objetivo (kg) - Palet #{selectedPalletId}
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
                                                                        handleSelectByWeight(selectedPalletId)
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <Button
                                                            onClick={() => handleSelectByWeight(selectedPalletId)}
                                                            disabled={!targetWeight[selectedPalletId] || parseFloat(targetWeight[selectedPalletId]) <= 0}
                                                            size="sm"
                                                        >
                                                            <Calculator className="h-4 w-4 mr-2" />
                                                            Calcular
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {getPalletBoxes(selectedPalletId).length} cajas disponibles
                                                    </p>
                                                </Card>
                                            )}
                                        </TabsContent>
                                        
                                        {/* Transfer List - Solo mostrar en modo manual */}
                                        <TabsContent value="manual" className="mt-4 flex-1 flex flex-col min-h-0">
                                            {selectedPalletId && getPalletBoxes(selectedPalletId).length > 0 && (
                                                <div className="grid grid-cols-12 gap-4 flex-1 min-h-0" style={{ height: 'calc(90vh - 450px)', minHeight: '400px' }}>
                                                    {/* Cajas disponibles del palet seleccionado */}
                                                    <div className="col-span-5 flex flex-col border rounded-lg overflow-hidden">
                                                        <div className="p-2 border-b bg-muted/50 flex-shrink-0">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="font-semibold text-sm">
                                                                    Disponibles
                                                                </Label>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {getPalletBoxes(selectedPalletId).filter(box => !isBoxSelected(box.id, selectedPalletId)).length}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <ScrollArea className="flex-1 min-h-0 overflow-hidden">
                                                            <div className="p-2 space-y-1">
                                                                {getPalletBoxes(selectedPalletId)
                                                                    .filter(box => !isBoxSelected(box.id, selectedPalletId))
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
                                                                                    Caja #{box.id}
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground truncate">
                                                                                    {box.product?.name || 'Sin producto'} | Lote: {box.lot || 'N/A'}
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {formatWeight(box.netWeight)}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                {getPalletBoxes(selectedPalletId).filter(box => !isBoxSelected(box.id, selectedPalletId)).length === 0 && (
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
                                                                const availableBoxes = getPalletBoxes(selectedPalletId)
                                                                    .filter(box => !isBoxSelected(box.id, selectedPalletId))
                                                                if (availableBoxes.length > 0) {
                                                                    handleToggleBox(availableBoxes[0].id, selectedPalletId)
                                                                }
                                                            }}
                                                            disabled={getPalletBoxes(selectedPalletId).filter(box => !isBoxSelected(box.id, selectedPalletId)).length === 0}
                                                            title="Mover seleccionada"
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => {
                                                                const availableBoxes = getPalletBoxes(selectedPalletId)
                                                                    .filter(box => !isBoxSelected(box.id, selectedPalletId))
                                                                    .map(box => ({ boxId: box.id, palletId: selectedPalletId }))
                                                                setSelectedBoxes(prev => [...prev, ...availableBoxes])
                                                            }}
                                                            disabled={getPalletBoxes(selectedPalletId).filter(box => !isBoxSelected(box.id, selectedPalletId)).length === 0}
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
                                                    <div className="col-span-5 flex flex-col border rounded-lg overflow-hidden">
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
                                                        <ScrollArea className="flex-1 min-h-0 overflow-hidden">
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
                                                                                    Caja #{box.id}
                                                                                </p>
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
                                                                {getSelectedBoxesForPallet(selectedPalletId).length === 0 && (
                                                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                                                        No hay cajas seleccionadas
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </ScrollArea>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedPalletId && getPalletBoxes(selectedPalletId).length === 0 && (
                                                <div className="text-center py-8 border rounded-lg">
                                                    <p className="text-sm text-muted-foreground">
                                                        Este palet no tiene cajas
                                                    </p>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </Tabs>
                                )}
                                
                                {!selectedPalletId && loadedPallets.length > 0 && (
                                    <div className="text-center py-8 border rounded-lg">
                                        <p className="text-sm text-muted-foreground">
                                            Selecciona un palet para ver sus cajas
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Columna derecha: Selección total de todos los palets */}
                            <div className="col-span-3 flex flex-col border rounded-lg overflow-hidden">
                                <div className="p-3 border-b bg-muted/50 flex-shrink-0">
                                    <div className="flex items-center justify-between">
                                        <Label className="font-semibold text-sm">Selección Total</Label>
                                        <Badge variant="default" className="text-xs">
                                            {selectedBoxes.length}
                                        </Badge>
                                    </div>
                                </div>
                                
                                {/* Resumen compacto */}
                                {selectedBoxes.length > 0 && (
                                    <div className="p-3 border-b bg-primary/5">
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Cajas:</span>
                                                <span className="font-semibold">{selectedBoxes.length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Peso Total:</span>
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
                                                    <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md">
                                                        <Badge variant="outline" className="text-xs font-semibold">
                                                            Palet #{pallet.id}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {selectedForPallet.length} cajas
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1 pl-2 border-l-2 border-muted">
                                                        {selectedForPallet.map((selectedBox) => {
                                                            const box = getPalletBoxes(pallet.id).find(b => b.id === selectedBox.boxId)
                                                            if (!box) return null
                                                            return (
                                                                <div
                                                                    key={`${pallet.id}-${selectedBox.boxId}`}
                                                                    className="flex items-center gap-2 p-1.5 hover:bg-muted rounded cursor-pointer border text-xs"
                                                                    onClick={() => handleToggleBox(box.id, pallet.id)}
                                                                >
                                                                    <Checkbox
                                                                        checked={true}
                                                                        onCheckedChange={() => handleToggleBox(box.id, pallet.id)}
                                                                        className="h-3 w-3"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium truncate">Caja #{box.id}</p>
                                                                        <p className="text-muted-foreground truncate">{formatWeight(box.netWeight)}</p>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
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

                        {/* Botones de acción */}
                        <div className="flex justify-end gap-2 pt-2 border-t">
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

