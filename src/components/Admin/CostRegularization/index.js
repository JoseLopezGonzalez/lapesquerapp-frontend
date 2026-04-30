'use client'

import React, { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
    Euro, Search, Package, AlertCircle, Loader2,
    Box, Warehouse, ShoppingCart, ChevronDown, ChevronUp,
    CheckCircle2, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { costRegularizationService } from '@/services/domain/cost-regularization/costRegularizationService'
import { notify } from '@/lib/notifications'
import { formatDateShort } from '@/helpers/formats/dates/formatDates'

const ALLOWED_ROLES = ['administrador', 'tecnico', 'direccion']

function hasAllowedRole(session) {
    const roles = session?.user?.role
    if (!roles) return false
    const arr = Array.isArray(roles) ? roles : [roles]
    return arr.some(r => ALLOWED_ROLES.includes(r))
}

function SummaryCard({ icon: Icon, label, value, sub }) {
    return (
        <Card>
            <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3">
                    <div className="rounded-md bg-muted p-2 mt-0.5">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-2xl font-semibold leading-tight">{value ?? '—'}</p>
                        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function ProductRow({ product, costInput, onCostChange, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <>
            <TableRow className="cursor-pointer hover:bg-muted/40" onClick={() => setOpen(o => !o)}>
                <TableCell className="font-medium">{product.productName}</TableCell>
                <TableCell className="text-right tabular-nums">{product.boxCount}</TableCell>
                <TableCell className="text-right tabular-nums">
                    {product.totalNetWeightKg != null ? `${product.totalNetWeightKg.toFixed(2)} kg` : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                    {product.suggestedCostPerKg != null
                        ? `${product.suggestedCostPerKg.toFixed(4)} €/kg`
                        : <span className="text-muted-foreground text-xs">Sin sugerencia</span>}
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()} className="w-36">
                    <div className="flex items-center gap-1">
                        <Input
                            type="number"
                            step="0.0001"
                            min="0"
                            placeholder="€/kg"
                            value={costInput}
                            onChange={e => onCostChange(product.productId, e.target.value)}
                            className="text-right h-8 text-sm"
                        />
                    </div>
                </TableCell>
                <TableCell className="w-8 text-center">
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </TableCell>
            </TableRow>
            {open && product.boxes && product.boxes.length > 0 && (
                <TableRow className="bg-muted/20">
                    <TableCell colSpan={6} className="p-0">
                        <div className="px-4 py-2">
                            <Table>
                                <TableHeader>
                                    <TableRow className="text-xs">
                                        <TableHead>Caja ID</TableHead>
                                        <TableHead>Lote</TableHead>
                                        <TableHead className="text-right">Peso neto</TableHead>
                                        <TableHead>Pedido</TableHead>
                                        <TableHead>Palet</TableHead>
                                        <TableHead>Fecha</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {product.boxes.map(box => (
                                        <TableRow key={box.boxId} className="text-xs">
                                            <TableCell className="font-mono">{box.boxId}</TableCell>
                                            <TableCell>{box.lot || '—'}</TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {box.netWeightKg != null ? `${box.netWeightKg.toFixed(2)} kg` : '—'}
                                            </TableCell>
                                            <TableCell>
                                                {box.orderId
                                                    ? <span className="text-blue-600">#{box.orderId}</span>
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                {box.palletId
                                                    ? <span className="font-mono">{box.palletId}</span>
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                {box.loadDate
                                                    ? formatDateShort(box.loadDate)
                                                    : box.createdAt
                                                        ? formatDateShort(box.createdAt)
                                                        : '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}

function ApplyDialog({ open, onClose, products, costsMap, totalBoxes, onApply, applying, result }) {
    const productsWithCost = products.filter(p => {
        const v = costsMap[p.productId]
        return v !== undefined && v !== '' && !isNaN(parseFloat(v)) && parseFloat(v) >= 0
    })
    const affectedBoxes = productsWithCost.reduce((sum, p) => sum + p.boxCount, 0)
    const needsConfirmation = affectedBoxes > 100
    const [confirmed, setConfirmed] = useState(false)

    const payload = {
        products: productsWithCost.map(p => ({
            productId: p.productId,
            manualCostPerKg: parseFloat(costsMap[p.productId]),
        })),
    }

    function handleClose() {
        setConfirmed(false)
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Aplicar costes manuales</DialogTitle>
                </DialogHeader>

                {result ? (
                    <div className="space-y-3 py-2">
                        {result.success && (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-medium">Costes aplicados correctamente</span>
                            </div>
                        )}
                        {result.updatedCount != null && (
                            <p className="text-sm text-muted-foreground">
                                {result.updatedCount} {result.updatedCount === 1 ? 'caja actualizada' : 'cajas actualizadas'}
                            </p>
                        )}
                        {result.errors && result.errors.length > 0 && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {result.errors.length} {result.errors.length === 1 ? 'error' : 'errores'} al procesar algunas cajas.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        {productsWithCost.length === 0 ? (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Introduce al menos un coste por producto para continuar.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <>
                                <div className="space-y-1.5">
                                    <p className="text-sm font-medium">Resumen de cambios</p>
                                    <div className="rounded-md border text-sm divide-y">
                                        {productsWithCost.map(p => (
                                            <div key={p.productId} className="flex items-center justify-between px-3 py-2">
                                                <span className="text-muted-foreground truncate max-w-[200px]">{p.productName}</span>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <Badge variant="secondary">{p.boxCount} cajas</Badge>
                                                    <span className="font-mono font-medium">
                                                        {parseFloat(costsMap[p.productId]).toFixed(4)} €/kg
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Total: <strong>{affectedBoxes}</strong> {affectedBoxes === 1 ? 'caja' : 'cajas'} afectadas en{' '}
                                    <strong>{productsWithCost.length}</strong> {productsWithCost.length === 1 ? 'producto' : 'productos'}.
                                </p>
                                {needsConfirmation && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Estás a punto de modificar más de 100 cajas. Esta acción no se puede deshacer fácilmente.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {needsConfirmation && !confirmed && (
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={confirmed}
                                            onChange={e => setConfirmed(e.target.checked)}
                                            className="accent-primary"
                                        />
                                        Confirmo que quiero modificar {affectedBoxes} cajas
                                    </label>
                                )}
                            </>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={applying}>
                        {result ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!result && (
                        <Button
                            onClick={() => onApply(payload)}
                            disabled={
                                applying ||
                                productsWithCost.length === 0 ||
                                (needsConfirmation && !confirmed)
                            }
                        >
                            {applying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Aplicar costes
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ResultsSection({ data, costsMap, onCostChange, tab }) {
    const summary = data?.summary
    const products = data?.byProduct || []
    const totalBoxes = summary?.totalBoxes ?? 0

    return (
        <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard
                    icon={Box}
                    label="Cajas sin coste"
                    value={summary?.totalBoxes?.toLocaleString('es-ES') ?? '—'}
                />
                <SummaryCard
                    icon={Euro}
                    label="Kg sin coste"
                    value={summary?.totalNetWeightKg != null
                        ? `${summary.totalNetWeightKg.toFixed(0)} kg`
                        : '—'}
                />
                <SummaryCard
                    icon={Package}
                    label="Productos distintos"
                    value={summary?.distinctProducts?.toLocaleString('es-ES') ?? '—'}
                />
                <SummaryCard
                    icon={tab === 'sales' ? ShoppingCart : Warehouse}
                    label={tab === 'sales' ? 'Pedidos afectados' : 'Palets afectados'}
                    value={tab === 'sales'
                        ? (summary?.distinctOrders?.toLocaleString('es-ES') ?? '—')
                        : (summary?.distinctPallets?.toLocaleString('es-ES') ?? '—')}
                />
            </div>

            {products.length === 0 ? (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        No se encontraron cajas sin coste calculable para los filtros indicados.
                    </AlertDescription>
                </Alert>
            ) : (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Por producto</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-right">Cajas</TableHead>
                                    <TableHead className="text-right">Kg totales</TableHead>
                                    <TableHead className="text-right">Coste sugerido</TableHead>
                                    <TableHead className="text-right">Coste a aplicar</TableHead>
                                    <TableHead className="w-8" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map(product => (
                                    <ProductRow
                                        key={product.productId}
                                        product={product}
                                        costInput={costsMap[product.productId] ?? ''}
                                        onCostChange={onCostChange}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default function CostRegularizationClient() {
    const { data: session } = useSession()

    const [tab, setTab] = useState('sales')

    // Sales filters
    const [salesFrom, setSalesFrom] = useState('')
    const [salesTo, setSalesTo] = useState('')

    // Stock filters
    const [stockLot, setStockLot] = useState('')
    const [stockFrom, setStockFrom] = useState('')
    const [stockTo, setStockTo] = useState('')

    // Results
    const [salesData, setSalesData] = useState(null)
    const [stockData, setStockData] = useState(null)

    // Loading states
    const [loadingSales, setLoadingSales] = useState(false)
    const [loadingStock, setLoadingStock] = useState(false)

    // Costs map: { [productId]: string }
    const [salesCosts, setSalesCosts] = useState({})
    const [stockCosts, setStockCosts] = useState({})

    // Apply dialog
    const [dialogOpen, setDialogOpen] = useState(false)
    const [applying, setApplying] = useState(false)
    const [applyResult, setApplyResult] = useState(null)

    const allowed = hasAllowedRole(session)

    const handleCostChange = useCallback((scope, productId, value) => {
        const setter = scope === 'sales' ? setSalesCosts : setStockCosts
        setter(prev => ({ ...prev, [productId]: value }))
    }, [])

    async function fetchSales() {
        if (!salesFrom || !salesTo) {
            notify.error({ title: 'Fechas requeridas', description: 'Indica fecha desde y hasta para buscar ventas.' })
            return
        }
        setLoadingSales(true)
        setSalesData(null)
        setSalesCosts({})
        try {
            const data = await costRegularizationService.getSalesMissingCost({
                dateFrom: salesFrom,
                dateTo: salesTo,
            })
            setSalesData(data)
        } catch {
            notify.error({ title: 'Error al cargar ventas', description: 'No se pudo obtener los datos.' })
        } finally {
            setLoadingSales(false)
        }
    }

    async function fetchStock() {
        setLoadingStock(true)
        setStockData(null)
        setStockCosts({})
        try {
            const data = await costRegularizationService.getStockMissingCost({
                lot: stockLot || undefined,
                createdFrom: stockFrom || undefined,
                createdTo: stockTo || undefined,
            })
            setStockData(data)
        } catch {
            notify.error({ title: 'Error al cargar stock', description: 'No se pudo obtener los datos.' })
        } finally {
            setLoadingStock(false)
        }
    }

    function openApplyDialog() {
        setApplyResult(null)
        setDialogOpen(true)
    }

    async function handleApply(payload) {
        const costsMap = tab === 'sales' ? salesCosts : stockCosts
        const currentData = tab === 'sales' ? salesData : stockData
        const products = currentData?.byProduct || []

        const productsWithCost = products.filter(p => {
            const v = costsMap[p.productId]
            return v !== undefined && v !== '' && !isNaN(parseFloat(v)) && parseFloat(v) >= 0
        })

        const finalPayload = {
            scope: tab,
            products: productsWithCost.map(p => ({
                productId: p.productId,
                manualCostPerKg: parseFloat(costsMap[p.productId]),
            })),
            ...(tab === 'sales' ? { dateFrom: salesFrom, dateTo: salesTo } : {}),
        }

        setApplying(true)
        try {
            const result = await costRegularizationService.applyManualCostsByProduct(finalPayload)
            setApplyResult(result)
            notify.success({ title: 'Costes aplicados', description: `${result.updatedCount ?? ''} cajas actualizadas.` })
            // Refresh data
            if (tab === 'sales') {
                setSalesData(null)
                setSalesCosts({})
            } else {
                setStockData(null)
                setStockCosts({})
            }
        } catch (err) {
            const msg = err?.data?.message || err?.data?.userMessage || 'No se pudo aplicar los costes.'
            notify.error({ title: 'Error al aplicar', description: msg })
        } finally {
            setApplying(false)
        }
    }

    if (!allowed) {
        return (
            <Alert variant="destructive" className="max-w-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    No tienes permiso para acceder a esta pantalla.
                </AlertDescription>
            </Alert>
        )
    }

    const activeData = tab === 'sales' ? salesData : stockData
    const activeCosts = tab === 'sales' ? salesCosts : stockCosts
    const hasResults = activeData != null
    const productsWithFilledCost = (activeData?.byProduct || []).filter(p => {
        const v = activeCosts[p.productId]
        return v !== undefined && v !== '' && !isNaN(parseFloat(v)) && parseFloat(v) >= 0
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Regularización de costes manuales</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Localiza cajas sin coste calculable y asigna costes manuales por producto.
                </p>
            </div>

            <Tabs value={tab} onValueChange={v => { setTab(v); }}>
                <TabsList>
                    <TabsTrigger value="sales">
                        <ShoppingCart className="h-4 w-4 mr-1.5" />
                        Ventas sin coste
                    </TabsTrigger>
                    <TabsTrigger value="stock">
                        <Warehouse className="h-4 w-4 mr-1.5" />
                        Stock actual sin coste
                    </TabsTrigger>
                </TabsList>

                {/* ── SALES TAB ── */}
                <TabsContent value="sales" className="mt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Filtros — Ventas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3 items-end">
                                <div className="space-y-1.5">
                                    <Label>Fecha carga desde</Label>
                                    <Input
                                        type="date"
                                        value={salesFrom}
                                        onChange={e => setSalesFrom(e.target.value)}
                                        className="w-40"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Fecha carga hasta</Label>
                                    <Input
                                        type="date"
                                        value={salesTo}
                                        onChange={e => setSalesTo(e.target.value)}
                                        className="w-40"
                                    />
                                </div>
                                <Button onClick={fetchSales} disabled={loadingSales}>
                                    {loadingSales
                                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        : <Search className="h-4 w-4 mr-2" />}
                                    Buscar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {salesData && (
                        <ResultsSection
                            data={salesData}
                            costsMap={salesCosts}
                            onCostChange={(pid, v) => handleCostChange('sales', pid, v)}
                            tab="sales"
                        />
                    )}
                </TabsContent>

                {/* ── STOCK TAB ── */}
                <TabsContent value="stock" className="mt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Filtros — Stock actual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3 items-end">
                                <div className="space-y-1.5">
                                    <Label>Lote</Label>
                                    <Input
                                        placeholder="Opcional"
                                        value={stockLot}
                                        onChange={e => setStockLot(e.target.value)}
                                        className="w-36"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Creación desde</Label>
                                    <Input
                                        type="date"
                                        value={stockFrom}
                                        onChange={e => setStockFrom(e.target.value)}
                                        className="w-40"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Creación hasta</Label>
                                    <Input
                                        type="date"
                                        value={stockTo}
                                        onChange={e => setStockTo(e.target.value)}
                                        className="w-40"
                                    />
                                </div>
                                <Button onClick={fetchStock} disabled={loadingStock}>
                                    {loadingStock
                                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        : <Search className="h-4 w-4 mr-2" />}
                                    Buscar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {stockData && (
                        <ResultsSection
                            data={stockData}
                            costsMap={stockCosts}
                            onCostChange={(pid, v) => handleCostChange('stock', pid, v)}
                            tab="stock"
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* Apply button — sticky at the bottom when there are results */}
            {hasResults && (activeData?.byProduct?.length ?? 0) > 0 && (
                <>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {productsWithFilledCost.length === 0
                                ? 'Introduce costes en la tabla para poder aplicar.'
                                : `${productsWithFilledCost.length} ${productsWithFilledCost.length === 1 ? 'producto' : 'productos'} con coste asignado.`}
                        </p>
                        <Button
                            onClick={openApplyDialog}
                            disabled={productsWithFilledCost.length === 0}
                        >
                            <Euro className="h-4 w-4 mr-2" />
                            Aplicar costes medios
                        </Button>
                    </div>
                </>
            )}

            <ApplyDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                products={activeData?.byProduct || []}
                costsMap={activeCosts}
                totalBoxes={activeData?.summary?.totalBoxes ?? 0}
                onApply={handleApply}
                applying={applying}
                result={applyResult}
            />
        </div>
    )
}
