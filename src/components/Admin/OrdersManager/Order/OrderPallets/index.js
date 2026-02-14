import React from 'react'
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
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

const OrderPallets = () => {
    const isMobile = useIsMobile();
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
        isSearching,
        isInitialLoading,
        isLinking,
        paginationMeta,
        currentPage,
        clonedPallet,
        isCloning,
        unlinkingPalletId,
        isUnlinkingAll,
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
        handleClonePallet,
        handleConfirmAction,
        handleCancelAction,
        handleOpenLinkPalletsDialog,
        handleCloseLinkPalletsDialog,
        handleAddPalletId,
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

    return (
        <div className='flex-1 flex flex-col min-h-0'>
            {isMobile ? (
                <div className="flex-1 flex flex-col min-h-0">
                    {pallets.length === 0 ? (
                        <OrderPalletsContent
                            pallets={pallets}
                            isMobile={isMobile}
                            onEdit={handleOpenEditPallet}
                            onClone={handleClonePallet}
                            onUnlink={handleUnlinkPallet}
                            onDelete={handleDeletePallet}
                            onPrintLabel={handleOpenPalletLabelDialog}
                            isCloning={isCloning}
                            unlinkingPalletId={unlinkingPalletId}
                        />
                    ) : (
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="pb-20">
                                <OrderPalletsContent
                                    pallets={pallets}
                                    isMobile={isMobile}
                                    onEdit={handleOpenEditPallet}
                                    onClone={handleClonePallet}
                                    onUnlink={handleUnlinkPallet}
                                    onDelete={handleDeletePallet}
                                    onPrintLabel={handleOpenPalletLabelDialog}
                                    isCloning={isCloning}
                                    unlinkingPalletId={unlinkingPalletId}
                                />
                            </div>
                        </ScrollArea>
                    )}
                    <OrderPalletsToolbar
                        isMobile={isMobile}
                        pallets={pallets}
                        isUnlinkingAll={isUnlinkingAll}
                        onCreate={handleOpenNewPallet}
                        onLink={handleOpenLinkPalletsDialog}
                        onCreateFromForecast={handleOpenCreateFromForecastDialog}
                        onUnlinkAll={handleUnlinkAllPallets}
                    />
                </div>
            ) : (
            <Card className='h-full flex flex-col bg-transparent'>
                <OrderPalletsToolbar
                    isMobile={isMobile}
                    pallets={pallets}
                    isUnlinkingAll={isUnlinkingAll}
                    onCreate={handleOpenNewPallet}
                    onLink={handleOpenLinkPalletsDialog}
                    onCreateFromForecast={handleOpenCreateFromForecastDialog}
                    onUnlinkAll={handleUnlinkAllPallets}
                />
                <CardContent className="flex-1 overflow-auto">
                    <OrderPalletsContent
                        pallets={pallets}
                        isMobile={isMobile}
                        onEdit={handleOpenEditPallet}
                        onClone={handleClonePallet}
                        onUnlink={handleUnlinkPallet}
                        onDelete={handleDeletePallet}
                        onPrintLabel={handleOpenPalletLabelDialog}
                        isCloning={isCloning}
                        unlinkingPalletId={unlinkingPalletId}
                    />
                </CardContent>
            </Card>
            )}

            {/* Store Selection Modal */}
            <StoreSelectionDialog
                open={isStoreSelectionOpen}
                onOpenChange={(open) => { if (!open) handleCloseStoreSelection(); }}
                storeOptions={storeOptions}
                selectedStoreId={selectedStoreId}
                onStoreSelect={handleStoreSelection}
                loading={storesLoading}
                isMobile={isMobile}
            />

            {/* Create Pallet from Forecast Dialog */}
            <CreateFromForecastDialog
                open={isCreateFromForecastDialogOpen}
                onOpenChange={(open) => { if (!open) handleCloseCreateFromForecastDialog(); }}
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
                onOpenChange={(open) => { if (!open) handleCancelAction(); }}
                action={confirmAction}
                onConfirm={handleConfirmAction}
                onCancel={handleCancelAction}
                isUnlinking={unlinkingPalletId !== null}
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
                onAddPalletId={handleAddPalletId}
                onRemovePalletId={handleRemovePalletId}
                onPalletIdKeyDown={handlePalletIdKeyDown}
                onLinkSelected={handleLinkSelectedPallets}
                currentPage={currentPage}
            />
        </div>
    )
}

export default OrderPallets