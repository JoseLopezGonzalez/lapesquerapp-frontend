'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { PALLET_LABEL_SIZE } from '@/configs/config';

import {
  Copy,
  Trash2,
  Scan,
  Plus,
  Upload,
  Package,
  FileText,
  Edit,
  Eye,
  CloudAlert,
  RotateCcw,
  ChevronDown,
  ChevronsUpDown,
  ListChevronsUpDown,
  ListChevronsDownUp,
  Box,
  Truck,
  Layers,
  Weight,
  Link2Off,
  Printer,
  AlertCircle,
  Factory,
  CheckCircle,
  Loader2,
  ExternalLink,
  Minus,
  History,
  Euro,
  Images,
  Hash,
} from 'lucide-react';
import { PiShrimp } from 'react-icons/pi';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Combobox } from '@/components/Shadcn/Combobox';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState';

import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { formatDateShort, formatDateHour } from '@/helpers/formats/dates/formatDates';

import { usePallet, saveDiscountPreferences } from '@/hooks/usePallet';
import { usePalletTimeline } from '@/hooks/usePalletTimeline';
import type { PalletBox, PalletState } from '@/hooks/pallets/palletHelpers';
import { usePrintElement } from '@/hooks/usePrintElement';
import PalletLabel from '@/components/Admin/Pallets/PalletLabel';
import SummaryPieChart from './SummaryPieChart';
import PalletImagesTab from './PalletImagesTab';
import { notify } from '@/lib/notifications';
import { deletePalletTimeline, downloadPalletExpeditionLabel } from '@/services/palletService';
import { getProductionByLot } from '@/services/productionService';
import BoxesLabels from './BoxesLabels';
import { PalletTimeline } from './PalletTimeline';
import { canDeletePallet, canManagePalletCostFields, isExternalActor } from '@/lib/auth/actor';

interface PalletViewProps {
  palletId?: string | number | null;
  onChange?: (...args: unknown[]) => unknown;
  initialStoreId?: string | number | null;
  initialOrderId?: string | number | null;
  wrappedInDialog?: boolean;
  onSaveTemporal?: ((pallet: unknown) => void) | null;
  initialPallet?: unknown;
  readOnly?: boolean;
  initialTab?: string | null;
  onHasPalletChangesChange?: (hasChanges: boolean) => void;
}

