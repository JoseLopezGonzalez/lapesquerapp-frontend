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
import { Plus, Trash2, Package, Search, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const ProductionInputsManager = ({ productionRecordId, onRefresh, hideTitle = false }) => {
    const { data: session } = useSession()
    const [inputs, setInputs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    
    // Estados para el diálogo de agregar cajas
    const [palletSearch, setPalletSearch] = useState('')
    const [selectedPallet, setSelectedPallet] = useState(null)
    const [selectedBoxes, setSelectedBoxes] = useState([])
    const [loadingPallet, setLoadingPallet] = useState(false)

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

        try {
            setLoadingPallet(true)
            const token = session.user.accessToken
            const pallet = await getPallet(palletSearch.trim(), token)
            setSelectedPallet(pallet)
            setSelectedBoxes([]) // Reset selección
        } catch (err) {
            console.error('Error loading pallet:', err)
            alert(err.message || 'Error al cargar el palet')
            setSelectedPallet(null)
        } finally {
            setLoadingPallet(false)
        }
    }

    const handleToggleBox = (boxId) => {
        setSelectedBoxes(prev => {
            if (prev.includes(boxId)) {
                return prev.filter(id => id !== boxId)
            } else {
                return [...prev, boxId]
            }
        })
    }

    const handleSelectAllBoxes = () => {
        if (!selectedPallet?.boxes) return
        const allBoxIds = selectedPallet.boxes.map(box => box.id)
        setSelectedBoxes(allBoxIds)
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
            const inputsData = selectedBoxes.map(boxId => ({
                production_record_id: parseInt(productionRecordId),
                box_id: boxId
            }))

            await createMultipleProductionInputs(inputsData, token)
            setAddDialogOpen(false)
            setPalletSearch('')
            setSelectedPallet(null)
            setSelectedBoxes([])
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

    // Agrupar cajas por producto y lote
    const groupedBoxes = selectedPallet?.boxes?.reduce((acc, box) => {
        const key = `${box.product?.id || 'unknown'}-${box.lot || 'unknown'}`
        if (!acc[key]) {
            acc[key] = {
                product: box.product,
                lot: box.lot,
                boxes: [],
                totalWeight: 0,
                count: 0
            }
        }
        acc[key].boxes.push(box)
        acc[key].totalWeight += parseFloat(box.netWeight || 0)
        acc[key].count += 1
        return acc
    }, {}) || {}

    const groupedBoxesArray = Object.values(groupedBoxes)

    // Verificar si todas las cajas de un grupo están seleccionadas
    const isGroupSelected = (group) => {
        return group.boxes.every(box => selectedBoxes.includes(box.id))
    }

    const handleToggleGroup = (group) => {
        const groupBoxIds = group.boxes.map(box => box.id)
        const allSelected = isGroupSelected(group)
        
        if (allSelected) {
            // Deseleccionar todas las cajas del grupo
            setSelectedBoxes(prev => prev.filter(id => !groupBoxIds.includes(id)))
        } else {
            // Seleccionar todas las cajas del grupo
            setSelectedBoxes(prev => {
                const newSelection = [...prev]
                groupBoxIds.forEach(boxId => {
                    if (!newSelection.includes(boxId)) {
                        newSelection.push(boxId)
                    }
                })
                return newSelection
            })
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
                    <DialogContent className="max-w-4xl max-h-[90vh]">
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

                            {/* Información del palet seleccionado */}
                            {selectedPallet && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg">Palet #{selectedPallet.id}</CardTitle>
                                                {selectedPallet.store && (
                                                    <CardDescription>
                                                        Almacén: {selectedPallet.store.name}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedPallet(null)
                                                    setSelectedBoxes([])
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {/* Resumen agrupado */}
                                            {groupedBoxesArray.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label>Selección por grupos</Label>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={handleSelectAllBoxes}
                                                            >
                                                                Seleccionar todas
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={handleUnselectAllBoxes}
                                                            >
                                                                Deseleccionar todas
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <ScrollArea className="h-48 border rounded-md p-2">
                                                        <div className="space-y-2">
                                                            {groupedBoxesArray.map((group, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                                                                    onClick={() => handleToggleGroup(group)}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Checkbox
                                                                            checked={isGroupSelected(group)}
                                                                            onCheckedChange={() => handleToggleGroup(group)}
                                                                        />
                                                                        <div>
                                                                            <p className="font-medium">
                                                                                {group.product?.name || 'Sin producto'}
                                                                            </p>
                                                                            <p className="text-sm text-muted-foreground">
                                                                                Lote: {group.lot || 'Sin lote'} | 
                                                                                {group.count} cajas | 
                                                                                {formatWeight(group.totalWeight)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </ScrollArea>
                                                </div>
                                            )}

                                            {/* Lista individual de cajas */}
                                            {selectedPallet.boxes && selectedPallet.boxes.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label>Selección individual ({selectedBoxes.length} seleccionadas)</Label>
                                                    <ScrollArea className="h-64 border rounded-md">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="w-12"></TableHead>
                                                                    <TableHead>ID</TableHead>
                                                                    <TableHead>Producto</TableHead>
                                                                    <TableHead>Lote</TableHead>
                                                                    <TableHead>Peso</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {selectedPallet.boxes.map((box) => (
                                                                    <TableRow
                                                                        key={box.id}
                                                                        className={selectedBoxes.includes(box.id) ? 'bg-muted' : ''}
                                                                    >
                                                                        <TableCell>
                                                                            <Checkbox
                                                                                checked={selectedBoxes.includes(box.id)}
                                                                                onCheckedChange={() => handleToggleBox(box.id)}
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell className="font-medium">{box.id}</TableCell>
                                                                        <TableCell>{box.product?.name || 'N/A'}</TableCell>
                                                                        <TableCell>{box.lot || 'N/A'}</TableCell>
                                                                        <TableCell>{formatWeight(box.netWeight)}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </ScrollArea>
                                                </div>
                                            )}

                                            {(!selectedPallet.boxes || selectedPallet.boxes.length === 0) && (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    Este palet no tiene cajas
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Botones de acción */}
                            <div className="flex justify-end gap-2">
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

