'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/datePicker'
import { dateToYmdLocalString, ymdLocalStringToDate } from '@/helpers/production/dateFormatters'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Info, Loader2, Plus, Save } from 'lucide-react'

/**
 * Formulario de información del proceso
 * @param {'card'|'embedded'} layout — `embedded` omite la Card (p. ej. dentro de un Dialog)
 */
export const ProcessInfoForm = ({
    formData,
    onFormDataChange,
    processes,
    existingRecords,
    currentRecordId,
    isEditMode,
    saving,
    onSubmit,
    /** false mientras el formulario coincide con la última línea base (servidor o vacío en alta). */
    isFormDirty = true,
    layout = 'card',
    /** Si el `process_id` del registro no viene en la lista de opciones, mostrar este nombre (p. ej. `record.process.name`). */
    processLabelFallback = ''
}) => {
    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit()
    }

    const processTypeOptions = useMemo(() => {
        const list = Array.isArray(processes) ? processes : []
        const rows = list
            .map((p) => {
                const v = p.value ?? p.id
                if (v == null) return null
                const valueStr = String(v)
                const label = (p.label ?? p.name ?? '').trim() || `Proceso #${valueStr}`
                return { valueStr, label, key: valueStr }
            })
            .filter(Boolean)

        const pid = formData.process_id
        if (pid && pid !== 'none' && !rows.some((r) => r.valueStr === String(pid))) {
            const fallback = processLabelFallback?.trim() || `Proceso #${pid}`
            rows.push({ valueStr: String(pid), label: fallback, key: `orphan-${pid}` })
        }

        return rows
    }, [processes, formData.process_id, processLabelFallback])

    const formInner = (
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Tipo de Proceso - OBLIGATORIO */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="process_id" className="text-sm">
                                Tipo de Proceso <span className="text-destructive">*</span>
                            </Label>
                        </div>
                        <div className="flex min-w-0 max-w-full items-center gap-2">
                            {processTypeOptions.length > 0 ? (
                                <Select
                                    value={formData.process_id !== 'none' ? formData.process_id : undefined}
                                    onValueChange={(value) => {
                                        onFormDataChange({ ...formData, process_id: value })
                                    }}
                                    disabled={saving}
                                    required
                                >
                                    <SelectTrigger className="h-9 w-full min-w-0 max-w-full">
                                        <SelectValue placeholder="Selecciona un tipo de proceso" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {processTypeOptions.map((process) => (
                                            <SelectItem key={process.key} value={process.valueStr}>
                                                {process.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="flex h-9 w-full min-w-0 items-center rounded-lg border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                                    {formData.process_id !== 'none'
                                        ? processLabelFallback?.trim() || `Proceso #${formData.process_id}`
                                        : 'Cargando tipos de proceso...'}
                                </div>
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
                                {existingRecords && existingRecords.length > 0 ? (
                                    existingRecords
                                        .filter(record => {
                                            // La API retorna 'value' en lugar de 'id'
                                            const recordId = record?.value ?? record?.id
                                            // Comparar como strings para evitar problemas de tipo
                                            return recordId != null && String(recordId) !== String(currentRecordId)
                                        })
                                        .map(record => {
                                            // La API retorna 'value' y 'label' directamente
                                            const recordId = record?.value ?? record?.id
                                            const label = record?.label || `Proceso #${recordId}`
                                            
                                            return (
                                                <SelectItem key={recordId} value={String(recordId)}>
                                                    {label}
                                                </SelectItem>
                                            )
                                        })
                                ) : (
                                    <SelectItem value="no-records" disabled>
                                        No hay procesos disponibles
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Fechas de Inicio y Finalización */}
                    {isEditMode ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="started_at" className="text-sm">Fecha de Inicio</Label>
                                <DatePicker
                                    id="started_at"
                                    formatStyle="short"
                                    disabled={saving}
                                    date={ymdLocalStringToDate(formData.started_at)}
                                    onChange={(d) =>
                                        onFormDataChange({
                                            ...formData,
                                            started_at: dateToYmdLocalString(d),
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="finished_at" className="text-sm">Fecha de Finalización</Label>
                                <DatePicker
                                    id="finished_at"
                                    formatStyle="short"
                                    disabled={saving}
                                    date={ymdLocalStringToDate(formData.finished_at)}
                                    onChange={(d) =>
                                        onFormDataChange({
                                            ...formData,
                                            finished_at: dateToYmdLocalString(d),
                                        })
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <Label htmlFor="started_at" className="text-sm">Fecha de Inicio</Label>
                            <DatePicker
                                id="started_at"
                                formatStyle="short"
                                disabled={saving}
                                date={ymdLocalStringToDate(formData.started_at)}
                                onChange={(d) =>
                                    onFormDataChange({
                                        ...formData,
                                        started_at: dateToYmdLocalString(d),
                                    })
                                }
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
                        <Button type="submit" disabled={saving || !isFormDirty} data-icon="inline-start">
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    {isEditMode ? 'Guardando...' : 'Creando...'}
                                </>
                            ) : (
                                <>
                                    {isEditMode ? <Save /> : <Plus />}
                                    {isEditMode ? 'Guardar' : 'Crear'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
    )

    if (layout === 'embedded') {
        return formInner
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
                {formInner}
            </CardContent>
        </Card>
    )
}
