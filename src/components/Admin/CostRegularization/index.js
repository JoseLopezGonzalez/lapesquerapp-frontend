'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
    Euro, Search, Package, AlertCircle, Loader2,
    Box, Warehouse, ShoppingCart, ChevronDown, ChevronUp,
    CheckCircle2, XCircle, Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DateRangePicker } from '@/components/ui/dateRangePicker'
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
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers'
import { format } from 'date-fns'

// -------------------------------------------------------------------
// Response shapes
// summary: { boxesCount, netWeightKg, productsCount, ordersCount, palletsCount? }
// products: [{ product: { id, name }, boxesCount, netWeightKg, ordersCount?, suggestedManualCostPerKg }]
// lotProducts: [{ product: { id, name }, lot, boxesCount, netWeightKg, suggestedManualCostPerKg }]
// boxes: [{ id, palletId, orderId, orderFormattedId, loadDate, createdAt?, product: { id, name }, lot, netWeightKg }]
// -------------------------------------------------------------------

const ALLOWED_ROLES = ['administrador', 'tecnico', 'direccion']

// Key for lotProduct cost map
const lotKey = (productId, lot) => `${productId}::${lot}`

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

function groupBoxesByLotProduct(boxes) {
    const map = {}
    for (const box of (boxes || [])) {
        const pid = box.product?.id
        const lot = box.lot
        if (pid == null || !lot) continue
        const k = lotKey(pid, lot)
        if (!map[k]) map[k] = []
        map[k].push(box)
    }
    return map
}

function groupBoxesByLot(boxes) {
    const map = {}
    for (const box of (boxes || [])) {
        const lot = box.lot || '__WITHOUT_LOT__'
        if (!map[lot]) map[lot] = []
        map[lot].push(box)
    }
    return map
}

// -------------------------------------------------------------------
// Small components
// -------------------------------------------------------------------

function SummaryMetric({ icon: Icon, label, value }) {
    return (
        <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="rounded-md bg-background p-1.5 shrink-0">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{label}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums shrink-0">{value ?? '—'}</p>
            </div>
        </div>
    )
}

