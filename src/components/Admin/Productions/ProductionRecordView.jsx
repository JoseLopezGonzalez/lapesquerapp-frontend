'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getProductionRecord } from '@/services/productionService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import ProductionInputsManager from './ProductionInputsManager'
import ProductionOutputsManager from './ProductionOutputsManager'

const ProductionRecordView = ({ productionId, recordId }) => {
    const { data: session } = useSession()
    const router = useRouter()
    const [record, setRecord] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (session?.user?.accessToken && recordId) {
            loadRecord()
        }
    }, [session, recordId])

    const loadRecord = async () => {
        try {
            setLoading(true)
            setError(null)
            const token = session.user.accessToken
            const recordData = await getProductionRecord(recordId, token)
            setRecord(recordData)
        } catch (err) {
            console.error('Error loading record:', err)
            setError(err.message || 'Error al cargar el proceso')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
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

    if (error) {
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

    if (!record) {
        return (
            <div className="h-full w-full overflow-y-auto">
                <div className="p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Proceso no encontrado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => router.push(`/admin/productions/${productionId}`)}>Volver</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    const isCompleted = record.finished_at !== null
    const isRoot = !record.parent_record_id

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
                            <h1 className="text-3xl font-bold">Proceso #{record.id}</h1>
                            <p className="text-muted-foreground">
                                Producción #{productionId}
                            </p>
                        </div>
                    </div>
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
                </div>

                {/* Información General */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información del Proceso</CardTitle>
                        <CardDescription>Datos básicos del proceso</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {record.process && (
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Tipo de Proceso</p>
                                    <p className="text-lg">{record.process.name}</p>
                                </div>
                            )}
                            {record.parent && (
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Proceso Padre</p>
                                    <p className="text-lg">Proceso #{record.parent.id}</p>
                                </div>
                            )}
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Fecha de inicio
                                </p>
                                <p className="text-lg">{formatDate(record.started_at)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Fecha de finalización
                                </p>
                                <p className="text-lg">{formatDate(record.finished_at) || 'Pendiente'}</p>
                            </div>
                            {record.notes && (
                                <div className="space-y-1 md:col-span-2 lg:col-span-3">
                                    <p className="text-sm font-medium text-muted-foreground">Notas</p>
                                    <p className="text-base">{record.notes}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Inputs y Outputs en dos columnas */}
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
                                productionRecordId={recordId}
                                onRefresh={loadRecord}
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
                                productionRecordId={recordId}
                                onRefresh={loadRecord}
                                hideTitle={true}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default ProductionRecordView

