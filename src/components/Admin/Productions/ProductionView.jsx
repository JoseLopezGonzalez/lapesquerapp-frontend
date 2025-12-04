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
import { Button } from '@/components/ui/button'
import Loader from '@/components/Utilities/Loader'
import { ArrowLeft, Calendar, Package, Scale, AlertCircle, Info, Calculator, TrendingDown, TrendingUp, Fish, MapPin, FileText } from 'lucide-react'
import ProductionRecordsManager from './ProductionRecordsManager'

const ProductionView = ({ productionId }) => {
    const { data: session } = useSession()
    const router = useRouter()
    const [production, setProduction] = useState(null)
    const [processTree, setProcessTree] = useState(null)
    const [totals, setTotals] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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
                getProductionProcessTree(productionId, token).catch(() => null),
                getProductionTotals(productionId, token).catch(() => null)
            ])

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
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                Diagrama de Producción
                            </CardTitle>
                            <CardDescription>Visualización del flujo de procesos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                El diagrama se generará dinámicamente desde los procesos registrados.
                            </p>
                            {/* Aquí se implementará el diagrama visual */}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            </div>
        </div>
    )
}

export default ProductionView

