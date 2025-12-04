'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getProductionRecords, deleteProductionRecord } from '@/services/productionService'
import { formatDateLong, formatWeight } from '@/helpers/production/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, CheckCircle, Clock, Package, ArrowRight } from 'lucide-react'
import Loader from '@/components/Utilities/Loader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { formatInteger, formatDecimal, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers'

const ProductionRecordsManager = ({ productionId, processTree, onRefresh }) => {
    const { data: session } = useSession()
    const router = useRouter()
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [paginationMeta, setPaginationMeta] = useState(null)
    const prevProductionIdRef = useRef(null)

    // Resetear página cuando cambia la producción
    useEffect(() => {
        if (productionId !== prevProductionIdRef.current) {
            setCurrentPage(1)
            prevProductionIdRef.current = productionId
        }
    }, [productionId])

    // Cargar records cuando cambian las dependencias
    useEffect(() => {
        if (session?.user?.accessToken && productionId && currentPage > 0) {
            loadRecords(currentPage)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.accessToken, productionId, currentPage])

    const loadRecords = async (page = 1) => {
        try {
            setLoading(true)
            setError(null)
            const token = session.user.accessToken
            const response = await getProductionRecords(token, { 
                production_id: productionId,
                page: page,
                per_page: 15
            })
            setRecords(response.data || [])
            
            // Guardar información de paginación
            if (response.meta) {
                setPaginationMeta({
                    currentPage: response.meta.current_page,
                    totalPages: response.meta.last_page,
                    totalItems: response.meta.total,
                    perPage: response.meta.per_page,
                    from: response.meta.from,
                    to: response.meta.to
                })
            }
        } catch (err) {
            console.error('Error loading records:', err)
            setError(err.message || 'Error al cargar los procesos')
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (newPage) => {
        if (newPage > 0 && paginationMeta && newPage <= paginationMeta.totalPages) {
            setCurrentPage(newPage)
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
            loadRecords(currentPage)
            if (onRefresh) onRefresh()
        } catch (err) {
            console.error('Error deleting record:', err)
            alert(err.message || 'Error al eliminar el proceso')
        }
    }

    const getRootRecords = () => {
        return records.filter(r => !r.parentRecordId)
    }

    const getChildRecords = (parentId) => {
        return records.filter(r => r.parentRecordId === parentId)
    }

    const renderRecordRow = (record, level = 0) => {
        const children = getChildRecords(record.id)
        const isCompleted = record.isCompleted || record.finishedAt !== null
        const isRoot = record.isRoot || !record.parentRecordId

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
                        {record.startedAt ? formatDateLong(record.startedAt) : (
                            <span className="text-muted-foreground">N/A</span>
                        )}
                    </TableCell>
                    <TableCell>
                        {record.finishedAt ? formatDateLong(record.finishedAt) : (
                            <span className="text-muted-foreground">Pendiente</span>
                        )}
                    </TableCell>
                    <TableCell>
                        {record.totalInputWeight !== undefined && record.totalInputWeight !== null ? (
                            <span className="text-sm">{formatWeight(record.totalInputWeight)}</span>
                        ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                        )}
                    </TableCell>
                    <TableCell>
                        {record.totalOutputWeight !== undefined && record.totalOutputWeight !== null ? (
                            <span className="text-sm">{formatWeight(record.totalOutputWeight)}</span>
                        ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                        )}
                    </TableCell>
                    <TableCell>
                        {record.waste !== undefined && record.waste !== null && record.waste > 0 ? (
                            <div className="text-sm">
                                <div className="font-medium text-destructive">
                                    -{formatDecimalWeight(record.waste)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    -{formatDecimal(record.wastePercentage || 0)}%
                                </div>
                            </div>
                        ) : record.yield !== undefined && record.yield !== null && record.yield > 0 ? (
                            <div className="text-sm">
                                <div className="font-medium text-green-600">
                                    +{formatDecimalWeight(record.yield)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    +{formatDecimal(record.yieldPercentage || 0)}%
                                </div>
                            </div>
                        ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                        )}
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
                        <div className="flex items-center justify-center gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => router.push(`/admin/productions/${productionId}/records/${record.id}`)}
                                            >
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Ver detalles del proceso</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDeleteRecord(record.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Eliminar proceso</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
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

            {rootRecords.length === 0 && !loading ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">
                            No hay procesos registrados. Crea el primer proceso para comenzar.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Tipo de Proceso</TableHead>
                                        <TableHead>Fecha Inicio</TableHead>
                                        <TableHead>Fecha Fin</TableHead>
                                        <TableHead>Entrada</TableHead>
                                        <TableHead>Salida</TableHead>
                                        <TableHead>Merma / Rendimiento</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-center">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rootRecords.map(record => renderRecordRow(record))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Paginación y Resumen */}
                    {paginationMeta && paginationMeta.totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                            {/* Resumen de resultados */}
                            <div className="text-sm text-muted-foreground">
                                {loading ? (
                                    <span>Cargando...</span>
                                ) : (
                                    <span>
                                        Mostrando <span className="font-semibold text-foreground">
                                            {paginationMeta.from || 0}
                                        </span> - <span className="font-semibold text-foreground">
                                            {paginationMeta.to || 0}
                                        </span> de <span className="font-semibold text-foreground">
                                            {formatInteger(paginationMeta.totalItems)}
                                        </span> resultados
                                    </span>
                                )}
                            </div>

                            {/* Controles de paginación */}
                            <Pagination className="w-auto">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                handlePageChange(currentPage - 1)
                                            }}
                                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                        />
                                    </PaginationItem>

                                    {/* Primera página si está lejos de la actual */}
                                    {currentPage > 3 && (
                                        <>
                                            <PaginationItem>
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        handlePageChange(1)
                                                    }}
                                                >
                                                    1
                                                </PaginationLink>
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        </>
                                    )}

                                    {/* Páginas visibles */}
                                    {(() => {
                                        const maxPagesToShow = 5
                                        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
                                        let endPage = Math.min(paginationMeta.totalPages, startPage + maxPagesToShow - 1)
                                        
                                        if (endPage - startPage < maxPagesToShow - 1) {
                                            startPage = Math.max(1, endPage - maxPagesToShow + 1)
                                        }

                                        const pages = []
                                        for (let i = startPage; i <= endPage; i++) {
                                            pages.push(i)
                                        }

                                        return pages.map((page) => (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        handlePageChange(page)
                                                    }}
                                                    isActive={page === currentPage}
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))
                                    })()}

                                    {/* Última página si está lejos de la actual */}
                                    {currentPage < paginationMeta.totalPages - 2 && (
                                        <>
                                            <PaginationItem>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        handlePageChange(paginationMeta.totalPages)
                                                    }}
                                                >
                                                    {paginationMeta.totalPages}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </>
                                    )}

                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                handlePageChange(currentPage + 1)
                                            }}
                                            className={currentPage === paginationMeta.totalPages ? 'pointer-events-none opacity-50' : ''}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}

                    {/* Resumen cuando hay solo una página o pocos resultados */}
                    {paginationMeta && paginationMeta.totalPages <= 1 && (
                        <div className="text-sm text-muted-foreground pt-2">
                            {loading ? (
                                <span>Cargando...</span>
                            ) : (
                                <span>
                                    <span className="font-semibold text-foreground">
                                        {formatInteger(paginationMeta.totalItems)}
                                    </span> resultado{paginationMeta.totalItems !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default ProductionRecordsManager

