'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getProductionRecords, deleteProductionRecord, finishProductionRecord } from '@/services/productionService'
import { formatDateLong } from '@/helpers/production/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, CheckCircle, Clock, ChevronRight, Package, Scale } from 'lucide-react'
import Loader from '@/components/Utilities/Loader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRouter } from 'next/navigation'

const ProductionRecordsManager = ({ productionId, processTree, onRefresh }) => {
    const { data: session } = useSession()
    const router = useRouter()
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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


    const getRootRecords = () => {
        return records.filter(r => !r.parent_record_id)
    }

    const getChildRecords = (parentId) => {
        return records.filter(r => r.parent_record_id === parentId)
    }

    const renderRecordRow = (record, level = 0) => {
        const children = getChildRecords(record.id)
        const isCompleted = record.finished_at !== null
        const isRoot = !record.parent_record_id

        return (
            <React.Fragment key={record.id}>
                <TableRow className={level > 0 ? 'bg-muted/30' : ''}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            {level > 0 && <span className="text-muted-foreground">└─</span>}
                            <span>#{record.id}</span>
                            {isRoot && (
                                <Badge variant="outline" className="text-xs">Raíz</Badge>
                            )}
                        </div>
                    </TableCell>
                    <TableCell>
                        {record.process?.name || 'Sin tipo'}
                    </TableCell>
                    <TableCell>
                        {formatDateLong(record.started_at)}
                    </TableCell>
                    <TableCell>
                        {record.finished_at ? formatDateLong(record.finished_at) : (
                            <span className="text-muted-foreground">Pendiente</span>
                        )}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            {record.inputs_count !== undefined && (
                                <div className="flex items-center gap-1 text-sm">
                                    <Package className="h-3 w-3 text-muted-foreground" />
                                    <span>{record.inputs_count || 0}</span>
                                </div>
                            )}
                            {record.outputs_count !== undefined && (
                                <div className="flex items-center gap-1 text-sm">
                                    <Scale className="h-3 w-3 text-muted-foreground" />
                                    <span>{record.outputs_count || 0}</span>
                                </div>
                            )}
                        </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => router.push(`/admin/productions/${productionId}/records/${record.id}`)}
                            >
                                <ChevronRight className="h-4 w-4" />
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
                    </TableCell>
                </TableRow>
                {children.map(child => renderRecordRow(child, level + 1))}
            </React.Fragment>
        )
    }

    if (loading) {
        return (
            <div className="space-y-4 flex items-center justify-center py-12">
                <Loader />
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
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Tipo de Proceso</TableHead>
                                    <TableHead>Fecha Inicio</TableHead>
                                    <TableHead>Fecha Fin</TableHead>
                                    <TableHead>Entradas/Salidas</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rootRecords.map(record => renderRecordRow(record))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default ProductionRecordsManager

