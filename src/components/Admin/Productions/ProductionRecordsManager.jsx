'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getProductionRecords, deleteProductionRecord, finishProductionRecord } from '@/services/productionService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, CheckCircle, Clock, ChevronDown, ChevronRight, Eye } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import ProductionInputsManager from './ProductionInputsManager'
import ProductionOutputsManager from './ProductionOutputsManager'
import { useRouter } from 'next/navigation'

const ProductionRecordsManager = ({ productionId, processTree, onRefresh }) => {
    const { data: session } = useSession()
    const router = useRouter()
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [expandedRecords, setExpandedRecords] = useState({})

    useEffect(() => {
        if (session?.user?.accessToken && productionId) {
            loadRecords()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.accessToken, productionId])

    const loadRecords = async () => {
        try {
            setLoading(true)
            setError(null)
            const token = session.user.accessToken
            const response = await getProductionRecords(token, { production_id: productionId })
            setRecords(response.data || [])
        } catch (err) {
            console.error('Error loading records:', err)
            setError(err.message || 'Error al cargar los procesos')
        } finally {
            setLoading(false)
        }
    }

    const handleNavigateToCreate = () => {
        router.push(`/admin/productions/${productionId}/records/create`)
    }

    const handleDeleteRecord = async (recordId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este proceso?')) {
            return
        }

        try {
            const token = session.user.accessToken
            await deleteProductionRecord(recordId, token)
            loadRecords()
            if (onRefresh) onRefresh()
        } catch (err) {
            console.error('Error deleting record:', err)
            alert(err.message || 'Error al eliminar el proceso')
        }
    }

    const handleFinishRecord = async (recordId) => {
        try {
            const token = session.user.accessToken
            await finishProductionRecord(recordId, token)
            loadRecords()
            if (onRefresh) onRefresh()
        } catch (err) {
            console.error('Error finishing record:', err)
            alert(err.message || 'Error al finalizar el proceso')
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getRootRecords = () => {
        return records.filter(r => !r.parent_record_id)
    }

    const getChildRecords = (parentId) => {
        return records.filter(r => r.parent_record_id === parentId)
    }

    const toggleRecordExpansion = (recordId) => {
        setExpandedRecords(prev => ({
            ...prev,
            [recordId]: !prev[recordId]
        }))
    }

    const renderRecordTree = (record, level = 0) => {
        const children = getChildRecords(record.id)
        const isCompleted = record.finished_at !== null
        const isRoot = !record.parent_record_id
        const isExpanded = expandedRecords[record.id]

        return (
            <div key={record.id} className={`${level > 0 ? 'ml-8 mt-2 border-l-2 pl-4' : ''}`}>
                <Card className="mb-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Collapsible open={isExpanded} onOpenChange={() => toggleRecordExpansion(record.id)}>
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </CollapsibleTrigger>
                                    </Collapsible>
                                    <CardTitle className="text-lg">
                                        Proceso #{record.id}
                                    </CardTitle>
                                    {isRoot && (
                                        <Badge variant="outline">Raíz</Badge>
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
                                {record.process && (
                                    <p className="text-sm text-muted-foreground">
                                        Tipo: {record.process.name}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/admin/productions/${productionId}/records/${record.id}`)}
                                >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver Detalle
                                </Button>
                                {!isCompleted && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleFinishRecord(record.id)}
                                    >
                                        Finalizar
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteRecord(record.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-muted-foreground">Inicio:</p>
                                    <p className="font-medium">{formatDate(record.started_at)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Fin:</p>
                                    <p className="font-medium">{formatDate(record.finished_at) || 'Pendiente'}</p>
                                </div>
                            </div>
                            {record.notes && (
                                <div>
                                    <p className="text-muted-foreground">Notas:</p>
                                    <p>{record.notes}</p>
                                </div>
                            )}
                            {record.inputs_count !== undefined && (
                                <div>
                                    <p className="text-muted-foreground">Entradas: {record.inputs_count || 0} cajas</p>
                                </div>
                            )}
                            {record.outputs_count !== undefined && (
                                <div>
                                    <p className="text-muted-foreground">Salidas: {record.outputs_count || 0} registros</p>
                                </div>
                            )}
                        </div>

                        {/* Inputs y Outputs expandidos */}
                        {isExpanded && (
                            <div className="mt-4 pt-4 border-t space-y-4">
                                <ProductionInputsManager
                                    productionRecordId={record.id}
                                    onRefresh={() => {
                                        loadRecords()
                                        if (onRefresh) onRefresh()
                                    }}
                                />
                                <ProductionOutputsManager
                                    productionRecordId={record.id}
                                    onRefresh={() => {
                                        loadRecords()
                                        if (onRefresh) onRefresh()
                                    }}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
                {children.map(child => renderRecordTree(child, level + 1))}
            </div>
        )
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

    const rootRecords = getRootRecords()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold">Procesos de Producción</h3>
                    <p className="text-sm text-muted-foreground">
                        Gestiona los procesos dentro del lote de producción
                    </p>
                </div>
                <Button onClick={handleNavigateToCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Proceso
                </Button>
            </div>

            {rootRecords.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">
                            No hay procesos registrados. Crea el primer proceso para comenzar.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {rootRecords.map(record => renderRecordTree(record))}
                </div>
            )}
        </div>
    )
}

export default ProductionRecordsManager

