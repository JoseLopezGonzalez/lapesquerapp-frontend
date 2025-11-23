'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { createProductionRecord } from '@/services/productionService'
import { fetchWithTenant } from '@/lib/fetchWithTenant'
import { API_URL_V2 } from '@/configs/config'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

const CreateProductionRecordForm = ({ 
    productionId, 
    existingRecords = [], 
    onSuccess, 
    onCancel,
    mode = 'dialog' // 'dialog' o 'page'
}) => {
    const { data: session } = useSession()
    const router = useRouter()
    const [processes, setProcesses] = useState([])
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        process_id: 'none',
        parent_record_id: 'none',
        notes: ''
    })

    useEffect(() => {
        if (session?.user?.accessToken) {
            loadProcesses()
        }
    }, [session])

    const loadProcesses = async () => {
        try {
            const token = session.user.accessToken
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
            setLoading(true)
            const token = session.user.accessToken
            const recordData = {
                production_id: parseInt(productionId),
                process_id: formData.process_id && formData.process_id !== 'none' ? parseInt(formData.process_id) : null,
                parent_record_id: formData.parent_record_id && formData.parent_record_id !== 'none' ? parseInt(formData.parent_record_id) : null,
                notes: formData.notes || null
            }

            const response = await createProductionRecord(recordData, token)
            
            // Get the created record ID from the response
            const createdRecordId = response?.data?.id || response?.id
            
            // Reset form
            setFormData({ process_id: 'none', parent_record_id: 'none', notes: '' })
            
            // Call success callback with the created record ID
            if (onSuccess) {
                onSuccess(createdRecordId)
            }
            
            // If in page mode, don't redirect - let the parent component handle it
            // The parent will show inputs/outputs in the same page
        } catch (err) {
            console.error('Error creating record:', err)
            alert(err.message || 'Error al crear el proceso')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setFormData({ process_id: 'none', parent_record_id: 'none', notes: '' })
        if (onCancel) {
            onCancel()
        }
        if (mode === 'page') {
            router.back()
        }
    }

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="parent_record_id">Proceso Padre (Opcional)</Label>
                <Select
                    value={formData.parent_record_id}
                    onValueChange={(value) => setFormData({ ...formData, parent_record_id: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona un proceso padre (dejar vacío para proceso raíz)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Ninguno (Proceso raíz)</SelectItem>
                        {existingRecords
                            .filter(record => record?.id != null)
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
                        value={formData.process_id}
                        onChange={(e) => setFormData({ ...formData, process_id: e.target.value })}
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
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Creando...' : 'Crear Proceso'}
                </Button>
            </div>
        </form>
    )

    if (mode === 'page') {
        return (
            <div className="h-full w-full overflow-y-auto">
                <div className="p-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Crear Nuevo Proceso</CardTitle>
                            <CardDescription>
                                Crea un nuevo proceso dentro de la producción #{productionId}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {formContent}
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Dialog mode - retorna solo el contenido, el Dialog wrapper se maneja externamente
    return (
        <>
            <DialogHeader>
                <DialogTitle>Crear Nuevo Proceso</DialogTitle>
                <DialogDescription>
                    Crea un nuevo proceso dentro de esta producción
                </DialogDescription>
            </DialogHeader>
            {formContent}
        </>
    )
}

export default CreateProductionRecordForm

