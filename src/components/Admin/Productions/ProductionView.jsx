'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getProduction, getProductionProcessTree, getProductionTotals } from '@/services/productionService'
import { formatDateLong, formatWeight } from '@/helpers/production/formatters'
import { formatDecimal, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Loader from '@/components/Utilities/Loader'
import { ArrowLeft, Calendar, Package, Scale, AlertCircle, Info, Calculator, TrendingDown, TrendingUp, Fish, MapPin, FileText, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import ProductionRecordsManager from './ProductionRecordsManager'
import ProductionDiagram, { ViewModeSelector } from './ProductionDiagram'

const ProductionView = ({ productionId }) => {
    const { data: session } = useSession()
    const router = useRouter()
    const [production, setProduction] = useState(null)
    const [processTree, setProcessTree] = useState(null)
    const [totals, setTotals] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [viewMode, setViewMode] = useState('simple')

    useEffect(() => {
        if (session?.user?.accessToken && productionId) {
            loadProductionData()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.accessToken, productionId])

    const loadProductionData = async () => {
        try {
            setLoading(true)
            setError(null)

            const token = session.user.accessToken

            // Cargar datos en paralelo
            const [productionData, treeData, totalsData] = await Promise.all([
                getProduction(productionId, token),
                getProductionProcessTree(productionId, token).catch((err) => {
                    console.error('Error al cargar processTree:', err)
                    // Si es un error 500, probablemente es un problema del backend con los nodos de venta/stock
                    if (err.message && err.message.includes('500')) {
                        console.error('Error 500 del backend - posible problema con formato de fechas en nodos de venta/stock')
                    }
                    return null
                }),
                getProductionTotals(productionId, token).catch(() => null)
            ])

            console.log('ProductionView - processTree cargado:', treeData)
            setProduction(productionData)
            setProcessTree(treeData)
            setTotals(totalsData)
        } catch (err) {
            console.error('Error loading production data:', err)
            setError(err.message || 'Error al cargar los datos de la producción')
        } finally {
            setLoading(false)
        }
    }


    if (loading) {
        return (
            <div className="h-full w-full overflow-y-auto flex items-center justify-center">
                <Loader />
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
                            <Button onClick={() => router.back()}>Volver</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (!production) {
        return (
            <div className="h-full w-full overflow-y-auto">
                <div className="p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Producción no encontrada</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => router.back()}>Volver</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    const isOpen = production.openedAt && !production.closedAt
    const isClosed = production.closedAt

    return (
        <div className="h-full w-full overflow-y-auto">
            <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Producción #{production.id}</h1>
                        <p className="text-sm text-muted-foreground">
                            Lote: {production.lot || 'Sin lote'}
                        </p>
                    </div>
                </div>
                <Badge
                    variant={isOpen ? 'default' : 'secondary'}
                    className={isOpen ? 'bg-green-500' : ''}
                >
                    {isOpen ? 'Abierto' : isClosed ? 'Cerrado' : 'Sin estado'}
                </Badge>
            </div>

            {/* Cards en fila para pantallas grandes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* Información General */}
            <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Info className="h-4 w-4 text-primary" />
                            Información General
                        </CardTitle>
                </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-4">
                            {/* Especie */}
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-muted p-2 flex-shrink-0">
                                    <Fish className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-1">Especie</p>
                                    <p className="text-sm font-semibold">{production.species?.name || 'No especificada'}</p>
                                </div>
                            </div>

                            {/* Zona de Captura */}
                            {production.captureZone && (
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-muted p-2 flex-shrink-0">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground mb-1">Zona de Captura</p>
                                        <p className="text-sm font-semibold">{production.captureZone?.name || 'No especificada'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Fechas */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-muted p-2 flex-shrink-0">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground mb-1">Apertura</p>
                                        <p className="text-sm font-semibold">{formatDateLong(production.openedAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-muted p-2 flex-shrink-0">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground mb-1">Cierre</p>
                                        <p className={`text-sm font-semibold ${production.closedAt ? '' : 'text-muted-foreground'}`}>
                                            {formatDateLong(production.closedAt) || 'No cerrado'}
                                        </p>
                        </div>
                        </div>
                        </div>

                            {/* Notas */}
                        {production.notes && (
                                <div className="pt-2 border-t">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-muted p-2 flex-shrink-0">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-muted-foreground mb-1.5">Notas</p>
                                            <p className="text-sm leading-relaxed">{production.notes}</p>
                                        </div>
                                    </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Totales */}
            {totals && (
                <Card className="h-auto">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calculator className="h-4 w-4 text-primary" />
                                Totales
                            </CardTitle>
                    </CardHeader>
                        <CardContent className="pt-0">
                            <div className="grid grid-cols-3 gap-0">
                                {/* Entrada */}
                                <div className="space-y-1.5 pr-3 border-r">
                                    <div className="flex items-center gap-1.5">
                                        <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground rotate-180" />
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entrada</p>
                            </div>
                                <div>
                                        <p className="text-lg font-bold leading-tight">{formatWeight(totals.totalInputWeight)}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{totals.totalInputBoxes || 0} cajas</p>
                                    </div>
                            </div>

                                {/* Salida */}
                                <div className="space-y-1.5 px-3 border-r">
                                    <div className="flex items-center gap-1.5">
                                        <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Salida</p>
                            </div>
                                <div>
                                        <p className="text-lg font-bold leading-tight">{formatWeight(totals.totalOutputWeight)}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{totals.totalOutputBoxes || 0} cajas</p>
                                    </div>
                                </div>

                                {/* Merma o Rendimiento */}
                                {(production.waste !== undefined && production.waste > 0) || (production.yield !== undefined && production.yield > 0) ? (
                                    <div className="space-y-1.5 pl-3">
                                        <div className="flex items-center gap-1.5">
                                            {production.waste > 0 ? (
                                                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                                            ) : (
                                                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                                            )}
                                            <p className={`text-xs font-semibold uppercase tracking-wide ${production.waste > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                                {production.waste > 0 ? 'Merma' : 'Rendimiento'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className={`text-lg font-bold leading-tight ${production.waste > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                                {production.waste > 0 
                                                    ? `-${formatDecimalWeight(production.waste)}`
                                                    : `+${formatDecimalWeight(production.yield)}`
                                                }
                                            </p>
                                            <p className={`text-xs mt-0.5 ${production.waste > 0 ? 'text-destructive/80' : 'text-green-600/80'}`}>
                                                {production.waste > 0 
                                                    ? `-${formatDecimal(production.wastePercentage || 0)}%`
                                                    : `+${formatDecimal(production.yieldPercentage || 0)}%`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 pl-3">
                                        <div className="flex items-center gap-1.5">
                                            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rendimiento</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold leading-tight text-muted-foreground">-</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">-</p>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </CardContent>
                </Card>
            )}

            </div>

            {/* Conciliación General */}
            {production.reconciliation && (
                <Card className={`border-2 ${
                    production.reconciliation.summary?.overallStatus === 'error' 
                        ? 'border-destructive' 
                        : production.reconciliation.summary?.overallStatus === 'warning'
                        ? 'border-yellow-500'
                        : 'border-green-500'
                }`}>
                    <CardHeader className="pb-2 pt-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                                {production.reconciliation.summary?.overallStatus === 'error' ? (
                                    <XCircle className="h-4 w-4 text-destructive" />
                                ) : production.reconciliation.summary?.overallStatus === 'warning' ? (
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                                Conciliación General
                            </CardTitle>
                            <Badge 
                                variant={
                                    production.reconciliation.summary?.overallStatus === 'error' 
                                        ? 'destructive' 
                                        : production.reconciliation.summary?.overallStatus === 'warning'
                                        ? 'secondary'
                                        : 'default'
                                }
                                className={`text-xs ${
                                    production.reconciliation.summary?.overallStatus === 'error' 
                                        ? 'bg-destructive' 
                                        : production.reconciliation.summary?.overallStatus === 'warning'
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                }`}
                            >
                                {production.reconciliation.summary?.overallStatus === 'error' 
                                    ? 'Error' 
                                    : production.reconciliation.summary?.overallStatus === 'warning'
                                    ? 'Advertencia'
                                    : 'OK'
                                }
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {/* Resumen compacto */}
                        {production.reconciliation.summary && (
                            <div className="mb-3 px-3 py-2 rounded-md bg-muted/50">
                                <div className="grid grid-cols-2 md:grid-cols-7 gap-x-4 gap-y-1 text-xs">
                                    <div>
                                        <p className="text-muted-foreground text-[10px] mb-0.5">Productos</p>
                                        <p className="font-semibold text-xs">
                                            {production.reconciliation.summary.totalProducts || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] mb-0.5">Producido</p>
                                        <p className="font-semibold text-xs">
                                            {formatWeight(production.reconciliation.summary.totalProducedWeight || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] mb-0.5">Registrado</p>
                                        <p className="font-semibold text-xs">
                                            {formatWeight(production.reconciliation.summary.totalContabilizedWeight || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] mb-0.5">Balance</p>
                                        <p className={`font-semibold text-xs ${
                                            (production.reconciliation.summary.totalBalanceWeight || 0) !== 0
                                                ? 'text-destructive'
                                                : 'text-green-600'
                                        }`}>
                                            {formatWeight(Math.abs(production.reconciliation.summary.totalBalanceWeight || 0))}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-muted-foreground text-[10px] mb-0.5">✓ Correctos</p>
                                        <p className="font-semibold text-xs text-green-600">
                                            {production.reconciliation.summary.productsOk || 0}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-muted-foreground text-[10px] mb-0.5">⚠ Advertencias</p>
                                        <p className="font-semibold text-xs text-yellow-600">
                                            {production.reconciliation.summary.productsWarning || 0}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-muted-foreground text-[10px] mb-0.5">✗ Errores</p>
                                        <p className="font-semibold text-xs text-destructive">
                                            {production.reconciliation.summary.productsError || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tabla de productos */}
                        {/* 
                          Formato de productos:
                          - Productos producidos: produced.weight > 0, status: 'ok'/'warning'/'error'
                          - Productos NO producidos: produced.weight === 0 pero existe en venta/stock/reprocesado,
                            balance.percentage === -100, status: 'error'
                          Ver documentación: docs/FORMATO_RESPUESTA_PRODUCTOS_NO_PRODUCIDOS_CONCILIACION.md
                        */}
                        {production.reconciliation.products && production.reconciliation.products.length > 0 && (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="h-8 w-[180px] text-xs">Producto</TableHead>
                                            <TableHead className="h-8 text-right text-xs">Producido</TableHead>
                                            <TableHead className="h-8 text-right text-xs">En Venta</TableHead>
                                            <TableHead className="h-8 text-right text-xs">En Stock</TableHead>
                                            <TableHead className="h-8 text-right text-xs">Reprocesado</TableHead>
                                            <TableHead className="h-8 text-right text-xs">Balance</TableHead>
                                            <TableHead className="h-8 w-[80px] text-center text-xs">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {production.reconciliation.products.map((item, index) => (
                                            <TableRow
                                                key={item.product?.id || index}
                                                className={`${
                                                    item.status === 'error'
                                                        ? 'bg-destructive/5'
                                                        : item.status === 'warning'
                                                        ? 'bg-yellow-500/5'
                                                        : ''
                                                }`}
                                            >
                                                <TableCell className="font-medium py-2">
                                                    <div>
                                                        <p className="text-xs font-semibold">{item.product?.name || 'Sin nombre'}</p>
                                                        {item.message && (
                                                            <p className={`text-[10px] mt-0.5 leading-tight ${
                                                                item.status === 'error'
                                                                    ? 'text-destructive'
                                                                    : item.status === 'warning'
                                                                    ? 'text-yellow-700'
                                                                    : 'text-green-700'
                                                            }`}>
                                                                {item.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-2">
                                                    <div>
                                                        <p className="text-xs font-semibold">{formatWeight(item.produced?.weight || 0)}</p>
                                                        <p className="text-[10px] text-muted-foreground">{item.produced?.boxes || 0} c.</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-2">
                                                    <div>
                                                        <p className="text-xs font-semibold">{formatWeight(item.inSales?.weight || 0)}</p>
                                                        <p className="text-[10px] text-muted-foreground">{item.inSales?.boxes || 0} c.</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-2">
                                                    <div>
                                                        <p className="text-xs font-semibold">{formatWeight(item.inStock?.weight || 0)}</p>
                                                        <p className="text-[10px] text-muted-foreground">{item.inStock?.boxes || 0} c.</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-2">
                                                    <div>
                                                        <p className="text-xs font-semibold">{formatWeight(item.reprocessed?.weight || 0)}</p>
                                                        <p className="text-[10px] text-muted-foreground">{item.reprocessed?.boxes || 0} c.</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-2">
                                                    <div>
                                                        <p className={`text-xs font-semibold ${
                                                            (item.balance?.weight || 0) < 0
                                                                ? 'text-destructive'
                                                                : (item.balance?.weight || 0) > 0
                                                                ? 'text-yellow-600'
                                                                : 'text-green-600'
                                                        }`}>
                                                            {formatWeight(Math.abs(item.balance?.weight || 0))}
                                                        </p>
                                                        <p className={`text-[10px] ${
                                                            (item.balance?.weight || 0) < 0
                                                                ? 'text-destructive'
                                                                : (item.balance?.weight || 0) > 0
                                                                ? 'text-yellow-600'
                                                                : 'text-green-600'
                                                        }`}>
                                                            {formatDecimal(Math.abs(item.balance?.percentage || 0))}%
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center py-2">
                                                    <Badge
                                                        variant={
                                                            item.status === 'error'
                                                                ? 'destructive'
                                                                : item.status === 'warning'
                                                                ? 'secondary'
                                                                : 'default'
                                                        }
                                                        className={`text-[10px] px-1.5 py-0 ${
                                                            item.status === 'error'
                                                                ? 'bg-destructive'
                                                                : item.status === 'warning'
                                                                ? 'bg-yellow-500'
                                                                : 'bg-green-500'
                                                        }`}
                                                    >
                                                        {item.status === 'error'
                                                            ? 'Error'
                                                            : item.status === 'warning'
                                                            ? 'Adv'
                                                            : 'OK'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Tabs para Procesos y más */}
            <Tabs defaultValue="processes" className="w-full">
                <TabsList>
                    <TabsTrigger value="processes">Procesos</TabsTrigger>
                    <TabsTrigger value="diagram">Diagrama</TabsTrigger>
                </TabsList>
                <TabsContent value="processes" className="mt-4">
                    <ProductionRecordsManager
                        productionId={productionId}
                        processTree={processTree}
                        onRefresh={loadProductionData}
                    />
                </TabsContent>
                <TabsContent value="diagram" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                Diagrama de Producción
                                </div>
                                <ViewModeSelector
                                    viewMode={viewMode}
                                    onViewModeChange={setViewMode}
                                />
                            </CardTitle>
                            <CardDescription>Visualización del flujo de procesos</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ProductionDiagram
                                processTree={processTree}
                                productionId={productionId}
                                loading={loading}
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            </div>
        </div>
    )
}

export default ProductionView

