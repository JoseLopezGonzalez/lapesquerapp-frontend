'use client';

import { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRightLeft,
  BarChart2,
  Filter,
  Layers,
  LocateFixed,
  MoreVertical,
  Plus,
  ScanLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { MobileFiltersSheet } from './MobileFiltersSheet';
import { MobileStoreLoader } from './MobileStoreLoader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PalletLabelDialog from '../../Pallets/PalletLabelDialog';
import MovePalletToStoreDialog from '../StoresManager/Store/MovePalletToStoreDialog';
import MoveMultiplePalletsToStoreDialog from '../StoresManager/Store/MoveMultiplePalletsToStoreDialog';
import PalletDialog from '@/components/Admin/Pallets/PalletDialog';
import { PalletsListDialog } from '../StoresManager/Store/PalletsListDialog';
import { ProductSummaryDialog } from '../StoresManager/Store/ProductSummaryDialog';
import { MobilePalletQrScanner } from './MobilePalletQrScanner';
import { parseQrPayload } from '@/lib/qr/parseQrPayload';
import { notify } from '@/lib/notifications';

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [palletsDialogOpen, setPalletsDialogOpen] = useState(false);
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const lastScannedRef = useRef({ code: '', at: 0 });
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
    filters,
  } = useStoreContext();

  const storeId = (store?.id as string | number | undefined) || passedStoreId;
  const isGhostStore =
    storeId === REGISTERED_PALLETS_STORE_ID ||
    passedStoreId === REGISTERED_PALLETS_STORE_ID ||
    store?.name === 'En espera';

  const displayStoreName = (passedStoreName || (store?.name as string | undefined) || 'Almacén') as string;

  const activeFilterCount =
    (filters?.products?.length ?? 0) + (filters?.pallets?.length ?? 0);

  const isUnallocatedRelevant = isPositionRelevant(UNLOCATED_POSITION_ID);
  const isUnallocatedFilled = isPositionFilled(UNLOCATED_POSITION_ID);
  const storeContent = store?.content as { pallets?: Array<{ id?: string | number }> } | undefined;

  const handleScannedPalletQr = (rawValue: string) => {
    const code = String(rawValue ?? '').trim();
    if (!code) return;

    const now = Date.now();
    const { code: lastCode, at: lastAt } = lastScannedRef.current;
    if (code === lastCode && now - lastAt < 1800) return;
    lastScannedRef.current = { code, at: now };

    const payload = parseQrPayload(code);
    const palletId = payload.P || (/^\d+$/.test(code) ? code : null);

    if (!palletId || !/^\d+$/.test(String(palletId))) {
      notify.error({
        title: 'QR no reconocido',
        description: 'No se encontró un identificador de palet en el código escaneado.',
      });
      return;
    }

    const numericPalletId = Number(palletId);
    const palletInStore = storeContent?.pallets?.some(
      (pallet) => Number(pallet.id) === numericPalletId
    );

    setScannerOpen(false);
    openPalletDialog(numericPalletId);

    if (palletInStore) {
      notify.success({ title: `Palet #${numericPalletId} localizado` }, { duration: 1200 });
      return;
    }

    notify.info(
      {
        title: `Abriendo palet #${numericPalletId}`,
        description: 'No aparece en este almacén, pero se abrirá su ficha.',
      },
      { duration: 1800 }
    );
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
      {/* Header — formato estandarizado */}
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

        {/* Único action button derecho — consolida filtro, escáner y acciones */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted relative h-12 min-h-12 w-12 min-w-12 shrink-0 rounded-full"
            >
              <MoreVertical className="h-6 w-6" />
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center p-0 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
              <span className="sr-only">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setScannerOpen(true)}>
                <ScanLine className="mr-2 h-4 w-4" />
                Escanear QR
              </DropdownMenuItem>
              {!isGhostStore && (
                <DropdownMenuItem onClick={() => setFiltersOpen(true)}>
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrar
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-primary-foreground ml-auto flex h-4 w-4 items-center justify-center rounded-full text-[10px]">
                      {activeFilterCount}
                    </span>
                  )}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Almacén</DropdownMenuLabel>
            <DropdownMenuGroup>
              {!isGhostStore && (
                <>
                  <DropdownMenuItem
                    onClick={openUnallocatedPositionSlideover}
                    className={cn(
                      isUnallocatedRelevant && 'text-green-600 focus:text-green-600',
                      isUnallocatedFilled && 'text-primary focus:text-primary'
                    )}
                  >
                    <LocateFixed className="mr-2 h-4 w-4" />
                    Sin ubicar
                    {(isUnallocatedRelevant || isUnallocatedFilled) && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-current" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openCreatePalletDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo palet
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPalletsDialogOpen(true)}>
                    <Layers className="mr-2 h-4 w-4" />
                    Palets
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setProductsDialogOpen(true)}>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Productos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={openMoveMultiplePalletsToStoreDialog}
                disabled={!storeContent?.pallets?.length}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Traspaso masivo
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {isGhostStore ? (
          <>
            <div className="from-background pointer-events-none absolute top-0 right-0 left-0 z-10 h-8 bg-gradient-to-b to-transparent" />
            <div className="from-background pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8 bg-gradient-to-t to-transparent" />
            <PalletKanbanView />
          </>
        ) : (
          <Card className="relative h-full overflow-auto rounded-none border-0">
            <MapContainer isMobile>
              <Map onClickPosition={() => {}} isPositionEmpty={() => {}} />
            </MapContainer>
          </Card>
        )}
      </div>

      {/* Filters bottom sheet */}
      {!isGhostStore && (
        <MobileFiltersSheet open={filtersOpen} onOpenChange={setFiltersOpen} />
      )}

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
        initialPallet={clonedPalletData}
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
        <MobilePalletQrScanner
          onScan={handleScannedPalletQr}
          onClose={() => setScannerOpen(false)}
          onError={handleScannerError}
        />
      )}

      {/* Dialogs de informes (controlados desde el dropdown) */}
      <PalletsListDialog open={palletsDialogOpen} onOpenChange={setPalletsDialogOpen} />
      <ProductSummaryDialog open={productsDialogOpen} onOpenChange={setProductsDialogOpen} />
    </div>
  );
}
