import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Warehouse } from 'lucide-react';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import PalletDialog from '@/components/Admin/Pallets/PalletDialog';
import { useStoresOptions } from '@/hooks/useStoresOptions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Loader from '@/components/Utilities/Loader';

const OrderPallets = () => {
    const { pallets, order, onEditingPallet, onCreatingPallet } = useOrderContext();
    const [isPalletDialogOpen, setIsPalletDialogOpen] = useState(false);
    const [selectedPalletId, setSelectedPalletId] = useState(null);
    const [isStoreSelectionOpen, setIsStoreSelectionOpen] = useState(false);
    const [selectedStoreId, setSelectedStoreId] = useState(null);
    const { storeOptions, loading: storesLoading } = useStoresOptions();

    const handleOpenNewPallet = () => {
        setIsStoreSelectionOpen(true);
    };

    const handleOpenEditPallet = (palletId) => {
        setSelectedPalletId(palletId);
        setIsPalletDialogOpen(true);
    };

    const handleClosePalletDialog = () => {
        setIsPalletDialogOpen(false);
        setSelectedPalletId(null);
        setSelectedStoreId(null);
    };

    const handleStoreSelection = (storeId) => {
        setSelectedStoreId(storeId);
        setIsStoreSelectionOpen(false);
        setSelectedPalletId('new');
        setIsPalletDialogOpen(true);
    };

    const handleCloseStoreSelection = () => {
        setIsStoreSelectionOpen(false);
        setSelectedStoreId(null);
    };

    const handlePalletChange = (pallet) => {
        /* si el id esta entre los ids de pallets actuales, se esta editando, si no, se esta creando */
        const isPalletVinculated = pallets.some(pallet => pallet.id === pallet.id);
        if (isPalletVinculated) {
            onEditingPallet(pallet);
        } else {
            onCreatingPallet(pallet);
        }
    };

    console.log('pallets ahiiiiii', pallets);
    return (
        <div className='h-full pb-2'>
            <Card className='h-full flex flex-col bg-transparent'>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-medium">Gestión de Palets</CardTitle>
                        <CardDescription>Modifica los palets de la orden</CardDescription>
                    </div>
                    <Button onClick={handleOpenNewPallet}>
                        <Plus className="h-4 w-4" />
                        Añadir palet
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                    {pallets.length === 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableBody>
                                    <TableRow className='text-nowrap'>
                                        <TableCell className='py-14'>
                                            <EmptyState
                                                title={'No existen palets vinculados'}
                                                description={'No se han añadido palets a este pedido'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Número</TableHead>
                                    <TableHead>Productos</TableHead>
                                    <TableHead>Lotes</TableHead>
                                    <TableHead>Cajas</TableHead>
                                    <TableHead>Peso</TableHead>
                                    <TableHead className="w-[100px]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pallets.map((pallet, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{pallet.id}</TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {pallet?.productsNames?.map((product) => (
                                                    <div key={product}>{product}</div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {pallet.lots.map((lot) => (
                                                    <div key={lot}>{lot}</div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {pallet.numberOfBoxes}
                                        </TableCell>
                                        <TableCell>
                                            {formatDecimalWeight(pallet.netWeight)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleOpenEditPallet(pallet.id)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>)}
                </CardContent>
            </Card>

            {/* Store Selection Modal */}
            <Dialog open={isStoreSelectionOpen} onOpenChange={handleCloseStoreSelection}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Warehouse className="h-5 w-5" />
                            Seleccionar Almacén
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="store-select">Almacén donde se creará el palet</Label>
                            {storesLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader />
                                </div>
                            ) : (
                                <Select onValueChange={handleStoreSelection}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un almacén" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {storeOptions.map((store) => (
                                            <SelectItem key={store.value} value={store.value}>
                                                {store.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            El palet se creará en el almacén seleccionado y se vinculará automáticamente a este pedido.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* PalletDialogWrapper */}
            <PalletDialog
                palletId={selectedPalletId}
                isOpen={isPalletDialogOpen}
                onChange={handlePalletChange}
                initialOrderId={order?.id}
                initialStoreId={selectedStoreId}
                onCloseDialog={handleClosePalletDialog}
            />
        </div>
    )
}

export default OrderPallets