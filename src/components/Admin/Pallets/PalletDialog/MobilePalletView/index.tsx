'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertCircle, CloudAlert, Loader2, RefreshCcw, RotateCcw, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { usePallet, saveDiscountPreferences } from '@/hooks/usePallet';
import { usePalletTimeline } from '@/hooks/usePalletTimeline';
import { isExternalActor, canManagePalletCostFields } from '@/lib/auth/actor';
import { parseGs1128Line } from '@/lib/gs1128Parser';
import type { PalletState } from '@/hooks/usePallet';
import type { PalletTimelineEntry } from '@/services/palletService';
import type { QrValidateResult } from '@/components/Shared/QrScannerWidget';
import type { PalletScreen } from './types';
import HubScreen from './HubScreen';
import AddManualScreen from './AddManualScreen';
import TaraScreen from './TaraScreen';
import ObservacionesScreen from './ObservacionesScreen';
import PedidoScreen from './PedidoScreen';
import BoxesTab from './BoxesTab';
import ResumenTab from './ResumenTab';
import ImagenesTab from './ImagenesTab';
import EliminarTab from './EliminarTab';
import HistorialTab from './HistorialTab';

const QrScannerWidget = dynamic(
  () => import('@/components/Shared/QrScannerWidget').then((m) => ({ default: m.QrScannerWidget })),
  { ssr: false }
);

export type { PalletScreen } from './types';

interface MobilePalletViewProps {
  palletId: string | number | null | undefined;
  onChange?: (...args: unknown[]) => unknown;
  initialStoreId?: string | number | null;
  initialOrderId?: string | number | null;
  onSaveTemporal?: ((pallet: PalletState) => void) | null;
  initialPallet?: PalletState | null;
  readOnly?: boolean;
  initialTab?: string | null;
  onActiveScreenChange?: (screen: PalletScreen) => void;
}

// Outer wrapper holds retry key so re-mounting the inner component re-initialises usePallet
export default function MobilePalletView(props: MobilePalletViewProps) {
  const [retryKey, setRetryKey] = useState(0);
  return (
    <MobilePalletViewInner
      key={retryKey}
      {...props}
      onRetry={() => setRetryKey((k) => k + 1)}
    />
  );
}

