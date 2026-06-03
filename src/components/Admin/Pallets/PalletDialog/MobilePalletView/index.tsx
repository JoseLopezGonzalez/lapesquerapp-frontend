'use client';

import { useState } from 'react';
import { AlertCircle, CloudAlert, Loader2, RotateCcw, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePallet, saveDiscountPreferences } from '@/hooks/usePallet';
import { usePalletTimeline } from '@/hooks/usePalletTimeline';
import { isExternalActor, canManagePalletCostFields } from '@/lib/auth/actor';
import type { PalletState } from '@/hooks/usePallet';
import type { PalletTimelineEntry } from '@/services/palletService';
import ScanTab from './ScanTab';
import BoxesTab from './BoxesTab';
import InfoTab from './InfoTab';

interface MobilePalletViewProps {
  palletId: string | number | null | undefined;
  onChange?: (...args: unknown[]) => unknown;
  initialStoreId?: string | number | null;
  initialOrderId?: string | number | null;
  onSaveTemporal?: ((pallet: PalletState) => void) | null;
  initialPallet?: PalletState | null;
  readOnly?: boolean;
}

export default function MobilePalletView({
  palletId,
  onChange = () => {},
  initialStoreId = null,
  initialOrderId = null,
  onSaveTemporal = null,
  initialPallet = null,
  readOnly: readOnlyProp = false,
}: MobilePalletViewProps) {
  const { data: session } = useSession();
  const externalActor = isExternalActor(session?.user);
  const canEditCost = canManagePalletCostFields(session?.user);

  const isNew = !palletId || palletId === 'new' || String(palletId).startsWith('temp-');
  const [activeTab, setActiveTab] = useState<string>(isNew ? 'escanear' : 'cajas');

  const {
    temporalPallet,
    loading,
    saving,
    error,
    editPallet,
    productsOptions,
    productsLoading,
    activeOrdersOptions,
    activeOrdersLoading,
    boxCreationData,
    boxCreationDataChange,
    onAddNewBox,
    onResetBoxCreationData,
    hasPalletChanges,
    onSavingChanges,
    resetAllChanges,
  } = usePallet({
    id: palletId ?? null,
    onChange,
    initialStoreId,
    initialOrderId,
    initialPallet,
  });

  const showHistorial = Boolean(
    palletId && palletId !== 'new' && !String(palletId).startsWith('temp-')
  );

  const { timeline, loading: timelineLoading, refetch: refetchTimeline } = usePalletTimeline(
    showHistorial ? palletId : null
  );

  const receptionId = temporalPallet?.receptionId as string | number | null | undefined;
  const isReadOnly = (receptionId !== null && receptionId !== undefined) || readOnlyProp;
  const orderIdBlocked = initialOrderId !== null;

  const totalBoxes = temporalPallet?.boxes?.length ?? 0;

  const handleSave = () => {
    if (isReadOnly) return;
    saveDiscountPreferences(boxCreationData);
    if (onSaveTemporal && temporalPallet) {
      onSaveTemporal(temporalPallet);
    } else {
      onSavingChanges();
    }
  };

  if (loading || !temporalPallet) {
    return (
      <div className="flex h-full w-full flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 py-10">
        <div className="flex items-center justify-center rounded-full bg-red-100 p-4">
          <CloudAlert className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-destructive">Error al cargar el palet</h2>
        <p className="text-center text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {isReadOnly && (
        <Alert className="mx-3 mt-2 shrink-0 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-sm text-orange-800">
            Pertenece a una recepción de materia prima. Solo lectura.
          </AlertDescription>
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          if (v === 'info' && showHistorial) refetchTimeline();
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="mx-3 mt-2 grid shrink-0 grid-cols-3">
          <TabsTrigger value="escanear" className="text-xs">
            Escanear
          </TabsTrigger>
          <TabsTrigger value="cajas" className="flex items-center gap-1.5 text-xs">
            Cajas
            {totalBoxes > 0 && (
              <Badge
                variant="secondary"
                className="h-4 min-w-[1rem] rounded-full px-1 py-0 text-[10px] leading-none"
              >
                {totalBoxes}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs">
            Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="escanear" className="mt-0 min-h-0 flex-1 overflow-auto px-3 py-3">
          <ScanTab
            temporalPallet={temporalPallet}
            productsOptions={productsOptions}
            productsLoading={productsLoading}
            boxCreationData={boxCreationData}
            boxCreationDataChange={boxCreationDataChange}
            onAddNewBox={onAddNewBox}
            onResetBoxCreationData={onResetBoxCreationData}
            onDeleteBox={(boxId) => editPallet.box.delete(boxId)}
            isReadOnly={isReadOnly}
            canEditCost={canEditCost}
          />
        </TabsContent>

        <TabsContent value="cajas" className="mt-0 min-h-0 flex-1 overflow-auto px-3 py-3">
          <BoxesTab
            temporalPallet={temporalPallet}
            onDeleteBox={(boxId) => editPallet.box.delete(boxId)}
            onDuplicateBox={(boxId) => editPallet.box.duplicate(boxId)}
            onEditLot={(boxId, lot) => editPallet.box.edit.lot(boxId, lot)}
            onEditNetWeight={(boxId, w) => editPallet.box.edit.netWeight(boxId, w)}
            onEditManualCost={(boxId, v) => editPallet.box.edit.manualCostPerKg(boxId, v)}
            isReadOnly={isReadOnly}
            canEditCost={canEditCost}
          />
        </TabsContent>

        <TabsContent value="info" className="mt-0 min-h-0 flex-1 overflow-auto px-3 py-3">
          <InfoTab
            temporalPallet={temporalPallet}
            onEditObservations={(obs) => editPallet.observations(obs)}
            onEditOrderId={(id) => editPallet.orderId(id)}
            activeOrdersOptions={
              activeOrdersOptions as Array<{
                id: string | number;
                name: string;
                load_date: string;
              }>
            }
            activeOrdersLoading={activeOrdersLoading}
            orderIdBlocked={orderIdBlocked}
            isReadOnly={isReadOnly}
            externalActor={externalActor}
            timeline={timeline as PalletTimelineEntry[] | null | undefined}
            timelineLoading={timelineLoading}
            showHistorial={showHistorial}
          />
        </TabsContent>
      </Tabs>

      {/* Sticky save/discard bar — only visible when there are unsaved changes */}
      {!isReadOnly && hasPalletChanges && (
        <div
          className="shrink-0 border-t bg-background/95 px-3 py-3 backdrop-blur-sm"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={resetAllChanges}
              disabled={saving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Descartar
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
