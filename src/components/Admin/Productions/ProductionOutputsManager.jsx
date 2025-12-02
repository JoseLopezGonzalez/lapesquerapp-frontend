'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getProductionOutputs, createProductionOutput, updateProductionOutput, deleteProductionOutput, syncProductionOutputs } from '@/services/productionService'
import { getProductOptions } from '@/services/productService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, Package, Edit, Save, X, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/Utilities/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/Shadcn/Combobox'

const ProductionOutputsManager = ({ productionRecordId, onRefresh, hideTitle = false, renderInCard = false, cardTitle, cardDescription }) => {
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
    // Estado para el dialog de gestión múltiple
    const [manageDialogOpen, setManageDialogOpen] = useState(false)
    const [editableOutputs, setEditableOutputs] = useState([])
    const [newRows, setNewRows] = useState([])
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (session?.user?.accessToken && productionRecordId) {
            loadOutputs()
            loadProducts()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.accessToken, productionRecordId])

    const loadOutputsOnly = async () => {
        try {
            const token = session.user.accessToken
            const response = await getProductionOutputs(token, { production_record_id: productionRecordId })
            setOutputs(response.data || [])
        } catch (err) {
            console.warn('Error loading outputs:', err)
        }
    }

    const loadOutputs = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true)
            }
            setError(null)
            const token = session.user.accessToken
            const response = await getProductionOutputs(token, { production_record_id: productionRecordId })
            setOutputs(response.data || [])
        } catch (err) {
            console.error('Error loading outputs:', err)
            setError(err.message || 'Error al cargar las salidas')
        } finally {
            if (showLoading) {
                setLoading(false)
            }
        }
    }

    const loadProducts = async () => {
        try {
            const token = session.user.accessToken
            const response = await getProductOptions(token)
            // Manejar tanto array directo como objeto con propiedad data
            const productsData = Array.isArray(response) ? response : (response.data || response || [])
            // Mapear a formato { value, label } para el Combobox
            const formattedProducts = productsData.map(product => ({
                value: product.id?.toString() || '',
                label: product.name || `Producto #${product.id}`
            }))
            setProducts(formattedProducts)
            // console.log('Productos cargados:', formattedProducts.length, formattedProducts)
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
            // Solo recargar outputs, no todo el componente
            await loadOutputsOnly()
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
            // Solo recargar outputs, no todo el componente
            await loadOutputsOnly()
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
            // Solo recargar outputs, no todo el componente
            await loadOutputsOnly()
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
            weight_kg: (output.weightKg || output.weight_kg || 0).toString()
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

    // Funciones para el dialog de gestión múltiple
    const openManageDialog = async () => {
        // Asegurar que los productos estén cargados
        if (products.length === 0) {
            await loadProducts()
        }
        
        // Inicializar con las salidas existentes
        setEditableOutputs(outputs.map(output => {
            // Manejar tanto camelCase como snake_case
            const weight = output.weightKg || output.weight_kg || 0
            return {
                id: output.id,
                product_id: output.product?.id?.toString() || '',
                boxes: output.boxes?.toString() || '',
                weight_kg: weight.toString(),
                isNew: false
            }
        }))
        setNewRows([])
        setManageDialogOpen(true)
    }

    const addNewRow = () => {
        setNewRows([...newRows, {
            id: `new-${Date.now()}`,
            product_id: '',
            boxes: '',
            weight_kg: '',
            isNew: true
        }])
    }

    const removeRow = (id) => {
        if (id.toString().startsWith('new-')) {
            setNewRows(newRows.filter(row => row.id !== id))
        } else {
            setEditableOutputs(editableOutputs.filter(row => row.id !== id))
        }
    }

    const updateRow = (id, field, value) => {
        if (id.toString().startsWith('new-')) {
            setNewRows(newRows.map(row => 
                row.id === id ? { ...row, [field]: value } : row
            ))
        } else {
            setEditableOutputs(editableOutputs.map(row => 
                row.id === id ? { ...row, [field]: value } : row
            ))
        }
    }

    const handleSaveAll = async () => {
        try {
            setSaving(true)
            const token = session.user.accessToken

            // Preparar el array de outputs para sincronización
            // Incluir tanto las salidas existentes (con ID) como las nuevas (sin ID)
            const allOutputs = [
                ...editableOutputs.filter(row => row.product_id && row.boxes && row.weight_kg),
                ...newRows.filter(row => row.product_id && row.boxes && row.weight_kg)
            ].map(row => {
                const output = {
                    product_id: parseInt(row.product_id),
                    lot_id: null, // Por ahora no se usa lot_id en el dialog masivo
                    boxes: parseInt(row.boxes) || 0,
                    weight_kg: parseFloat(row.weight_kg) || 0
                }
                
                // Si tiene ID (es una salida existente), incluir el ID para actualizar
                if (row.id && !row.id.toString().startsWith('new-')) {
                    output.id = row.id
                }
                
                return output
            })

            // Usar el endpoint de sincronización que maneja crear, actualizar y eliminar en una sola petición
            const response = await syncProductionOutputs(productionRecordId, {
                outputs: allOutputs
            }, token)

            // Resetear estados antes de cerrar el diálogo
            setEditableOutputs([])
            setNewRows([])
            setSaving(false)
            
            // Cerrar el dialog
            setManageDialogOpen(false)
            
            // Actualizar el estado con los outputs sincronizados del servidor
            if (response.data && response.data.outputs) {
                setOutputs(response.data.outputs)
            } else {
                // Si no vienen en la respuesta, recargar solo outputs en segundo plano
                loadOutputsOnly().catch(err => {
                    console.warn('Error al recargar outputs:', err)
                })
            }
            
        } catch (err) {
            console.error('Error saving outputs:', err)
            alert(err.message || 'Error al guardar las salidas')
            // Asegurar que el estado se resetee incluso si hay error
            setSaving(false)
        }
    }

    const getAllRows = () => {
        return [...editableOutputs, ...newRows]
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

    const addDialogContent = (
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
    )

    const addDialog = (
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            {addDialogContent}
        </Dialog>
    )

    const addButton = (
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Salida
                </Button>
            </DialogTrigger>
            {addDialogContent}
        </Dialog>
    )

    const editDialog = (
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
    )

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
                                        <TableHead>Cajas</TableHead>
                                        <TableHead>Peso Total</TableHead>
                                        <TableHead>Peso Promedio</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {outputs.map((output) => {
                                        const weight = output.weightKg || output.weight_kg || 0
                                        const avgWeight = output.boxes > 0 
                                            ? (weight / output.boxes).toFixed(2)
                                            : '0.00'
                                        return (
                                            <TableRow key={output.id}>
                                                <TableCell className="font-medium">
                                                    {output.product?.name || 'N/A'}
                                                </TableCell>
                                                <TableCell>{output.boxes || 0}</TableCell>
                                                <TableCell>{formatWeight(weight)}</TableCell>
                                                <TableCell>{formatWeight(avgWeight)}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
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
                    <div className="flex justify-end items-center">
                        <Button
                            onClick={addNewRow}
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
                                    <TableHead className="w-[300px]">Producto</TableHead>
                                    <TableHead className="w-[120px]">Cajas</TableHead>
                                    <TableHead className="w-[120px]">Peso (kg)</TableHead>
                                    <TableHead className="w-[100px]">Peso Prom.</TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getAllRows().map((row) => {
                                    const avgWeight = row.boxes && parseFloat(row.boxes) > 0 && row.weight_kg
                                        ? (parseFloat(row.weight_kg) / parseFloat(row.boxes)).toFixed(2)
                                        : '0.00'
                                    
                                    const isValid = row.product_id && row.boxes && parseFloat(row.boxes) > 0 && row.weight_kg && parseFloat(row.weight_kg) > 0
                                    
                                    return (
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
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={row.boxes}
                                                    onChange={(e) => updateRow(row.id, 'boxes', e.target.value)}
                                                    placeholder="0"
                                                    className={`h-9 ${!row.boxes || parseFloat(row.boxes) <= 0 ? 'border-destructive' : ''}`}
                                                />
                                            </TableCell>
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
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatWeight(avgWeight)}
                                                </span>
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
                                (!row.product_id || !row.boxes || parseFloat(row.boxes) <= 0 || !row.weight_kg || parseFloat(row.weight_kg) <= 0)
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

    // Si renderInCard es true, envolver en Card con botón en header
    if (renderInCard) {
        return (
            <>
                {manageDialog}
                {addDialog}
                {editDialog}
                <Card className="h-fit">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{cardTitle || 'Salidas Lógicas'}</CardTitle>
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
            {addButton}
            {editDialog}
            {mainContent}
        </div>
    )
}

export default ProductionOutputsManager

