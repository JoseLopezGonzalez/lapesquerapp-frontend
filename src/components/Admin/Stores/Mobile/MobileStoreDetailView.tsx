'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRightLeft, Filter, LocateFixed, MoreHorizontal, Plus } from 'lucide-react';
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

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <MoreHorizontal className="h-5 w-5" />
              <span className="sr-only">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
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
                </>
              )}
              <DropdownMenuItem
                onClick={openMoveMultiplePalletsToStoreDialog}
                disabled={!store?.content?.pallets || store.content.pallets.length === 0}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Traspaso masivo
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

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
          <MobileStoreLoader storeName={displayStoreName} />
        ) : isGhostStore ? (
          /* Ghost store — kanban view */
          <div className="h-full overflow-hidden">
            <PalletKanbanView />
          </div>
        ) : (
          /* Normal store — full-screen map */
          <Card className="relative h-full overflow-auto rounded-none border-0">
            <MapContainer>
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
