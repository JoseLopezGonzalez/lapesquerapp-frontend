'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getProductionOutputs, createProductionOutput, updateProductionOutput, deleteProductionOutput } from '@/services/productionService'
import { getProductOptions } from '@/services/productService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, Package, Edit } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ProductionOutputsManager = ({ productionRecordId, onRefresh, hideTitle = false }) => {
    const { data: session } = useSession()
    const [outputs, setOutputs] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
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

    useEffect(() => {
        if (session?.user?.accessToken && productionRecordId) {
            loadOutputs()
            loadProducts()
        }
    }, [session, productionRecordId])

    const loadOutputs = async () => {
        try {
            setLoading(true)
            setError(null)
            const token = session.user.accessToken
            const response = await getProductionOutputs(token, { production_record_id: productionRecordId })
            setOutputs(response.data || [])
        } catch (err) {
            console.error('Error loading outputs:', err)
            setError(err.message || 'Error al cargar las salidas')
        } finally {
            setLoading(false)
        }
    }

    const loadProducts = async () => {
        try {
            const token = session.user.accessToken
            const response = await getProductOptions(token)
            setProducts(response.data || [])
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
            setAddDialogOpen(false)
            resetForm()
            loadOutputs()
            if (onRefresh) onRefresh()
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
            setEditDialogOpen(false)
            setEditingOutput(null)
            resetForm()
            loadOutputs()
            if (onRefresh) onRefresh()
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
            loadOutputs()
            if (onRefresh) onRefresh()
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
            weight_kg: output.weight_kg?.toString() || ''
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

    const formatWeight = (weight) => {
        if (!weight) return '0 kg'
        return `${parseFloat(weight).toFixed(2)} kg`
    }


    if (loading) {
        return (
            <div className="space-y-4">
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
                        <h3 className="text-lg font-semibold">Salidas Lógicas</h3>
                        <p className="text-sm text-muted-foreground">
                            Productos producidos en este proceso
                        </p>
                    </div>
                </div>
            )}
            <div className={`flex items-center ${hideTitle ? 'justify-end' : 'justify-between'}`}>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Salida
                        </Button>
                    </DialogTrigger>
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
                                    <Label htmlFor="boxes">Cantidad de Cajas *</Label>
                                    <Input
                                        id="boxes"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={formData.boxes}
                                        onChange={(e) => setFormData({ ...formData, boxes: e.target.value })}
                                        required
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
                                <Button type="submit" disabled={!formData.product_id || !formData.boxes || !formData.weight_kg}>
                                    Crear Salida
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog de edición */}
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
                                    <Label htmlFor="edit_boxes">Cantidad de Cajas *</Label>
                                    <Input
                                        id="edit_boxes"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={formData.boxes}
                                        onChange={(e) => setFormData({ ...formData, boxes: e.target.value })}
                                        required
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
                                <Button type="submit" disabled={!formData.product_id || !formData.boxes || !formData.weight_kg}>
                                    Guardar Cambios
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Lista de outputs existentes */}
            {outputs.length === 0 ? (
                <div className="py-8 text-center border rounded-lg">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                        No hay salidas registradas. Agrega una salida para registrar los productos producidos.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {!hideTitle && (
                        <div>
                            <h4 className="text-sm font-semibold">Salidas Registradas ({outputs.length})</h4>
                            <p className="text-xs text-muted-foreground">
                                Productos producidos en este proceso
                            </p>
                        </div>
                    )}
                    <div>
                        <ScrollArea className={hideTitle ? "h-64" : "h-96"}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Lote</TableHead>
                                        <TableHead>Cajas</TableHead>
                                        <TableHead>Peso Total</TableHead>
                                        <TableHead>Peso Promedio</TableHead>
                                        <TableHead className="w-24"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {outputs.map((output) => {
                                        const avgWeight = output.boxes > 0 
                                            ? (output.weight_kg / output.boxes).toFixed(2)
                                            : '0.00'
                                        return (
                                            <TableRow key={output.id}>
                                                <TableCell className="font-medium">
                                                    {output.product?.name || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {output.lot_id || (
                                                        <span className="text-muted-foreground">Sin lote</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{output.boxes || 0}</TableCell>
                                                <TableCell>{formatWeight(output.weight_kg)}</TableCell>
                                                <TableCell>{formatWeight(avgWeight)}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEditClick(output)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteOutput(output.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
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
                </div>
            )}
        </div>
    )
}

export default ProductionOutputsManager

