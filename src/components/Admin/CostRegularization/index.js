'use client'

import React, { useState, useCallback, useMemo } from 'react'
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

function groupBoxesByProduct(boxes) {
    const map = {}
    for (const box of (boxes || [])) {
        const pid = box.product?.id
        if (pid == null) continue
        if (!map[pid]) map[pid] = []
        map[pid].push(box)
    }
    return map
}

function SummaryCard({ icon: Icon, label, value }) {
    return (
        <Card>
            <CardContent className="pt-4 pb-3">
                <div className="flex items-start gap-3">
                    <div className="rounded-md bg-muted p-2 mt-0.5 shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-xl font-semibold leading-tight">{value ?? '—'}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function BoxDetailRow({ box, tab }) {
    const date = tab === 'sales' ? box.loadDate : (box.createdAt || box.loadDate)
    return (
        <TableRow className="text-xs">
            <TableCell className="font-mono text-muted-foreground">{box.id}</TableCell>
            <TableCell>{box.lot || '—'}</TableCell>
            <TableCell className="text-right tabular-nums">
                {box.netWeightKg != null ? `${Number(box.netWeightKg).toFixed(2)} kg` : '—'}
            </TableCell>
            <TableCell>
                {tab === 'sales' && box.orderFormattedId
                    ? <span className="text-blue-600">{box.orderFormattedId}</span>
                    : box.orderId
                        ? <span className="text-blue-600">#{box.orderId}</span>
                        : '—'}
            </TableCell>
            <TableCell>
                {box.palletId ? <span className="font-mono">{box.palletId}</span> : '—'}
            </TableCell>
            <TableCell>{date ? formatDateShort(date) : '—'}</TableCell>
        </TableRow>
    )
}

function ProductRow({ product, boxesByProduct, costInput, onCostChange, tab }) {
    const [open, setOpen] = useState(false)
    const pid = product.product.id
    const boxes = boxesByProduct[pid] || []

    return (
        <>
            <TableRow
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => setOpen(o => !o)}
            >
                <TableCell className="font-medium">{product.product.name}</TableCell>
                <TableCell className="text-right tabular-nums">{product.boxesCount}</TableCell>
                <TableCell className="text-right tabular-nums">
                    {product.netWeightKg != null
                        ? `${Number(product.netWeightKg).toFixed(2)} kg`
                        : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                    {product.suggestedManualCostPerKg != null
                        ? `${Number(product.suggestedManualCostPerKg).toFixed(4)} €/kg`
                        : <span className="text-muted-foreground text-xs">Sin sugerencia</span>}
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()} className="w-36">
                    <Input
                        type="number"
                        step="0.0001"
                        min="0"
                        placeholder="€/kg"
                        value={costInput}
                        onChange={e => onCostChange(pid, e.target.value)}
                        className="text-right h-8 text-sm"
                    />
                </TableCell>
                <TableCell className="w-8 text-center text-muted-foreground">
                    {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </TableCell>
            </TableRow>
            {open && boxes.length > 0 && (
                <TableRow className="bg-muted/20">
                    <TableCell colSpan={6} className="p-0">
                        <div className="px-4 py-2 max-h-52 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="text-xs">
                                        <TableHead>ID caja</TableHead>
                                        <TableHead>Lote</TableHead>
                                        <TableHead className="text-right">Peso neto</TableHead>
                                        <TableHead>Pedido</TableHead>
                                        <TableHead>Palet</TableHead>
                                        <TableHead>{tab === 'sales' ? 'F. carga' : 'F. creación'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {boxes.map(box => (
                                        <BoxDetailRow key={box.id} box={box} tab={tab} />
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

function ApplyDialog({ open, onClose, products, costsMap, onApply, applying, result }) {
    const [confirmed, setConfirmed] = useState(false)

    const productsWithCost = useMemo(
        () => products.filter(p => {
            const v = costsMap[p.product.id]
            return v !== undefined && v !== '' && !isNaN(parseFloat(v)) && parseFloat(v) >= 0
        }),
        [products, costsMap]
    )

    const affectedBoxes = productsWithCost.reduce((s, p) => s + p.boxesCount, 0)
    const needsConfirmation = affectedBoxes > 100

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
                        {result.success !== false && (
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
                                    <div className="rounded-md border text-sm divide-y max-h-60 overflow-y-auto">
                                        {productsWithCost.map(p => (
                                            <div key={p.product.id} className="flex items-center justify-between px-3 py-2">
                                                <span className="text-muted-foreground truncate max-w-[200px]">{p.product.name}</span>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <Badge variant="secondary">{p.boxesCount} cajas</Badge>
                                                    <span className="font-mono font-medium">
                                                        {parseFloat(costsMap[p.product.id]).toFixed(4)} €/kg
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Total:{' '}
                                    <strong>{affectedBoxes}</strong>{' '}
                                    {affectedBoxes === 1 ? 'caja' : 'cajas'} en{' '}
                                    <strong>{productsWithCost.length}</strong>{' '}
                                    {productsWithCost.length === 1 ? 'producto' : 'productos'}.
                                </p>
                                {needsConfirmation && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Estás a punto de modificar más de 100 cajas. Esta acción no se puede deshacer fácilmente.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {needsConfirmation && (
                                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
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
                            onClick={onApply}
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

// Renders summary cards + scrollable product table.
// Must receive flex-1 min-h-0 from parent to grow into available space.
function ResultsSection({ data, costsMap, onCostChange, tab }) {
    const summary = data?.summary
    const products = data?.products || []
    const boxesByProduct = useMemo(() => groupBoxesByProduct(data?.boxes), [data?.boxes])

    const countLabel = tab === 'sales'
        ? { icon: ShoppingCart, label: 'Pedidos afectados', value: summary?.ordersCount }
        : { icon: Warehouse, label: 'Palets afectados', value: summary?.palletsCount ?? summary?.ordersCount }

    return (
        <div className="flex-1 flex flex-col min-h-0 gap-3 mt-3">
            {/* Summary cards — fixed height */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 shrink-0">
                <SummaryCard icon={Box} label="Cajas sin coste"
                    value={summary?.boxesCount?.toLocaleString('es-ES') ?? '—'} />
                <SummaryCard icon={Euro} label="Kg sin coste"
                    value={summary?.netWeightKg != null ? `${Number(summary.netWeightKg).toFixed(0)} kg` : '—'} />
                <SummaryCard icon={Package} label="Productos distintos"
                    value={summary?.productsCount?.toLocaleString('es-ES') ?? '—'} />
                <SummaryCard icon={countLabel.icon} label={countLabel.label}
                    value={countLabel.value?.toLocaleString('es-ES') ?? '—'} />
            </div>

            {/* Product table — grows to fill remaining space */}
            {products.length === 0 ? (
                <Alert className="shrink-0">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        No se encontraron cajas sin coste calculable para los filtros indicados.
                    </AlertDescription>
                </Alert>
            ) : (
                <Card className="flex-1 flex flex-col min-h-0">
                    <CardHeader className="pb-3 shrink-0">
                        <CardTitle className="text-base">Por producto</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 min-h-0">
                        <div className="h-full overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
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
                                            key={product.product.id}
                                            product={product}
                                            boxesByProduct={boxesByProduct}
                                            costInput={costsMap[product.product.id] ?? ''}
                                            onCostChange={onCostChange}
                                            tab={tab}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function TabPanel({ filterCard, resultsData, costsMap, onCostChange, tab }) {
    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="shrink-0">{filterCard}</div>
            {resultsData && (
                <ResultsSection
                    data={resultsData}
                    costsMap={costsMap}
                    onCostChange={onCostChange}
                    tab={tab}
                />
            )}
        </div>
    )
}

export default function CostRegularizationClient() {
    const { data: session } = useSession()
    const [tab, setTab] = useState('sales')

    const [salesFrom, setSalesFrom] = useState('')
    const [salesTo, setSalesTo] = useState('')
    const [stockLot, setStockLot] = useState('')
    const [stockFrom, setStockFrom] = useState('')
    const [stockTo, setStockTo] = useState('')

    const [salesData, setSalesData] = useState(null)
    const [stockData, setStockData] = useState(null)
    const [loadingSales, setLoadingSales] = useState(false)
    const [loadingStock, setLoadingStock] = useState(false)

    const [salesCosts, setSalesCosts] = useState({})
    const [stockCosts, setStockCosts] = useState({})

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
            notify.error({ title: 'Fechas requeridas', description: 'Indica fecha desde y hasta.' })
            return
        }
        setLoadingSales(true)
        setSalesData(null)
        setSalesCosts({})
        try {
            setSalesData(await costRegularizationService.getSalesMissingCost({ dateFrom: salesFrom, dateTo: salesTo }))
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
            setStockData(await costRegularizationService.getStockMissingCost({
                lot: stockLot || undefined,
                createdFrom: stockFrom || undefined,
                createdTo: stockTo || undefined,
            }))
        } catch {
            notify.error({ title: 'Error al cargar stock', description: 'No se pudo obtener los datos.' })
        } finally {
            setLoadingStock(false)
        }
    }

    const activeData = tab === 'sales' ? salesData : stockData
    const activeCosts = tab === 'sales' ? salesCosts : stockCosts
    const activeProducts = activeData?.products || []

    const productsWithFilledCost = useMemo(
        () => activeProducts.filter(p => {
            const v = activeCosts[p.product.id]
            return v !== undefined && v !== '' && !isNaN(parseFloat(v)) && parseFloat(v) >= 0
        }),
        [activeProducts, activeCosts]
    )

    async function handleApply() {
        const payload = {
            scope: tab,
            products: productsWithFilledCost.map(p => ({
                productId: p.product.id,
                manualCostPerKg: parseFloat(activeCosts[p.product.id]),
            })),
            ...(tab === 'sales' ? { dateFrom: salesFrom, dateTo: salesTo } : {}),
        }
        setApplying(true)
        try {
            const result = await costRegularizationService.applyManualCostsByProduct(payload)
            setApplyResult(result)
            notify.success({
                title: 'Costes aplicados',
                description: `${result.updatedCount ?? ''} cajas actualizadas.`,
            })
            if (tab === 'sales') { setSalesData(null); setSalesCosts({}) }
            else { setStockData(null); setStockCosts({}) }
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
                <AlertDescription>No tienes permiso para acceder a esta pantalla.</AlertDescription>
            </Alert>
        )
    }

    const salesFilterCard = (
        <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Filtros — Ventas</CardTitle></CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1.5">
                        <Label>Fecha carga desde</Label>
                        <Input type="date" value={salesFrom} onChange={e => setSalesFrom(e.target.value)} className="w-40" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Fecha carga hasta</Label>
                        <Input type="date" value={salesTo} onChange={e => setSalesTo(e.target.value)} className="w-40" />
                    </div>
                    <Button onClick={fetchSales} disabled={loadingSales}>
                        {loadingSales ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                        Buscar
                    </Button>
                </div>
            </CardContent>
        </Card>
    )

    const stockFilterCard = (
        <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Filtros — Stock actual</CardTitle></CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1.5">
                        <Label>Lote</Label>
                        <Input placeholder="Opcional" value={stockLot} onChange={e => setStockLot(e.target.value)} className="w-36" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Creación desde</Label>
                        <Input type="date" value={stockFrom} onChange={e => setStockFrom(e.target.value)} className="w-40" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Creación hasta</Label>
                        <Input type="date" value={stockTo} onChange={e => setStockTo(e.target.value)} className="w-40" />
                    </div>
                    <Button onClick={fetchStock} disabled={loadingStock}>
                        {loadingStock ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                        Buscar
                    </Button>
                </div>
            </CardContent>
        </Card>
    )

    return (
        // flex-1 so this fills the h-full flex-col wrapper from page.js
        <div className="flex-1 flex flex-col min-h-0 gap-4">
            {/* Page header — fixed */}
            <div className="shrink-0">
                <h1 className="text-2xl font-semibold">Regularización de costes manuales</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Localiza cajas sin coste calculable y asigna costes manuales por producto.
                </p>
            </div>

            {/* Tabs — grow to fill all remaining space above the bottom bar */}
            <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="shrink-0">
                    <TabsTrigger value="sales">
                        <ShoppingCart className="h-4 w-4 mr-1.5" />
                        Ventas sin coste
                    </TabsTrigger>
                    <TabsTrigger value="stock">
                        <Warehouse className="h-4 w-4 mr-1.5" />
                        Stock actual sin coste
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sales" className="flex-1 flex flex-col min-h-0 mt-0 pt-4">
                    <TabPanel
                        filterCard={salesFilterCard}
                        resultsData={salesData}
                        costsMap={salesCosts}
                        onCostChange={(pid, v) => handleCostChange('sales', pid, v)}
                        tab="sales"
                    />
                </TabsContent>

                <TabsContent value="stock" className="flex-1 flex flex-col min-h-0 mt-0 pt-4">
                    <TabPanel
                        filterCard={stockFilterCard}
                        resultsData={stockData}
                        costsMap={stockCosts}
                        onCostChange={(pid, v) => handleCostChange('stock', pid, v)}
                        tab="stock"
                    />
                </TabsContent>
            </Tabs>

            {/* Bottom bar — always visible, only when results exist */}
            {activeData != null && activeProducts.length > 0 && (
                <div className="shrink-0 space-y-3">
                    <Separator />
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {productsWithFilledCost.length === 0
                                ? 'Introduce costes en la tabla para poder aplicar.'
                                : `${productsWithFilledCost.length} ${productsWithFilledCost.length === 1 ? 'producto' : 'productos'} con coste asignado.`}
                        </p>
                        <Button
                            onClick={() => { setApplyResult(null); setDialogOpen(true) }}
                            disabled={productsWithFilledCost.length === 0}
                        >
                            <Euro className="h-4 w-4 mr-2" />
                            Aplicar costes medios
                        </Button>
                    </div>
                </div>
            )}

            <ApplyDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                products={activeProducts}
                costsMap={activeCosts}
                onApply={handleApply}
                applying={applying}
                result={applyResult}
            />
        </div>
    )
}
