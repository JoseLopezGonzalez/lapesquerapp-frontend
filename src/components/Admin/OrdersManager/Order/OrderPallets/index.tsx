'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import PalletDialog from '@/components/Admin/Pallets/PalletDialog';
import PalletLabelDialog from '@/components/Admin/Pallets/PalletLabelDialog';
import StoreSelectionDialog from './dialogs/StoreSelectionDialog';
import ConfirmActionDialog from './dialogs/ConfirmActionDialog';
import CreateFromForecastDialog from './dialogs/CreateFromForecastDialog';
import LinkPalletsDialog from './dialogs/LinkPalletsDialog';
import OrderPalletsToolbar from './components/OrderPalletsToolbar';
import OrderPalletsContent from './components/OrderPalletsContent';
import { useOrderPallets } from './hooks/useOrderPallets';

interface OrderPalletsProps {
  readOnly?: boolean;
  canViewCostData?: boolean;
}

const OrderPallets = ({ readOnly = false, canViewCostData = true }: OrderPalletsProps) => {
  const { isMobile, mounted } = useIsMobileSafe();
  const api = useOrderPallets();
  const {
    pallets,
    order,
    storeOptions,
    storesLoading,
    isPalletDialogOpen,
    selectedPalletId,
    isStoreSelectionOpen,
    selectedStoreId,
    isConfirmDialogOpen,
    confirmAction,
    confirmPalletId,
    isPalletLabelDialogOpen,
    selectedPalletForLabel,
    isLinkPalletsDialogOpen,
    palletIds,
    inputPalletId,
    setInputPalletId,
    filterStoreId,
    setFilterStoreId,
    searchResults,
    selectedPalletIds,
    selectedLinkedPalletIds,
    isSearching,
    isInitialLoading,
    isLinking,
    paginationMeta,
    currentPage,
    clonedPallet,
    isCloning,
    unlinkingPalletId,
    isUnlinkingAll,
    isPrintingExpeditionLabels,
    canPrintExpeditionLabels,
    isCreateFromForecastDialogOpen,
    createFromForecastLot,
    setCreateFromForecastLot,
    createFromForecastStoreId,
    setCreateFromForecastStoreId,
    isCreatingFromForecast,
    handleOpenNewPallet,
    handleOpenEditPallet,
    handleClosePalletDialog,
    handleStoreSelection,
    handleCloseStoreSelection,
    handlePalletChange,
    handleDeletePallet,
    handleUnlinkPallet,
    handleOpenPalletLabelDialog,
    handleClosePalletLabelDialog,
    handleToggleLinkedPalletSelection,
    handleSelectAllLinkedPallets,
    handleDeselectAllLinkedPallets,
    handlePrintPalletExpeditionLabel,
    handlePrintSelectedPalletExpeditionLabels,
    handleClonePallet,
    handleConfirmAction,
    handleCancelAction,
    handleOpenLinkPalletsDialog,
    handleCloseLinkPalletsDialog,
    handleRemovePalletId,
    handlePalletIdKeyDown,
    handleSearchPallets,
    togglePalletSelection,
    handleSelectAllPallets,
    handleDeselectAllPallets,
    handleLinkSelectedPallets,
    handleUnlinkAllPallets,
    handleOpenCreateFromForecastDialog,
    handleCloseCreateFromForecastDialog,
    handleCreatePalletFromForecast,
  } = api;

  if (!mounted) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isMobile ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {pallets.length === 0 ? (
            <OrderPalletsContent
              pallets={pallets}
              isMobile={isMobile}
              readOnly={readOnly}
              canViewCostData={canViewCostData}
              onEdit={handleOpenEditPallet}
              onClone={handleClonePallet}
              onUnlink={handleUnlinkPallet}
              onDelete={handleDeletePallet}
              onPrintLabel={handleOpenPalletLabelDialog}
              onPrintExpeditionLabel={handlePrintPalletExpeditionLabel}
              canPrintExpeditionLabels={canPrintExpeditionLabels}
              selectedPalletIds={selectedLinkedPalletIds}
              onToggleSelection={handleToggleLinkedPalletSelection}
              isCloning={isCloning}
              unlinkingPalletId={unlinkingPalletId}
            />
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <div className="pb-20">
                <OrderPalletsContent
                  pallets={pallets}
                  isMobile={isMobile}
                  readOnly={readOnly}
                  canViewCostData={canViewCostData}
                  onEdit={handleOpenEditPallet}
                  onClone={handleClonePallet}
                  onUnlink={handleUnlinkPallet}
                  onDelete={handleDeletePallet}
                  onPrintLabel={handleOpenPalletLabelDialog}
                  onPrintExpeditionLabel={handlePrintPalletExpeditionLabel}
                  canPrintExpeditionLabels={canPrintExpeditionLabels}
                  selectedPalletIds={selectedLinkedPalletIds}
                  onToggleSelection={handleToggleLinkedPalletSelection}
                  isCloning={isCloning}
                  unlinkingPalletId={unlinkingPalletId}
                />
              </div>
            </ScrollArea>
          )}
          <OrderPalletsToolbar
            isMobile={isMobile}
            pallets={pallets}
            readOnly={readOnly}
            isUnlinkingAll={isUnlinkingAll}
            onCreate={handleOpenNewPallet}
            onLink={handleOpenLinkPalletsDialog}
            onCreateFromForecast={handleOpenCreateFromForecastDialog}
            onUnlinkAll={handleUnlinkAllPallets}
            selectedPalletCount={selectedLinkedPalletIds.length}
            isPrintingExpeditionLabels={isPrintingExpeditionLabels}
            canPrintExpeditionLabels={canPrintExpeditionLabels}
            onPrintSelectedExpeditionLabels={handlePrintSelectedPalletExpeditionLabels}
          />
        </div>
      ) : (
        <Card className="flex min-h-0 flex-1 flex-col bg-transparent">
          <OrderPalletsToolbar
            isMobile={isMobile}
            pallets={pallets}
            isUnlinkingAll={isUnlinkingAll}
            readOnly={readOnly}
            onCreate={handleOpenNewPallet}
            onLink={handleOpenLinkPalletsDialog}
            onCreateFromForecast={handleOpenCreateFromForecastDialog}
            onUnlinkAll={handleUnlinkAllPallets}
            selectedPalletCount={selectedLinkedPalletIds.length}
            isPrintingExpeditionLabels={isPrintingExpeditionLabels}
            canPrintExpeditionLabels={canPrintExpeditionLabels}
            onPrintSelectedExpeditionLabels={handlePrintSelectedPalletExpeditionLabels}
          />
          <CardContent className="flex-1 overflow-auto">
            <OrderPalletsContent
              pallets={pallets}
              isMobile={isMobile}
              readOnly={readOnly}
              canViewCostData={canViewCostData}
              onEdit={handleOpenEditPallet}
              onClone={handleClonePallet}
              onUnlink={handleUnlinkPallet}
              onDelete={handleDeletePallet}
              onPrintLabel={handleOpenPalletLabelDialog}
              onPrintExpeditionLabel={handlePrintPalletExpeditionLabel}
              canPrintExpeditionLabels={canPrintExpeditionLabels}
              selectedPalletIds={selectedLinkedPalletIds}
              onToggleSelection={handleToggleLinkedPalletSelection}
              onSelectAll={handleSelectAllLinkedPallets}
              onDeselectAll={handleDeselectAllLinkedPallets}
              isCloning={isCloning}
              unlinkingPalletId={unlinkingPalletId}
            />
          </CardContent>
        </Card>
      )}

      {/* Store Selection Modal */}
      <StoreSelectionDialog
        open={isStoreSelectionOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseStoreSelection();
        }}
        storeOptions={storeOptions}
        selectedStoreId={selectedStoreId}
        onStoreSelect={handleStoreSelection}
        loading={storesLoading}
        isMobile={isMobile}
      />

      {/* Create Pallet from Forecast Dialog */}
      <CreateFromForecastDialog
        open={isCreateFromForecastDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseCreateFromForecastDialog();
        }}
        lot={createFromForecastLot}
        setLot={setCreateFromForecastLot}
        storeId={createFromForecastStoreId}
        setStoreId={setCreateFromForecastStoreId}
        storeOptions={storeOptions}
        storesLoading={storesLoading}
        isCreating={isCreatingFromForecast}
        onCreate={handleCreatePalletFromForecast}
        onCancel={handleCloseCreateFromForecastDialog}
        isMobile={isMobile}
      />

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={isConfirmDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelAction();
        }}
        action={confirmAction}
        palletId={confirmPalletId}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
        isUnlinking={unlinkingPalletId !== null || isUnlinkingAll}
        unlinkAllCount={confirmAction === 'unlinkAll' ? pallets.length : undefined}
      />

      {/* PalletDialogWrapper */}
      <PalletDialog
        palletId={selectedPalletId}
        isOpen={isPalletDialogOpen}
        onChange={handlePalletChange}
        initialOrderId={order?.id}
        initialStoreId={selectedStoreId}
        onCloseDialog={handleClosePalletDialog}
        initialPallet={clonedPallet}
      />

      {/* PalletLabelDialog */}
      <PalletLabelDialog
        isOpen={isPalletLabelDialogOpen}
        onClose={handleClosePalletLabelDialog}
        pallet={selectedPalletForLabel}
      />

      {/* Link Existing Pallets Dialog */}
      <LinkPalletsDialog
        open={isLinkPalletsDialogOpen}
        onClose={handleCloseLinkPalletsDialog}
        orderId={order?.id}
        pallets={pallets}
        storeOptions={storeOptions}
        storesLoading={storesLoading}
        isMobile={isMobile}
        onSearch={handleSearchPallets}
        onToggleSelection={togglePalletSelection}
        onSelectAll={handleSelectAllPallets}
        onDeselectAll={handleDeselectAllPallets}
        selectedPalletIds={selectedPalletIds}
        searchResults={searchResults}
        paginationMeta={paginationMeta}
        isSearching={isSearching}
        isInitialLoading={isInitialLoading}
        isLinking={isLinking}
        palletIds={palletIds}
        inputPalletId={inputPalletId}
        setInputPalletId={setInputPalletId}
        filterStoreId={filterStoreId}
        setFilterStoreId={setFilterStoreId}
        onRemovePalletId={handleRemovePalletId}
        onPalletIdKeyDown={handlePalletIdKeyDown}
        onLinkSelected={handleLinkSelectedPallets}
        currentPage={currentPage}
      />
    </div>
  );
};

export default OrderPallets;
