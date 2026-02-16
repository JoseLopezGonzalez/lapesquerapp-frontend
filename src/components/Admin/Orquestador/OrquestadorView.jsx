'use client';

import React, { useMemo, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';
import { formatDateShort } from '@/helpers/formats/dates/formatDates';
import {
  ThermometerSnowflake,
  Package,
  PackagePlus,
  Printer,
  Tag,
  Scan,
  ClipboardList,
  Upload,
  QrCode,
  Link2,
  Layers,
  Download,
  OctagonAlert,
} from 'lucide-react';
import { BsFileEarmarkPdf } from 'react-icons/bs';
import { notify } from '@/lib/notifications';
import { getInitialMockState } from '@/data/mock/orquestador';
import { EmptyState } from '@/components/Utilities/EmptyState';
import OrderCard from '@/components/Admin/OrdersManager/OrdersList/OrderCard';
import { Combobox } from '@/components/Shadcn/Combobox';

const DATE_FILTER_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'tomorrow', label: 'Mañana' },
];

const SCREENS = [
  { id: 'preparacion', label: 'Preparación de pedidos', icon: ClipboardList },
  { id: 'emision', label: 'Impresión de etiquetas', icon: Tag },
];

const LABEL_FORMAT_OPTIONS = [
  { id: 'estandar', label: 'Estándar 100×50 mm' },
  { id: 'caja', label: 'Caja 90×40 mm' },
  { id: 'palet', label: 'Palet 150×100 mm' },
];

const ORDER_EXPORT_DOCUMENTS = [
  { id: 'order-signs', label: 'Letrero de transporte', type: 'pdf' },
  { id: 'order-cmr', label: 'CMR', type: 'pdf' },
  { id: 'restricted-loading-note', label: 'Nota de Carga Restringida', type: 'pdf' },
  { id: 'loading-note', label: 'Nota de Carga', type: 'pdf' },
];

function getLoadDateKey(loadDateIso) {
  if (!loadDateIso) return '';
  return loadDateIso.slice(0, 10);
}

function filterOrdersByDate(orders, dateFilter) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayKey = today.toISOString().slice(0, 10);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);
  const key = dateFilter === 'today' ? todayKey : tomorrowKey;
  return orders.filter((o) => getLoadDateKey(o.loadDate) === key && o.status === 'pending');
}

function statusBadgeVariant(status) {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'finished':
      return 'default';
    case 'incident':
      return 'destructive';
    default:
      return 'outline';
  }
}

function lineStatusColor(status) {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'exceeded':
      return 'bg-amber-500';
    default:
      return 'bg-muted';
  }
}

