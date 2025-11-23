'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getProduction, getProductionProcessTree, getProductionTotals, getProductionReconciliation } from '@/services/productionService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Calendar, Package, Scale, AlertCircle } from 'lucide-react'
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

    const formatWeight = (weight) => {
        if (!weight) return '0 kg'
        return `${parseFloat(weight).toFixed(2)} kg`
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
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Producción #{production.id}</h1>
                        <p className="text-muted-foreground">
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

            {/* Información General */}
            <Card>
                <CardHeader>
                    <CardTitle>Información General</CardTitle>
                    <CardDescription>Datos básicos del lote de producción</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Especie</p>
                            <p className="text-lg">{production.species?.name || 'No especificada'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Fecha de apertura
                            </p>
                            <p className="text-lg">{formatDate(production.openedAt)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Fecha de cierre
                            </p>
                            <p className="text-lg">{formatDate(production.closedAt) || 'No cerrado'}</p>
                        </div>
                        {production.notes && (
                            <div className="space-y-1 md:col-span-2 lg:col-span-3">
                                <p className="text-sm font-medium text-muted-foreground">Notas</p>
                                <p className="text-base">{production.notes}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Totales */}
            {totals && (
                <Card>
                    <CardHeader>
                        <CardTitle>Totales</CardTitle>
                        <CardDescription>Resumen de pesos y cantidades</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Cajas entrada
                                </p>
                                <p className="text-2xl font-bold">{totals.totalInputBoxes || 0}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Scale className="h-4 w-4" />
                                    Peso entrada
                                </p>
                                <p className="text-2xl font-bold">{formatWeight(totals.totalInputWeight)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Cajas salida
                                </p>
                                <p className="text-2xl font-bold">{totals.totalOutputBoxes || 0}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Scale className="h-4 w-4" />
                                    Peso salida
                                </p>
                                <p className="text-2xl font-bold">{formatWeight(totals.totalOutputWeight)}</p>
                            </div>
                        </div>
                        {totals.totalWaste !== undefined && (
                            <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">Merma</p>
                                    <div className="text-right">
                                        <p className="text-xl font-bold">{formatWeight(totals.totalWaste)}</p>
                                        <p className="text-sm text-muted-foreground">
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
                    <CardHeader>
                        <CardTitle>Conciliación</CardTitle>
                        <CardDescription>Comparación entre producción declarada y stock real</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Declarado</p>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            Cajas: <span className="font-semibold">{reconciliation.declaredBoxes || 0}</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Peso: <span className="font-semibold">{formatWeight(reconciliation.declaredWeight)}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Stock Real</p>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            Cajas: <span className="font-semibold">{reconciliation.stockBoxes || 0}</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Peso: <span className="font-semibold">{formatWeight(reconciliation.stockWeight)}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <Badge
                                    variant={reconciliation.status === 'green' ? 'default' : reconciliation.status === 'yellow' ? 'outline' : 'destructive'}
                                    className={
                                        reconciliation.status === 'green' ? 'bg-green-500' :
                                        reconciliation.status === 'yellow' ? 'bg-yellow-500' :
                                        'bg-red-500'
                                    }
                                >
                                    Estado: {
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
                            <CardTitle>Diagrama de Producción</CardTitle>
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

