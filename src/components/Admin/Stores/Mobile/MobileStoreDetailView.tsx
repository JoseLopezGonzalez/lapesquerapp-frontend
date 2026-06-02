'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRightLeft, Filter, LocateFixed, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useStoreContext } from '@/context/StoreContext';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PalletLabelDialog from '../../Pallets/PalletLabelDialog';
import MovePalletToStoreDialog from '../StoresManager/Store/MovePalletToStoreDialog';
import MoveMultiplePalletsToStoreDialog from '../StoresManager/Store/MoveMultiplePalletsToStoreDialog';
import PalletDialog from '@/components/Admin/Pallets/PalletDialog';

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

  const {
    loading,
    isOpenAddElementToPositionDialog,
    isOpenPalletDialog,
    isOpenPalletLabelDialog,
    openUnallocatedPositionSlideover,
    isPositionRelevant,
    isPositionFilled,
    palletDialogData,
    clonedPalletData,
    updateStoreWhenOnChangePallet,
    openCreatePalletDialog,
    store,
    closePalletLabelDialog,
    palletLabelDialogData,
    closePalletDialog,
    openMoveMultiplePalletsToStoreDialog,
    filters,
  } = useStoreContext();

  const storeId = store?.id || passedStoreId;
  const isGhostStore =
    storeId === REGISTERED_PALLETS_STORE_ID ||
    passedStoreId === REGISTERED_PALLETS_STORE_ID ||
    store?.name === 'En espera';

  const displayStoreName = passedStoreName || store?.name || 'Almacén';

  const activeFilterCount =
    (filters?.products?.length ?? 0) + (filters?.pallets?.length ?? 0);

  const isUnallocatedRelevant = isPositionRelevant(UNLOCATED_POSITION_ID);
  const isUnallocatedFilled = isPositionFilled(UNLOCATED_POSITION_ID);

  const unallocatedButtonClass = isUnallocatedRelevant
    ? 'bg-green-500 hover:bg-green-400 text-white border-green-500'
    : isUnallocatedFilled
      ? 'bg-primary/75 hover:bg-primary/90 text-background border-primary/75'
      : '';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Volver</span>
        </Button>
        <span className="flex-1 truncate text-sm font-semibold">{displayStoreName}</span>
        {!isGhostStore && (
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 shrink-0"
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="h-5 w-5" />
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center p-0 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground text-sm">Cargando almacén…</div>
          </div>
        ) : isGhostStore ? (
          /* Ghost store — kanban view */
          <div className="relative h-full overflow-hidden">
            <PalletKanbanView />
            <div className="absolute right-4 bottom-4 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={openMoveMultiplePalletsToStoreDialog}
                disabled={!store?.content?.pallets || store.content.pallets.length === 0}
              >
                <ArrowRightLeft className="mr-1.5 h-4 w-4" />
                Traspaso masivo
              </Button>
            </div>
          </div>
        ) : (
          /* Normal store — full-screen map */
          <Card className="relative h-full overflow-auto rounded-none border-0">
            <MapContainer>
              <Map onClickPosition={() => {}} isPositionEmpty={() => {}} />
            </MapContainer>

            {/* FAB strip — bottom of map, above safe area */}
            <div className="absolute right-3 bottom-3 left-3 z-10 flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                className={cn('flex items-center gap-1.5', unallocatedButtonClass)}
                onClick={openUnallocatedPositionSlideover}
              >
                <LocateFixed className="h-4 w-4" />
                Sin ubicar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Nuevo
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Crear elementos</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={openCreatePalletDialog}>Palet</DropdownMenuItem>
                    <DropdownMenuItem disabled>Tinas</DropdownMenuItem>
                    <DropdownMenuItem disabled>Cajas</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={openMoveMultiplePalletsToStoreDialog}
                disabled={!store?.content?.pallets || store.content.pallets.length === 0}
              >
                <ArrowRightLeft className="mr-1 h-4 w-4" />
                Traspaso
              </Button>
            </div>
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
        onChange={updateStoreWhenOnChangePallet}
        initialStoreId={storeId}
        onCloseDialog={closePalletDialog}
        initialPallet={clonedPalletData}
      />
      <PalletLabelDialog
        isOpen={isOpenPalletLabelDialog}
        onClose={closePalletLabelDialog}
        pallet={palletLabelDialogData}
      />
      <MovePalletToStoreDialog />
      <MoveMultiplePalletsToStoreDialog />
    </div>
  );
}