function BoxDetailRow({ box, tab, showLot = true }) {
    const date = tab === 'sales' ? box.loadDate : (box.createdAt || box.loadDate)
    return (
        <TableRow className="text-xs">
            <TableCell className="font-mono text-muted-foreground">{box.id}</TableCell>
            {showLot && <TableCell>{box.lot || '—'}</TableCell>}
            <TableCell className="text-right tabular-nums">
                {box.netWeightKg != null ? `${Number(box.netWeightKg).toFixed(2)} kg` : '—'}
            </TableCell>
            <TableCell>
                {tab === 'sales' && box.orderFormattedId
                    ? <span className="text-blue-600">{box.orderFormattedId}</span>
                    : box.orderId ? <span className="text-blue-600">#{box.orderId}</span> : '—'}
            </TableCell>
            <TableCell>
                {box.palletId ? <span className="font-mono">{box.palletId}</span> : '—'}
            </TableCell>
            <TableCell>{date ? formatDateShort(date) : '—'}</TableCell>
        </TableRow>
    )
}

// -------------------------------------------------------------------
// By-product table row
// -------------------------------------------------------------------

function ProductRow({ product, boxesByProduct, costInput, onCostChange, tab }) {
    const [open, setOpen] = useState(false)
    const [openLots, setOpenLots] = useState({})
    const pid = product.product.id
    const boxes = boxesByProduct[pid] || []
    const boxesByLot = useMemo(() => groupBoxesByLot(boxes), [boxes])
    const lotEntries = useMemo(
        () => Object.entries(boxesByLot).sort(([a], [b]) => a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' })),
        [boxesByLot]
    )

    function toggleLot(lot) {
        setOpenLots(prev => ({ ...prev, [lot]: !prev[lot] }))
    }

    return (
        <>
            <TableRow className="cursor-pointer hover:bg-muted/40" onClick={() => setOpen(o => !o)}>
                <TableCell className="font-medium">{product.product.name}</TableCell>
                <TableCell className="text-right tabular-nums">{product.boxesCount}</TableCell>
                <TableCell className="text-right tabular-nums">
                    {product.netWeightKg != null ? `${Number(product.netWeightKg).toFixed(2)} kg` : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                    {product.suggestedManualCostPerKg != null
                        ? `${Number(product.suggestedManualCostPerKg).toFixed(4)} €/kg`
                        : <span className="text-muted-foreground text-xs">Sin sugerencia</span>}
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()} className="w-36">
                    <Input
                        type="number" step="0.0001" min="0" placeholder="€/kg"
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
                                        <TableHead>Lote</TableHead>
                                        <TableHead className="text-right">Cajas</TableHead>
                                        <TableHead className="text-right">Peso neto</TableHead>
                                        <TableHead className="w-8" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lotEntries.map(([lot, lotBoxes]) => {
                                        const isLotOpen = openLots[lot] ?? false
                                        const lotWeight = lotBoxes.reduce((sum, box) => sum + (Number(box.netWeightKg) || 0), 0)
                                        const lotLabel = lot === '__WITHOUT_LOT__' ? 'Sin lote' : lot

                                        return (
                                            <React.Fragment key={lot}>
                                                <TableRow
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => toggleLot(lot)}
                                                >
                                                    <TableCell>
                                                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{lotLabel}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums">{lotBoxes.length}</TableCell>
                                                    <TableCell className="text-right tabular-nums">{lotWeight.toFixed(2)} kg</TableCell>
                                                    <TableCell className="text-center text-muted-foreground">
                                                        {isLotOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </TableCell>
                                                </TableRow>

                                                {isLotOpen && (
                                                    <TableRow className="bg-background">
                                                        <TableCell colSpan={4} className="p-0">
                                                            <div className="border-t max-h-44 overflow-y-auto">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow className="text-xs">
                                                                            <TableHead>ID caja</TableHead>
                                                                            <TableHead className="text-right">Peso neto</TableHead>
                                                                            <TableHead>Pedido</TableHead>
                                                                            <TableHead>Palet</TableHead>
                                                                            <TableHead>{tab === 'sales' ? 'F. carga' : 'F. creación'}</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {lotBoxes.map(box => <BoxDetailRow key={box.id} box={box} tab={tab} showLot={false} />)}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}

// -------------------------------------------------------------------
// By-lot-product table row
// -------------------------------------------------------------------

function LotProductRow({ item, boxesByLotProduct, costInput, onCostChange, tab }) {
    const [open, setOpen] = useState(false)
    const pid = item.product.id
    const lot = item.lot
    const k = lotKey(pid, lot)
    const boxes = boxesByLotProduct[k] || []

    return (
        <>
            <TableRow className="cursor-pointer hover:bg-muted/40" onClick={() => setOpen(o => !o)}>
                <TableCell className="font-medium">{item.product.name}</TableCell>
                <TableCell>
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{lot}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{item.boxesCount}</TableCell>
                <TableCell className="text-right tabular-nums">
                    {item.netWeightKg != null ? `${Number(item.netWeightKg).toFixed(2)} kg` : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                    {item.suggestedManualCostPerKg != null
                        ? `${Number(item.suggestedManualCostPerKg).toFixed(4)} €/kg`
                        : <span className="text-muted-foreground text-xs">Sin sugerencia</span>}
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()} className="w-36">
                    <Input
                        type="number" step="0.0001" min="0" placeholder="€/kg"
                        value={costInput}
                        onChange={e => onCostChange(k, e.target.value)}
                        className="text-right h-8 text-sm"
                    />
                </TableCell>
                <TableCell className="w-8 text-center text-muted-foreground">
                    {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </TableCell>
            </TableRow>
            {open && boxes.length > 0 && (
                <TableRow className="bg-muted/20">
                    <TableCell colSpan={7} className="p-0">
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
                                    {boxes.map(box => <BoxDetailRow key={box.id} box={box} tab={tab} />)}
                                </TableBody>
                            </Table>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}

// -------------------------------------------------------------------
// Apply dialog
// -------------------------------------------------------------------

function ApplyDialog({ open, onClose, applyMode, productItems, lotProductItems, productCostsMap, lotProductCostsMap, onApply, applying, result }) {
    const [confirmed, setConfirmed] = useState(false)

    const byProduct = applyMode === 'product'

    const eligibleProducts = useMemo(
        () => productItems.filter(p => {
            const v = productCostsMap[p.product.id]
            return v !== undefined && v !== '' && !isNaN(parseFloat(v)) && parseFloat(v) >= 0
        }),
        [productItems, productCostsMap]
    )

    const eligibleLots = useMemo(
        () => lotProductItems.filter(item => {
            const k = lotKey(item.product.id, item.lot)
            const v = lotProductCostsMap[k]
            return v !== undefined && v !== '' && !isNaN(parseFloat(v)) && parseFloat(v) >= 0
        }),
        [lotProductItems, lotProductCostsMap]
    )

    const eligible = byProduct ? eligibleProducts : eligibleLots
    const affectedBoxes = eligible.reduce((s, item) => s + item.boxesCount, 0)
    const needsConfirmation = affectedBoxes > 100

    function handleClose() { setConfirmed(false); onClose() }

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        Aplicar costes — {byProduct ? 'por producto' : 'por producto + lote'}
                    </DialogTitle>
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
                        {result.errors?.length > 0 && (
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
                        {eligible.length === 0 ? (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Introduce al menos un coste en la tabla para continuar.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <>
                                <div className="space-y-1.5">
                                    <p className="text-sm font-medium">Resumen de cambios</p>
                                    <div className="rounded-md border text-sm divide-y max-h-60 overflow-y-auto">
                                        {byProduct
                                            ? eligibleProducts.map(p => (
                                                <div key={p.product.id} className="flex items-center justify-between px-3 py-2">
                                                    <span className="text-muted-foreground truncate max-w-[180px]">{p.product.name}</span>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Badge variant="secondary">{p.boxesCount} cajas</Badge>
                                                        <span className="font-mono font-medium">
                                                            {parseFloat(productCostsMap[p.product.id]).toFixed(4)} €/kg
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                            : eligibleLots.map(item => {
                                                const k = lotKey(item.product.id, item.lot)
                                                return (
                                                    <div key={k} className="flex items-center justify-between px-3 py-2 gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-muted-foreground truncate text-xs">{item.product.name}</p>
                                                            <p className="font-mono text-xs">{item.lot}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <Badge variant="secondary">{item.boxesCount} cajas</Badge>
                                                            <span className="font-mono font-medium">
                                                                {parseFloat(lotProductCostsMap[k]).toFixed(4)} €/kg
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Total: <strong>{affectedBoxes}</strong>{' '}
                                    {affectedBoxes === 1 ? 'caja' : 'cajas'} en{' '}
                                    <strong>{eligible.length}</strong>{' '}
                                    {byProduct ? (eligible.length === 1 ? 'producto' : 'productos') : (eligible.length === 1 ? 'línea' : 'líneas')}.
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
                                        <input type="checkbox" checked={confirmed}
                                            onChange={e => setConfirmed(e.target.checked)}
                                            className="accent-primary" />
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
                            disabled={applying || eligible.length === 0 || (needsConfirmation && !confirmed)}
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

// -------------------------------------------------------------------
// Results section — summary cards + togglable product/lot tables
// -------------------------------------------------------------------

function ResultsSection({ data, productCostsMap, lotProductCostsMap, onProductCostChange, onLotProductCostChange, tab, applyMode, onApplyModeChange }) {
    const summary = data?.summary
    const products = data?.products || []
    const lotProducts = data?.lotProducts || []

    const boxesByProduct = useMemo(() => groupBoxesByProduct(data?.boxes), [data?.boxes])
    const boxesByLotProduct = useMemo(() => groupBoxesByLotProduct(data?.boxes), [data?.boxes])

    const countLabel = tab === 'sales'
        ? { icon: ShoppingCart, label: 'Pedidos afectados', value: summary?.ordersCount }
        : { icon: Warehouse, label: 'Palets afectados', value: summary?.palletsCount ?? summary?.ordersCount }

    return (
        <div className="flex-1 flex flex-col min-h-0 gap-3 mt-3">
            {/* Summary */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4 shrink-0">
                <SummaryMetric icon={Box} label="Cajas sin coste"
                    value={summary?.boxesCount?.toLocaleString('es-ES') ?? '—'} />
                <SummaryMetric icon={Euro} label="Cantidad sin coste"
                    value={summary?.netWeightKg != null ? formatDecimalWeight(summary.netWeightKg) : '—'} />
                <SummaryMetric icon={Package} label="Productos distintos"
                    value={summary?.productsCount?.toLocaleString('es-ES') ?? '—'} />
                <SummaryMetric icon={countLabel.icon} label={countLabel.label}
                    value={countLabel.value?.toLocaleString('es-ES') ?? '—'} />
            </div>

            {/* Mode toggle + table */}
            {products.length === 0 ? (
                <Alert className="shrink-0">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No se encontraron cajas sin coste calculable para los filtros indicados.</AlertDescription>
                </Alert>
            ) : (
                <Card className="flex-1 flex flex-col min-h-0 gap-2">
                    <CardHeader className="pb-1 shrink-0">
                        <div className="flex items-center justify-start gap-3">
                            <Tabs value={applyMode} onValueChange={onApplyModeChange} className="shrink-0">
                                <TabsList>
                                    <TabsTrigger value="product">Por producto</TabsTrigger>
                                    <TabsTrigger value="lot" className="flex items-center gap-1">
                                        <Tag className="h-3 w-3" />
                                        Por lote
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 min-h-0">
                        <div className="h-full overflow-y-auto">
                            {applyMode === 'product' ? (
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
                                                costInput={productCostsMap[product.product.id] ?? ''}
                                                onCostChange={onProductCostChange}
                                                tab={tab}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Lote</TableHead>
                                            <TableHead className="text-right">Cajas</TableHead>
                                            <TableHead className="text-right">Kg totales</TableHead>
                                            <TableHead className="text-right">Coste sugerido</TableHead>
                                            <TableHead className="text-right">Coste a aplicar</TableHead>
                                            <TableHead className="w-8" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lotProducts.map(item => {
                                            const k = lotKey(item.product.id, item.lot)
                                            return (
                                                <LotProductRow
                                                    key={k}
                                                    item={item}
                                                    boxesByLotProduct={boxesByLotProduct}
                                                    costInput={lotProductCostsMap[k] ?? ''}
                                                    onCostChange={onLotProductCostChange}
                                                    tab={tab}
                                                />
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

// -------------------------------------------------------------------
// Tab panel wrapper
// -------------------------------------------------------------------

function TabPanel({ filterCard, resultsData, productCostsMap, lotProductCostsMap, onProductCostChange, onLotProductCostChange, tab, applyMode, onApplyModeChange }) {
    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="shrink-0">{filterCard}</div>
            {resultsData && (
                <ResultsSection
                    data={resultsData}
                    productCostsMap={productCostsMap}
                    lotProductCostsMap={lotProductCostsMap}
                    onProductCostChange={onProductCostChange}
                    onLotProductCostChange={onLotProductCostChange}
                    tab={tab}
                    applyMode={applyMode}
                    onApplyModeChange={onApplyModeChange}
                />
            )}
        </div>
    )
}

// -------------------------------------------------------------------
// Root component
// -------------------------------------------------------------------

export default function CostRegularizationClient() {
    const { data: session } = useSession()
    const [tab, setTab] = useState('sales')
    const today = new Date()
    const defaultFrom = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd')
    const defaultTo = format(today, 'yyyy-MM-dd')

    // Filters
    const [salesFrom, setSalesFrom] = useState(defaultFrom)
    const [salesTo, setSalesTo] = useState(defaultTo)
    const [stockLot, setStockLot] = useState('')
    const [stockFrom, setStockFrom] = useState('')
    const [stockTo, setStockTo] = useState('')

    // Results
    const [salesData, setSalesData] = useState(null)
    const [stockData, setStockData] = useState(null)
    const [loadingSales, setLoadingSales] = useState(false)
    const [loadingStock, setLoadingStock] = useState(false)

    // Cost maps per scope
    const [salesProductCosts, setSalesProductCosts] = useState({})   // { productId: string }
    const [salesLotCosts, setSalesLotCosts] = useState({})            // { "pid::lot": string }
    const [stockProductCosts, setStockProductCosts] = useState({})
    const [stockLotCosts, setStockLotCosts] = useState({})

    // Apply mode per scope (independent)
    const [salesApplyMode, setSalesApplyMode] = useState('product')
    const [stockApplyMode, setStockApplyMode] = useState('product')

    // Dialog
    const [dialogOpen, setDialogOpen] = useState(false)
    const [applying, setApplying] = useState(false)
    const [applyResult, setApplyResult] = useState(null)

    const allowed = hasAllowedRole(session)

    const activeData = tab === 'sales' ? salesData : stockData
    const activeApplyMode = tab === 'sales' ? salesApplyMode : stockApplyMode
    const activeProductCosts = tab === 'sales' ? salesProductCosts : stockProductCosts
    const activeLotCosts = tab === 'sales' ? salesLotCosts : stockLotCosts
    const activeProducts = activeData?.products || []
    const activeLotProducts = activeData?.lotProducts || []

    const handleProductCostChange = useCallback((scope, productId, value) => {
        const setter = scope === 'sales' ? setSalesProductCosts : setStockProductCosts
        setter(prev => ({ ...prev, [productId]: value }))
    }, [])

    const handleLotCostChange = useCallback((scope, key, value) => {
        const setter = scope === 'sales' ? setSalesLotCosts : setStockLotCosts
        setter(prev => ({ ...prev, [key]: value }))
    }, [])

    const salesDateRange = useMemo(
        () => ({
            from: salesFrom ? new Date(`${salesFrom}T00:00:00`) : undefined,
            to: salesTo ? new Date(`${salesTo}T00:00:00`) : undefined,
        }),
        [salesFrom, salesTo]
    )

    const handleSalesDateRangeChange = useCallback((range) => {
        setSalesFrom(range?.from ? format(range.from, 'yyyy-MM-dd') : '')
        setSalesTo(range?.to ? format(range.to, 'yyyy-MM-dd') : '')
    }, [])

    const stockDateRange = useMemo(
        () => ({
            from: stockFrom ? new Date(`${stockFrom}T00:00:00`) : undefined,
            to: stockTo ? new Date(`${stockTo}T00:00:00`) : undefined,
        }),
        [stockFrom, stockTo]
    )

    const handleStockDateRangeChange = useCallback((range) => {
        setStockFrom(range?.from ? format(range.from, 'yyyy-MM-dd') : '')
        setStockTo(range?.to ? format(range.to, 'yyyy-MM-dd') : '')
    }, [])

    async function fetchSales() {
        if (!salesFrom || !salesTo) {
            notify.error({ title: 'Fechas requeridas', description: 'Indica fecha desde y hasta.' })
            return
        }
        setLoadingSales(true)
        setSalesData(null)
        setSalesProductCosts({})
        setSalesLotCosts({})
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
        setStockProductCosts({})
        setStockLotCosts({})
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

    // Items with a valid cost filled in
    const productsWithCost = useMemo(
        () => activeProducts.filter(p => {
            const v = activeProductCosts[p.product.id]
            return v !== undefined && v !== '' && !isNaN(parseFloat(v)) && parseFloat(v) >= 0
        }),
        [activeProducts, activeProductCosts]
    )

    const lotProductsWithCost = useMemo(
        () => activeLotProducts.filter(item => {
            const k = lotKey(item.product.id, item.lot)
            const v = activeLotCosts[k]
            return v !== undefined && v !== '' && !isNaN(parseFloat(v)) && parseFloat(v) >= 0
        }),
        [activeLotProducts, activeLotCosts]
    )

    const filledCount = activeApplyMode === 'product' ? productsWithCost.length : lotProductsWithCost.length

    async function handleApply() {
        const byProduct = activeApplyMode === 'product'
        let result

        if (byProduct) {
            const payload = {
                scope: tab,
                products: productsWithCost.map(p => ({
                    productId: p.product.id,
                    manualCostPerKg: parseFloat(activeProductCosts[p.product.id]),
                })),
                ...(tab === 'sales' ? { dateFrom: salesFrom, dateTo: salesTo } : {}),
            }
            result = await costRegularizationService.applyManualCostsByProduct(payload)
        } else {
            const filters = tab === 'sales'
                ? { dateFrom: salesFrom, dateTo: salesTo }
                : { lot: stockLot || undefined, createdFrom: stockFrom || undefined, createdTo: stockTo || undefined }
            const payload = {
                scope: tab,
                filters,
                lotProductCosts: lotProductsWithCost.map(item => ({
                    productId: item.product.id,
                    lot: item.lot,
                    manualCostPerKg: parseFloat(activeLotCosts[lotKey(item.product.id, item.lot)]),
                })),
            }
            result = await costRegularizationService.applyManualCostsByLotProduct(payload)
        }
        return result
    }

    async function onApply() {
        setApplying(true)
        try {
            const result = await handleApply()
            setApplyResult(result)
            notify.success({ title: 'Costes aplicados', description: `${result.updatedCount ?? ''} cajas actualizadas.` })
            // Clear results so user re-fetches
            if (tab === 'sales') { setSalesData(null); setSalesProductCosts({}); setSalesLotCosts({}) }
            else { setStockData(null); setStockProductCosts({}); setStockLotCosts({}) }
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
            <CardContent>
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1.5 w-full max-w-[340px]">
                        <Label>Rango de fechas de carga</Label>
                        <DateRangePicker dateRange={salesDateRange} onChange={handleSalesDateRangeChange} />
                    </div>
                    <Button onClick={fetchSales} disabled={loadingSales}>
                        {loadingSales ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Buscar
                    </Button>
                </div>
            </CardContent>
        </Card>
    )

    const stockFilterCard = (
        <Card>
            <CardContent>
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1.5">
                        <Label>Lote</Label>
                        <Input placeholder="Opcional" value={stockLot} onChange={e => setStockLot(e.target.value)} className="w-36" />
                    </div>
                    <div className="space-y-1.5 w-full max-w-[340px]">
                        <Label>Rango de fechas de creación</Label>
                        <DateRangePicker dateRange={stockDateRange} onChange={handleStockDateRangeChange} />
                    </div>
                    <Button onClick={fetchStock} disabled={loadingStock}>
                        {loadingStock ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Buscar
                    </Button>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="flex-1 flex flex-col min-h-0 gap-4">
            {/* Header */}
            <div className="shrink-0">
                <h1 className="text-2xl font-semibold">Regularización de costes manuales</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Localiza cajas sin coste calculable y asigna costes manuales por producto o por producto + lote.
                </p>
            </div>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="shrink-0">
                    <TabsTrigger value="sales">
                        <ShoppingCart className="h-4 w-4" />
                        Ventas sin coste
                    </TabsTrigger>
                    <TabsTrigger value="stock">
                        <Warehouse className="h-4 w-4" />
                        Stock actual sin coste
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sales" className="flex-1 flex flex-col min-h-0 mt-0 pt-4">
                    <TabPanel
                        filterCard={salesFilterCard}
                        resultsData={salesData}
                        productCostsMap={salesProductCosts}
                        lotProductCostsMap={salesLotCosts}
                        onProductCostChange={(pid, v) => handleProductCostChange('sales', pid, v)}
                        onLotProductCostChange={(k, v) => handleLotCostChange('sales', k, v)}
                        tab="sales"
                        applyMode={salesApplyMode}
                        onApplyModeChange={setSalesApplyMode}
                    />
                </TabsContent>

                <TabsContent value="stock" className="flex-1 flex flex-col min-h-0 mt-0 pt-4">
                    <TabPanel
                        filterCard={stockFilterCard}
                        resultsData={stockData}
                        productCostsMap={stockProductCosts}
                        lotProductCostsMap={stockLotCosts}
                        onProductCostChange={(pid, v) => handleProductCostChange('stock', pid, v)}
                        onLotProductCostChange={(k, v) => handleLotCostChange('stock', k, v)}
                        tab="stock"
                        applyMode={stockApplyMode}
                        onApplyModeChange={setStockApplyMode}
                    />
                </TabsContent>
            </Tabs>

            {/* Bottom bar */}
            {activeData != null && activeProducts.length > 0 && (
                <div className="shrink-0 space-y-3">
                    <Separator />
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {filledCount === 0
                                ? 'Introduce costes en la tabla para poder aplicar.'
                                : `${filledCount} ${activeApplyMode === 'product'
                                    ? (filledCount === 1 ? 'producto' : 'productos')
                                    : (filledCount === 1 ? 'línea' : 'líneas')} con coste asignado.`}
                        </p>
                        <Button
                            onClick={() => { setApplyResult(null); setDialogOpen(true) }}
                            disabled={filledCount === 0}
                        >
                            <Euro className="h-4 w-4" />
                            Aplicar costes
                        </Button>
                    </div>
                </div>
            )}

            <ApplyDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                applyMode={activeApplyMode}
                productItems={activeProducts}
                lotProductItems={activeLotProducts}
                productCostsMap={activeProductCosts}
                lotProductCostsMap={activeLotCosts}
                onApply={onApply}
                applying={applying}
                result={applyResult}
            />
        </div>
    )
}