export default function OrquestadorView() {
  const [mockState, setMockState] = useState(getInitialMockState);
  const [activeScreen, setActiveScreen] = useState('preparacion');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [dateFilter, setDateFilter] = useState('today');
  const [nextPalletId, setNextPalletId] = useState(9012);
  const [currentPalletBoxes, setCurrentPalletBoxes] = useState([]);

  // Pantalla “Escanear etiquetas” (apartado seleccionable)
  const [scannedLabelsBoxes, setScannedLabelsBoxes] = useState([]);
  const [scanLabelsInput, setScanLabelsInput] = useState('');
  const [nextScannedId, setNextScannedId] = useState(20000);
  const scanLabelsInputRef = useRef(null);

  // Pantalla 1 — Emisión
  const [emisionForm, setEmisionForm] = useState({
    productId: '',
    lot: '',
    weightsString: '',
    labelFormatId: '',
    addMethod: 'lines', // 'lines' | 'average'
    totalWeight: '',
    numberOfBoxes: '',
  });
  const [lastGeneratedCount, setLastGeneratedCount] = useState(0);

  // Dialog "Agregar cajas a un pedido" (steps: 1 = pedido, 2 = cómo añadir, 3 = palet si existente)
  const [addCajasDialogOpen, setAddCajasDialogOpen] = useState(false);
  const [addCajasStep, setAddCajasStep] = useState(1);
  const [addCajasOrderId, setAddCajasOrderId] = useState('');
  const [addCajasMode, setAddCajasMode] = useState('new'); // 'new' | 'existing'
  const [addCajasPaletId, setAddCajasPaletId] = useState('');

  const { orders, pallets, products, availableBoxes, nextBoxId } = mockState;

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);
  const addCajasPalletsForOrder = useMemo(
    () => (addCajasOrderId ? pallets.filter((p) => p.orderId === Number(addCajasOrderId)) : []),
    [pallets, addCajasOrderId]
  );

  const activeOrders = useMemo(
    () => filterOrdersByDate(orders, dateFilter),
    [orders, dateFilter]
  );

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const palletsForSelectedOrder = useMemo(() => {
    if (!selectedOrderId) return [];
    return pallets.filter((p) => p.orderId === selectedOrderId);
  }, [pallets, selectedOrderId]);

  // ——— Pantalla 1: Generar cajas (emisión de etiquetas) ———
  const roundToTwoDecimals = (x) => Math.round(x * 100) / 100;

  const handleGenerarCajas = useCallback(() => {
    const productId = emisionForm.productId ? Number(emisionForm.productId) : null;
    const lot = (emisionForm.lot || '').trim();
    const labelFormatId = (emisionForm.labelFormatId || '').trim();

    // Validación: 3 primeros campos y al menos una caja generable
    const missingField = !productId ? 'producto' : !lot ? 'lote' : !labelFormatId ? 'formato de etiqueta' : null;
    if (missingField) {
      notify.error(`Completa los tres primeros campos: producto, lote y formato de etiqueta (falta: ${missingField}).`);
      return;
    }
    if (lot.length !== 14) {
      notify.error('El lote debe tener exactamente 14 caracteres.');
      return;
    }
    let canGenerateAtLeastOne = false;
    if (emisionForm.addMethod === 'average') {
      const totalWeight = (emisionForm.totalWeight || '').trim();
      const numberOfBoxes = (emisionForm.numberOfBoxes || '').trim();
      const n = parseInt(numberOfBoxes, 10);
      const netTotalWeight = parseFloat(totalWeight);
      canGenerateAtLeastOne = totalWeight !== '' && numberOfBoxes !== '' && Number.isInteger(n) && n >= 1 && netTotalWeight > 0 && !Number.isNaN(netTotalWeight);
    } else {
      const weightsString = (emisionForm.weightsString || '').trim();
      const weightsLines = weightsString.split('\n').map((l) => l.trim().replace(',', '.')).filter(Boolean);
      const weights = weightsLines.map((w) => parseFloat(w)).filter((n) => !Number.isNaN(n) && n > 0);
      canGenerateAtLeastOne = weights.length >= 1;
    }
    if (!canGenerateAtLeastOne) {
      notify.error('Indica al menos una caja a generar.');
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      notify.error('Producto no encontrado.');
      return;
    }

    if (emisionForm.addMethod === 'average') {
      const totalWeight = (emisionForm.totalWeight || '').trim();
      const numberOfBoxes = (emisionForm.numberOfBoxes || '').trim();
      if (!totalWeight || !numberOfBoxes) {
        notify.error('Peso total y número de cajas son obligatorios.');
        return;
      }
      const n = parseInt(numberOfBoxes, 10);
      if (!Number.isInteger(n) || n < 1) {
        notify.error('Número de cajas debe ser un entero mayor que 0.');
        return;
      }
      const netTotalWeight = parseFloat(totalWeight);
      if (netTotalWeight <= 0) {
        notify.error('El peso total debe ser mayor que 0.');
        return;
      }
      const averageNetWeight = netTotalWeight / n;
      const standardWeight = roundToTwoDecimals(averageNetWeight);
      let accumulatedWeight = 0;
      const newBoxes = [];
      for (let i = 0; i < n; i++) {
        const boxWeight = i === n - 1
          ? roundToTwoDecimals(netTotalWeight - accumulatedWeight)
          : standardWeight;
        accumulatedWeight += boxWeight;
        newBoxes.push({
          id: nextBoxId + i,
          productId: product.id,
          productName: product.name,
          lot,
          netWeight: boxWeight,
          status: 'available',
        });
      }
      setMockState((prev) => ({
        ...prev,
        availableBoxes: [...prev.availableBoxes, ...newBoxes],
        nextBoxId: prev.nextBoxId + n,
      }));
      setLastGeneratedCount(n);
      setEmisionForm((p) => ({ ...p, totalWeight: '', numberOfBoxes: '' }));
      notify.success(`${n} caja(s) generada(s) por promedio. Estado: Disponible.`);
      return;
    }

    // addMethod === 'lines'
    const weightsString = (emisionForm.weightsString || '').trim();
    const weightsLines = weightsString
      .split('\n')
      .map((l) => l.trim().replace(',', '.'))
      .filter(Boolean);
    const weights = weightsLines.map((w) => parseFloat(w)).filter((n) => !Number.isNaN(n) && n > 0);
    if (weights.length === 0) {
      notify.error('Introduce al menos un peso por línea (una caja por línea).');
      return;
    }
    const newBoxes = weights.map((netWeight, i) => ({
      id: nextBoxId + i,
      productId: product.id,
      productName: product.name,
      lot,
      netWeight: roundToTwoDecimals(netWeight),
      status: 'available',
    }));
    setMockState((prev) => ({
      ...prev,
      availableBoxes: [...prev.availableBoxes, ...newBoxes],
      nextBoxId: prev.nextBoxId + weights.length,
    }));
    setLastGeneratedCount(weights.length);
    setEmisionForm((p) => ({ ...p, weightsString: '' }));
    notify.success(`${weights.length} caja(s) generada(s). Estado: Disponible (pendiente de escaneo).`);
  }, [emisionForm, products, nextBoxId]);

  const handleImprimirEtiquetasEmision = useCallback(() => {
    if (lastGeneratedCount === 0) {
      notify.error('Genera cajas antes de imprimir etiquetas.');
      return;
    }
    notify.success(`Impresión simulada: ${lastGeneratedCount} etiquetas de caja.`);
  }, [lastGeneratedCount]);

  const handleLimpiarCajasEmision = useCallback(() => {
    setMockState((prev) => ({ ...prev, availableBoxes: [] }));
    notify.success('Lista de cajas vaciada.');
  }, []);

  const openAddCajasDialog = useCallback(() => {
    setAddCajasStep(1);
    setAddCajasOrderId('');
    setAddCajasMode('new');
    setAddCajasPaletId('');
    setAddCajasDialogOpen(true);
  }, []);

  const handleAddCajasConfirm = useCallback(() => {
    const orderId = addCajasOrderId ? Number(addCajasOrderId) : null;
    if (!orderId) {
      notify.error('Selecciona un pedido.');
      return;
    }
    if (addCajasMode === 'existing' && !addCajasPaletId) {
      notify.error('Selecciona un palet.');
      return;
    }
    if (availableBoxes.length === 0) {
      notify.error('No hay cajas para añadir. Genera o escanea cajas antes.');
      return;
    }
    const order = orders.find((o) => o.id === orderId);
    const orderLabel = order ? `#${order.id} ${order.customer?.name}` : `#${orderId}`;
    if (addCajasMode === 'new') {
      notify.success(`${availableBoxes.length} caja(s) añadidas al pedido ${orderLabel} como nuevo palet (simulado).`);
    } else {
      const palet = pallets.find((p) => p.id === Number(addCajasPaletId));
      const paletLabel = palet ? `#${palet.id}` : addCajasPaletId;
      notify.success(`${availableBoxes.length} caja(s) añadidas al palet ${paletLabel} del pedido ${orderLabel} (simulado).`);
    }
    setAddCajasDialogOpen(false);
  }, [addCajasOrderId, addCajasMode, addCajasPaletId, availableBoxes.length, orders, pallets]);

  // ——— Pantalla 2: Escanear caja y añadir al palet ———
  const handleConfirmarPalet = useCallback(() => {
    if (currentPalletBoxes.length === 0) {
      notify.error('Añade al menos una caja al palet.');
      return;
    }
    const orderId = selectedOrderId || null;
    const productsNames = [...new Set(currentPalletBoxes.map((b) => b.productName))];
    const lots = [...new Set(currentPalletBoxes.map((b) => b.lot))];
    const numberOfBoxes = currentPalletBoxes.length;
    const netWeight = currentPalletBoxes.reduce((s, b) => s + b.netWeight, 0);

    const newPallet = {
      id: nextPalletId,
      orderId,
      receptionId: null,
      productsNames,
      lots,
      numberOfBoxes,
      netWeight: Math.round(netWeight * 1000) / 1000,
    };

    setMockState((prev) => {
      const newPallets = [...prev.pallets, newPallet];
      let newOrders = prev.orders;
      if (orderId && currentPalletBoxes.length > 0) {
        const byProduct = currentPalletBoxes.reduce((acc, b) => {
          if (!acc[b.productId]) acc[b.productId] = { boxes: 0, weight: 0 };
          acc[b.productId].boxes += 1;
          acc[b.productId].weight += b.netWeight;
          return acc;
        }, {});
        newOrders = prev.orders.map((ord) => {
          if (ord.id !== orderId) return ord;
          const progress = ord.productProgress.map((line) => {
            const add = byProduct[line.product.id];
            if (!add) return line;
            return {
              ...line,
              completedQuantity: line.completedQuantity + add.weight,
              completedBoxes: line.completedBoxes + add.boxes,
              remainingQuantity: line.remainingQuantity - add.weight,
              remainingBoxes: line.remainingBoxes - add.boxes,
              status:
                line.remainingBoxes - add.boxes <= 0
                  ? line.remainingQuantity - add.weight <= 0
                    ? 'completed'
                    : 'exceeded'
                  : 'pending',
            };
          });
          return {
            ...ord,
            productProgress: progress,
            palletIds: [...(ord.palletIds || []), newPallet.id],
          };
        });
      }
      return { ...prev, orders: newOrders, pallets: newPallets };
    });
    setNextPalletId((id) => id + 1);
    setCurrentPalletBoxes([]);
    notify.success(`Palet #${newPallet.id} cerrado (simulado). ${numberOfBoxes} cajas.`);
  }, [currentPalletBoxes, selectedOrderId, nextPalletId]);

  const handleFinishOrder = useCallback(() => {
    if (!selectedOrderId) {
      notify.error('Selecciona un pedido.');
      return;
    }
    setMockState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === selectedOrderId ? { ...o, status: 'finished' } : o
      ),
    }));
    notify.success(`Pedido #${selectedOrderId} marcado como Terminado (simulado).`);
  }, [selectedOrderId]);

  // Overlay “Escanear etiquetas”: añadir caja al escanear (simulado)
  const handleScanLabelSubmit = useCallback(
    (e) => {
      e?.preventDefault();
      const value = (scanLabelsInput || '').trim();
      if (!value) return;
      const product = products[0];
      if (!product) return;
      const newBox = {
        id: nextScannedId,
        productId: product.id,
        productName: product.name,
        lot: value.slice(0, 20) || 'ESCAN',
        netWeight: 20 + Math.round(Math.random() * 200) / 100,
      };
      setScannedLabelsBoxes((prev) => [...prev, newBox]);
      setNextScannedId((id) => id + 1);
      setScanLabelsInput('');
      scanLabelsInputRef.current?.focus();
    },
    [scanLabelsInput, products, nextScannedId]
  );

  const removeScannedLabelBox = useCallback((box) => {
    setScannedLabelsBoxes((prev) => prev.filter((b) => b.id !== box.id));
  }, []);

  const finishScanLabels = useCallback(() => {
    if (scannedLabelsBoxes.length > 0) {
      setMockState((prev) => ({
        ...prev,
        availableBoxes: [...prev.availableBoxes, ...scannedLabelsBoxes],
        nextBoxId: Math.max(prev.nextBoxId, nextScannedId),
      }));
      const count = scannedLabelsBoxes.length;
      setScannedLabelsBoxes([]);
      setActiveScreen('preparacion');
      notify.success(`${count} caja(s) pasan a disponibles.`);
    } else {
      setActiveScreen('preparacion');
    }
  }, [scannedLabelsBoxes, nextScannedId]);

  const goToPreparacionWithoutSaving = useCallback(() => {
    setScannedLabelsBoxes([]);
    setActiveScreen('preparacion');
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-muted/30">
      {/* Tabs: Pantalla 1 vs Pantalla 2 */}
      <header className="flex shrink-0 flex-col gap-2 border-b bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          {SCREENS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveScreen(id)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                activeScreen === id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {activeScreen === 'emision' ? (
        /* ——— Pantalla 1: Impresión de etiquetas ——— */
        <main className="flex min-h-0 flex-1 gap-4 overflow-auto p-4">
          <Card className="flex min-w-0 flex-1 flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="h-5 w-5" />
                Impresión de etiquetas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-4">
              <div>
                <Label htmlFor="em-product">Producto</Label>
                <Combobox
                  id="em-product"
                  className="mt-1"
                  options={products.map((prod) => ({ value: prod.id, label: prod.name }))}
                  value={emisionForm.productId === '' ? '' : Number(emisionForm.productId)}
                  onChange={(v) => setEmisionForm((p) => ({ ...p, productId: v === '' || v == null ? '' : String(v) }))}
                  placeholder="Selecciona producto"
                  searchPlaceholder="Buscar producto..."
                  notFoundMessage="Ningún producto encontrado."
                />
              </div>
              <div>
                <Label htmlFor="em-lot">Lote</Label>
                <Input
                  id="em-lot"
                  value={emisionForm.lot}
                  onChange={(e) => setEmisionForm((p) => ({ ...p, lot: e.target.value }))}
                  placeholder="Ej. LOT-2025-001"
                  className={`mt-1 ${emisionForm.lot.length > 0 && emisionForm.lot.length !== 14 ? 'border-amber-300 dark:border-amber-600 focus-visible:ring-amber-500/30' : ''}`}
                  aria-invalid={emisionForm.lot.length > 0 && emisionForm.lot.length !== 14}
                  maxLength={14}
                />
                {emisionForm.lot.length > 0 && emisionForm.lot.length !== 14 && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-500" role="alert">
                    El lote debe tener exactamente 14 caracteres ({emisionForm.lot.length}/14).
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="em-format">Formato de etiqueta</Label>
                <Combobox
                  id="em-format"
                  className="mt-1"
                  options={LABEL_FORMAT_OPTIONS.map((opt) => ({ value: opt.id, label: opt.label }))}
                  value={emisionForm.labelFormatId}
                  onChange={(v) => setEmisionForm((p) => ({ ...p, labelFormatId: v === '' || v == null ? '' : String(v) }))}
                  placeholder="Selecciona formato"
                  searchPlaceholder="Buscar formato..."
                  notFoundMessage="Ningún formato encontrado."
                />
              </div>
              <Tabs
                value={emisionForm.addMethod}
                onValueChange={(v) => setEmisionForm((p) => ({ ...p, addMethod: v }))}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="lines" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Masivo
                  </TabsTrigger>
                  <TabsTrigger value="average" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Promedio
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="lines" className="space-y-0 mt-3">
                  <div>
                    <Label htmlFor="em-weights">Pesos en kg (uno por línea = una caja)</Label>
                    <Textarea
                      id="em-weights"
                      value={emisionForm.weightsString}
                      onChange={(e) => setEmisionForm((p) => ({ ...p, weightsString: e.target.value }))}
                      placeholder={'20.5\n19.8\n21.2'}
                      rows={5}
                      className="mt-1 font-mono text-sm"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="average" className="space-y-4 mt-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="em-total-weight">Peso total (kg)</Label>
                      <Input
                        id="em-total-weight"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={emisionForm.totalWeight}
                        onChange={(e) => setEmisionForm((p) => ({ ...p, totalWeight: e.target.value }))}
                        className="mt-1 text-right"
                      />
                    </div>
                    <div>
                      <Label htmlFor="em-num-boxes">Número de cajas</Label>
                      <Input
                        id="em-num-boxes"
                        type="number"
                        min="1"
                        placeholder="0"
                        value={emisionForm.numberOfBoxes}
                        onChange={(e) => setEmisionForm((p) => ({ ...p, numberOfBoxes: e.target.value }))}
                        className="mt-1 text-right"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerarCajas} className="w-full sm:w-auto">
                <Package className="mr-2 h-4 w-4" />
                Generar cajas
              </Button>
            </CardFooter>
          </Card>
          <Card className="flex min-w-0 flex-1 flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cajas ({availableBoxes.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col p-4 pt-0">
              <div className="border rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
                {availableBoxes.length === 0 ? (
                  <div className="flex-1 min-h-0 flex items-center justify-center p-4">
                    <EmptyState
                      icon={<Package className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                      title="No hay cajas disponibles"
                      description="Genera cajas en el formulario de la izquierda"
                    />
                  </div>
                ) : (
                  <div className="overflow-y-auto flex-1 min-h-0 w-full">
                    <table className="w-full caption-bottom text-sm">
                      <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                        <TableRow>
                          <TableHead className="min-w-[200px]">Artículo</TableHead>
                          <TableHead className="min-w-[170px] w-[170px]">Lote</TableHead>
                          <TableHead className="min-w-[100px] w-[100px] text-right">Peso Neto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableBoxes.map((b) => (
                          <TableRow key={b.id} className="cursor-default">
                            <TableCell className="font-medium">{b.productName}</TableCell>
                            <TableCell className="text-muted-foreground">{b.lot}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatDecimalWeight(b.netWeight)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Limpiar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader className="items-center">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                      <OctagonAlert className="h-7 w-7 text-destructive" />
                    </div>
                    <AlertDialogTitle>¿Vaciar lista de cajas?</AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-[15px]">
                      Se eliminarán todas las cajas de la lista. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-2 sm:justify-center">
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                      onClick={handleLimpiarCajasEmision}
                    >
                      Vaciar lista
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleImprimirEtiquetasEmision} className="w-full sm:w-auto">
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir etiquetas
                </Button>
                <Button variant="outline" onClick={openAddCajasDialog} className="w-full sm:w-auto">
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Agregar cajas a un pedido
                </Button>
              </div>
            </CardFooter>
          </Card>
        </main>
      ) : activeScreen === 'escanear' ? (
        /* ——— Pantalla: Escanear etiquetas ——— */
        <main className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
          <Card className="flex min-h-0 flex-1 flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scan className="h-5 w-5" />
                Escanear etiquetas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {scannedLabelsBoxes.length} caja{scannedLabelsBoxes.length !== 1 ? 's' : ''} escaneada{scannedLabelsBoxes.length !== 1 ? 's' : ''}
              </p>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-4 pt-0">
              <form onSubmit={handleScanLabelSubmit}>
                <Label htmlFor="scan-labels-input" className="sr-only">Código o referencia</Label>
                <Input
                  id="scan-labels-input"
                  ref={scanLabelsInputRef}
                  type="text"
                  placeholder="Escanea etiqueta o introduce referencia..."
                  value={scanLabelsInput}
                  onChange={(e) => setScanLabelsInput(e.target.value)}
                  className="font-mono w-full"
                />
              </form>
              <div className="min-h-0 flex-1 rounded-lg border overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1 min-h-0">
                  <table className="w-full caption-bottom text-sm">
                    <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                      <TableRow>
                        <TableHead className="min-w-[180px]">Artículo</TableHead>
                        <TableHead className="min-w-[120px]">Lote</TableHead>
                        <TableHead className="min-w-[90px] text-right">Peso neto</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scannedLabelsBoxes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                            Escanea etiquetas para ir generando cajas en la tabla.
                          </TableCell>
                        </TableRow>
                      ) : (
                        scannedLabelsBoxes.map((b) => (
                          <TableRow key={b.id} className="cursor-default">
                            <TableCell className="font-medium">{b.productName}</TableCell>
                            <TableCell className="text-muted-foreground">{b.lot}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatDecimalWeight(b.netWeight)}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-muted-foreground hover:text-destructive"
                                onClick={() => removeScannedLabelBox(b)}
                              >
                                Quitar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </table>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between gap-2">
              <Button variant="outline" onClick={goToPreparacionWithoutSaving}>
                Volver
              </Button>
              <Button onClick={finishScanLabels}>
                Crear palet
              </Button>
            </CardFooter>
          </Card>
        </main>
      ) : (
        /* ——— Pantalla: Preparación de pedidos (por escaneo) ——— */
        <>
          <div className="flex min-h-0 flex-1">
            <aside className="flex w-full sm:w-[300px] flex-shrink-0 flex-col border-r bg-card">
              <div className="flex-shrink-0 border-b px-3 pt-2 sm:pt-3 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold dark:text-white">Pedidos activos</h2>
                    {activeOrders.length > 0 && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {activeOrders.length} pedido{activeOrders.length !== 1 ? 's' : ''} encontrado{activeOrders.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[120px] shrink-0 h-9">
                      <SelectValue placeholder="Fecha" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FILTER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden px-3">
                <ScrollArea className="h-full">
                  <div className={`flex flex-col gap-3 pt-2 pb-4 ${activeOrders.length === 0 ? 'min-h-[70vh]' : ''}`}>
                  {activeOrders.length === 0 ? (
                    <div className="flex flex-1 min-h-[60vh] items-center justify-center px-2 py-6">
                      <EmptyState
                        icon={<ClipboardList className="h-12 w-12 text-muted-foreground" strokeWidth={1.5} />}
                        title="Sin pedidos activos"
                        description={`No hay pedidos para ${dateFilter === 'today' ? 'hoy' : 'mañana'}. Cambia la fecha o espera a que se asignen pedidos.`}
                      />
                    </div>
                  ) : (
                    activeOrders.map((order) => {
                      const orderForCard = {
                        ...order,
                        customer: { name: order.customer?.name ?? 'Sin cliente' },
                        numberOfBoxes: null,
                      };
                      return (
                        <div key={order.id}>
                          <OrderCard
                            order={orderForCard}
                            onClick={() => setSelectedOrderId(order.id)}
                            disabled={false}
                            isSelected={selectedOrderId === order.id}
                          />
                        </div>
                      );
                    })
                  )}
                  </div>
                </ScrollArea>
              </div>
            </aside>

            <main className="flex min-w-0 flex-1 flex-col min-h-0 p-4">
              {!selectedOrder ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center text-muted-foreground">
                  Selecciona un pedido de la lista.
                </div>
              ) : (
                <Card className="flex flex-1 flex-col min-h-0 overflow-hidden">
                  <CardContent className="flex flex-col gap-4 pt-4 flex-1 min-h-0 overflow-auto">
                  <Card className="shrink-0">
                    <CardContent className="space-y-3 pt-4">
                      {(selectedOrder.productProgress || []).map((line) => (
                        <div key={line.product.id}>
                          <div className="flex justify-between text-sm">
                            <span>{line.product.name}</span>
                            <span className="tabular-nums">
                              {line.completedBoxes}/{line.plannedBoxes} cajas ·{' '}
                              {formatDecimalWeight(line.completedQuantity)} / {formatDecimalWeight(line.plannedQuantity)}
                            </span>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${lineStatusColor(line.status)}`}
                              style={{
                                width: `${Math.min(100, (line.completedBoxes / line.plannedBoxes) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                    <div className="flex flex-col gap-4 min-h-0">
                      <div className="grid grid-cols-2 gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={() => setActiveScreen('escanear')}
                          className="gap-2 py-6"
                        >
                          <QrCode className="h-5 w-5" />
                          Crear palet
                        </Button>
                        <Button type="button" variant="outline" size="lg" className="gap-2 py-6">
                          <Link2 className="h-5 w-5" />
                          Vincular palet
                        </Button>
                      </div>
                      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        <CardHeader className="pb-2 shrink-0">
                          <CardTitle className="text-base">Observaciones de producción</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 overflow-auto">
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            Prioridad carga por la mañana. Cliente confirma llegada camión 12:00.

                            Atún fresco salida de túnel a las 10:30. Lote LOT-2025-001 listo para etiquetado.

                            Control OK en primera partida. Segunda partida en proceso.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="shrink-0">
                        <CardContent className="pt-4">
                          <div className="grid gap-2">
                            {ORDER_EXPORT_DOCUMENTS.map((doc) => (
                              <Button
                                key={doc.id}
                                variant="outline"
                                className="justify-start"
                                onClick={() => {
                                  notify.success(`Descarga de "${doc.label}" para pedido #${selectedOrderId} (simulado). En producción usarás el gestor de pedidos.`);
                                }}
                              >
                                <BsFileEarmarkPdf className="h-4 w-4 mr-2 shrink-0" />
                                {doc.label}
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="flex flex-col min-h-0 flex-1 min-w-0 overflow-hidden">
                      {palletsForSelectedOrder.length === 0 ? (
                        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                          Aún no hay palets para este pedido.
                        </p>
                      ) : (
                        <div className="flex-1 min-h-0 space-y-2 overflow-y-auto">
                          {palletsForSelectedOrder.map((pallet) => (
                            <Card key={pallet.id} className="p-3 shrink-0">
                              <div>
                                <p className="font-medium">Palet #{pallet.id}</p>
                                <p className="text-xs text-muted-foreground">
                                  {pallet.productsNames.join(', ')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {pallet.lots.join(', ')}
                                </p>
                                <p className="mt-1 text-sm tabular-nums">
                                  {formatInteger(pallet.numberOfBoxes)} cajas · {formatDecimalWeight(pallet.netWeight)}
                                </p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  </CardContent>
                  <CardFooter className="flex shrink-0 items-center justify-end gap-3 border-t px-4 py-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline">Finalizar</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader className="items-center">
                          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                            <OctagonAlert className="h-7 w-7 text-muted-foreground" />
                          </div>
                          <AlertDialogTitle>¿Finalizar pedido #{selectedOrderId}?</AlertDialogTitle>
                          <AlertDialogDescription className="text-center text-[15px]">
                            El pedido se marcará como terminado. Puedes revertir esta acción desde el gestor de pedidos si es necesario.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-2 sm:justify-center">
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-foreground text-background shadow-sm hover:bg-foreground/90"
                            onClick={handleFinishOrder}
                          >
                            Finalizar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              )}
            </main>
          </div>
        </>
      )}

      <Dialog open={addCajasDialogOpen} onOpenChange={setAddCajasDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {addCajasStep === 1 && 'Selecciona el pedido'}
              {addCajasStep === 2 && '¿Cómo quieres añadir las cajas?'}
              {addCajasStep === 3 && 'Selecciona un palet'}
            </DialogTitle>
          </DialogHeader>

          {addCajasStep === 1 && (
            <ScrollArea className="max-h-[min(60vh,320px)] pr-3">
              <div className="flex flex-col gap-2 py-1">
                {pendingOrders.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No hay pedidos pendientes.</p>
                ) : (
                  pendingOrders.map((order) => {
                    const isSelected = addCajasOrderId === String(order.id);
                    const loadDateStr = order.loadDate ? formatDateShort(order.loadDate) : null;
                    return (
                      <Card
                        key={order.id}
                        className={`cursor-pointer border-l-4 py-2.5 px-3 transition-colors hover:bg-accent/50 ${
                          isSelected ? 'border-l-primary bg-primary/10' : 'border-l-orange-500'
                        }`}
                        onClick={() => setAddCajasOrderId(String(order.id))}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">#{order.id} · {order.customer?.name ?? 'Sin cliente'}</p>
                            {loadDateStr && (
                              <p className="text-xs text-muted-foreground">{loadDateStr}</p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          )}

          {addCajasStep === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
              <Card
                className={`cursor-pointer transition-colors border py-6 px-4 flex flex-col items-center justify-center gap-2 hover:bg-accent/50 ${
                  addCajasMode === 'new' ? 'bg-accent border-primary/30 ring-1 ring-primary/30' : 'border-border bg-card'
                }`}
                onClick={() => setAddCajasMode('new')}
              >
                <PackagePlus className="h-10 w-10 text-muted-foreground" />
                <span className="text-sm font-medium text-center">Añadir como nuevo palet</span>
              </Card>
              <Card
                className={`cursor-pointer transition-colors border py-6 px-4 flex flex-col items-center justify-center gap-2 hover:bg-accent/50 ${
                  addCajasMode === 'existing' ? 'bg-accent border-primary/30 ring-1 ring-primary/30' : 'border-border bg-card'
                }`}
                onClick={() => setAddCajasMode('existing')}
              >
                <Layers className="h-10 w-10 text-muted-foreground" />
                <span className="text-sm font-medium text-center">Añadir a un palet existente</span>
              </Card>
            </div>
          )}

          {addCajasStep === 3 && (
            <ScrollArea className="max-h-[min(60vh,280px)] pr-3">
              <div className="flex flex-col gap-2 py-1">
                {addCajasPalletsForOrder.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Este pedido no tiene palets.</p>
                ) : (
                  addCajasPalletsForOrder.map((palet) => {
                    const isSelected = addCajasPaletId === String(palet.id);
                    return (
                      <Card
                        key={palet.id}
                        className={`cursor-pointer border-l-4 py-2.5 px-3 transition-colors hover:bg-accent/50 ${
                          isSelected ? 'border-l-primary bg-primary/10' : 'border-l-muted-foreground/50'
                        }`}
                        onClick={() => setAddCajasPaletId(String(palet.id))}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm">Palet #{palet.id}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {palet.productsNames?.join(', ') ?? '-'} · {formatInteger(palet.numberOfBoxes)} cajas
                            </p>
                          </div>
                          {isSelected && (
                            <div className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="flex-row justify-between sm:justify-between">
            <div className="flex gap-2">
              {addCajasStep > 1 ? (
                <Button variant="outline" onClick={() => setAddCajasStep((s) => s - 1)}>
                  Atrás
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => setAddCajasDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
            <div>
              {addCajasStep === 1 && (
                <Button
                  onClick={() => setAddCajasStep(2)}
                  disabled={!addCajasOrderId}
                >
                  Siguiente
                </Button>
              )}
              {addCajasStep === 2 && (
                addCajasMode === 'new' ? (
                  <Button onClick={handleAddCajasConfirm}>Añadir cajas</Button>
                ) : (
                  <Button onClick={() => setAddCajasStep(3)}>Siguiente</Button>
                )
              )}
              {addCajasStep === 3 && (
                <Button
                  onClick={handleAddCajasConfirm}
                  disabled={!addCajasPaletId}
                >
                  Añadir cajas
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
