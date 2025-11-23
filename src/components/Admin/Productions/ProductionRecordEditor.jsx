'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
    getProductionRecord, 
    createProductionRecord, 
    updateProductionRecord,
    getProductionRecords 
} from '@/services/productionService'
import { fetchWithTenant } from '@/lib/fetchWithTenant'
import { API_URL_V2 } from '@/configs/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Check, ChevronsUpDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import ProductionInputsManager from './ProductionInputsManager'
import ProductionOutputsManager from './ProductionOutputsManager'

const ProductionRecordEditor = ({ productionId, recordId = null }) => {
    const { data: session } = useSession()
    const router = useRouter()
    const isEditMode = recordId !== null
    
    const [processes, setProcesses] = useState([])
    const [existingRecords, setExistingRecords] = useState([])
    const [record, setRecord] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    
    const [formData, setFormData] = useState({
        name: '',
        process_id: 'none',
        parent_record_id: 'none',
        notes: ''
    })
    const [nameOpen, setNameOpen] = useState(false)

    useEffect(() => {
        if (session?.user?.accessToken && productionId) {
            loadInitialData()
        }
    }, [session, productionId, recordId])

    const loadInitialData = async () => {
        try {
            setLoading(true)
            setError(null)
            const token = session.user.accessToken
            
            // Cargar procesos disponibles
            await loadProcesses(token)
            
            // Cargar records existentes para el select de proceso padre
            const recordsResponse = await getProductionRecords(token, { production_id: productionId })
            setExistingRecords(recordsResponse.data || [])
            
            // Si es modo edición, cargar el record
            if (isEditMode && recordId) {
                const recordData = await getProductionRecord(recordId, token)
                setRecord(recordData)
                
                // Rellenar el formulario con los datos existentes
                setFormData({
                    name: recordData.name || '',
                    process_id: recordData.process_id ? recordData.process_id.toString() : 'none',
                    parent_record_id: recordData.parent_record_id ? recordData.parent_record_id.toString() : 'none',
                    notes: recordData.notes || ''
                })
            }
        } catch (err) {
            console.error('Error loading data:', err)
            setError(err.message || 'Error al cargar los datos')
        } finally {
            setLoading(false)
        }
    }

    const loadProcesses = async (token) => {
        try {
            const response = await fetchWithTenant(`${API_URL_V2}processes/options`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'User-Agent': navigator.userAgent,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setProcesses(data.data || data || [])
            }
        } catch (err) {
            console.warn('No se pudieron cargar los tipos de proceso:', err)
            setProcesses([])
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setSaving(true)
            setError(null)
            const token = session.user.accessToken
            
            const recordData = {
                production_id: parseInt(productionId),
                name: formData.name || null,
                process_id: formData.process_id && formData.process_id !== 'none' ? parseInt(formData.process_id) : null,
                parent_record_id: formData.parent_record_id && formData.parent_record_id !== 'none' ? parseInt(formData.parent_record_id) : null,
                notes: formData.notes || null
            }

            let response
            if (isEditMode) {
                // Actualizar
                response = await updateProductionRecord(recordId, recordData, token)
                // Recargar el record actualizado
                const updatedRecord = await getProductionRecord(recordId, token)
                setRecord(updatedRecord)
            } else {
                // Crear
                response = await createProductionRecord(recordData, token)
                const createdRecordId = response?.data?.id || response?.id
                
                if (createdRecordId) {
                    // Cargar el record recién creado
                    const newRecord = await getProductionRecord(createdRecordId, token)
                    setRecord(newRecord)
                    // Actualizar la URL sin recargar la página
                    window.history.pushState({}, '', `/admin/productions/${productionId}/records/${createdRecordId}`)
                }
            }
            
            // Recargar records para actualizar el select de proceso padre
            const recordsResponse = await getProductionRecords(token, { production_id: productionId })
            setExistingRecords(recordsResponse.data || [])
            
        } catch (err) {
            console.error('Error saving record:', err)
            setError(err.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el proceso`)
        } finally {
            setSaving(false)
        }
    }

    const handleRefresh = () => {
        if (record?.id) {
            loadInitialData()
        }
    }

    if (loading) {
        return (
            <div className="h-full w-full overflow-y-auto">
                <div className="p-6 space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        )
    }

    if (error && !record && isEditMode) {
        return (
            <div className="h-full w-full overflow-y-auto">
                <div className="p-6">
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Error
                            </CardTitle>
                            <CardDescription>{error}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => router.push(`/admin/productions/${productionId}`)}>Volver</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    const currentRecordId = record?.id || recordId
    const isCompleted = record?.finished_at !== null
    const isRoot = !record?.parent_record_id && !formData.parent_record_id || formData.parent_record_id === 'none'

    return (
        <div className="h-full w-full overflow-y-auto">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push(`/admin/productions/${productionId}`)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">
                                {isEditMode ? `Proceso #${recordId}` : 'Crear Nuevo Proceso'}
                            </h1>
                            <p className="text-muted-foreground">
                                Producción #{productionId}
                            </p>
                        </div>
                    </div>
                    {isEditMode && record && (
                        <div className="flex items-center gap-2">
                            {isRoot && (
                                <Badge variant="outline">Proceso Raíz</Badge>
                            )}
                            {isCompleted ? (
                                <Badge variant="default" className="bg-green-500">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completado
                                </Badge>
                            ) : (
                                <Badge variant="outline">
                                    <Clock className="h-3 w-3 mr-1" />
                                    En progreso
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                {/* Mensaje de error si existe */}
                {error && (
                    <Card className="border-destructive">
                        <CardContent className="pt-6">
                            <p className="text-sm text-destructive">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Formulario de Información del Proceso */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información del Proceso</CardTitle>
                        <CardDescription>
                            {isEditMode ? 'Edita la información del proceso' : 'Completa la información para crear el proceso'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Proceso</Label>
                                <Popover open={nameOpen} onOpenChange={setNameOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={nameOpen}
                                            className="w-full justify-between"
                                            disabled={saving}
                                        >
                                            {formData.name || "Selecciona o escribe un nombre..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Buscar nombre..." />
                                            <CommandList>
                                                <CommandEmpty>
                                                    <div className="py-2 text-center text-sm">
                                                        <p className="mb-2">No se encontraron nombres.</p>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setNameOpen(false)
                                                            }}
                                                        >
                                                            Usar nombre escrito
                                                        </Button>
                                                    </div>
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {existingRecords
                                                        .filter(record => record?.name && record.name.trim() !== '' && record.id !== currentRecordId)
                                                        .map((record) => (
                                                            <CommandItem
                                                                key={record.id}
                                                                value={record.name}
                                                                onSelect={(currentValue) => {
                                                                    setFormData({ ...formData, name: currentValue })
                                                                    setNameOpen(false)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.name === record.name ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {record.name}
                                                            </CommandItem>
                                                        ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <Input
                                    id="name"
                                    placeholder="O escribe un nombre personalizado"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={saving}
                                    className="mt-2"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Asigna un nombre descriptivo al proceso para identificarlo fácilmente
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="parent_record_id">Proceso Padre (Opcional)</Label>
                                <Select
                                    value={formData.parent_record_id}
                                    onValueChange={(value) => setFormData({ ...formData, parent_record_id: value })}
                                    disabled={saving}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un proceso padre (dejar vacío para proceso raíz)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Ninguno (Proceso raíz)</SelectItem>
                                        {existingRecords
                                            .filter(record => record?.id != null && record.id !== currentRecordId)
                                            .map(record => (
                                                <SelectItem key={record.id} value={record.id.toString()}>
                                                    Proceso #{record.id} {record.process?.name ? `- ${record.process.name}` : ''}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Los procesos raíz consumen cajas directamente de palets. Los procesos hijos consumen salidas de procesos anteriores.
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="process_id">Tipo de Proceso (Opcional)</Label>
                                {processes.length > 0 ? (
                                    <Select
                                        value={formData.process_id}
                                        onValueChange={(value) => setFormData({ ...formData, process_id: value })}
                                        disabled={saving}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un tipo de proceso" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Ninguno</SelectItem>
                                            {processes
                                                .filter(process => process?.id != null)
                                                .map(process => (
                                                    <SelectItem key={process.id} value={process.id.toString()}>
                                                        {process.name || `Proceso #${process.id}`}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        id="process_id"
                                        type="number"
                                        placeholder="ID del tipo de proceso (opcional)"
                                        value={formData.process_id === 'none' ? '' : formData.process_id}
                                        onChange={(e) => setFormData({ ...formData, process_id: e.target.value || 'none' })}
                                        disabled={saving}
                                    />
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {processes.length > 0 
                                        ? 'Selecciona el tipo de proceso desde la lista'
                                        : 'ID del proceso desde la tabla processes (opcional)'}
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notas</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Notas adicionales sobre el proceso"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    disabled={saving}
                                />
                            </div>
                            
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push(`/admin/productions/${productionId}`)}
                                    disabled={saving}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving 
                                        ? (isEditMode ? 'Guardando...' : 'Creando...') 
                                        : (isEditMode ? 'Guardar Cambios' : 'Crear Proceso')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Inputs y Outputs - Solo mostrar si el proceso ya existe o está en modo creación (se mostrarán vacíos hasta crear) */}
                {currentRecordId && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Inputs */}
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle>Entradas de Cajas</CardTitle>
                                <CardDescription>
                                    Cajas consumidas en este proceso
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ProductionInputsManager
                                    productionRecordId={currentRecordId}
                                    onRefresh={handleRefresh}
                                    hideTitle={true}
                                />
                            </CardContent>
                        </Card>

                        {/* Outputs */}
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle>Salidas Lógicas</CardTitle>
                                <CardDescription>
                                    Productos producidos en este proceso
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ProductionOutputsManager
                                    productionRecordId={currentRecordId}
                                    onRefresh={handleRefresh}
                                    hideTitle={true}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Mensaje si aún no se ha creado el proceso */}
                {!currentRecordId && !isEditMode && (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">
                                Crea el proceso primero para poder agregar entradas y salidas
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default ProductionRecordEditor

