'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProductionDetail } from '@/hooks/production/useProductionDetail'
import { formatDateLong, formatWeight } from '@/helpers/production/formatters'
import { formatDecimal, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import Loader from '@/components/Utilities/Loader'
import { ArrowLeft, Calendar, Package, Scale, AlertCircle, Info, Calculator, TrendingDown, TrendingUp, Fish, MapPin, FileText, CheckCircle2, XCircle, AlertTriangle, Eye, AlertOctagon } from 'lucide-react'
import ProductionRecordsManager from './ProductionRecordsManager'
import ProductionDiagram, { ViewModeSelector } from './ProductionDiagram'

const ProductionView = ({ productionId }) => {
    const router = useRouter()
    const { production, processTree, totals, isLoading: loading, error, refetch } = useProductionDetail(productionId)
    const [viewMode, setViewMode] = useState('simple')
    const [reconciliationDialogOpen, setReconciliationDialogOpen] = useState(false)


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

            {/* Tabs para Información y Diagrama */}
            <Tabs defaultValue="info" className="w-full">
                <TabsList>
                    <TabsTrigger value="info">Información</TabsTrigger>
                    <TabsTrigger value="diagram">Diagrama</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="mt-4">
                    <div className="space-y-4">
                        {/* Cards en fila para pantallas grandes */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                        {/* Información General */}
                        <Card className={`flex flex-col ${production.reconciliation ? "lg:row-span-2" : ""} h-full`}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Info className="h-4 w-4 text-primary" />
                                        Información General
                                    </CardTitle>
                            </CardHeader>
                                <CardContent className="pt-0 flex-1 flex flex-col">
                                    <div className="space-y-4 flex-1">
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

                        {/* Conciliación General */}
                        {production.reconciliation && (
                                <Card className={`h-auto border-2 ${
                                    production.reconciliation.summary?.overallStatus === 'error' 
                                        ? 'border-destructive bg-destructive/5' 
                                        : production.reconciliation.summary?.overallStatus === 'warning'
                                        ? 'border-yellow-500 bg-yellow-500/5'
                                        : 'border-green-500 bg-green-500/5'
                                }`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {production.reconciliation.summary?.overallStatus === 'error' ? (
                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                ) : production.reconciliation.summary?.overallStatus === 'warning' ? (
                                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                )}
                                                Conciliación
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
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
                                                        ? 'Adv'
                                                        : 'OK'
                                                    }
                                                </Badge>
                                                {production.reconciliation.products && production.reconciliation.products.length > 0 && (
                                                    <Dialog open={reconciliationDialogOpen} onOpenChange={setReconciliationDialogOpen}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm" className="h-7 text-xs">
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                Detalle
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-6xl max-h-[90vh]">
                                                            <DialogHeader>
                                                                <DialogTitle className="flex items-center gap-2">
                                                                    {production.reconciliation.summary?.overallStatus === 'error' ? (
                                                                        <XCircle className="h-5 w-5 text-destructive" />
                                                                    ) : production.reconciliation.summary?.overallStatus === 'warning' ? (
                                                                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                                                    ) : (
                                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                                    )}
                                                                    Detalle de Conciliación General
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    Detalle completo de la conciliación de productos
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <ScrollArea className="max-h-[calc(90vh-120px)]">
                                                                <div className="space-y-4 pr-4">
                                                                    {/* Resumen en el dialog */}
                                                                    {production.reconciliation.summary && (
                                                                        <div className="px-3 py-3 rounded-md bg-muted/50 border">
                                                                            <div className="grid grid-cols-2 md:grid-cols-7 gap-x-4 gap-y-2 text-sm">
                                                                                <div>
                                                                                    <p className="text-muted-foreground text-xs mb-1">Productos</p>
                                                                                    <p className="font-semibold text-sm">
                                                                                        {production.reconciliation.summary.totalProducts || 0}
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-muted-foreground text-xs mb-1">Producido</p>
                                                                                    <p className="font-semibold text-sm">
                                                                                        {formatWeight(production.reconciliation.summary.totalProducedWeight || 0)}
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-muted-foreground text-xs mb-1">Registrado</p>
                                                                                    <p className="font-semibold text-sm">
                                                                                        {formatWeight(production.reconciliation.summary.totalContabilizedWeight || 0)}
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-muted-foreground text-xs mb-1">Balance</p>
                                                                                    <p className={`font-semibold text-sm ${
                                                                                        (production.reconciliation.summary.totalBalanceWeight || 0) !== 0
                                                                                            ? 'text-destructive'
                                                                                            : 'text-green-600'
                                                                                    }`}>
                                                                                        {formatWeight(Math.abs(production.reconciliation.summary.totalBalanceWeight || 0))}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="text-center">
                                                                                    <p className="text-muted-foreground text-xs mb-1">✓ Correctos</p>
                                                                                    <p className="font-semibold text-sm text-green-600">
                                                                                        {production.reconciliation.summary.productsOk || 0}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="text-center">
                                                                                    <p className="text-muted-foreground text-xs mb-1">⚠ Advertencias</p>
                                                                                    <p className="font-semibold text-sm text-yellow-600">
                                                                                        {production.reconciliation.summary.productsWarning || 0}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="text-center">
                                                                                    <p className="text-muted-foreground text-xs mb-1">✗ Errores</p>
                                                                                    <p className="font-semibold text-sm text-destructive">
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
                                                                                        <TableHead className="h-10 w-[200px] text-sm">Producto</TableHead>
                                                                                        <TableHead className="h-10 text-right text-sm">Producido</TableHead>
                                                                                        <TableHead className="h-10 text-right text-sm">En Venta</TableHead>
                                                                                        <TableHead className="h-10 text-right text-sm">En Stock</TableHead>
                                                                                        <TableHead className="h-10 text-right text-sm">Reprocesado</TableHead>
                                                                                        <TableHead className="h-10 text-right text-sm">Balance</TableHead>
                                                                                        <TableHead className="h-10 w-[100px] text-center text-sm">Estado</TableHead>
                                                                                    </TableRow>
                                                                                </TableHeader>
                                                                                <TableBody>
                                                                                    {production.reconciliation.products.map((item, index) => {
                                                                                        // Detectar si es un producto no producido pero que existe en la app
                                                                                        // Opción 1: Por produced.weight === 0 y contabilizado > 0 (incluye reprocesado)
                                                                                        const hasNoProduction = (item.produced?.weight || 0) === 0;
                                                                                        const hasContabilized = ((item.inSales?.weight || 0) > 0 || 
                                                                                                                 (item.inStock?.weight || 0) > 0 || 
                                                                                                                 (item.reprocessed?.weight || 0) > 0);
                                                                                        // Opción 2: Por status === 'error' y balance.percentage === -100
                                                                                        const isErrorWithNegativeBalance = item.status === 'error' && 
                                                                                                                           (item.balance?.percentage || 0) === -100;
                                                                                        // Opción 3: Por el mensaje
                                                                                        const hasNotProducedMessage = item.message?.includes('no registrado como producido');
                                                                                        // Detectar productos no producidos: cualquier combinación que indique que existe en sistema pero no fue producido
                                                                                        const isNotProduced = hasNotProducedMessage || 
                                                                                                             isErrorWithNegativeBalance || 
                                                                                                             (hasNoProduction && hasContabilized);
                                                                                        
                                                                                        return (
                                                                                        <TableRow
                                                                                            key={item.product?.id || index}
                                                                                            className={`${
                                                                                                isNotProduced
                                                                                                    ? 'bg-amber-50 dark:bg-amber-950/20 border-l-4 border-l-amber-500'
                                                                                                    : item.status === 'error'
                                                                                                    ? 'bg-destructive/5'
                                                                                                    : item.status === 'warning'
                                                                                                    ? 'bg-yellow-500/5'
                                                                                                    : ''
                                                                                            }`}
                                                                                        >
                                                                                            <TableCell className="font-medium py-3">
                                                                                                <div className="flex items-start gap-2">
                                                                                                    {isNotProduced && (
                                                                                                        <AlertOctagon className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                                                                                                    )}
                                                                                                    <div className="flex-1 min-w-0">
                                                                                                        <p className="text-sm font-semibold">{item.product?.name || 'Sin nombre'}</p>
                                                                                                        {isNotProduced ? (
                                                                                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                                                                <Badge variant="outline" className="text-xs px-2 py-0.5 whitespace-nowrap bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                                                                                                                    No producido
                                                                                                                </Badge>
                                                                                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                                                                    Existe en sistema
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        ) : item.message && item.status !== 'ok' && (
                                                                                                            <p className={`text-xs mt-1 leading-tight ${
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
                                                                                                </div>
                                                                                            </TableCell>
                                                                                            <TableCell className="text-right py-3">
                                                                                                <div className="flex flex-col justify-start min-h-[2.5rem]">
                                                                                                    <p className="text-sm font-semibold">{formatWeight(item.produced?.weight || 0)}</p>
                                                                                                    {(item.produced?.boxes || 0) > 0 ? (
                                                                                                        <p className="text-xs text-muted-foreground">{item.produced.boxes} cajas</p>
                                                                                                    ) : (
                                                                                                        <p className="text-xs text-transparent">0</p>
                                                                                                    )}
                                                                                                </div>
                                                                                            </TableCell>
                                                                                            <TableCell className="text-right py-3">
                                                                                                <div className="flex flex-col justify-start min-h-[2.5rem]">
                                                                                                    <p className="text-sm font-semibold">{formatWeight(item.inSales?.weight || 0)}</p>
                                                                                                    {(item.inSales?.boxes || 0) > 0 ? (
                                                                                                        <p className="text-xs text-muted-foreground">{item.inSales.boxes} cajas</p>
                                                                                                    ) : (
                                                                                                        <p className="text-xs text-transparent">0</p>
                                                                                                    )}
                                                                                                </div>
                                                                                            </TableCell>
                                                                                            <TableCell className="text-right py-3">
                                                                                                <div className="flex flex-col justify-start min-h-[2.5rem]">
                                                                                                    <p className="text-sm font-semibold">{formatWeight(item.inStock?.weight || 0)}</p>
                                                                                                    {(item.inStock?.boxes || 0) > 0 ? (
                                                                                                        <p className="text-xs text-muted-foreground">{item.inStock.boxes} cajas</p>
                                                                                                    ) : (
                                                                                                        <p className="text-xs text-transparent">0</p>
                                                                                                    )}
                                                                                                </div>
                                                                                            </TableCell>
                                                                                            <TableCell className="text-right py-3">
                                                                                                <div className="flex flex-col justify-start min-h-[2.5rem]">
                                                                                                    <p className="text-sm font-semibold">{formatWeight(item.reprocessed?.weight || 0)}</p>
                                                                                                    {(item.reprocessed?.boxes || 0) > 0 ? (
                                                                                                        <p className="text-xs text-muted-foreground">{item.reprocessed.boxes} cajas</p>
                                                                                                    ) : (
                                                                                                        <p className="text-xs text-transparent">0</p>
                                                                                                    )}
                                                                                                </div>
                                                                                            </TableCell>
                                                                                            <TableCell className="text-right py-3">
                                                                                                <div>
                                                                                                    <p className={`text-sm font-semibold ${
                                                                                                        (item.balance?.weight || 0) < 0
                                                                                                            ? 'text-destructive'
                                                                                                            : (item.balance?.weight || 0) > 0
                                                                                                            ? 'text-yellow-600'
                                                                                                            : 'text-green-600'
                                                                                                    }`}>
                                                                                                        {formatWeight(Math.abs(item.balance?.weight || 0))}
                                                                                                    </p>
                                                                                                    <p className={`text-xs ${
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
                                                                                            <TableCell className="text-center py-3">
                                                                                                <Badge
                                                                                                    variant={
                                                                                                        item.status === 'error'
                                                                                                            ? 'destructive'
                                                                                                            : item.status === 'warning'
                                                                                                            ? 'secondary'
                                                                                                            : 'default'
                                                                                                    }
                                                                                                    className={`text-xs px-2 py-0.5 ${
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
                                                                                    );
                                                                                    })}
                                                                                </TableBody>
                                                                            </Table>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </ScrollArea>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        {/* Resumen compacto - datos globales */}
                                        {production.reconciliation.summary && (
                                            <div className="grid grid-cols-3 gap-0">
                                                {/* Producido vs Registrado */}
                                                <div className="space-y-1.5 pr-3 border-r">
                                                    <div className="flex items-center gap-1.5">
                                                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Producido</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold leading-tight">{formatWeight(production.reconciliation.summary.totalProducedWeight || 0)}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{production.reconciliation.summary.totalProducts || 0} productos</p>
                                                    </div>
                                                </div>

                                                {/* Registrado */}
                                                <div className="space-y-1.5 px-3 border-r">
                                                    <div className="flex items-center gap-1.5">
                                                        <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Registrado</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold leading-tight">{formatWeight(production.reconciliation.summary.totalContabilizedWeight || 0)}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{production.reconciliation.summary.totalProducts || 0} productos</p>
                                                    </div>
                                                </div>

                                                {/* Balance y Estado */}
                                                <div className="space-y-1.5 pl-3">
                                                    <div className="flex items-center gap-1.5">
                                                        {(production.reconciliation.summary.totalBalanceWeight || 0) !== 0 ? (
                                                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                                        ) : (
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                                        )}
                                                        <p className={`text-xs font-semibold uppercase tracking-wide ${
                                                            (production.reconciliation.summary.totalBalanceWeight || 0) !== 0
                                                                ? 'text-destructive'
                                                                : 'text-green-600'
                                                        }`}>
                                                            Balance
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className={`text-lg font-bold leading-tight ${
                                                            (production.reconciliation.summary.totalBalanceWeight || 0) !== 0
                                                                ? 'text-destructive'
                                                                : 'text-green-600'
                                                        }`}>
                                                            {formatWeight(Math.abs(production.reconciliation.summary.totalBalanceWeight || 0))}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5 text-xs">
                                                            <div className="flex items-center gap-1 text-green-600">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                <span>{production.reconciliation.summary.productsOk || 0}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-yellow-600">
                                                                <AlertTriangle className="h-3 w-3" />
                                                                <span>{production.reconciliation.summary.productsWarning || 0}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-destructive">
                                                                <XCircle className="h-3 w-3" />
                                                                <span>{production.reconciliation.summary.productsError || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                        )}

                        </div>

                        {/* Procesos */}
                        <ProductionRecordsManager
                            productionId={productionId}
                            processTree={processTree}
                            onRefresh={refetch}
                        />
                    </div>
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

