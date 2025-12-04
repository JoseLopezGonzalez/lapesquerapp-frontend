'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProductionRecord } from '@/hooks/useProductionRecord'
import { formatDateLong } from '@/helpers/production/formatters'
import { formatDecimal, formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import Loader from '@/components/Utilities/Loader'
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Info, Package, ArrowDown, Image as ImageIcon, Calculator, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import ProductionInputsManager from './ProductionInputsManager'
import ProductionOutputsManager from './ProductionOutputsManager'
import ProductionOutputConsumptionsManager from './ProductionOutputConsumptionsManager'
import ProductionRecordImagesManager from './ProductionRecordImagesManager'

const ProductionRecordEditor = ({ productionId, recordId = null }) => {
    const router = useRouter()
    
    const {
        record,
        production,
        processes,
        existingRecords,
        loading,
        saving,
        error,
        isEditMode,
        saveRecord,
        refresh
    } = useProductionRecord(productionId, recordId)

    const [formData, setFormData] = useState({
        process_id: 'none',
        parent_record_id: 'none',
        notes: '',
        started_at: ''
    })

    // Inicializar formulario cuando se carga el record
    useEffect(() => {
        if (record && isEditMode) {
            const processId = record.processId || record.process?.id || null
            const matchingProcess = processes.find(p => {
                const pValue = p.value?.toString()
                const rValue = processId?.toString()
                return pValue && rValue && pValue === rValue
            })
            
            const finalProcessId = matchingProcess 
                ? matchingProcess.value.toString() 
                : (processId ? processId.toString() : 'none')
            
            // Convertir started_at de ISO a formato datetime-local
            let startedAtFormatted = ''
            if (record.startedAt) {
                const date = new Date(record.startedAt)
                // Formato: YYYY-MM-DDTHH:mm
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const day = String(date.getDate()).padStart(2, '0')
                const hours = String(date.getHours()).padStart(2, '0')
                const minutes = String(date.getMinutes()).padStart(2, '0')
                startedAtFormatted = `${year}-${month}-${day}T${hours}:${minutes}`
            }
            
            // Convertir finished_at de ISO a formato datetime-local
            let finishedAtFormatted = ''
            if (record.finishedAt) {
                const date = new Date(record.finishedAt)
                // Formato: YYYY-MM-DDTHH:mm
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const day = String(date.getDate()).padStart(2, '0')
                const hours = String(date.getHours()).padStart(2, '0')
                const minutes = String(date.getMinutes()).padStart(2, '0')
                finishedAtFormatted = `${year}-${month}-${day}T${hours}:${minutes}`
            }
            
            setFormData({
                process_id: finalProcessId,
                parent_record_id: record.parentRecordId ? record.parentRecordId.toString() : 'none',
                notes: record.notes || '',
                started_at: startedAtFormatted,
                finished_at: finishedAtFormatted
            })
        }
    }, [record, processes, isEditMode])

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await saveRecord(formData)
            
            // Si es creación, actualizar la URL
            if (!isEditMode && record?.id) {
                window.history.pushState({}, '', `/admin/productions/${productionId}/records/${record.id}`)
            }
        } catch (err) {
            // El error ya está manejado en el hook
            console.error('Error saving record:', err)
        }
    }

    const handleRefresh = () => {
        refresh()
    }

    if (loading) {
        return (
            <div className="h-full w-full overflow-y-auto flex items-center justify-center">
                <Loader />
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
                                {production?.lot && (
                                    <span>Lote: <span className="font-medium text-foreground">{production.lot}</span></span>
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
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Info className="h-5 w-5 text-primary" />
                                    Información del Proceso
                                </CardTitle>
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

                                    {/* Fechas de Inicio y Finalización */}
                                    {isEditMode ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="started_at" className="text-sm">Fecha de Inicio</Label>
                                                <Input
                                                    id="started_at"
                                                    type="datetime-local"
                                                    value={formData.started_at}
                                                    onChange={(e) => setFormData({ ...formData, started_at: e.target.value })}
                                                    disabled={saving}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="finished_at" className="text-sm">Fecha de Finalización</Label>
                                                <Input
                                                    id="finished_at"
                                                    type="datetime-local"
                                                    value={formData.finished_at || ''}
                                                    onChange={(e) => setFormData({ ...formData, finished_at: e.target.value })}
                                                    disabled={saving}
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <Label htmlFor="started_at" className="text-sm">Fecha de Inicio</Label>
                                            <Input
                                                id="started_at"
                                                type="datetime-local"
                                                value={formData.started_at}
                                                onChange={(e) => setFormData({ ...formData, started_at: e.target.value })}
                                                disabled={saving}
                                                className="h-9"
                                            />
                                        </div>
                                    )}

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

                    {/* Resumen del Proceso - Solo mostrar si el proceso ya existe y tiene datos */}
                    {currentRecordId && record && (record.totalInputWeight !== undefined || record.totalOutputWeight !== undefined) && (
                        <div className="break-inside-avoid mb-6 max-w-full w-full">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Calculator className="h-5 w-5 text-primary" />
                                        Resumen del Proceso
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                                <Package className="h-3 w-3" />
                                                Cajas entrada
                                            </p>
                                            <p className="text-lg font-bold">{formatInteger(record.totalInputBoxes || 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                                <Scale className="h-3 w-3" />
                                                Peso entrada
                                            </p>
                                            <p className="text-lg font-bold">{formatDecimalWeight(record.totalInputWeight || 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                                <Package className="h-3 w-3" />
                                                Cajas salida
                                            </p>
                                            <p className="text-lg font-bold">{formatInteger(record.totalOutputBoxes || 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                                <Scale className="h-3 w-3" />
                                                Peso salida
                                            </p>
                                            <p className="text-lg font-bold">{formatDecimalWeight(record.totalOutputWeight || 0)}</p>
                                        </div>
                                        {(record.waste !== undefined && record.waste > 0) || (record.yield !== undefined && record.yield > 0) ? (
                                            <div className={record.waste > 0 ? "bg-destructive/10 border border-destructive/20 rounded-lg p-2" : "bg-green-500/10 border border-green-500/20 rounded-lg p-2"}>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    {record.waste > 0 ? (
                                                        <TrendingDown className="h-3 w-3 text-destructive" />
                                                    ) : (
                                                        <TrendingUp className="h-3 w-3 text-green-600" />
                                                    )}
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        {record.waste > 0 ? 'Merma' : 'Rendimiento'}
                                                    </p>
                                                </div>
                                                <p className="text-base font-bold">
                                                    {record.waste > 0 
                                                        ? formatDecimalWeight(record.waste)
                                                        : formatDecimalWeight(record.yield)
                                                    }
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {record.waste > 0 
                                                        ? `${formatDecimal(record.wastePercentage || 0)}%`
                                                        : `${formatDecimal(record.yieldPercentage || 0)}%`
                                                    }
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="bg-muted/30 border border-dashed rounded-lg p-2 flex items-center justify-center">
                                                <p className="text-xs text-muted-foreground">Sin datos</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

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
                                    cardTitle="Consumo de materia prima desde stock"
                                    cardDescription="Materia prima consumida desde el stock"
                                />
                            </div>

                            {/* Consumos del Padre */}
                            <div className="break-inside-avoid mb-6 max-w-full w-full">
                                <ProductionOutputConsumptionsManager
                                    productionRecordId={currentRecordId}
                                    onRefresh={handleRefresh}
                                    hideTitle={true}
                                    renderInCard={true}
                                    cardTitle="Consumos de proceso anterior"
                                    cardDescription="Productos consumidos del proceso anterior"
                                />
                            </div>

                            {/* Outputs */}
                            <div className="break-inside-avoid mb-6 max-w-full w-full">
                                <ProductionOutputsManager
                                    productionRecordId={currentRecordId}
                                    onRefresh={handleRefresh}
                                    hideTitle={true}
                                    renderInCard={true}
                                    cardTitle="Productos resultantes"
                                    cardDescription="Productos resultantes de este proceso"
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

