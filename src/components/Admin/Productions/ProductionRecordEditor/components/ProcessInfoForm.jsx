'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Info } from 'lucide-react'

/**
 * Formulario de información del proceso
 */
export const ProcessInfoForm = ({
    formData,
    onFormDataChange,
    processes,
    existingRecords,
    currentRecordId,
    isEditMode,
    saving,
    onSubmit
}) => {
    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit()
    }

    return (
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
                                        onFormDataChange({ ...formData, process_id: value })
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
                        <Label htmlFor="parent_record_id" className="text-sm">
                            Proceso Padre (Opcional)
                        </Label>
                        <Select
                            value={formData.parent_record_id}
                            onValueChange={(value) => onFormDataChange({ ...formData, parent_record_id: value })}
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
                                    onChange={(e) => onFormDataChange({ ...formData, started_at: e.target.value })}
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
                                    onChange={(e) => onFormDataChange({ ...formData, finished_at: e.target.value })}
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
                                onChange={(e) => onFormDataChange({ ...formData, started_at: e.target.value })}
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
                            onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
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
    )
}

