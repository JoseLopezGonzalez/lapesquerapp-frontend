'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getProduction, getProductionProcessTree, getProductionTotals, getProductionReconciliation } from '@/services/productionService'
import { formatDateLong, formatWeight } from '@/helpers/production/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Loader from '@/components/Utilities/Loader'
import { ArrowLeft, Calendar, Package, Scale, AlertCircle, Info, Calculator, CheckCircle2 } from 'lucide-react'
import ProductionRecordsManager from './ProductionRecordsManager'

const ProductionView = ({ productionId }) => {
    const { data: session } = useSession()
    const router = useRouter()
    const [production, setProduction] = useState(null)
    const [processTree, setProcessTree] = useState(null)
    const [totals, setTotals] = useState(null)
    const [reconciliation, setReconciliation] = useState(null)
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
            const [productionData, treeData, totalsData, reconciliationData] = await Promise.all([
                getProduction(productionId, token),
                getProductionProcessTree(productionId, token).catch(() => null),
                getProductionTotals(productionId, token).catch(() => null),
                getProductionReconciliation(productionId, token).catch(() => null)
            ])

            setProduction(productionData)
            setProcessTree(treeData)
            setTotals(totalsData)
            setReconciliation(reconciliationData)
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Información General */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Info className="h-4 w-4 text-primary" />
                            Información General
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Especie:</span>
                                <span className="font-medium">{production.species?.name || 'No especificada'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Apertura:
                                </span>
                                <span className="font-medium">{formatDateLong(production.openedAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Cierre:
                                </span>
                                <span className="font-medium">{formatDateLong(production.closedAt) || 'No cerrado'}</span>
                            </div>
                            {production.notes && (
                                <div className="pt-2 border-t">
                                    <p className="text-xs text-muted-foreground mb-1">Notas:</p>
                                    <p className="text-sm">{production.notes}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Totales */}
                {totals && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calculator className="h-4 w-4 text-primary" />
                                Totales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                        <Package className="h-3 w-3" />
                                        Cajas entrada
                                    </p>
                                    <p className="text-lg font-bold">{totals.totalInputBoxes || 0}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                        <Scale className="h-3 w-3" />
                                        Peso entrada
                                    </p>
                                    <p className="text-lg font-bold">{formatWeight(totals.totalInputWeight)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                        <Package className="h-3 w-3" />
                                        Cajas salida
                                    </p>
                                    <p className="text-lg font-bold">{totals.totalOutputBoxes || 0}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                        <Scale className="h-3 w-3" />
                                        Peso salida
                                    </p>
                                    <p className="text-lg font-bold">{formatWeight(totals.totalOutputWeight)}</p>
                                </div>
                            </div>
                            {totals.totalWaste !== undefined && (
                                <div className="mt-3 pt-3 border-t">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Merma:</span>
                                        <div className="text-right">
                                            <p className="text-base font-bold">{formatWeight(totals.totalWaste)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {totals.wastePercentage?.toFixed(2) || 0}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Conciliación */}
                {reconciliation && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                Conciliación
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Declarado</p>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Cajas:</span>
                                            <span className="font-semibold">{reconciliation.declaredBoxes || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Peso:</span>
                                            <span className="font-semibold">{formatWeight(reconciliation.declaredWeight)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Stock Real</p>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Cajas:</span>
                                            <span className="font-semibold">{reconciliation.stockBoxes || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Peso:</span>
                                            <span className="font-semibold">{formatWeight(reconciliation.stockWeight)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2 border-t">
                                    <Badge
                                        variant={reconciliation.status === 'green' ? 'default' : reconciliation.status === 'yellow' ? 'outline' : 'destructive'}
                                        className={
                                            reconciliation.status === 'green' ? 'bg-green-500' :
                                            reconciliation.status === 'yellow' ? 'bg-yellow-500' :
                                            'bg-red-500'
                                        }
                                    >
                                        {
                                            reconciliation.status === 'green' ? 'Conciliado' :
                                            reconciliation.status === 'yellow' ? 'Diferencia leve' :
                                            'Diferencia importante'
                                        }
                                    </Badge>
                                </div>
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

