import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Warehouse, Trash2, Unlink, Link2, Search, X, Loader2, ChevronLeft, ChevronRight, CornerDownLeft, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { useStoresOptions } from '@/hooks/useStoresOptions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Loader from '@/components/Utilities/Loader';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import PalletDialog from '@/components/Admin/Pallets/PalletDialog';
import { getPallet, getAvailablePalletsForOrder } from '@/services/palletService';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { Checkbox as UICheckbox } from '@/components/ui/checkbox';

const OrderPallets = () => {
    const { pallets, order, onEditingPallet, onCreatingPallet, onDeletePallet, onUnlinkPallet, onLinkPallets } = useOrderContext();
    const { data: session } = useSession();
    const [isPalletDialogOpen, setIsPalletDialogOpen] = useState(false);
    const [selectedPalletId, setSelectedPalletId] = useState(null);
    const [isStoreSelectionOpen, setIsStoreSelectionOpen] = useState(false);
    const [selectedStoreId, setSelectedStoreId] = useState(null);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmPalletId, setConfirmPalletId] = useState(null);
    const { storeOptions, loading: storesLoading } = useStoresOptions();
    
    // Estados para el diálogo de vincular palets existentes
    const [isLinkPalletsDialogOpen, setIsLinkPalletsDialogOpen] = useState(false);
    const [palletIds, setPalletIds] = useState([]); // IDs de palets a buscar (badges)
    const [inputPalletId, setInputPalletId] = useState(''); // Input temporal para agregar IDs
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPalletIds, setSelectedPalletIds] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [paginationMeta, setPaginationMeta] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [clonedPallet, setClonedPallet] = useState(null);
    const [isCloning, setIsCloning] = useState(false);
    
    // Función para generar IDs únicos temporales para cajas clonadas
    const generateUniqueBoxId = (() => {
        let nextId = Date.now();
        return () => nextId++;
    })();

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
        setClonedPallet(null);
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

    const handlePalletChange = async (pallet) => {
        /* si el id esta entre los ids de pallets actuales, se esta editando, si no, se esta creando */
        // CORREGIDO: Comparar el pallet recibido con los pallets existentes
        const isPalletVinculated = pallets.some(existingPallet => existingPallet.id === pallet.id);
        try {
            if (isPalletVinculated) {
                await onEditingPallet(pallet);
            } else {
                await onCreatingPallet(pallet);
            }
        } catch (error) {
            console.error('Error al actualizar palet:', error);
            // El error ya se maneja en las funciones onEditingPallet/onCreatingPallet
        }
    };

    const handleDeletePallet = (palletId) => {
        setConfirmAction('delete');
        setConfirmPalletId(palletId);
        setIsConfirmDialogOpen(true);
    };

    const handleUnlinkPallet = (palletId) => {
        setConfirmAction('unlink');
        setConfirmPalletId(palletId);
        setIsConfirmDialogOpen(true);
    };

    const handleClonePallet = async (palletId) => {
        const token = session?.user?.accessToken;
        if (!token) {
            toast.error('No se pudo obtener el token de autenticación', getToastTheme());
            return;
        }

        try {
            setIsCloning(true);
            // Obtener el palet completo
            const originalPallet = await getPallet(palletId, token);
            
            // Clonar el palet eliminando el ID y generando IDs únicos temporales para las cajas
            const clonedPalletData = {
                ...originalPallet,
                id: null, // Eliminar el ID para que se cree como nuevo
                receptionId: null, // No mantener receptionId en el clon
                boxes: originalPallet.boxes?.map(box => ({
                    ...box,
                    id: generateUniqueBoxId(), // Generar ID único temporal para evitar errores de React con keys duplicadas
                    new: true, // Marcar como nuevas
                })) || [],
                store: originalPallet.store ? { id: originalPallet.store.id } : null, // Mantener el almacén
                storeId: originalPallet.storeId || originalPallet.store?.id, // Mantener el almacén
                orderId: order?.id, // Mantener el pedido
            };

            // Establecer el palet clonado y abrir el diálogo
            setClonedPallet(clonedPalletData);
            setSelectedStoreId(originalPallet.storeId || originalPallet.store?.id);
            setSelectedPalletId('new'); // Usar 'new' para indicar que es un nuevo palet
            setIsPalletDialogOpen(true);
            
            toast.success('Palet clonado. Puedes editarlo antes de guardarlo.', getToastTheme());
        } catch (error) {
            console.error('Error al clonar el palet:', error);
            toast.error(error.message || 'Error al clonar el palet', getToastTheme());
        } finally {
            setIsCloning(false);
        }
    };

    const handleConfirmAction = async () => {
        try {
            if (confirmAction === 'delete') {
                await onDeletePallet(confirmPalletId);
            } else if (confirmAction === 'unlink') {
                await onUnlinkPallet(confirmPalletId);
            }
            setIsConfirmDialogOpen(false);
            setConfirmAction(null);
            setConfirmPalletId(null);
        } catch (error) {
            console.error('Error al ejecutar la acción:', error);
        }
    };

    const handleCancelAction = () => {
        setIsConfirmDialogOpen(false);
        setConfirmAction(null);
        setConfirmPalletId(null);
    };

    // Funciones para vincular palets existentes
    const handleOpenLinkPalletsDialog = async () => {
        setIsLinkPalletsDialogOpen(true);
        setPalletIds([]);
        setInputPalletId('');
        setSearchResults([]);
        setSelectedPalletIds([]);
        setCurrentPage(1);
        
        // Cargar palets disponibles automáticamente al abrir el diálogo
        const token = session?.user?.accessToken;
        if (token && order?.id) {
            try {
                setIsInitialLoading(true);
                const result = await getAvailablePalletsForOrder({ 
                    orderId: order.id, 
                    perPage: 50,
                    page: 1 
                }, token);
                setSearchResults(result.data || []);
                setPaginationMeta(result.meta || null);
            } catch (error) {
                console.error('Error al cargar palets disponibles:', error);
                toast.error('Error al cargar palets disponibles', getToastTheme());
            } finally {
                setIsInitialLoading(false);
            }
        }
    };

    const handleCloseLinkPalletsDialog = () => {
        setIsLinkPalletsDialogOpen(false);
        setPalletIds([]);
        setInputPalletId('');
        setSearchResults([]);
        setSelectedPalletIds([]);
        setPaginationMeta(null);
        setCurrentPage(1);
    };

    // Agregar ID de palet a la lista
    const handleAddPalletId = () => {
        const trimmed = inputPalletId.trim();
        if (!trimmed) return;

        // Validar que sea un número
        if (!/^\d+$/.test(trimmed)) {
            toast.error('Por favor ingresa un ID numérico válido', getToastTheme());
            return;
        }

        const id = parseInt(trimmed);
        
        // Verificar que no esté duplicado
        if (palletIds.includes(id)) {
            toast.error('Este ID ya está en la lista', getToastTheme());
            return;
        }

        // Verificar que no esté ya vinculado al pedido
        if (pallets.some(p => p.id === id)) {
            toast.error('Este palet ya está vinculado a este pedido', getToastTheme());
            return;
        }

        setPalletIds([...palletIds, id]);
        setInputPalletId('');
    };

    // Eliminar ID de palet de la lista
    const handleRemovePalletId = (idToRemove) => {
        setPalletIds(palletIds.filter(id => id !== idToRemove));
    };

    // Manejar tecla Enter en el input de ID
    const handlePalletIdKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddPalletId();
        }
    };

    const handleSearchPallets = async (page = 1) => {
        const token = session?.user?.accessToken;

        if (!token) {
            toast.error('No se pudo obtener el token de autenticación', getToastTheme());
            return;
        }

        try {
            setIsSearching(true);
            setCurrentPage(page);
            let foundPallets = [];
            let meta = null;

            // Si hay IDs en los badges, buscar esos IDs
            if (palletIds.length > 0) {
                if (palletIds.length > 50) {
                    toast.error('Máximo 50 IDs a la vez. Por favor, reduce la cantidad', getToastTheme());
                    setIsSearching(false);
                    return;
                }

                // Buscar todos los IDs individualmente en paralelo
                const linkedPalletIds = pallets.map(p => p.id);
                const idsToSearch = palletIds.filter(id => !linkedPalletIds.includes(id));

                if (idsToSearch.length === 0) {
                    toast.info('Todos los palets especificados ya están vinculados a este pedido', getToastTheme());
                    setIsSearching(false);
                    return;
                }

                if (idsToSearch.length < palletIds.length) {
                    const alreadyLinked = palletIds.length - idsToSearch.length;
                    toast.info(`${alreadyLinked} palet(s) ya están vinculados y se omitirán`, getToastTheme());
                }

                // Buscar todos los palets en paralelo
                const palletPromises = idsToSearch.map(id => 
                    getPallet(id, token)
                        .then(pallet => {
                            // Verificar que el palet no esté vinculado a otro pedido
                            if (pallet.orderId && pallet.orderId !== order?.id) {
                                return null; // Omitir palets vinculados a otros pedidos
                            }
                            return pallet;
                        })
                        .catch(() => null) // Ignorar errores de palets no encontrados
                );
                
                const palletResults = await Promise.all(palletPromises);
                foundPallets = palletResults.filter(p => p !== null);
                
                if (foundPallets.length === 0) {
                    toast.error('No se encontraron palets disponibles con los IDs especificados', getToastTheme());
                    setIsSearching(false);
                    return;
                }

                if (foundPallets.length < idsToSearch.length) {
                    const notFound = idsToSearch.length - foundPallets.length;
                    toast.info(`${notFound} palet(s) no se encontraron o están vinculados a otros pedidos`, getToastTheme());
                }

                setPaginationMeta(null); // No hay paginación para búsqueda por IDs
            } else {
                // Sin IDs, cargar todos los disponibles con paginación
                const result = await getAvailablePalletsForOrder({ 
                    orderId: order?.id, 
                    perPage: 50,
                    page: page
                }, token);
                foundPallets = result.data || [];
                meta = result.meta || null;
            }

            setSearchResults(foundPallets);
            setPaginationMeta(meta);
            // NO seleccionar automáticamente - el usuario debe seleccionarlos manualmente
        } catch (error) {
            console.error('Error al buscar palets:', error);
            toast.error(error.message || 'Error al buscar palets', getToastTheme());
        } finally {
            setIsSearching(false);
        }
    };

    const togglePalletSelection = (palletId) => {
        setSelectedPalletIds(prev => 
            prev.includes(palletId) 
                ? prev.filter(id => id !== palletId)
                : [...prev, palletId]
        );
    };

    const handleLinkSelectedPallets = async () => {
        if (selectedPalletIds.length === 0) {
            toast.error('Por favor selecciona al menos un palet', getToastTheme());
            return;
        }

        try {
            setIsLinking(true);
            await onLinkPallets(selectedPalletIds);
            handleCloseLinkPalletsDialog();
        } catch (error) {
            console.error('Error al vincular palets:', error);
            // El error ya se maneja en onLinkPallets
        } finally {
            setIsLinking(false);
        }
    };

    // console.log('pallets ahiiiiii', pallets);
    return (
        <div className='h-full pb-2'>
            <Card className='h-full flex flex-col bg-transparent'>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-medium">Gestión de Palets</CardTitle>
                        <CardDescription>Modifica los palets de la orden</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleOpenLinkPalletsDialog}>
                            <Link2 className="h-4 w-4 mr-2" />
                            Vincular palets existentes
                        </Button>
                        <Button onClick={handleOpenNewPallet}>
                            <Plus className="h-4 w-4" />
                            Crear palet
                        </Button>
                    </div>
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
                                    <TableHead className="w-[150px]">Acciones</TableHead>
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
                                            <div className="flex items-center gap-1">
                                                {(() => {
                                                    const receptionId = pallet?.receptionId;
                                                    const belongsToReception = receptionId !== null && receptionId !== undefined;
                                                    return (
                                                        <>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={() => handleOpenEditPallet(pallet.id)}
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{belongsToReception ? "Ver palet (solo lectura - pertenece a una recepción)" : "Editar palet"}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() => handleClonePallet(pallet.id)}
                                                                        disabled={!!belongsToReception || isCloning}
                                                                    >
                                                                        {isCloning ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Copy className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{belongsToReception ? "No se puede clonar un pallet que pertenece a una recepción" : "Clonar palet"}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="h-8 w-8 "
                                                                        onClick={() => handleUnlinkPallet(pallet.id)}
                                                                        disabled={!!belongsToReception}
                                                                    >
                                                                        <Unlink className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{belongsToReception ? "No se puede desvincular un pallet que pertenece a una recepción" : "Desvincular palet de pedido"}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="icon"
                                                                        className="h-8 w-8 "
                                                                        onClick={() => handleDeletePallet(pallet.id)}
                                                                        disabled={!!belongsToReception}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{belongsToReception ? "No se puede eliminar un pallet que pertenece a una recepción" : "Eliminar pallet"}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </>
                                                    );
                                                })()}
                                            </div>
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

            {/* Confirmation Dialog */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={handleCancelAction}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {confirmAction === 'delete' ? (
                                <Trash2 className="h-5 w-5 text-red-600" />
                            ) : (
                                <Unlink className="h-5 w-5 text-orange-600" />
                            )}
                            {confirmAction === 'delete' ? 'Eliminar Palet' : 'Desvincular Palet'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {confirmAction === 'delete'
                                ? '¿Estás seguro de que quieres eliminar este palet? Esta acción no se puede deshacer.'
                                : '¿Estás seguro de que quieres desvincular este palet del pedido? El palet permanecerá en el almacén pero ya no estará asociado a este pedido.'
                            }
                        </p>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={handleCancelAction}>
                            Cancelar
                        </Button>
                        <Button
                            variant={confirmAction === 'delete' ? 'destructive' : 'default'}
                            onClick={handleConfirmAction}
                        >
                            {confirmAction === 'delete' ? 'Eliminar' : 'Desvincular'}
                        </Button>
                    </DialogFooter>
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
                initialPallet={clonedPallet}
            />

            {/* Link Existing Pallets Dialog */}
            <Dialog open={isLinkPalletsDialogOpen} onOpenChange={handleCloseLinkPalletsDialog}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Link2 className="h-5 w-5" />
                            Vincular Palets Existentes
                        </DialogTitle>
                    </DialogHeader>
                    {isInitialLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader />
                        </div>
                    ) : (
                        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="space-y-4">
                            {/* Input para agregar IDs de palets con botón integrado */}
                            <div className="space-y-2">
                                <Label htmlFor="pallet-id-input">Buscar por ID de palet (opcional)</Label>
                                <div className="flex gap-2">
                                    <div className="flex-1 border border-input bg-background rounded-md px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
                                        <input
                                            type="text"
                                            id="pallet-id-input"
                                            value={inputPalletId}
                                            onChange={(e) => setInputPalletId(e.target.value)}
                                            onKeyDown={handlePalletIdKeyDown}
                                            placeholder="Ingresa un ID y presiona Enter"
                                            className="w-full bg-transparent outline-none text-sm"
                                            disabled={isSearching || isInitialLoading}
                                        />
                                        {palletIds.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {palletIds.map((id) => (
                                                    <Badge
                                                        key={id}
                                                        className="flex items-center gap-1"
                                                    >
                                                        {id}
                                                        <button
                                                            onClick={() => handleRemovePalletId(id)}
                                                            type="button"
                                                            className="group hover:bg-white/95 bg-foreground-700 rounded-full text-md font-bold text-black-500 p-0.5 shadow-sm"
                                                            disabled={isSearching || isInitialLoading}
                                                        >
                                                            <XMarkIcon className="h-3 w-3 group-hover:text-primary" aria-hidden="true" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Button 
                                        onClick={() => {
                                            setCurrentPage(1);
                                            handleSearchPallets(1);
                                        }} 
                                        disabled={isSearching || isInitialLoading}
                                        className="h-auto"
                                    >
                                        <Search className="h-4 w-4 mr-2" />
                                        Buscar
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground flex gap-1 items-center">
                                    • Introduce el ID y pulsa
                                    <Badge variant="outline" className="text-xs w-fit flex items-center gap-1">
                                        <CornerDownLeft className="h-3 w-3" />
                                        <span>Enter</span>
                                    </Badge>
                                    para añadirlo a la lista
                                </p>
                            </div>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="flex-1 overflow-auto border rounded-md">
                                <div className="p-4 space-y-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium">
                                            Palets encontrados ({searchResults.length})
                                        </Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (selectedPalletIds.length === searchResults.length) {
                                                    setSelectedPalletIds([]);
                                                } else {
                                                    setSelectedPalletIds(searchResults.map(p => p.id));
                                                }
                                            }}
                                        >
                                            {selectedPalletIds.length === searchResults.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                        </Button>
                                    </div>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {searchResults.map((pallet) => {
                                            const isSelected = selectedPalletIds.includes(pallet.id);
                                            const isLinkedToOtherOrder = pallet.orderId && pallet.orderId !== order?.id;
                                            
                                            // Extraer lotes del palet (puede venir como array o desde las cajas)
                                            const lots = pallet.lots && Array.isArray(pallet.lots) 
                                                ? pallet.lots 
                                                : pallet.boxes 
                                                    ? [...new Set(pallet.boxes.map(box => box.lot).filter(Boolean))]
                                                    : [];
                                            
                                            // Extraer productos del palet (puede venir como productsNames o desde las cajas)
                                            const products = pallet.productsNames && Array.isArray(pallet.productsNames) && pallet.productsNames.length > 0
                                                ? pallet.productsNames
                                                : pallet.boxes
                                                    ? [...new Set(pallet.boxes.map(box => box.product?.name).filter(Boolean))]
                                                    : [];
                                            
                                            return (
                                                <div
                                                    key={pallet.id}
                                                    className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                                                        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                                                    } ${isLinkedToOtherOrder ? 'opacity-50' : ''}`}
                                                    onClick={() => !isLinkedToOtherOrder && togglePalletSelection(pallet.id)}
                                                >
                                                    <UICheckbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => !isLinkedToOtherOrder && togglePalletSelection(pallet.id)}
                                                        disabled={isLinkedToOtherOrder}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">Palet #{pallet.id}</span>
                                                            {isLinkedToOtherOrder && (
                                                                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                                                                    Vinculado a otro pedido
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                                            {products.length > 0 && (
                                                                <div className="text-foreground">
                                                                    {products.join(', ')}
                                                                </div>
                                                            )}
                                                            <div>Cajas: {pallet.boxes?.length || pallet.numberOfBoxes || 0}</div>
                                                            <div>Peso: {formatDecimalWeight(pallet.netWeight || 0)}</div>
                                                            {lots.length > 0 && (
                                                                <div>Lotes: {lots.join(', ')}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {searchResults.length === 0 && !isSearching && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>
                                    {palletIds.length === 0
                                        ? 'No hay palets disponibles para vincular.'
                                        : 'No se encontraron palets con los IDs especificados.'}
                                </p>
                            </div>
                        )}

                        {/* Paginación */}
                        {paginationMeta && paginationMeta.last_page > 1 && (
                            <div className="flex items-center justify-end gap-2 border-t pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSearchPallets(currentPage - 1)}
                                    disabled={currentPage === 1 || isSearching}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {paginationMeta.current_page} / {paginationMeta.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSearchPallets(currentPage + 1)}
                                    disabled={currentPage >= paginationMeta.last_page || isSearching}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        </div>
                    )}
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={handleCloseLinkPalletsDialog} disabled={isLinking}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleLinkSelectedPallets}
                            disabled={selectedPalletIds.length === 0 || isLinking}
                        >
                            {isLinking ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Vinculando...
                                </>
                            ) : (
                                <>
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Vincular {selectedPalletIds.length > 0 ? `(${selectedPalletIds.length})` : ''}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default OrderPallets