export default function PalletView({
  palletId,
  onChange = () => {},
  initialStoreId = null,
  initialOrderId = null,
  wrappedInDialog = false,
  onSaveTemporal = null,
  initialPallet = null,
  readOnly: readOnlyProp = false,
  initialTab = null,
  onHasPalletChangesChange,
}: PalletViewProps) {
  const {
    productsOptions,
    productsLoading,
    boxCreationData,
    boxCreationDataChange,
    loading,
    saving,
    temporalPallet,
    error,
    temporalProductsSummary,
    temporalTotalProducts,
    temporalTotalLots,
    onResetBoxCreationData,
    activeOrdersOptions,
    activeOrdersLoading,
    editPallet,
    onAddNewBox,
    deleteAllBoxes,
    resetAllChanges,
    getPieChartData,
    onSavingChanges,
    onClose,
    setBoxPrinted,
    hasPalletChanges = false,
  } = usePallet({ id: palletId ?? null, onChange, initialStoreId: initialStoreId ?? null, initialOrderId: initialOrderId ?? null, initialPallet: initialPallet as PalletState | null | undefined });

  type ActiveOrderOption = { id: string; name: string; load_date: string };
  const typedActiveOrdersOptions = activeOrdersOptions as ActiveOrderOption[] | undefined;

  const {
    timeline,
    loading: timelineLoading,
    error: timelineError,
    refetch: refetchTimeline,
  } = usePalletTimeline(palletId);
  const showHistorialTab = palletId && palletId !== 'new' && !String(palletId).startsWith('temp-');
  const [mainTab, setMainTab] = useState(initialTab ?? 'edicion');
  const [deletingTimeline, setDeletingTimeline] = useState(false);
  const [resolvingProductionLot, setResolvingProductionLot] = useState<string | null>(null);
  const [isDownloadingExpeditionLabel, setIsDownloadingExpeditionLabel] = useState(false);

  // Estado de expansión de los eventos del historial
  const [timelineOpenStates, setTimelineOpenStates] = useState(() =>
    timeline?.length ? timeline.map(() => true) : []
  );

  useEffect(() => {
    if (!timeline?.length) {
      setTimelineOpenStates([]);
      return;
    }
    setTimelineOpenStates((prev) => {
      if (prev.length !== timeline.length) {
        return timeline.map((_, i) => prev[i] ?? true);
      }
      return prev;
    });
  }, [timeline?.length]);

  const allTimelineOpen = timelineOpenStates.length > 0 && timelineOpenStates.every(Boolean);

  const handleToggleAllTimeline = () => {
    setTimelineOpenStates((prev) => prev.map(() => !allTimelineOpen));
  };

  const { data: session } = useSession();
  const rawRole = session?.user?.role;
  const roles = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];
  const externalActor = isExternalActor(session?.user);
  const canDeleteTimeline =
    !externalActor && roles.some((r) => r === 'administrador' || r === 'tecnico');
  const canDeletePalletData = canDeletePallet(session?.user);
  const canEditCost = canManagePalletCostFields(session?.user);
  const canPrintExpeditionLabels = !roles.includes('comercial');

  const orderIdBlocked = initialOrderId !== null;

  // Check if pallet belongs to a reception or is locked (e.g. linked to order)
  const receptionId = temporalPallet?.receptionId as string | number | null | undefined;
  const belongsToReception = receptionId !== null && receptionId !== undefined;
  const isReadOnly = belongsToReception || readOnlyProp;

  useEffect(() => {
    onHasPalletChangesChange?.(hasPalletChanges && !isReadOnly);
  }, [hasPalletChanges, isReadOnly, onHasPalletChangesChange]);

  const { onPrint } = usePrintElement({
    id: 'print-area-id',
    width: parseInt(PALLET_LABEL_SIZE.width) || 110,
    height: parseInt(PALLET_LABEL_SIZE.height) || 150,
  });

  const handleOnClickPrintLabel = () => {
    onPrint();
  };

  const handleOnClickDownloadExpeditionLabel = async () => {
    if (!canPrintExpeditionLabels) {
      notify.error({
        title: 'Documento no disponible',
        description: 'Este documento no está disponible para el rol Comercial.',
      });
      return;
    }
    const effectivePalletId = temporalPallet?.id ?? palletId;
    if (
      !effectivePalletId ||
      effectivePalletId === 'new' ||
      String(effectivePalletId).startsWith('temp-')
    ) {
      notify.error({
        title: 'Guarda el palet antes de imprimir',
        description: 'La etiqueta de expedición solo está disponible para palets guardados.',
      });
      return;
    }

    setIsDownloadingExpeditionLabel(true);
    try {
      await notify.promise(downloadPalletExpeditionLabel(effectivePalletId), {
        loading: {
          title: 'Generando etiqueta',
          description: `Preparando la etiqueta de expedición del palet #${effectivePalletId}.`,
        },
        success: {
          title: 'Etiqueta generada',
          description: 'El PDF ya está listo para descarga.',
        },
        error: (err: unknown) => {
          const e = err as Record<string, unknown>;
          const data = e?.data as Record<string, unknown> | undefined;
          const responseData = (e?.response as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined;
          return {
            title: 'Error al generar la etiqueta',
            description:
              (e?.userMessage as string) ||
              (data?.userMessage as string) ||
              (responseData?.userMessage as string) ||
              (e?.message as string) ||
              'No se pudo generar la etiqueta de expedición.',
          };
        },
      });
    } finally {
      setIsDownloadingExpeditionLabel(false);
    }
  };

  const handleOpenProductionByLot = async (lot: string) => {
    const trimmedLot = typeof lot === 'string' ? lot.trim() : '';
    if (!trimmedLot || resolvingProductionLot) return;

    setResolvingProductionLot(trimmedLot);
    try {
      const res = await getProductionByLot(trimmedLot);
      const productionId = res?.data?.id;
      if (productionId) {
        window.open(`/admin/productions/${productionId}`, '_blank', 'noopener,noreferrer');
      } else {
        notify.error({
          title: 'Producción no encontrada',
          description: 'No existe ninguna producción con ese lote.',
        });
      }
    } catch (err) {
      notify.error({
        title: 'Producción no encontrada',
        description: (err as { message?: string })?.message || 'No existe ninguna producción con ese lote.',
      });
    } finally {
      setResolvingProductionLot(null);
    }
  };

  const handleDeleteTimeline = () => {
    if (!palletId || deletingTimeline) return;
    setDeleteTimelineConfirmOpen(true);
  };

  const handleConfirmDeleteTimeline = async () => {
    if (!palletId) return;
    setDeletingTimeline(true);
    try {
      const res = await deletePalletTimeline(palletId);
      notify.success({ title: res?.message || 'Historial borrado correctamente' });
      refetchTimeline();
    } catch (err) {
      notify.error({ title: (err as { message?: string })?.message || 'Error al borrar el historial' });
    } finally {
      setDeletingTimeline(false);
    }
  };

  const [selectedBox, setSelectedBox] = useState<number | string | null>(null);
  const [activeTab, setActiveTab] = useState('disponibles');
  const [addBoxesTab, setAddBoxesTab] = useState('lector');
  const [deleteBoxConfirmId, setDeleteBoxConfirmId] = useState<number | string | null>(null);
  const [deleteTimelineConfirmOpen, setDeleteTimelineConfirmOpen] = useState(false);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const [bulkActionType, setBulkActionType] = useState<string | null>(null); // 'lot', 'weight', 'weightAdd' o 'product'
  const [bulkActionValue, setBulkActionValue] = useState('');
  const [weightOperation, setWeightOperation] = useState('add'); // 'add' o 'subtract'
  const [oldProductId, setOldProductId] = useState('');
  const [newProductId, setNewProductId] = useState('');

  useEffect(() => {
    if (addBoxesTab === 'lector' && scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, [addBoxesTab]);

  // Obtener productos únicos disponibles en el palet
  const availableProductsInPallet = useMemo(() => {
    if (!temporalPallet?.boxes) return [];
    const productMap = new Map<number | string, { value: number | string; label: string }>();
    temporalPallet.boxes
      .filter((box) => box.isAvailable !== false && box.product?.id)
      .forEach((box) => {
        const product = box.product as { id: number | string; name: string; alias?: string } | null;
        if (product && !productMap.has(product.id)) {
          productMap.set(product.id, {
            value: product.id,
            label: product.name || product.alias || 'Producto sin nombre',
          });
        }
      });
    return Array.from(productMap.values());
  }, [temporalPallet?.boxes]);

  const handleOnClickBoxRow = (boxId: number | string) => {
    if (selectedBox === boxId) {
      setSelectedBox(null);
    } else {
      setSelectedBox(boxId);
    }
  };

  const handleOnChangeBoxLot = (boxId: number | string, lot: string) => {
    if (isReadOnly) return;
    // Check if box is available before allowing edit
    const box = temporalPallet?.boxes?.find((b) => b.id === boxId);
    if (box && !isBoxAvailable(box)) {
      notify.error({
        title: 'Caja en uso',
        description: `No se puede modificar el lote de la caja #${boxId}: está siendo usada en producción.`,
      });
      return;
    }
    editPallet.box.edit.lot(boxId, lot);
  };

  const handleOnChangeBoxNetWeight = (boxId: number | string, netWeight: number | string) => {
    if (isReadOnly) return;
    // Check if box is available before allowing edit
    const box = temporalPallet?.boxes?.find((b) => b.id === boxId);
    if (box && !isBoxAvailable(box)) {
      notify.error({
        title: 'Caja en uso',
        description: `No se puede modificar el peso de la caja #${boxId}: está siendo usada en producción.`,
      });
      return;
    }
    editPallet.box.edit.netWeight(boxId, netWeight);
  };

  const handleOnChangeBoxManualCost = (boxId: number | string, value: number | string) => {
    if (isReadOnly) return;
    editPallet.box.edit.manualCostPerKg(boxId, value);
  };

  const handleOnClickDuplicateBox = (boxId: number | string) => {
    if (isReadOnly) return;
    // Check if box is available before allowing duplicate
    const box = temporalPallet?.boxes?.find((b) => b.id === boxId);
    if (box && !isBoxAvailable(box)) {
      notify.error({
        title: 'Caja en uso',
        description: `No se puede duplicar la caja #${boxId}: está siendo usada en producción.`,
      });
      return;
    }
    editPallet.box.duplicate(boxId);
  };

  const handleOnClickDeleteBox = (boxId: number | string) => {
    if (isReadOnly) return;
    const box = temporalPallet?.boxes?.find((b) => b.id === boxId);
    if (box && !isBoxAvailable(box)) {
      const productionInfo = getBoxProductionInfo(box);
      const productionText = productionInfo
        ? ` (Producción #${productionInfo.id}${productionInfo.lot ? `, Lote: ${productionInfo.lot}` : ''})`
        : '';
      notify.error({
        title: 'Caja en uso',
        description: `No se puede eliminar la caja #${boxId}: está siendo usada en producción${productionText}`,
      });
      return;
    }
    setDeleteBoxConfirmId(boxId);
  };

  const handleConfirmDeleteBox = () => {
    if (deleteBoxConfirmId !== null) {
      editPallet.box.delete(deleteBoxConfirmId);
      setDeleteBoxConfirmId(null);
    }
  };

  const handleOnClickDeleteAllBoxes = () => {
    if (isReadOnly) return;
    deleteAllBoxes();
  };

  const handleOnClickReset = () => {
    if (isReadOnly) return;
    resetAllChanges();
  };

  const handleOnClickSaveChanges = () => {
    if (isReadOnly) return;

    // Guardar preferencias de descuento antes de guardar el palet
    saveDiscountPreferences(boxCreationData);

    // If onSaveTemporal is provided, use it instead of onSavingChanges
    if (onSaveTemporal && temporalPallet) {
      onSaveTemporal(temporalPallet);
    } else {
      onSavingChanges();
    }
  };

  /* const handleOnClickClose = () => {
        onCloseDialog();
        onClose();
    }; */

  /* click on back */
  const goBack = () => {
    window.history.back();
  };

  // Helper function to check if box is available
  const isBoxAvailable = (box: PalletBox) => {
    return box.isAvailable !== false;
  };

  // Helper function to get production information from box
  const getBoxProductionInfo = (box: PalletBox) => {
    // El campo production contiene { id, lot }
    return (box as { production?: { id: number | null; lot: string | null } | null }).production || null;
  };

  // Agrupar cajas por producción
  const groupBoxesByProduction = () => {
    const productionGroups = new Map<string | number, { production: { id: number | null; lot: string | null } | null; boxes: PalletBox[] }>();
    const availableBoxes: PalletBox[] = [];

    if (!temporalPallet) return { available: availableBoxes, inProduction: [] };

    temporalPallet.boxes.forEach((box) => {
      if (isBoxAvailable(box)) {
        availableBoxes.push(box);
      } else {
        const productionInfo = getBoxProductionInfo(box);
        if (productionInfo) {
          const productionKey = productionInfo.id || 'unknown';
          if (!productionGroups.has(productionKey)) {
            productionGroups.set(productionKey, {
              production: productionInfo,
              boxes: [],
            });
          }
          productionGroups.get(productionKey)!.boxes.push(box);
        } else {
          // Si no tiene información de producción pero no está disponible, la agregamos a un grupo "sin producción"
          const unknownKey = 'unknown';
          if (!productionGroups.has(unknownKey)) {
            productionGroups.set(unknownKey, {
              production: { id: null, lot: null },
              boxes: [],
            });
          }
          productionGroups.get(unknownKey)!.boxes.push(box);
        }
      }
    });

    return {
      available: availableBoxes,
      inProduction: Array.from(productionGroups.values()),
    };
  };

  return (
    <>
      <div
        className={` ${!wrappedInDialog && 'bg-card text-card-foreground mb-4 overflow-auto rounded-2xl border px-5 pt-5 pb-3 shadow'} h-full w-full`}
      >
        {loading || !temporalPallet ? (
          <div className="flex h-full w-full flex-1 flex-col gap-4 p-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="ml-auto h-6 w-24 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : error ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 py-10">
            <div className="mb-2 flex items-center justify-center rounded-full bg-red-100 p-5">
              <CloudAlert className="text-destructive h-12 w-12" />
            </div>
            <h2 className="text-destructive text-xl font-semibold">¡Vaya! Ocurrió un error</h2>
            <p className="text-muted-foreground max-w-xs text-sm">
              Por favor, revisa tu conexión o inténtalo nuevamente más tarde.
            </p>
            {!wrappedInDialog && (
              <Button variant="outline" className="mt-4" onClick={goBack}>
                Volver
              </Button>
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-0 w-full flex-col">
            {!wrappedInDialog && (
              <div className="mb-4 flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-medium">
                    {palletId && palletId !== 'new' ? `Editar Palet #${palletId}` : 'Nuevo Palet'}
                  </h1>
                  {belongsToReception && receptionId && !externalActor && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/admin/raw-material-receptions/${receptionId}/edit`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Badge
                              variant="outline"
                              className="flex cursor-pointer items-center gap-1.5 border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800"
                            >
                              <Package className="h-3 w-3" />
                              <span>Recepción #{receptionId}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Badge>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver recepción #{receptionId}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            )}
            {isReadOnly && (
              <Alert className="mb-4 border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="flex items-center gap-2">
                  <span className="text-orange-800">
                    {belongsToReception
                      ? 'Este palet pertenece a una recepción de materia prima. Solo visualización.'
                      : 'Este palet está en modo solo lectura.'}
                  </span>
                  {belongsToReception && receptionId && !externalActor && (
                    <Link
                      href={`/admin/raw-material-receptions/${receptionId}/edit`}
                      className="flex items-center gap-1 text-sm font-medium text-orange-700 underline hover:text-orange-900"
                    >
                      Ver recepción #{receptionId}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex min-h-0 w-full flex-1 flex-col">
              <Tabs
                value={mainTab}
                onValueChange={(v: string) => {
                  setMainTab(v);
                  if (v === 'historial') refetchTimeline();
                }}
                className="flex min-h-0 w-full flex-1 flex-col"
              >
                <TabsList className="mb-4 w-fit justify-start self-start">
                  <TabsTrigger value="edicion" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" /> Edición
                    {hasPalletChanges && (
                      <span className="ml-1 h-2 w-2 rounded-full bg-orange-400" />
                    )}
                  </TabsTrigger>
                  {!isReadOnly && (
                    <TabsTrigger value="acciones-masivas" className="flex items-center gap-2">
                      <Layers className="h-4 w-4" /> Acciones Masivas
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="resumen" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Resumen
                  </TabsTrigger>
                  <TabsTrigger value="etiqueta" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Etiqueta Palet
                  </TabsTrigger>
                  <TabsTrigger value="boxesLabels" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Etiquetas Cajas
                  </TabsTrigger>
                  {showHistorialTab && (
                    <TabsTrigger value="imagenes" className="flex items-center gap-2">
                      <Images className="h-4 w-4" /> Imágenes
                    </TabsTrigger>
                  )}
                  {showHistorialTab && (
                    <TabsTrigger value="historial" className="flex items-center gap-2">
                      <History className="h-4 w-4" /> Historial
                    </TabsTrigger>
                  )}
                  {canDeletePalletData && (
                    <TabsTrigger
                      value="eliminar"
                      className="text-destructive data-[state=active]:text-destructive flex items-center gap-2"
                      disabled={isReadOnly}
                    >
                      <Trash2 className="h-4 w-4" /> Eliminar
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="edicion" className="mt-0 min-h-0 flex-1">
                  <div className="grid h-full min-h-0 grid-cols-5 gap-6">
                    <div className="col-span-2 h-full min-h-0 space-y-6 overflow-y-auto pr-2 pb-2">
                      <Card className="border-muted bg-foreground-50 w-full border-2">
                        <CardHeader className="w-full pb-4">
                          <CardTitle className="flex w-full items-center justify-between gap-2 text-lg">
                            <div className="flex items-center gap-2">
                              <Package className="text-primary h-5 w-5" />
                              Agregar Cajas
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Tabs value={addBoxesTab} onValueChange={setAddBoxesTab}>
                            <TabsList>
                              <TabsTrigger value="lector">
                                <Scan />
                                Lector
                              </TabsTrigger>
                              <TabsTrigger value="manual">
                                <Plus />
                                Manual
                              </TabsTrigger>
                              <TabsTrigger value="masiva">
                                <Upload />
                                Masiva
                              </TabsTrigger>
                              <TabsTrigger value="promedio">
                                <Weight />
                                Promedio
                              </TabsTrigger>
                              <TabsTrigger value="codes">
                                <Hash />
                                Codigos GS1
                              </TabsTrigger>
                            </TabsList>
                            {/* IGNORAR */}

                            <TabsContent value="lector" className="space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor="codigo-escaneado">Código escaneado</Label>
                                <Input
                                  ref={scannerInputRef}
                                  value={boxCreationData.scannedCode}
                                  onChange={(e) => {
                                    boxCreationDataChange('scannedCode', e.target.value);
                                  }}
                                  type="text"
                                  id="codigo-escaneado"
                                  placeholder="Escanea aquí..."
                                  className="font-mono"
                                  disabled={isReadOnly}
                                />
                                <p className="text-muted-foreground text-xs">
                                  La caja se agregará automáticamente al detectar un código válido
                                </p>
                              </div>
                            </TabsContent>

                            <TabsContent value="codes" className="space-y-3">
                              <div className="space-y-4">
                                <Textarea
                                  value={boxCreationData.gs1codes}
                                  onChange={(e) =>
                                    boxCreationDataChange('gs1codes', e.target.value)
                                  }
                                  placeholder="Ingresa los códigos GS1-128, uno por línea"
                                  className="min-h-[100px]"
                                  disabled={isReadOnly}
                                />
                                <div className="col-span-2 grid grid-cols-2 gap-x-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => boxCreationDataChange('gs1codes', '')}
                                    disabled={isReadOnly}
                                  >
                                    <RotateCcw className="h-4 w-4" /> Resetear
                                  </Button>

                                  <Button
                                    className="w-full"
                                    onClick={() => onAddNewBox({ method: 'gs1' })}
                                    disabled={isReadOnly}
                                  >
                                    <Upload className="h-4 w-4" /> Agregar Cajas en Lote
                                  </Button>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="manual" className="">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                  <Label>Artículo</Label>
                                  <Combobox
                                    options={productsOptions}
                                    placeholder="Seleccionar artículo"
                                    searchPlaceholder="Buscar artículo..."
                                    notFoundMessage="No se encontraron artículos"
                                    value={boxCreationData.productId}
                                    onChange={(value) => {
                                      boxCreationDataChange('productId', value);
                                    }}
                                    disabled={isReadOnly}
                                    loading={productsLoading}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Lote</Label>
                                  <Input
                                    type="text"
                                    placeholder="Lote del producto"
                                    value={boxCreationData.lot}
                                    onChange={(e) => {
                                      boxCreationDataChange('lot', e.target.value);
                                    }}
                                    disabled={isReadOnly}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Peso Neto (kg)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={boxCreationData.netWeight}
                                    onChange={(e) => {
                                      boxCreationDataChange('netWeight', e.target.value);
                                    }}
                                    className="text-right"
                                    disabled={isReadOnly}
                                  />
                                </div>
                                {canEditCost && (
                                  <div className="space-y-2">
                                    <Label>Coste manual (€/kg)</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="Opcional"
                                      value={boxCreationData.manualCostPerKg}
                                      onChange={(e) =>
                                        boxCreationDataChange('manualCostPerKg', e.target.value)
                                      }
                                      className="text-right"
                                      disabled={isReadOnly}
                                    />
                                  </div>
                                )}
                                <div className="col-span-2 grid grid-cols-2 gap-x-2">
                                  <Button
                                    variant="outline"
                                    className=""
                                    onClick={() => {
                                      onResetBoxCreationData();
                                    }}
                                    disabled={isReadOnly}
                                  >
                                    <RotateCcw className="h-4 w-4" /> Resetear
                                  </Button>
                                  <Button
                                    className="w-full"
                                    onClick={() => onAddNewBox({ method: 'manual' })}
                                    disabled={isReadOnly}
                                  >
                                    <Plus className="h-4 w-4" /> Agregar Caja
                                  </Button>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="masiva" className="space-y-4">
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Artículo</Label>
                                  <Combobox
                                    options={productsOptions}
                                    placeholder="Seleccionar artículo"
                                    searchPlaceholder="Buscar artículo..."
                                    notFoundMessage="No se encontraron artículos"
                                    value={boxCreationData.productId}
                                    onChange={(value) => {
                                      boxCreationDataChange('productId', value);
                                    }}
                                    disabled={isReadOnly}
                                    loading={productsLoading}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Lote</Label>
                                  <Input
                                    type="text"
                                    placeholder="Lote del producto"
                                    value={boxCreationData.lot}
                                    onChange={(e) => {
                                      boxCreationDataChange('lot', e.target.value);
                                    }}
                                    disabled={isReadOnly}
                                  />
                                </div>
                                <Textarea
                                  placeholder="Ingresa los pesos de las cajas, uno por línea"
                                  value={boxCreationData.weights}
                                  onChange={(e) => {
                                    const weights = e.target.value;
                                    boxCreationDataChange('weights', weights);
                                  }}
                                  className="min-h-[100px]"
                                  disabled={isReadOnly}
                                />
                                <div className="col-span-2 grid grid-cols-2 gap-x-2">
                                  <Button
                                    variant="outline"
                                    className=""
                                    onClick={() => {
                                      onResetBoxCreationData();
                                    }}
                                    disabled={isReadOnly}
                                  >
                                    <RotateCcw className="h-4 w-4" /> Resetear
                                  </Button>
                                  <Button
                                    className="w-full"
                                    onClick={() => onAddNewBox({ method: 'bulk' })}
                                    disabled={isReadOnly}
                                  >
                                    <Upload className="h-4 w-4" /> Agregar Cajas en Lote
                                  </Button>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="promedio" className="space-y-4">
                              <div className="grid grid-cols-3 gap-4 space-y-4">
                                <div className="col-span-3 space-y-2">
                                  <Label>Artículo</Label>
                                  <Combobox
                                    options={productsOptions}
                                    placeholder="Seleccionar artículo"
                                    searchPlaceholder="Buscar artículo..."
                                    notFoundMessage="No se encontraron artículos"
                                    value={boxCreationData.productId}
                                    onChange={(value) => {
                                      boxCreationDataChange('productId', value);
                                    }}
                                    disabled={isReadOnly}
                                    loading={productsLoading}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Lote</Label>
                                  <Input
                                    type="text"
                                    placeholder="Lote del producto"
                                    value={boxCreationData.lot}
                                    onChange={(e) => {
                                      boxCreationDataChange('lot', e.target.value);
                                    }}
                                    disabled={isReadOnly}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Peso Total (kg)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={boxCreationData.totalWeight}
                                    onChange={(e) => {
                                      boxCreationDataChange('totalWeight', e.target.value);
                                    }}
                                    className="text-right"
                                    disabled={isReadOnly}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Número de Cajas</Label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={boxCreationData.numberOfBoxes}
                                    onChange={(e) => {
                                      boxCreationDataChange('numberOfBoxes', e.target.value);
                                    }}
                                    className="text-right"
                                    disabled={isReadOnly}
                                  />
                                </div>
                                <div className="col-span-3 space-y-3">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="show-pallet-weight"
                                        checked={boxCreationData.showPalletWeight}
                                        onCheckedChange={(checked) => {
                                          boxCreationDataChange('showPalletWeight', checked);
                                          if (!checked) {
                                            boxCreationDataChange('palletWeight', '');
                                          }
                                        }}
                                        disabled={isReadOnly}
                                      />
                                      <Label
                                        htmlFor="show-pallet-weight"
                                        className="cursor-pointer text-sm font-normal"
                                      >
                                        Descontar peso del palet
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="show-box-tare"
                                        checked={boxCreationData.showBoxTare}
                                        onCheckedChange={(checked) => {
                                          boxCreationDataChange('showBoxTare', checked);
                                          if (!checked) {
                                            boxCreationDataChange('boxTare', '');
                                          }
                                        }}
                                        disabled={isReadOnly}
                                      />
                                      <Label
                                        htmlFor="show-box-tare"
                                        className="cursor-pointer text-sm font-normal"
                                      >
                                        Descontar tara de cajas
                                      </Label>
                                    </div>
                                  </div>
                                  {(boxCreationData.showPalletWeight ||
                                    boxCreationData.showBoxTare) && (
                                    <div className="grid grid-cols-2 gap-4">
                                      {boxCreationData.showPalletWeight && (
                                        <div className="space-y-2">
                                          <Label>Peso del Palet (kg)</Label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={boxCreationData.palletWeight}
                                            onChange={(e) => {
                                              boxCreationDataChange('palletWeight', e.target.value);
                                            }}
                                            className="text-right"
                                            disabled={isReadOnly}
                                          />
                                        </div>
                                      )}
                                      {boxCreationData.showBoxTare && (
                                        <div className="space-y-2">
                                          <Label>Tara por Caja (kg)</Label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={boxCreationData.boxTare}
                                            onChange={(e) => {
                                              boxCreationDataChange('boxTare', e.target.value);
                                            }}
                                            className="text-right"
                                            disabled={isReadOnly}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="col-span-3 grid grid-cols-2 gap-x-2">
                                  <Button
                                    variant="outline"
                                    className=""
                                    onClick={() => {
                                      onResetBoxCreationData();
                                    }}
                                    disabled={isReadOnly}
                                  >
                                    <RotateCcw className="h-4 w-4" /> Resetear
                                  </Button>
                                  <Button
                                    className="w-full"
                                    onClick={() => onAddNewBox({ method: 'average' })}
                                    disabled={isReadOnly}
                                  >
                                    <Plus className="h-4 w-4" /> Generar Cajas
                                  </Button>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>

                      <Card className="border-muted border-2">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="text-muted-foreground h-5 w-5" />
                            Información del Palet
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="pallet-tare-weight">Tara del palet vacío (kg)</Label>
                            <Input
                              id="pallet-tare-weight"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={temporalPallet.palletTareWeightKg ?? ''}
                              onChange={(e) => editPallet.palletTareWeightKg(e.target.value)}
                              className="max-w-[220px] text-right"
                              disabled={isReadOnly}
                            />
                            <p className="text-muted-foreground text-xs">
                              Peso físico del palet vacío. No modifica el peso neto de las cajas.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Observaciones</Label>
                            <Textarea
                              value={temporalPallet.observations ?? ''}
                              onChange={(e) => editPallet.observations(e.target.value)}
                              className="min-h-[80px]"
                              disabled={isReadOnly}
                            />
                          </div>
                          {!externalActor && (
                            <div className="space-y-2">
                              <Label>Pedido vinculado (opcional)</Label>
                              <Select
                                disabled={orderIdBlocked}
                                value={temporalPallet.orderId != null ? String(temporalPallet.orderId) : undefined}
                                onValueChange={(value) => editPallet.orderId(value)}
                              >
                                <SelectTrigger loading={activeOrdersLoading}>
                                  <SelectValue
                                    placeholder="Sin pedido asignado"
                                    loading={activeOrdersLoading}
                                  />
                                </SelectTrigger>
                                <SelectContent loading={activeOrdersLoading}>
                                  {typedActiveOrdersOptions?.map((order) => (
                                    <SelectItem key={order.id} value={order.id}>
                                      #{order.name} - {formatDateShort(order.load_date)}
                                    </SelectItem>
                                  ))}
                                  {temporalPallet.orderId &&
                                    !typedActiveOrdersOptions?.some(
                                      (order) => order.id === temporalPallet.orderId
                                    ) && (
                                      <SelectItem value={String(temporalPallet.orderId)}>
                                        #{temporalPallet.orderId} - Pedido Actual
                                      </SelectItem>
                                    )}
                                </SelectContent>
                              </Select>
                              {temporalPallet.orderId && !orderIdBlocked && !isReadOnly && (
                                <button
                                  type="button"
                                  onClick={() => editPallet.orderId(null)}
                                  className="text-destructive flex items-center gap-1 text-xs hover:text-red-600"
                                >
                                  <Link2Off className="inline h-4 w-4" />
                                  Desvincular del pedido
                                </button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="col-span-3 flex flex-col space-y-4 overflow-y-auto">
                      {(() => {
                        const { available, inProduction } = groupBoxesByProduction();

                        // Calcular datos resumen según el tab activo
                        const getSummaryData = () => {
                          let boxesToShow: PalletBox[] = [];

                          if (activeTab === 'disponibles') {
                            boxesToShow = available;
                          } else if (activeTab === 'produccion') {
                            boxesToShow = inProduction.flatMap((group) => group.boxes);
                          } else {
                            boxesToShow = temporalPallet.boxes;
                          }

                          const numberOfBoxes = boxesToShow.length;
                          const netWeight = boxesToShow.reduce(
                            (sum, box) => sum + parseFloat(String(box.netWeight ?? 0)),
                            0
                          );

                          // Calcular productos únicos
                          const productsSet = new Set();
                          boxesToShow.forEach((box) => {
                            if (box.product?.name) {
                              productsSet.add(box.product!.name);
                            }
                          });
                          const totalProducts = productsSet.size;

                          // Calcular lotes únicos
                          const lotsSet = new Set();
                          boxesToShow.forEach((box) => {
                            if (box.lot) {
                              lotsSet.add(box.lot);
                            }
                          });
                          const totalLots = lotsSet.size;

                          return {
                            numberOfBoxes,
                            netWeight,
                            totalProducts,
                            totalLots,
                          };
                        };

                        const summaryData = getSummaryData();

                        // Función para renderizar una fila de caja (reutilizable)
                        const renderBoxRow = (box: PalletBox, isEditable = true) => {
                          const isSelected = box.id === selectedBox;
                          const boxAvailable = isBoxAvailable(box);
                          const canEditBox = isEditable && !isReadOnly && boxAvailable;

                          if (isSelected && canEditBox) {
                            return (
                              <TableRow
                                key={box.id}
                                onClick={() => handleOnClickBoxRow(box.id)}
                                className="hover:bg-muted"
                              >
                                <TableCell>{box.product?.name}</TableCell>
                                <TableCell>
                                  <Input
                                    defaultValue={box.lot}
                                    onChange={(e) => {
                                      handleOnChangeBoxLot(box.id, e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full"
                                    disabled={isReadOnly || !boxAvailable}
                                  />
                                </TableCell>
                                <TableCell>{box.gs1128}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    defaultValue={box.netWeight}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      handleOnChangeBoxNetWeight(
                                        box.id,
                                        parseFloat(e.target.value)
                                      );
                                    }}
                                    className="w-full"
                                    disabled={isReadOnly || !boxAvailable}
                                  />
                                </TableCell>
                                {canEditCost && (
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    {box.traceableCostPerKg != null ? (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="cursor-help text-right">
                                              <span className="text-sm font-medium text-green-700">
                                                {parseFloat(String(box.traceableCostPerKg ?? 0)).toFixed(2)} €/kg
                                              </span>
                                              <p className="text-muted-foreground text-xs">
                                                Trazable
                                              </p>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Coste por recepción o producción. No editable.</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ) : (
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="€/kg"
                                        defaultValue={
                                          box.manualCostPerKg != null ? box.manualCostPerKg : ''
                                        }
                                        onChange={(e) =>
                                          handleOnChangeBoxManualCost(box.id, e.target.value)
                                        }
                                        className="w-full text-right"
                                        disabled={isReadOnly || !boxAvailable}
                                      />
                                    )}
                                  </TableCell>
                                )}
                                <TableCell>
                                  {canEditBox && (
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOnClickDuplicateBox(box.id);
                                        }}
                                        disabled={isReadOnly || !boxAvailable}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive h-8 w-8"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOnClickDeleteBox(box.id);
                                        }}
                                        disabled={isReadOnly || !boxAvailable}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return (
                            <TableRow
                              key={box.id}
                              onClick={canEditBox ? () => handleOnClickBoxRow(box.id) : undefined}
                              className={`${canEditBox ? 'hover:bg-muted cursor-text' : 'cursor-default'} ${box?.new === true ? 'bg-foreground-50' : ''} ${!boxAvailable ? 'bg-orange-50/30' : ''}`}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {box.product?.name}
                                  {!boxAvailable && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <AlertCircle className="h-4 w-4 text-orange-600" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>
                                            {(() => {
                                              const productionInfo = getBoxProductionInfo(box);
                                              return productionInfo
                                                ? `Caja usada en producción #${productionInfo.id}${productionInfo.lot ? ` (Lote: ${productionInfo.lot})` : ''}`
                                                : 'Caja usada en producción';
                                            })()}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{box.lot}</TableCell>
                              <TableCell>{box.gs1128}</TableCell>
                              <TableCell>{box.netWeight} kg</TableCell>
                              {canEditCost && (
                                <TableCell className="text-right text-sm">
                                  {box.traceableCostPerKg != null ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help text-green-700">
                                            {parseFloat(String(box.traceableCostPerKg ?? 0)).toFixed(2)} €/kg
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Coste trazable (recepción / producción)</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : box.manualCostPerKg != null ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help text-blue-600">
                                            {parseFloat(String(box.manualCostPerKg ?? 0)).toFixed(2)} €/kg
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Coste manual</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                              )}
                              <TableCell>
                                {canEditBox && (
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOnClickDuplicateBox(box.id);
                                      }}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOnClickDeleteBox(box.id);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                                {!boxAvailable && (
                                  <Badge
                                    variant="outline"
                                    className="cursor-default border-orange-200 bg-orange-50 text-xs text-orange-700"
                                  >
                                    En Producción
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        };

                        return (
                          <>
                            <div className="flex flex-shrink-0 items-center justify-between">
                              <h3 className="text-lg font-semibold">Cajas en el Palet</h3>
                              <div className="text-muted-foreground bg-muted/50 flex items-center rounded-full px-4 py-1 text-sm">
                                <span>
                                  <span className="text-foreground font-semibold">
                                    {summaryData.numberOfBoxes}
                                  </span>{' '}
                                  cajas
                                </span>
                                <Separator orientation="vertical" className="mx-2 h-3" />
                                <span className="text-foreground font-semibold">
                                  {formatDecimalWeight(summaryData.netWeight)}
                                </span>
                                <Separator orientation="vertical" className="mx-2 h-3" />
                                <span>
                                  <span className="text-foreground font-semibold">
                                    {summaryData.totalProducts}
                                  </span>{' '}
                                  productos
                                </span>
                                <Separator orientation="vertical" className="mx-2 h-3" />
                                <span>
                                  <span className="text-foreground font-semibold">
                                    {summaryData.totalLots}
                                  </span>{' '}
                                  lotes
                                </span>
                              </div>
                            </div>

                            <Tabs
                              value={activeTab}
                              onValueChange={setActiveTab}
                              className="flex min-h-0 flex-1 flex-col"
                            >
                              <TabsList className="grid w-full flex-shrink-0 grid-cols-3">
                                <TabsTrigger
                                  value="disponibles"
                                  className="flex items-center gap-2"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Disponibles ({available.length})
                                </TabsTrigger>
                                <TabsTrigger value="produccion" className="flex items-center gap-2">
                                  <Factory className="h-4 w-4" />
                                  En Producción (
                                  {inProduction.reduce((sum, group) => sum + group.boxes.length, 0)}
                                  )
                                </TabsTrigger>
                                <TabsTrigger value="todas">
                                  Todas ({temporalPallet.boxes.length})
                                </TabsTrigger>
                              </TabsList>

                              {/* Tab: Todas las cajas */}
                              <TabsContent
                                value="todas"
                                className="mt-4 min-h-0 flex-1 data-[state=inactive]:hidden"
                              >
                                <div className="flex h-full flex-col overflow-hidden rounded-lg border">
                                  <div className="max-h-[calc(90vh-300px)] flex-1 overflow-y-auto">
                                    <Table>
                                      <TableHeader className="bg-background sticky top-0 z-10">
                                        <TableRow>
                                          <TableHead className="min-w-[200px]">Artículo</TableHead>
                                          <TableHead className="w-[170px] min-w-[170px]">
                                            Lote
                                          </TableHead>
                                          <TableHead className="min-w-[150px]">GS1 128</TableHead>
                                          <TableHead className="w-[100px] min-w-[100px]">
                                            Peso Neto
                                          </TableHead>
                                          {canEditCost && (
                                            <TableHead className="w-[110px] text-right">
                                              Coste/kg
                                            </TableHead>
                                          )}
                                          <TableHead className="w-[100px]">Acciones</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {temporalPallet.boxes.length === 0 ? (
                                          <TableRow>
                                            <TableCell
                                              colSpan={canEditCost ? 6 : 5}
                                              className="p-0"
                                            >
                                              <div className="py-12">
                                                <EmptyState
                                                  icon={
                                                    <Box
                                                      className="text-primary h-12 w-12"
                                                      strokeWidth={1.5}
                                                    />
                                                  }
                                                  title="No hay cajas en el palet"
                                                  description="Agrega cajas al palet usando las opciones de la izquierda"
                                                />
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ) : (
                                          temporalPallet.boxes.map((box) => {
                                            const boxAvailable = isBoxAvailable(box);
                                            const productionInfo = getBoxProductionInfo(box);

                                            return (
                                              <TableRow
                                                key={box.id}
                                                className={`cursor-default ${box?.new === true ? 'bg-foreground-50' : ''} ${!boxAvailable ? 'bg-orange-50/50' : ''}`}
                                              >
                                                <TableCell>
                                                  <div className="flex items-center gap-2">
                                                    {box.product?.name}
                                                    {!boxAvailable && (
                                                      <AlertCircle className="h-4 w-4 text-orange-600" />
                                                    )}
                                                  </div>
                                                </TableCell>
                                                <TableCell>{box.lot}</TableCell>
                                                <TableCell>{box.gs1128}</TableCell>
                                                <TableCell>{box.netWeight} kg</TableCell>
                                                {canEditCost && (
                                                  <TableCell className="text-right text-sm">
                                                    {box.traceableCostPerKg != null ? (
                                                      <span className="text-green-700">
                                                        {parseFloat(String(box.traceableCostPerKg ?? 0)).toFixed(
                                                          2
                                                        )}{' '}
                                                        €/kg
                                                      </span>
                                                    ) : box.manualCostPerKg != null ? (
                                                      <span className="text-blue-600">
                                                        {parseFloat(String(box.manualCostPerKg ?? 0)).toFixed(2)}{' '}
                                                        €/kg
                                                      </span>
                                                    ) : (
                                                      <span className="text-muted-foreground">
                                                        —
                                                      </span>
                                                    )}
                                                  </TableCell>
                                                )}
                                                <TableCell>
                                                  {boxAvailable ? (
                                                    <div className="flex gap-1">
                                                      <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleOnClickDuplicateBox(box.id);
                                                        }}
                                                        disabled={isReadOnly}
                                                        title="Duplicar caja"
                                                      >
                                                        <Copy className="h-4 w-4" />
                                                      </Button>
                                                      <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive h-8 w-8"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleOnClickDeleteBox(box.id);
                                                        }}
                                                        disabled={isReadOnly}
                                                        title="Eliminar caja"
                                                      >
                                                        <Trash2 className="h-4 w-4" />
                                                      </Button>
                                                    </div>
                                                  ) : productionInfo ? (
                                                    <TooltipProvider>
                                                      <Tooltip>
                                                        <TooltipTrigger asChild>
                                                          <div className="inline-flex h-6 w-6 cursor-help items-center justify-center rounded-full border border-orange-200 bg-orange-100 text-orange-700 transition-colors hover:bg-orange-200">
                                                            <Factory className="h-3.5 w-3.5" />
                                                          </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                          <div className="space-y-1">
                                                            <p className="font-semibold">
                                                              En Producción
                                                            </p>
                                                            <p className="text-xs">
                                                              Producción #
                                                              {productionInfo.id || 'N/A'}
                                                            </p>
                                                            {productionInfo.lot && (
                                                              <p className="text-xs">
                                                                Lote: {productionInfo.lot}
                                                              </p>
                                                            )}
                                                          </div>
                                                        </TooltipContent>
                                                      </Tooltip>
                                                    </TooltipProvider>
                                                  ) : null}
                                                </TableCell>
                                              </TableRow>
                                            );
                                          })
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </TabsContent>

                              {/* Tab: Cajas disponibles */}
                              <TabsContent
                                value="disponibles"
                                className="mt-4 min-h-0 flex-1 data-[state=inactive]:hidden"
                              >
                                {available.length > 0 ? (
                                  <div className="flex h-full flex-col overflow-hidden rounded-lg border">
                                    <div className="max-h-[calc(90vh-300px)] flex-1 overflow-y-auto">
                                      <Table>
                                        <TableHeader className="bg-background sticky top-0 z-10">
                                          <TableRow>
                                            <TableHead className="min-w-[200px]">
                                              Artículo
                                            </TableHead>
                                            <TableHead className="w-[170px] min-w-[170px]">
                                              Lote
                                            </TableHead>
                                            <TableHead className="min-w-[150px]">GS1 128</TableHead>
                                            <TableHead className="w-[100px] min-w-[100px]">
                                              Peso Neto
                                            </TableHead>
                                            {canEditCost && (
                                              <TableHead className="w-[110px] text-right">
                                                Coste/kg
                                              </TableHead>
                                            )}
                                            <TableHead className="w-[100px]">Acciones</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {available.map((box) => renderBoxRow(box, true))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex h-full flex-col overflow-hidden rounded-lg border">
                                    <div className="flex h-full items-center justify-center">
                                      <EmptyState
                                        icon={
                                          <Factory
                                            className="text-muted-foreground h-12 w-12"
                                            strokeWidth={1.5}
                                          />
                                        }
                                        title="No hay cajas disponibles"
                                        description="Todas las cajas de este palet están en producción"
                                      />
                                    </div>
                                  </div>
                                )}
                              </TabsContent>

                              {/* Tab: Cajas en producción */}
                              <TabsContent
                                value="produccion"
                                className="mt-4 min-h-0 flex-1 data-[state=inactive]:hidden"
                              >
                                {inProduction.length > 0 ? (
                                  <div className="flex h-full flex-col overflow-hidden rounded-lg border">
                                    <div className="max-h-[calc(90vh-300px)] flex-1 overflow-y-auto">
                                      <Table>
                                        <TableHeader className="bg-background sticky top-0 z-10">
                                          <TableRow>
                                            <TableHead className="min-w-[200px]">
                                              Artículo
                                            </TableHead>
                                            <TableHead className="w-[170px] min-w-[170px]">
                                              Lote
                                            </TableHead>
                                            <TableHead className="min-w-[150px]">GS1 128</TableHead>
                                            <TableHead className="w-[100px] min-w-[100px]">
                                              Peso Neto
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {inProduction.map((group, groupIndex) => (
                                            <React.Fragment
                                              key={group.production.id || `unknown-${groupIndex}`}
                                            >
                                              {/* Fila de encabezado del grupo */}
                                              {(() => {
                                                const totalWeight = group.boxes.reduce(
                                                  (sum, box) =>
                                                    sum + parseFloat(String(box.netWeight ?? 0)),
                                                  0
                                                );
                                                return (
                                                  <TableRow className="bg-orange-50/50 hover:bg-orange-50">
                                                    <TableCell colSpan={4} className="py-2">
                                                      <div className="flex items-center gap-2 font-semibold text-orange-900">
                                                        <Factory className="h-4 w-4" />
                                                        <span>
                                                          Producción #{group.production.id || 'N/A'}
                                                        </span>
                                                        {group.production.lot && (
                                                          <>
                                                            <Separator
                                                              orientation="vertical"
                                                              className="h-4"
                                                            />
                                                            <span className="text-sm font-normal text-orange-700">
                                                              Lote: {group.production.lot}
                                                            </span>
                                                          </>
                                                        )}
                                                        <Separator
                                                          orientation="vertical"
                                                          className="h-4"
                                                        />
                                                        <span className="text-sm font-normal text-orange-700">
                                                          {group.boxes.length}{' '}
                                                          {group.boxes.length === 1
                                                            ? 'caja'
                                                            : 'cajas'}
                                                        </span>
                                                        <Separator
                                                          orientation="vertical"
                                                          className="h-4"
                                                        />
                                                        <span className="text-sm font-normal text-orange-700">
                                                          {formatDecimalWeight(totalWeight)}
                                                        </span>
                                                      </div>
                                                    </TableCell>
                                                  </TableRow>
                                                );
                                              })()}
                                              {/* Filas de cajas del grupo - NO EDITABLES */}
                                              {group.boxes.map((box) => {
                                                return (
                                                  <TableRow
                                                    key={box.id}
                                                    className={`cursor-default bg-orange-50/30 ${box?.new === true ? 'bg-foreground-50' : ''}`}
                                                  >
                                                    <TableCell>
                                                      <div className="flex items-center gap-2">
                                                        {box.product?.name}
                                                        <AlertCircle className="h-4 w-4 text-orange-600" />
                                                      </div>
                                                    </TableCell>
                                                    <TableCell>{box.lot}</TableCell>
                                                    <TableCell>{box.gs1128}</TableCell>
                                                    <TableCell>{box.netWeight} kg</TableCell>
                                                  </TableRow>
                                                );
                                              })}
                                            </React.Fragment>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex h-full flex-col overflow-hidden rounded-lg border">
                                    <div className="flex h-full items-center justify-center">
                                      <EmptyState
                                        icon={
                                          <Factory
                                            className="text-primary h-12 w-12"
                                            strokeWidth={1.5}
                                          />
                                        }
                                        title="No hay cajas en producción"
                                        description="Todas las cajas de este palet están disponibles"
                                      />
                                    </div>
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="acciones-masivas" className="mt-0">
                  <div className="grid max-h-[calc(90vh-200px)] grid-cols-5 gap-6">
                    <div className="col-span-2 max-h-[calc(90vh-200px)] space-y-6 overflow-y-auto pr-2 pb-2">
                      <Card className="border-muted bg-foreground-50 w-full border-2">
                        <CardHeader className="w-full pb-4">
                          <CardTitle className="flex w-full items-center gap-2 text-lg">
                            <Layers className="text-primary h-5 w-5" />
                            Acciones Masivas
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Selecciona la acción a realizar</Label>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <Button
                                variant={bulkActionType === 'lot' ? 'default' : 'outline'}
                                onClick={() => {
                                  setBulkActionType('lot');
                                  setBulkActionValue('');
                                }}
                                size="sm"
                                className="flex h-8 items-center justify-center gap-2 px-3 text-xs"
                                disabled={isReadOnly}
                              >
                                <FileText className="h-5 w-5" />
                                <span>Cambiar Lote</span>
                              </Button>
                              <Button
                                variant={bulkActionType === 'weight' ? 'default' : 'outline'}
                                onClick={() => {
                                  setBulkActionType('weight');
                                  setBulkActionValue('');
                                }}
                                size="sm"
                                className="flex h-8 items-center justify-center gap-2 px-3 text-xs"
                                disabled={isReadOnly}
                              >
                                <Weight className="h-5 w-5" />
                                <span>Cambiar Peso</span>
                              </Button>
                              <Button
                                variant={bulkActionType === 'weightAdd' ? 'default' : 'outline'}
                                onClick={() => {
                                  setBulkActionType('weightAdd');
                                  setBulkActionValue('');
                                  setWeightOperation('add');
                                }}
                                size="sm"
                                className="flex h-8 items-center justify-center gap-2 px-3 text-xs"
                                disabled={isReadOnly}
                              >
                                <Plus className="h-5 w-5" />
                                <span>Sumar/Restar Peso</span>
                              </Button>
                              <Button
                                variant={bulkActionType === 'product' ? 'default' : 'outline'}
                                onClick={() => {
                                  setBulkActionType('product');
                                  setOldProductId('');
                                  setNewProductId('');
                                }}
                                size="sm"
                                className="flex h-8 items-center justify-center gap-2 px-3 text-xs"
                                disabled={isReadOnly}
                              >
                                <Package className="h-5 w-5" />
                                <span>Cambiar Producto</span>
                              </Button>
                              {canEditCost && (
                                <Button
                                  variant={bulkActionType === 'cost' ? 'default' : 'outline'}
                                  onClick={() => {
                                    setBulkActionType('cost');
                                    setBulkActionValue('');
                                  }}
                                  size="sm"
                                  className="flex h-8 items-center justify-center gap-2 px-3 text-xs"
                                  disabled={isReadOnly}
                                >
                                  <Euro className="h-5 w-5" />
                                  <span>Coste por kg</span>
                                </Button>
                              )}
                            </div>
                          </div>

                          {bulkActionType && (
                            <>
                              {bulkActionType === 'weightAdd' && (
                                <div className="space-y-2">
                                  <Label>Operación</Label>
                                  <div className="grid grid-cols-2 gap-3">
                                    <Button
                                      variant={weightOperation === 'add' ? 'default' : 'outline'}
                                      onClick={() => setWeightOperation('add')}
                                      className="flex h-auto items-center justify-center gap-2 py-2"
                                      disabled={isReadOnly}
                                      type="button"
                                    >
                                      <Plus className="h-4 w-4" />
                                      <span>Sumar</span>
                                    </Button>
                                    <Button
                                      variant={
                                        weightOperation === 'subtract' ? 'default' : 'outline'
                                      }
                                      onClick={() => setWeightOperation('subtract')}
                                      className="flex h-auto items-center justify-center gap-2 py-2"
                                      disabled={isReadOnly}
                                      type="button"
                                    >
                                      <Minus className="h-4 w-4" />
                                      <span>Restar</span>
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {bulkActionType === 'cost' ? (
                                <div className="space-y-3">
                                  <div className="space-y-2">
                                    <Label>Coste por kg (€)</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={bulkActionValue}
                                      onChange={(e) => setBulkActionValue(e.target.value)}
                                      placeholder="0.00"
                                      className="text-right"
                                      disabled={isReadOnly}
                                    />
                                  </div>
                                  <p className="text-muted-foreground text-xs">
                                    Solo se aplica a cajas disponibles sin coste trazable
                                    (recepción/producción).
                                  </p>
                                </div>
                              ) : bulkActionType === 'product' ? (
                                <>
                                  <div className="space-y-2">
                                    <Label>Producto Actual</Label>
                                    <Combobox
                                      options={availableProductsInPallet}
                                      placeholder="Seleccionar producto actual"
                                      searchPlaceholder="Buscar producto..."
                                      notFoundMessage="No se encontraron productos"
                                      value={oldProductId}
                                      onChange={(value) => {
                                        setOldProductId(value);
                                      }}
                                      disabled={isReadOnly}
                                      loading={loading}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Nuevo Producto</Label>
                                    <Combobox
                                      options={productsOptions}
                                      placeholder="Seleccionar nuevo producto"
                                      searchPlaceholder="Buscar producto..."
                                      notFoundMessage="No se encontraron productos"
                                      value={newProductId}
                                      onChange={(value) => {
                                        setNewProductId(value);
                                      }}
                                      disabled={isReadOnly}
                                      loading={productsLoading}
                                    />
                                  </div>
                                </>
                              ) : (
                                <div className="space-y-2">
                                  <Label>
                                    {bulkActionType === 'lot'
                                      ? 'Nuevo Lote'
                                      : bulkActionType === 'weight'
                                        ? 'Nuevo Peso Neto (kg)'
                                        : 'Peso a ' +
                                          (weightOperation === 'add' ? 'sumar' : 'restar') +
                                          ' (kg)'}
                                  </Label>
                                  {bulkActionType === 'lot' ? (
                                    <Input
                                      value={bulkActionValue}
                                      onChange={(e) => setBulkActionValue(e.target.value)}
                                      placeholder="Ingresa el nuevo lote"
                                      disabled={isReadOnly}
                                    />
                                  ) : (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={bulkActionValue}
                                      onChange={(e) => setBulkActionValue(e.target.value)}
                                      placeholder="0.00"
                                      disabled={isReadOnly}
                                    />
                                  )}
                                </div>
                              )}

                              <Alert className="border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/60 dark:bg-blue-900/40 dark:text-blue-100">
                                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                                <AlertDescription className="text-sm text-blue-800 dark:text-blue-100">
                                  Los cambios se aplicarán únicamente a las cajas disponibles (no en
                                  producción).
                                </AlertDescription>
                              </Alert>

                              <div className="pt-2">
                                <Button
                                  className="w-full"
                                  onClick={() => {
                                    if (bulkActionType === 'cost') {
                                      const costValue = parseFloat(bulkActionValue);
                                      if (isNaN(costValue) || costValue < 0) return;
                                      editPallet.box.bulkEdit.setManualCostPerKg(null, costValue);
                                    } else if (bulkActionType === 'product') {
                                      if (!oldProductId || !newProductId) {
                                        return;
                                      }
                                      editPallet.box.bulkEdit.changeProduct(
                                        null,
                                        oldProductId,
                                        newProductId
                                      );
                                    } else {
                                      if (!bulkActionValue || bulkActionValue.trim() === '') {
                                        return;
                                      }

                                      if (bulkActionType === 'lot') {
                                        editPallet.box.bulkEdit.changeLot(
                                          null,
                                          bulkActionValue.trim()
                                        );
                                      } else if (bulkActionType === 'weight') {
                                        editPallet.box.bulkEdit.changeNetWeight(
                                          null,
                                          parseFloat(bulkActionValue)
                                        );
                                      } else if (bulkActionType === 'weightAdd') {
                                        const weightValue = parseFloat(bulkActionValue);
                                        const weightDifference =
                                          weightOperation === 'add' ? weightValue : -weightValue;
                                        editPallet.box.bulkEdit.addOrSubtractWeight(
                                          null,
                                          weightDifference
                                        );
                                      }
                                    }

                                    setBulkActionType(null);
                                    setBulkActionValue('');
                                    setOldProductId('');
                                    setNewProductId('');
                                    setWeightOperation('add');
                                  }}
                                  disabled={
                                    isReadOnly ||
                                    (bulkActionType === 'cost'
                                      ? bulkActionValue === '' ||
                                        isNaN(parseFloat(bulkActionValue)) ||
                                        parseFloat(bulkActionValue) < 0
                                      : bulkActionType === 'product'
                                        ? !oldProductId || !newProductId
                                        : !bulkActionValue || bulkActionValue.trim() === '')
                                  }
                                >
                                  Aplicar Cambios
                                </Button>
                              </div>
                            </>
                          )}

                          {isReadOnly && (
                            <Alert className="border-orange-200 bg-orange-50">
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                              <AlertDescription className="text-orange-800">
                                Este palet pertenece a una recepción. Las acciones masivas no están
                                disponibles.
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-muted border-2">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <AlertCircle className="text-muted-foreground h-5 w-5" />
                            Información
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground space-y-2 text-sm">
                          <p>
                            Las acciones masivas te permiten modificar múltiples cajas del palet de
                            una sola vez.
                          </p>
                          <ul className="ml-2 list-inside list-disc space-y-1">
                            <li>
                              <strong>Cambiar Lote:</strong> Aplica un nuevo lote a todas las cajas
                              disponibles
                            </li>
                            <li>
                              <strong>Cambiar Peso:</strong> Aplica un nuevo peso neto a todas las
                              cajas disponibles
                            </li>
                            <li>
                              <strong>Sumar/Restar Peso:</strong> Suma o resta un valor de peso a
                              todas las cajas disponibles
                            </li>
                            <li>
                              <strong>Cambiar Producto:</strong> Cambia un producto por otro en
                              todas las cajas disponibles que tengan ese producto
                            </li>
                            <li>
                              <strong>Importante:</strong> Los cambios solo se aplican a cajas
                              disponibles (no en producción). Las cajas en producción no pueden ser
                              modificadas.
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="col-span-3 flex flex-col space-y-4 overflow-y-auto">
                      <div className="flex flex-shrink-0 items-center justify-between">
                        <h3 className="text-lg font-semibold">Vista Previa de Cajas</h3>
                        <div className="text-muted-foreground/90 bg-foreground-50 flex items-center rounded-full px-4 py-1 text-sm">
                          <span>{temporalPallet.boxes.length} cajas</span>
                          <Separator orientation="vertical" className="mx-2 h-3" />
                          <span>{formatDecimalWeight(temporalPallet.netWeight)}</span>
                        </div>
                      </div>

                      <div className="flex h-full flex-col overflow-hidden rounded-lg border">
                        <div className="max-h-[calc(90vh-300px)] flex-1 overflow-y-auto">
                          <Table>
                            <TableHeader className="bg-background sticky top-0 z-10">
                              <TableRow>
                                <TableHead className="min-w-[200px]">Artículo</TableHead>
                                <TableHead className="w-[170px] min-w-[170px]">Lote</TableHead>
                                <TableHead className="min-w-[150px]">GS1 128</TableHead>
                                <TableHead className="w-[100px] min-w-[100px]">Peso Neto</TableHead>
                                <TableHead className="min-w-[150px]">Estado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {temporalPallet.boxes.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="p-0">
                                    <div className="py-12">
                                      <EmptyState
                                        icon={
                                          <Box
                                            className="text-primary h-12 w-12"
                                            strokeWidth={1.5}
                                          />
                                        }
                                        title="No hay cajas en el palet"
                                        description="Agrega cajas al palet usando la pestaña de Edición"
                                      />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                temporalPallet.boxes.map((box) => {
                                  const boxAvailable = isBoxAvailable(box);
                                  const productionInfo = getBoxProductionInfo(box);

                                  return (
                                    <TableRow
                                      key={box.id}
                                      className={`cursor-default ${box?.new === true ? 'bg-foreground-50' : ''} ${!boxAvailable ? 'bg-orange-50/50' : ''}`}
                                    >
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          {box.product?.name}
                                          {!boxAvailable && (
                                            <AlertCircle className="h-4 w-4 text-orange-600" />
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>{box.lot}</TableCell>
                                      <TableCell>{box.gs1128}</TableCell>
                                      <TableCell>{box.netWeight} kg</TableCell>
                                      {canEditCost && (
                                        <TableCell className="text-right text-sm">
                                          {box.traceableCostPerKg != null ? (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <span className="cursor-help text-green-700">
                                                    {parseFloat(String(box.traceableCostPerKg ?? 0)).toFixed(2)}{' '}
                                                    €/kg
                                                  </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>Coste trazable (recepción / producción)</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          ) : box.manualCostPerKg != null ? (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <span className="cursor-help text-blue-600">
                                                    {parseFloat(String(box.manualCostPerKg ?? 0)).toFixed(2)}{' '}
                                                    €/kg
                                                  </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>Coste manual</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          ) : (
                                            <span className="text-muted-foreground">—</span>
                                          )}
                                        </TableCell>
                                      )}
                                      <TableCell>
                                        {!boxAvailable && productionInfo ? (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="inline-flex h-6 w-6 cursor-help items-center justify-center rounded-full border border-orange-200 bg-orange-100 text-orange-700 transition-colors hover:bg-orange-200">
                                                  <Factory className="h-3.5 w-3.5" />
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <div className="space-y-1">
                                                  <p className="font-semibold">En Producción</p>
                                                  <p className="text-xs">
                                                    Producción #{productionInfo.id || 'N/A'}
                                                  </p>
                                                  {productionInfo.lot && (
                                                    <p className="text-xs">
                                                      Lote: {productionInfo.lot}
                                                    </p>
                                                  )}
                                                </div>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        ) : (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="inline-flex h-6 w-6 cursor-help items-center justify-center rounded-full border border-green-200 bg-green-100 text-green-700 transition-colors hover:bg-green-200">
                                                  <CheckCircle className="h-3.5 w-3.5" />
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="font-semibold">Disponible</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="resumen" className="mt-0">
                  <div className="grid h-[calc(90vh-200px)] grid-cols-1 gap-6 overflow-y-auto px-2 lg:grid-cols-2">
                    <div className="flex flex-col gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-xl">Resumen General del Palet</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-5 gap-4">
                            <div className="bg-foreground-50 flex items-center gap-2 rounded-lg border p-2">
                              <div className="bg-foreground-200/50 rounded-lg p-2.5">
                                <Box className="h-6 w-6" />
                              </div>
                              <div className="flex flex-col">
                                <h4 className="text-lg font-medium">
                                  {temporalPallet.numberOfBoxes}
                                </h4>
                                <span className="text-muted-foreground text-sm">Cajas</span>
                              </div>
                            </div>

                            <div className="bg-foreground-50 flex items-center gap-2 rounded-lg border p-2">
                              <div className="bg-foreground-200/50 rounded-lg p-2.5">
                                <PiShrimp className="h-6 w-6" />
                              </div>
                              <div className="flex flex-col">
                                <h4 className="text-lg font-medium">{temporalTotalProducts}</h4>
                                <span className="text-muted-foreground text-sm">Productos</span>
                              </div>
                            </div>

                            <div className="bg-foreground-50 flex items-center gap-2 rounded-lg border p-2">
                              <div className="bg-foreground-200/50 rounded-lg p-2.5">
                                <Layers className="h-6 w-6" />
                              </div>
                              <div className="flex flex-col">
                                <h4 className="text-lg font-medium">{temporalTotalLots}</h4>
                                <span className="text-muted-foreground text-sm">Lotes</span>
                              </div>
                            </div>

                            <div className="bg-foreground-50 flex items-center gap-2 rounded-lg border p-2">
                              <div className="bg-foreground-200/50 rounded-lg p-2.5">
                                <Weight className="h-6 w-6" />
                              </div>
                              <div className="flex flex-col">
                                <h4 className="text-lg font-medium">
                                  {formatDecimalWeight(temporalPallet.netWeight)}
                                </h4>
                                <span className="text-muted-foreground text-sm">Peso total</span>
                              </div>
                            </div>

                            <div className="bg-foreground-50 flex items-center gap-2 rounded-lg border p-2">
                              <div className="bg-foreground-200/50 rounded-lg p-2.5">
                                <Weight className="h-6 w-6" />
                              </div>
                              <div className="flex flex-col">
                                <h4 className="text-lg font-medium">
                                  {temporalPallet.palletTareWeightKg !== null &&
                                  temporalPallet.palletTareWeightKg !== undefined &&
                                  temporalPallet.palletTareWeightKg !== '' &&
                                  Number.isFinite(Number(temporalPallet.palletTareWeightKg))
                                    ? formatDecimalWeight(Number(temporalPallet.palletTareWeightKg))
                                    : '-'}
                                </h4>
                                <span className="text-muted-foreground text-sm">Tara palet</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Espacio para gráficos */}
                      <Card className="flex-1">
                        <CardHeader>
                          <CardTitle className="text-lg">Gráfico de Distribución</CardTitle>
                        </CardHeader>
                        <CardContent className="flex h-[240px] items-center justify-center">
                          <SummaryPieChart data={getPieChartData} />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Columna izquierda: Productos + detalles por lote */}
                    <div className="h-full space-y-4 overflow-y-auto">
                      {temporalProductsSummary &&
                        Object.entries(temporalProductsSummary).map(
                          ([productName, productData]) => (
                            <Card key={productName}>
                              <CardHeader className="pb-3">
                                <CardTitle className="flex items-center justify-between text-lg">
                                  {productName}
                                  <Badge variant="outline" className="text-sm font-medium">
                                    {productData.numberOfBoxes} cajas •{' '}
                                    {productData.totalNetWeight.toFixed(2)} kg
                                  </Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <Collapsible>
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-between"
                                    >
                                      Ver detalles por lote
                                      <span className="text-muted-foreground ml-2">
                                        <ChevronDown className="h-4 w-4 transform transition-transform duration-200" />
                                      </span>
                                    </Button>
                                  </CollapsibleTrigger>

                                  <CollapsibleContent className="mt-4 space-y-3">
                                    {Object.entries(productData.lots).map(([lot, weights]) => {
                                      const lotLabel =
                                        typeof lot === 'string'
                                          ? lot.trim()
                                          : String(lot ?? '').trim();
                                      const isResolvingLot = resolvingProductionLot === lotLabel;
                                      return (
                                        <div
                                          key={lot}
                                          className="bg-muted/50 rounded-lg border p-3"
                                        >
                                          <div className="mb-2 flex items-center justify-between">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenProductionByLot(lotLabel)}
                                              disabled={isResolvingLot}
                                              className="text-primary inline-flex items-center gap-1 font-medium hover:underline disabled:no-underline disabled:opacity-60"
                                              title="Abrir producción de este lote en una nueva pestaña"
                                            >
                                              Lote: {lot}
                                              {isResolvingLot ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                              ) : (
                                                <ExternalLink className="h-3 w-3" />
                                              )}
                                            </button>
                                            <Badge variant="outline" className="text-xs">
                                              {weights.length} cajas
                                            </Badge>
                                          </div>
                                          <div className="space-y-1 text-sm">
                                            {weights.map((weight, index) => (
                                              <div key={index} className="flex justify-between">
                                                <span>Caja {index + 1}:</span>
                                                <span>{weight.toFixed(2)} kg</span>
                                              </div>
                                            ))}
                                            <Separator />
                                            <div className="mt-1 flex justify-between font-medium">
                                              <span>Subtotal:</span>
                                              <span>
                                                {weights.reduce((sum, w) => sum + w, 0).toFixed(2)}{' '}
                                                kg
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </CollapsibleContent>
                                </Collapsible>
                              </CardContent>
                            </Card>
                          )
                        )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="etiqueta" className="mt-0">
                  <div className="mt-4 flex flex-col items-center gap-4">
                    <div className="bg-orange-200 px-4">
                      <div
                        className="flex flex-col items-center gap-4"
                        style={{ width: PALLET_LABEL_SIZE.width }}
                      >
                        <div className="bg-card text-card-foreground h-20 w-full rounded-b-xl border border-t-0 bg-white shadow"></div>
                        <div
                          id="print-area-id"
                          className="text-black"
                          style={{
                            width: PALLET_LABEL_SIZE.width,
                            height: PALLET_LABEL_SIZE.height,
                          }}
                        >
                          <PalletLabel pallet={temporalPallet} />
                        </div>
                        <div className="bg-card text-card-foreground h-20 w-full rounded-t-xl border border-b-0 bg-white"></div>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button variant="outline" onClick={handleOnClickPrintLabel}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir etiqueta interna
                      </Button>
                      {canPrintExpeditionLabels && (
                        <Button
                          onClick={handleOnClickDownloadExpeditionLabel}
                          disabled={isDownloadingExpeditionLabel}
                        >
                          {isDownloadingExpeditionLabel ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Printer className="mr-2 h-4 w-4" />
                          )}
                          Etiqueta expedición
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="boxesLabels" className="mt-0 w-full">
                  <BoxesLabels pallet={temporalPallet} setBoxPrinted={setBoxPrinted} />
                </TabsContent>

                {showHistorialTab && (
                  <TabsContent
                    value="imagenes"
                    className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
                  >
                    <PalletImagesTab palletId={palletId} />
                  </TabsContent>
                )}

                {showHistorialTab && (
                  <TabsContent
                    value="historial"
                    className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
                  >
                    <div className="flex min-h-0 flex-1 flex-col">
                      <Card className="flex min-h-0 flex-1 flex-col">
                        <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-4">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <History className="h-5 w-5" /> Historial del palet
                            </CardTitle>
                            <p className="text-muted-foreground mt-1 text-sm">
                              Eventos más recientes primero. Haz clic en la flecha para ver el
                              detalle.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="shrink-0"
                              onClick={handleToggleAllTimeline}
                              disabled={timelineLoading || !timeline || timeline.length === 0}
                              aria-label={allTimelineOpen ? 'Colapsar todo' : 'Expandir todo'}
                            >
                              {allTimelineOpen ? (
                                <ListChevronsUpDown className="h-4 w-4" />
                              ) : (
                                <ListChevronsDownUp className="h-4 w-4" />
                              )}
                            </Button>
                            {canDeleteTimeline && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                                onClick={handleDeleteTimeline}
                                disabled={deletingTimeline}
                              >
                                {deletingTimeline ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                <span className="ml-1.5">Borrar historial</span>
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="min-h-0 flex-1 overflow-y-auto">
                          <PalletTimeline
                            timeline={timeline}
                            loading={timelineLoading}
                            error={timelineError}
                            openStates={timelineOpenStates}
                            onItemOpenChange={(index, open) => {
                              setTimelineOpenStates((prev) => {
                                const next = [...prev];
                                next[index] = open;
                                return next;
                              });
                            }}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                )}

                {canDeletePalletData && (
                  <TabsContent value="eliminar" className="mt-0">
                    <div className="grid max-h-[calc(90vh-200px)] grid-cols-5 gap-6">
                      {/* Columna izquierda: opciones de eliminación */}
                      <div className="col-span-2 space-y-6 overflow-y-auto pr-2">
                        <Card className="border-muted bg-foreground-50 w-full border-2">
                          <CardHeader className="w-full pb-4">
                            <CardTitle className="flex w-full items-center gap-2 text-lg">
                              <Trash2 className="text-destructive h-5 w-5" /> Eliminar cajas
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Label htmlFor="codigo-escaneado">Código escaneado</Label>
                              <Input
                                value={boxCreationData.deleteScannedCode}
                                onChange={(e) => {
                                  boxCreationDataChange('deleteScannedCode', e.target.value);
                                }}
                                type="text"
                                id="codigo-escaneado"
                                placeholder="Escanea aquí..."
                                className="font-mono"
                                disabled={isReadOnly}
                              />
                              <p className="text-muted-foreground text-xs">
                                La caja se eliminará automáticamente al detectar un código válido
                              </p>
                            </div>
                            <div className="mt-4">
                              <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => handleOnClickDeleteAllBoxes()}
                                disabled={isReadOnly}
                              >
                                <Trash2 className="h-4 w-4" /> Eliminar todas las cajas
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="col-span-3 space-y-4 overflow-y-auto">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Cajas en el Palet</h3>
                          <div className="text-muted-foreground/90 bg-foreground-50 flex items-center rounded-full px-4 py-1 text-sm">
                            <span>{temporalPallet.numberOfBoxes} cajas</span>
                            <Separator orientation="vertical" className="mx-2 h-3" />
                            <span>{formatDecimalWeight(temporalPallet.netWeight)}</span>
                            <Separator orientation="vertical" className="mx-2 h-3" />
                            <span>{temporalTotalProducts} productos</span>
                            <Separator orientation="vertical" className="mx-2 h-3" />
                            <span>{temporalTotalLots} lotes</span>
                          </div>
                        </div>
                        <div className="overflow-hidden rounded-lg border">
                          <div className="max-h-[calc(90vh-260px)] overflow-y-auto">
                            <Table>
                              <TableHeader className="bg-background sticky top-0">
                                <TableRow>
                                  <TableHead>Artículo</TableHead>
                                  <TableHead>Lote</TableHead>
                                  <TableHead>GS1 128</TableHead>
                                  <TableHead>Peso Neto</TableHead>
                                  <TableHead>Estado</TableHead>
                                  <TableHead className="w-[100px]">Acciones</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {temporalPallet.boxes.map((box) => {
                                  const boxAvailable = isBoxAvailable(box);
                                  const productionInfo = getBoxProductionInfo(box);

                                  return (
                                    <TableRow
                                      key={box.id}
                                      onClick={() => handleOnClickBoxRow(box.id)}
                                      className={`hover:bg-muted cursor-text ${box?.new === true ? 'bg-foreground-50' : ''} ${!boxAvailable ? 'bg-orange-50/50' : ''}`}
                                    >
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          {box.product?.name}
                                          {!boxAvailable && (
                                            <AlertCircle className="h-4 w-4 text-orange-600" />
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>{box.lot}</TableCell>
                                      <TableCell>{box.gs1128}</TableCell>
                                      <TableCell>{box.netWeight} kg</TableCell>
                                      <TableCell>
                                        {!boxAvailable && productionInfo ? (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Badge
                                                  variant="outline"
                                                  className="cursor-help border-orange-200 bg-orange-50 text-orange-700"
                                                >
                                                  <Factory className="mr-1 h-3 w-3" />
                                                  En Producción
                                                </Badge>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <div className="space-y-1">
                                                  <p className="font-semibold">
                                                    Producción #{productionInfo.id || 'N/A'}
                                                  </p>
                                                  {productionInfo.lot && (
                                                    <p className="text-xs">
                                                      Lote: {productionInfo.lot}
                                                    </p>
                                                  )}
                                                </div>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="border-green-200 bg-green-50 text-green-700"
                                          >
                                            Disponible
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOnClickDuplicateBox(box.id);
                                            }}
                                            disabled={!boxAvailable || isReadOnly}
                                            title={
                                              isReadOnly
                                                ? 'Este pallet pertenece a una recepción y no puede ser editado'
                                                : !boxAvailable
                                                  ? 'No se puede duplicar una caja en producción'
                                                  : 'Duplicar caja'
                                            }
                                          >
                                            <Copy className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive h-8 w-8"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOnClickDeleteBox(box.id);
                                            }}
                                            disabled={!boxAvailable || isReadOnly}
                                            title={
                                              isReadOnly
                                                ? 'Este pallet pertenece a una recepción y no puede ser editado'
                                                : !boxAvailable
                                                  ? 'No se puede eliminar una caja en producción'
                                                  : 'Eliminar caja'
                                            }
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
            <div className="mt-3 flex justify-end gap-3 border-t pt-3 pb-3">
              <Button
                variant="outline"
                onClick={handleOnClickReset}
                disabled={saving || isReadOnly || !hasPalletChanges}
              >
                Deshacer
              </Button>
              <Button
                onClick={handleOnClickSaveChanges}
                disabled={saving || isReadOnly || !hasPalletChanges}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmación: eliminar caja */}
      <AlertDialog
        open={deleteBoxConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteBoxConfirmId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta caja?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la caja del palet. No se puede deshacer una vez guardado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDeleteBox}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación: borrar historial completo */}
      <AlertDialog open={deleteTimelineConfirmOpen} onOpenChange={setDeleteTimelineConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar todo el historial?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente todo el historial de este palet. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDeleteTimeline}
            >
              Borrar historial
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