function MobilePalletViewInner({
  palletId,
  onChange = () => {},
  initialStoreId = null,
  initialOrderId = null,
  onSaveTemporal = null,
  initialPallet = null,
  readOnly: readOnlyProp = false,
  onActiveScreenChange,
  onRetry,
}: MobilePalletViewProps & { onRetry: () => void }) {
  const { data: session } = useSession();
  const externalActor = isExternalActor(session?.user);
  const canEditCost = canManagePalletCostFields(session?.user);

  const isNew = !palletId || palletId === 'new' || String(palletId).startsWith('temp-');
  const [activeScreen, setActiveScreen] = useState<PalletScreen>('hub');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    setActiveScreen('hub');
    onActiveScreenChange?.('hub');
  }, [palletId, onActiveScreenChange]);

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
    deleteAllBoxes,
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

  const handleSave = () => {
    if (isReadOnly) return;
    saveDiscountPreferences(boxCreationData);
    if (onSaveTemporal && temporalPallet) {
      onSaveTemporal(temporalPallet);
    } else {
      onSavingChanges();
    }
  };

  const navigateTo = (screen: PalletScreen) => {
    if (screen === 'historial' && showHistorial) refetchTimeline();
    setActiveScreen(screen);
    onActiveScreenChange?.(screen);
  };

  const goToHub = useCallback(() => {
    setActiveScreen('hub');
    onActiveScreenChange?.('hub');
  }, [onActiveScreenChange]);

  const handleOpenScanner = () => {
    setSessionCount(0);
    setScannerOpen(true);
  };

  const validateGs1128 = useCallback(
    (rawValue: string): QrValidateResult => {
      const parsed = parseGs1128Line(
        rawValue,
        productsOptions as { value: unknown; label: unknown; boxGtin: unknown }[]
      );
      return parsed ? { ok: true } : { ok: false, message: 'Código GS1-128 no reconocido' };
    },
    [productsOptions]
  );

  const handleScannedCode = (rawValue: string) => {
    const code = String(rawValue ?? '').trim();
    if (!code) return;
    boxCreationDataChange('scannedCode', code);
    setSessionCount((prev) => prev + 1);
  };

  if (loading || !temporalPallet) {
    return (
      <div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cargando palet…</p>
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
        <Button variant="outline" onClick={onRetry} className="mt-1 gap-2">
          <RefreshCcw className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  const boxes = temporalPallet.boxes ?? [];

  // Screens with their own bottom CTA don't show the global save bar to avoid double bottom bars
  const showSaveBar =
    !isReadOnly && hasPalletChanges && activeScreen !== 'add-manual' && activeScreen !== 'eliminar';

  const renderScreen = () => {
    switch (activeScreen) {
      case 'hub':
        return (
          <HubScreen
            temporalPallet={temporalPallet}
            isNew={isNew}
            isReadOnly={isReadOnly}
            externalActor={externalActor}
            showHistorial={showHistorial}
            onNavigate={navigateTo}
            onOpenScanner={handleOpenScanner}
          />
        );

      case 'add-manual':
        return (
          <AddManualScreen
            productsOptions={productsOptions}
            productsLoading={productsLoading}
            boxCreationData={boxCreationData}
            boxCreationDataChange={boxCreationDataChange}
            onAddNewBox={onAddNewBox}
            onResetBoxCreationData={onResetBoxCreationData}
            onBack={goToHub}
            isReadOnly={isReadOnly}
            canEditCost={canEditCost}
            hasPalletChanges={hasPalletChanges}
          />
        );

      case 'cajas':
        return (
          <BoxesTab
            temporalPallet={temporalPallet}
            onDeleteBox={(boxId) => editPallet.box.delete(boxId)}
            onDuplicateBox={(boxId) => editPallet.box.duplicate(boxId)}
            onEditLot={(boxId, lot) => editPallet.box.edit.lot(boxId, lot)}
            onEditNetWeight={(boxId, w) => editPallet.box.edit.netWeight(boxId, w)}
            onEditManualCost={(boxId, v) => editPallet.box.edit.manualCostPerKg(boxId, v)}
            isReadOnly={isReadOnly}
            canEditCost={canEditCost}
            onBack={goToHub}
          />
        );

      case 'tara':
        return (
          <TaraScreen
            temporalPallet={temporalPallet}
            onEditPalletTareWeightKg={(v) => editPallet.palletTareWeightKg(v)}
            onBack={goToHub}
            isReadOnly={isReadOnly}
          />
        );

      case 'observaciones':
        return (
          <ObservacionesScreen
            temporalPallet={temporalPallet}
            onEditObservations={(obs) => editPallet.observations(obs)}
            onBack={goToHub}
            isReadOnly={isReadOnly}
          />
        );

      case 'pedido':
        return (
          <PedidoScreen
            temporalPallet={temporalPallet}
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
            onBack={goToHub}
            isReadOnly={isReadOnly}
          />
        );

      case 'resumen':
        return <ResumenTab temporalPallet={temporalPallet} onBack={goToHub} />;

      case 'imagenes':
        return <ImagenesTab palletId={palletId!} onBack={goToHub} />;

      case 'historial':
        return (
          <HistorialTab
            timeline={timeline as PalletTimelineEntry[] | null | undefined}
            timelineLoading={timelineLoading}
            onBack={goToHub}
          />
        );

      case 'eliminar':
        return (
          <EliminarTab
            temporalPallet={temporalPallet}
            onDeleteBox={(boxId) => editPallet.box.delete(boxId)}
            onDeleteAllBoxes={deleteAllBoxes}
            onDeleteScannedCode={(code) => boxCreationDataChange('deleteScannedCode', code)}
            isReadOnly={isReadOnly}
            hasPalletChanges={hasPalletChanges}
            onBack={goToHub}
          />
        );
    }
  };

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

      {/* Screen content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {renderScreen()}
      </div>

      {/* Fullscreen QR scanner */}
      {scannerOpen && (
        <QrScannerWidget
          onScan={handleScannedCode}
          onClose={() => setScannerOpen(false)}
          onError={() => setScannerOpen(false)}
          validate={validateGs1128}
          statusText="Apunta al código GS1-128 de la caja"
          successText="Caja registrada"
          boxCount={boxes.length}
          sessionCount={sessionCount}
        />
      )}

      {/* Sticky save/discard bar — hidden on screens with their own bottom CTA */}
      {showSaveBar && (
        <div
          className="shrink-0 bg-background/95 px-3 py-3 backdrop-blur-sm"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={resetAllChanges}
              disabled={saving}
            >
              <RotateCcw />
              Descartar
            </Button>
            <Button size="lg" className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
