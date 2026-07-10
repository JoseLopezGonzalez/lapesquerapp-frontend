'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRightLeft,
  BarChart2,
  LayoutGrid,
  LocateFixed,
  MapPin,
  MoreVertical,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useStoreContext } from '@/context/StoreContext';
import { useHideBottomNav } from '@/context/BottomNavContext';
import { UNLOCATED_POSITION_ID } from '@/configs/config';
import { REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores';
import { cn } from '@/lib/utils';
import Map from '../StoresManager/Store/MapContainer/Map';
import MapContainer from '../StoresManager/Store/MapContainer';
import PositionSlideover from '../StoresManager/Store/PositionSlideover';
import UnallocatedPositionSlideover from '../StoresManager/Store/UnallocatedPositionSlideover';
import AddElementToPosition from '../StoresManager/Store/AddElementToPositionDialog';
import PalletKanbanView from '../StoresManager/Store/PalletKanbanView';
import { MobileStoreLoader } from './MobileStoreLoader';
import { StoreSearchBar } from './StoreSearchBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PalletLabelDialog from '../../Pallets/PalletLabelDialog';
import MovePalletToStoreDialog from '../StoresManager/Store/MovePalletToStoreDialog';
import MoveMultiplePalletsToStoreDialog from '../StoresManager/Store/MoveMultiplePalletsToStoreDialog';
import PalletDialog from '@/components/Admin/Pallets/PalletDialog';
import { type PalletState } from '@/hooks/usePallet';
import { ProductSummaryDialog } from '../StoresManager/Store/ProductSummaryDialog';
import dynamic from 'next/dynamic';
import { parseQrPayload } from '@/lib/qr/parseQrPayload';
import type { QrValidateResult } from '@/components/Shared/QrScannerWidget';
import { notify } from '@/lib/notifications';

const QrScannerWidget = dynamic(
  () => import('@/components/Shared/QrScannerWidget').then((m) => ({ default: m.QrScannerWidget })),
  { ssr: false }
);

interface MobileStoreDetailViewProps {
  passedStoreId: string | number;
  passedStoreName?: string;
  onBack: () => void;
}

export function MobileStoreDetailView({
  passedStoreId,
  passedStoreName,
  onBack,
}: MobileStoreDetailViewProps) {
  const [viewMode, setViewMode] = useState<'map' | 'kanban'>('kanban');
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  useHideBottomNav();

  const {
    loading,
    isOpenAddElementToPositionDialog,
    isOpenPalletDialog,
    isOpenPalletLabelDialog,
    openUnallocatedPositionSlideover,
    isPositionRelevant,
    isPositionFilled,
    palletDialogData,
    palletDialogInitialTab,
    clonedPalletData,
    updateStoreWhenOnChangePallet,
    openPalletDialog,
    openCreatePalletDialog,
    store,
    closePalletLabelDialog,
    palletLabelDialogData,
    closePalletDialog,
    openMoveMultiplePalletsToStoreDialog,
  } = useStoreContext();

  const storeId = (store?.id as string | number | undefined) || passedStoreId;
  const isGhostStore =
    storeId === REGISTERED_PALLETS_STORE_ID ||
    passedStoreId === REGISTERED_PALLETS_STORE_ID ||
    store?.name === 'En espera';

  const displayStoreName = (
    passedStoreName ||
    (store?.name as string | undefined) ||
    'Almacén'
  ) as string;

  const isUnallocatedRelevant = isPositionRelevant(UNLOCATED_POSITION_ID);
  const isUnallocatedFilled = isPositionFilled(UNLOCATED_POSITION_ID);
  const storeContent = store?.content as { pallets?: Array<{ id?: string | number }> } | undefined;

  const validatePalletQr = (rawValue: string): QrValidateResult => {
    const payload = parseQrPayload(rawValue);
    const palletId = payload.P || (/^\d+$/.test(rawValue) ? rawValue : null);
    if (!palletId || !/^\d+$/.test(String(palletId))) {
      return { ok: false, message: 'No se encontró un identificador de palet.' };
    }
    return { ok: true };
  };

  const handleScannedPalletQr = (rawValue: string) => {
    const payload = parseQrPayload(rawValue);
    const palletId = payload.P || (/^\d+$/.test(rawValue) ? rawValue : null);
    if (!palletId) return;

    const numericPalletId = Number(palletId);
    const palletInStore = storeContent?.pallets?.some(
      (pallet) => Number(pallet.id) === numericPalletId,
    );

    setScannerOpen(false);
    openPalletDialog(numericPalletId);

    if (!palletInStore) {
      notify.info(
        {
          title: `Abriendo palet #${numericPalletId}`,
          description: 'No aparece en este almacén, pero se abrirá su ficha.',
        },
        { duration: 1800 },
      );
    }
  };

  const handleScannerError = (message: string) => {
    notify.error({
      title: 'No se pudo abrir la cámara',
      description: message || 'Revisa permisos del navegador e inténtalo de nuevo.',
    });
    setScannerOpen(false);
  };

  if (loading) {
    return <MobileStoreLoader storeName={displayStoreName} />;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 px-2 pt-4 pb-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="hover:bg-muted h-12 min-h-12 w-12 min-w-12 shrink-0 rounded-full"
          aria-label="Volver"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <h2 className="flex-1 truncate text-center text-xl font-normal dark:text-white">
          {displayStoreName}
        </h2>

        {/* Menú secundario — solo acciones menos frecuentes */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted h-12 min-h-12 w-12 min-w-12 shrink-0 rounded-full"
            >
              <MoreVertical className="h-6 w-6" />
              <span className="sr-only">Más acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              {!isGhostStore && (
                <DropdownMenuItem
                  onClick={openUnallocatedPositionSlideover}
                  className={cn(
                    isUnallocatedRelevant && 'text-green-600 focus:text-green-600',
                    isUnallocatedFilled && 'text-primary focus:text-primary',
                  )}
                >
                  <LocateFixed className="mr-2 h-4 w-4" />
                  Sin ubicar
                  {(isUnallocatedRelevant || isUnallocatedFilled) && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-current" />
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={openMoveMultiplePalletsToStoreDialog}
                disabled={!storeContent?.pallets?.length}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Traspaso masivo
              </DropdownMenuItem>
              {!isGhostStore && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProductsDialogOpen(true)}>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Resumen productos
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Barra de búsqueda unificada — solo en almacenes reales */}
      {!isGhostStore && (
        <StoreSearchBar onScannerOpen={() => setScannerOpen(true)} />
      )}

      {/* Contenido principal */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {isGhostStore ? (
          <>
            <div className="from-background pointer-events-none absolute top-0 right-0 left-0 z-10 h-8 bg-gradient-to-b to-transparent" />
            <div className="from-background pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8 bg-gradient-to-t to-transparent" />
            <PalletKanbanView />
          </>
        ) : viewMode === 'map' ? (
          <Card className="relative h-full overflow-auto rounded-none border-0">
            <MapContainer isMobile>
              <Map onClickPosition={() => {}} isPositionEmpty={() => {}} />
            </MapContainer>
          </Card>
        ) : (
          <>
            <div className="from-background pointer-events-none absolute top-0 right-0 left-0 z-10 h-8 bg-gradient-to-b to-transparent" />
            <div className="from-background pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8 bg-gradient-to-t to-transparent" />
            <PalletKanbanView />
          </>
        )}

        {/* Botón toggle vista — esquina inferior izquierda */}
        {!isGhostStore && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 bottom-4 z-20 h-14 w-14 shadow-lg"
            onClick={() => setViewMode(viewMode === 'map' ? 'kanban' : 'map')}
            aria-label={viewMode === 'map' ? 'Ver tarjetas' : 'Ver mapa'}
          >
            {viewMode === 'map' ? (
              <LayoutGrid className="h-5 w-5" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
          </Button>
        )}

        {/* FAB — crear palet */}
        {!isGhostStore && (
          <Button
            onClick={openCreatePalletDialog}
            size="icon"
            className="absolute right-4 bottom-4 z-20 h-14 w-14 shadow-lg"
            aria-label="Nuevo palet"
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Slideovres y diálogos reutilizados del desktop */}
      <PositionSlideover />
      <UnallocatedPositionSlideover />
      <AddElementToPosition open={isOpenAddElementToPositionDialog} />
      <PalletDialog
        isOpen={isOpenPalletDialog}
        palletId={palletDialogData}
        onChange={updateStoreWhenOnChangePallet as (...args: unknown[]) => unknown}
        initialStoreId={storeId}
        onCloseDialog={closePalletDialog}
        initialPallet={clonedPalletData as PalletState | null}
        initialTab={palletDialogInitialTab}
      />
      <PalletLabelDialog
        isOpen={isOpenPalletLabelDialog}
        onClose={closePalletLabelDialog}
        pallet={palletLabelDialogData}
      />
      <MovePalletToStoreDialog />
      <MoveMultiplePalletsToStoreDialog />

      {scannerOpen && (
        <QrScannerWidget
          onScan={handleScannedPalletQr}
          onClose={() => setScannerOpen(false)}
          onError={handleScannerError}
          validate={validatePalletQr}
          title="Localizar palet"
          statusText="Apunta al QR del palet"
          successText="Palet localizado"
          manualEntryHelp="Introduce el identificador del palet manualmente."
        />
      )}

      <ProductSummaryDialog open={productsDialogOpen} onOpenChange={setProductsDialogOpen} />
    </div>
  );
}
