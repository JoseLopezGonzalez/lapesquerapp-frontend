'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getProductionRecord, createProductionRecord, updateProductionRecord, getProductionRecords, getProduction } from '@/services/productionService'
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
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react'
import ProductionInputsManager from './ProductionInputsManager'
import ProductionOutputsManager from './ProductionOutputsManager'
import ProductionRecordImagesManager from './ProductionRecordImagesManager'

const ProductionRecordEditor = ({ productionId, recordId = null }) => {
    const { data: session } = useSession()
    const router = useRouter()
    const isEditMode = recordId !== null

    const [processes, setProcesses] = useState([])
    const [existingRecords, setExistingRecords] = useState([])
    const [record, setRecord] = useState(null)
    const [production, setProduction] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const [formData, setFormData] = useState({
        process_id: 'none', // Obligatorio
        parent_record_id: 'none', // Opcional
        notes: ''
    })

    useEffect(() => {
        if (session?.user?.accessToken && productionId) {
            loadInitialData()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.accessToken, productionId, recordId])

    const loadInitialData = async () => {
        try {
            setLoading(true)
            setError(null)
            const token = session.user.accessToken

            // Cargar información de la producción
            try {
                const productionData = await getProduction(productionId, token)
                setProduction(productionData)
            } catch (err) {
                console.warn('Error loading production data:', err)
            }

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
                // El processId viene en camelCase (processId) o dentro de process.id
                const processId = recordData.processId || recordData.process?.id || null
                
                // Verificar que el proceso esté disponible en la lista antes de establecerlo
                // Normalizar los valores para comparar (ambos como string)
                const matchingProcess = processes.find(p => {
                    const pValue = p.value?.toString()
                    const rValue = processId?.toString()
                    return pValue && rValue && pValue === rValue
                })
                
                const finalProcessId = matchingProcess ? matchingProcess.value.toString() : (processId ? processId.toString() : 'none')
                
                // Debug: verificar si el proceso existe
                if (processId && !matchingProcess) {
                    console.warn('Process ID not found in available processes:', {
                        processId,
                        processIdType: typeof processId,
                        availableProcesses: processes.map(p => ({ value: p.value?.toString(), valueType: typeof p.value, label: p.label }))
                    })
                }
                
                setFormData({
                    process_id: finalProcessId,
                    parent_record_id: recordData.parentRecordId ? recordData.parentRecordId.toString() : 'none',
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
                // Los datos vienen como {value, label}
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

            // Validar que process_id sea obligatorio
            if (!formData.process_id || formData.process_id === 'none') {
                setError('El tipo de proceso es obligatorio')
                setSaving(false)
                return
            }

            const recordData = {
                production_id: parseInt(productionId),
                process_id: parseInt(formData.process_id), // Obligatorio
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
    const isCompleted = record?.finishedAt !== null
    const isRoot = !record?.parentRecordId && (!formData.parent_record_id || formData.parent_record_id === 'none')

    return (
        <div className="h-full w-full overflow-y-auto">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="icon"
                            /* size="sm" */
                            onClick={() => router.push(`/admin/productions/${productionId}`)}
                            className="gap-2 -ml-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {/* <span className="hidden sm:inline">Volver</span> */}
                        </Button>
                        <div className="h-6 w-px bg-border" />
                        <div className="space-y-1">
                            <h1 className="text-3xl font-medium">
                                {isEditMode 
                                    ? record?.process?.name || `Proceso #${recordId}`
                                    : 'Crear Nuevo Proceso'}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                {/* <span>Producción #{productionId}</span> */}
                                {production?.lot && (
                                    <>
                                       {/*  <span>•</span> */}
                                        <span>Lote: <span className="font-medium text-foreground">{production.lot}</span></span>
                                    </>
                                )}
                            </div>
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
                <div className="w-full columns-1 lg:columns-2 gap-6 space-y-6">
                    {/* Formulario de Información del Proceso */}
                    <div className="break-inside-avoid mb-6 max-w-full w-full">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Información del Proceso</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    {/* Tipo de Proceso - OBLIGATORIO */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="process_id" className="text-sm">
                                                Tipo de Proceso <span className="text-destructive">*</span>
                                            </Label>

                                        </div>
                                        <div className="flex items-center gap-2">
                                            {processes.length > 0 && (
                                                <Select
                                                    value={formData.process_id !== 'none' ? formData.process_id : undefined}
                                                    onValueChange={(value) => {
                                                        setFormData({ ...formData, process_id: value })
                                                    }}
                                                    disabled={saving}
                                                    required
                                                >
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Selecciona un tipo de proceso">
                                                            {formData.process_id !== 'none' && processes.find(p => p.value?.toString() === formData.process_id)?.label}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {processes
                                                            .filter(process => process?.value != null)
                                                            .map(process => (
                                                                <SelectItem key={process.value} value={process.value.toString()}>
                                                                    {process.label || `Proceso #${process.value}`}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>

                                    </div>

                                    {/* Proceso Padre - OPCIONAL */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="parent_record_id" className="text-sm">Proceso Padre (Opcional)</Label>
                                        <Select
                                            value={formData.parent_record_id}
                                            onValueChange={(value) => setFormData({ ...formData, parent_record_id: value })}
                                            disabled={saving}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Selecciona un proceso padre" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Ninguno (Proceso raíz)</SelectItem>
                                                {existingRecords
                                                    .filter(record => record?.id != null && record.id !== currentRecordId)
                                                    .map(record => (
                                                        <SelectItem key={record.id} value={record.id.toString()}>
                                                            Proceso #{record.id} {record.process?.name ? `- ${record.process.name}` : ''} {record.name ? `(${record.name})` : ''}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="notes" className="text-sm">Notas</Label>
                                        <Textarea
                                            id="notes"
                                            placeholder="Notas adicionales sobre el proceso"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={2}
                                            disabled={saving}
                                            className="resize-none"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-1">
                                        <Button type="submit" disabled={saving} size="sm">
                                            {saving
                                                ? (isEditMode ? 'Guardando...' : 'Creando...')
                                                : (isEditMode ? 'Guardar' : 'Crear')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Inputs y Outputs - Solo mostrar si el proceso ya existe o está en modo creación (se mostrarán vacíos hasta crear) */}
                    {currentRecordId && (
                        <>
                            {/* Imágenes */}
                            <div className="break-inside-avoid mb-6 max-w-full w-full">
                                <ProductionRecordImagesManager
                                    productionRecordId={currentRecordId}
                                    onRefresh={handleRefresh}
                                    hideTitle={true}
                                    renderInCard={true}
                                    cardTitle="Imágenes del Proceso"
                                    cardDescription="Imágenes asociadas a este proceso de producción"
                                />
                            </div>

                            {/* Inputs */}
                            <div className="break-inside-avoid mb-6 max-w-full w-full">
                                <ProductionInputsManager
                                    productionRecordId={currentRecordId}
                                    onRefresh={handleRefresh}
                                    hideTitle={true}
                                    renderInCard={true}
                                    cardTitle="Consumo de Materia prima desde stock"
                                    cardDescription="Materia prima consumida desde el stock en este proceso"
                                />
                            </div>

                            {/* Outputs */}
                            <div className="break-inside-avoid mb-6 max-w-full w-full">
                                <ProductionOutputsManager
                                    productionRecordId={currentRecordId}
                                    onRefresh={handleRefresh}
                                    hideTitle={true}
                                    renderInCard={true}
                                    cardTitle="Salidas Lógicas"
                                    cardDescription="Productos producidos en este proceso"
                                />
                            </div>
                        </>
                    )}

                    {/* Mensaje si aún no se ha creado el proceso */}
                    {!currentRecordId && !isEditMode && (
                        <div className="break-inside-avoid mb-6 max-w-full w-full">
                            <Card>
                                <CardContent className="py-8 text-center">
                                    <p className="text-muted-foreground">
                                        Crea el proceso primero para poder agregar entradas y salidas
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProductionRecordEditor

