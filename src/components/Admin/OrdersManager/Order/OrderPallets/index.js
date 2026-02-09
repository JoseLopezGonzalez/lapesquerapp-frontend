import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Warehouse, Trash2, Unlink, Link2, Search, X, Loader2, ChevronLeft, ChevronRight, CornerDownLeft, Copy, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { useOrderContext } from '@/context/OrderContext';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { useStoresOptions } from '@/hooks/useStoresOptions';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Input } from '@/components/ui/input';
import Loader from '@/components/Utilities/Loader';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import PalletDialog from '@/components/Admin/Pallets/PalletDialog';
import PalletLabelDialog from '@/components/Admin/Pallets/PalletLabelDialog';
import { getPallet, getAvailablePalletsForOrder } from '@/services/palletService';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import SearchPalletCard from './SearchPalletCard';
import Masonry from 'react-masonry-css';

const OrderPallets = () => {
    const isMobile = useIsMobile();
    const { pallets, order, onEditingPallet, onCreatingPallet, onDeletePallet, onUnlinkPallet, onLinkPallets, onUnlinkAllPallets } = useOrderContext();
    const { data: session } = useSession();
    const [isPalletDialogOpen, setIsPalletDialogOpen] = useState(false);
    const [selectedPalletId, setSelectedPalletId] = useState(null);
    const [isStoreSelectionOpen, setIsStoreSelectionOpen] = useState(false);
    const [selectedStoreId, setSelectedStoreId] = useState(null);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmPalletId, setConfirmPalletId] = useState(null);
    const { storeOptions, loading: storesLoading } = useStoresOptions();
    const [isPalletLabelDialogOpen, setIsPalletLabelDialogOpen] = useState(false);
    const [selectedPalletForLabel, setSelectedPalletForLabel] = useState(null);
    
    // Estados para el diálogo de vincular palets existentes
    const [isLinkPalletsDialogOpen, setIsLinkPalletsDialogOpen] = useState(false);
    const [palletIds, setPalletIds] = useState([]); // IDs de palets a buscar (badges)
    const [inputPalletId, setInputPalletId] = useState(''); // Input temporal para agregar IDs
    const [filterStoreId, setFilterStoreId] = useState(null); // Almacén seleccionado para filtrar
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPalletIds, setSelectedPalletIds] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [paginationMeta, setPaginationMeta] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [clonedPallet, setClonedPallet] = useState(null);
    const [isCloning, setIsCloning] = useState(false);
    const [unlinkingPalletId, setUnlinkingPalletId] = useState(null);
    const [isUnlinkingAll, setIsUnlinkingAll] = useState(false);
    
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

    const handleOpenPalletLabelDialog = (palletId) => {
        const pallet = pallets.find(p => p.id === palletId);
        if (!pallet) {
            console.error(`Pallet with ID ${palletId} not found`);
            return;
        }
        setSelectedPalletForLabel(pallet);
        setIsPalletLabelDialogOpen(true);
    };

    const handleClosePalletLabelDialog = () => {
        setIsPalletLabelDialogOpen(false);
        setTimeout(() => {
            setSelectedPalletForLabel(null);
        }, 1000);
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
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al clonar el palet';
            toast.error(errorMessage, getToastTheme());
        } finally {
            setIsCloning(false);
        }
    };

    const handleConfirmAction = async () => {
        try {
            if (confirmAction === 'delete') {
                await onDeletePallet(confirmPalletId);
            } else if (confirmAction === 'unlink') {
                setUnlinkingPalletId(confirmPalletId);
                try {
                    await onUnlinkPallet(confirmPalletId);
                } finally {
                    setUnlinkingPalletId(null);
                }
            }
            setIsConfirmDialogOpen(false);
            setConfirmAction(null);
            setConfirmPalletId(null);
        } catch (error) {
            console.error('Error al ejecutar la acción:', error);
            if (confirmAction === 'unlink') {
                setUnlinkingPalletId(null);
            }
        }
    };

    const handleCancelAction = () => {
        setIsConfirmDialogOpen(false);
        setConfirmAction(null);
        setConfirmPalletId(null);
        setUnlinkingPalletId(null);
    };

    // Funciones para vincular palets existentes
    const handleOpenLinkPalletsDialog = async () => {
        setIsLinkPalletsDialogOpen(true);
        setPalletIds([]);
        setInputPalletId('');
        setFilterStoreId(null);
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
        setFilterStoreId(null);
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

    const handleSearchPallets = async (page = 1, storeIdOverride = null) => {
        const token = session?.user?.accessToken;

        if (!token) {
            toast.error('No se pudo obtener el token de autenticación', getToastTheme());
            return;
        }

        try {
            setIsSearching(true);
            setCurrentPage(page);
            // Usar el storeId pasado como parámetro o el del estado
            const storeIdToUse = storeIdOverride !== null ? storeIdOverride : filterStoreId;
            let foundPallets = [];
            let meta = null;

            // Si hay IDs en los badges, buscar usando el endpoint con el parámetro id
            if (palletIds.length > 0) {
                if (palletIds.length > 50) {
                    toast.error('Máximo 50 IDs a la vez. Por favor, reduce la cantidad', getToastTheme());
                    setIsSearching(false);
                    return;
                }

                // Filtrar IDs que ya están vinculados al pedido
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

                // Buscar usando el endpoint con el parámetro ids (array de IDs)
                // ids tiene prioridad absoluta sobre storeId
                const result = await getAvailablePalletsForOrder({ 
                    orderId: order?.id, 
                    ids: idsToSearch.map(id => parseInt(id)).filter(id => !isNaN(id)),
                    perPage: 50,
                    page: 1
                }, token);
                
                foundPallets = result.data || [];
                meta = result.meta || null;
                
                if (foundPallets.length === 0) {
                    toast.error('No se encontraron palets disponibles con los IDs especificados', getToastTheme());
                    setIsSearching(false);
                    return;
                }

                if (foundPallets.length < idsToSearch.length) {
                    const notFound = idsToSearch.length - foundPallets.length;
                    toast.info(`${notFound} palet(s) no se encontraron o no están disponibles`, getToastTheme());
                }

                setPaginationMeta(null); // No hay paginación para búsqueda por IDs
            } else {
                // Sin IDs, cargar todos los disponibles con paginación
                const result = await getAvailablePalletsForOrder({ 
                    orderId: order?.id, 
                    storeId: storeIdToUse,
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
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al buscar palets';
            toast.error(errorMessage, getToastTheme());
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

    const handleUnlinkAllPallets = async () => {
        if (!pallets || pallets.length === 0) {
            toast.error('No hay palets para desvincular', getToastTheme());
            return;
        }

        // Filtrar palets que pertenecen a recepciones (no se pueden desvincular)
        const palletsToUnlink = pallets.filter(p => !p.receptionId);
        
        if (palletsToUnlink.length === 0) {
            toast.error('No hay palets disponibles para desvincular. Todos pertenecen a recepciones.', getToastTheme());
            return;
        }

        const palletIds = palletsToUnlink.map(p => p.id);
        
        try {
            setIsUnlinkingAll(true);
            await onUnlinkAllPallets(palletIds);
        } catch (error) {
            console.error('Error al desvincular todos los palets:', error);
            // El error ya se maneja en onUnlinkAllPallets
        } finally {
            setIsUnlinkingAll(false);
        }
    };

    // console.log('pallets ahiiiiii', pallets);
    return (
        <div className='flex-1 flex flex-col min-h-0'>
            {isMobile ? (
                <div className='flex-1 flex flex-col min-h-0'>
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="pb-20">
                            {pallets.length === 0 ? (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <EmptyState
                                title={'No existen palets vinculados'}
                                description={'No se han añadido palets a este pedido'}
                            />
                        </div>
                    ) : (
                        <>
                            {isMobile ? (
                                /* Vista Mobile: Cards */
                                <div className="space-y-3">
                                    {pallets.map((pallet) => {
                                        const productNames = pallet.productsNames && Array.isArray(pallet.productsNames) && pallet.productsNames.length > 0
                                            ? pallet.productsNames.join(', ')
                                            : '';
                                        const lots = pallet.lots && Array.isArray(pallet.lots) && pallet.lots.length > 0
                                            ? pallet.lots.join(', ')
                                            : '';
                                        const observations = pallet.observations || '';
                                        const belongsToReception = pallet?.receptionId !== null && pallet?.receptionId !== undefined;

                                        return (
                                            <Card key={pallet.id} className="p-4">
                                                <div className="space-y-3">
                                                    {/* ID y Acciones */}
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">ID</p>
                                                            <p className="text-sm font-semibold">#{pallet.id}</p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                    >
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleOpenEditPallet(pallet.id)}
                                                                    >
                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                        {belongsToReception ? "Ver palet" : "Editar palet"}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleClonePallet(pallet.id)}
                                                                        disabled={belongsToReception || isCloning}
                                                                    >
                                                                        <Copy className="h-4 w-4 mr-2" />
                                                                        Clonar palet
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleUnlinkPallet(pallet.id)}
                                                                        disabled={unlinkingPalletId === pallet.id}
                                                                    >
                                                                        {unlinkingPalletId === pallet.id ? (
                                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                        ) : (
                                                                            <Unlink className="h-4 w-4 mr-2" />
                                                                        )}
                                                                        Desvincular palet
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeletePallet(pallet.id)}
                                                                        disabled={belongsToReception}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Eliminar palet
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>

                                                    {/* Información en grid */}
                                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cajas</p>
                                                            <p className="text-sm font-semibold">{pallet.numberOfBoxes || 0}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Peso Neto</p>
                                                            <p className="text-sm font-semibold">{formatDecimalWeight(pallet.netWeight || 0)}</p>
                                                        </div>
                                                    </div>

                                                    {/* Productos */}
                                                    {productNames && (
                                                        <div className="space-y-1 pt-2 border-t">
                                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Productos</p>
                                                            <p className="text-sm font-medium">{productNames}</p>
                                                        </div>
                                                    )}

                                                    {/* Lotes */}
                                                    {lots && (
                                                        <div className="space-y-1 pt-2 border-t">
                                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lotes</p>
                                                            <p className="text-sm font-medium">{lots}</p>
                                                        </div>
                                                    )}

                                                    {/* Observaciones */}
                                                    {observations && (
                                                        <div className="space-y-1 pt-2 border-t">
                                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observaciones</p>
                                                            <p className="text-sm font-medium">{observations}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Vista Desktop: Tabla */
                                <div className="border rounded-md max-h-[500px] overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Productos</TableHead>
                                                <TableHead>Lotes</TableHead>
                                                <TableHead>Observaciones</TableHead>
                                                <TableHead className="text-right">Cajas</TableHead>
                                                <TableHead className="text-right">Peso Neto</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pallets.map((pallet) => {
                                                const productNames = pallet.productsNames && Array.isArray(pallet.productsNames) && pallet.productsNames.length > 0
                                                    ? pallet.productsNames.join('\n')
                                                    : '';
                                                const lots = pallet.lots && Array.isArray(pallet.lots) && pallet.lots.length > 0
                                                    ? pallet.lots.join(', ')
                                                    : '';
                                                const observations = pallet.observations || '';
                                                const belongsToReception = pallet?.receptionId !== null && pallet?.receptionId !== undefined;

                                                return (
                                                    <TableRow key={pallet.id} className="border-b border-muted last:border-0 hover:bg-muted/20">
                                                        <TableCell className="px-4 py-3">{pallet.id}</TableCell>
                                                        <TableCell className="px-4 py-3 whitespace-pre-wrap">{productNames || '-'}</TableCell>
                                                        <TableCell className="px-4 py-3 max-w-[150px] truncate" title={lots}>
                                                            {lots || '-'}
                                                        </TableCell>
                                                        <TableCell className="px-4 py-3 max-w-[200px] truncate" title={observations}>
                                                            {observations || '-'}
                                                        </TableCell>
                                                        <TableCell className="px-4 py-3 text-right">{pallet.numberOfBoxes || 0}</TableCell>
                                                        <TableCell className="px-4 py-3 text-right text-nowrap">
                                                            {formatDecimalWeight(pallet.netWeight || 0)}
                                                        </TableCell>
                                                        <TableCell className="px-4 py-3">
                                                            <div className="flex justify-end gap-1">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => handleOpenEditPallet(pallet.id)}
                                                                            title={belongsToReception ? "Ver palet (solo lectura - pertenece a una recepción)" : "Editar palet"}
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{belongsToReception ? "Ver palet" : "Editar palet"}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => handleClonePallet(pallet.id)}
                                                                            disabled={belongsToReception || isCloning}
                                                                        >
                                                                            <Copy className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Clonar palet</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => handleUnlinkPallet(pallet.id)}
                                                                            disabled={unlinkingPalletId === pallet.id}
                                                                        >
                                                                            {unlinkingPalletId === pallet.id ? (
                                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                            ) : (
                                                                                <Unlink className="h-4 w-4" />
                                                                            )}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Desvincular palet</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => handleDeletePallet(pallet.id)}
                                                                            disabled={belongsToReception}
                                                                            className="text-destructive hover:text-destructive"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Eliminar palet</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </>
                    )}
                        </div>
                    </ScrollArea>
                    {/* Footer con botones */}
                    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex items-center gap-2 z-50" style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}>
                        <Button 
                            variant="outline" 
                            onClick={handleOpenLinkPalletsDialog}
                            size="sm"
                            className="flex-1 min-h-[44px]"
                        >
                            <Link2 className="h-4 w-4 mr-2" />
                            Vincular
                        </Button>
                        <Button 
                            onClick={handleOpenNewPallet}
                            size="sm"
                            className="flex-1 min-h-[44px]"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Crear
                        </Button>
                        {pallets && pallets.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="outline"
                                        size="icon"
                                        className="min-h-[44px] min-w-[44px]"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={handleUnlinkAllPallets}
                                        disabled={isUnlinkingAll}
                                    >
                                        {isUnlinkingAll ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Desvinculando...
                                            </>
                                        ) : (
                                            <>
                                                <Unlink className="h-4 w-4 mr-2" />
                                                Desvincular todos
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            ) : (
            <Card className='h-full flex flex-col bg-transparent'>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-medium">Gestión de Palets</CardTitle>
                        <CardDescription>Modifica los palets de la orden</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {pallets && pallets.length > 0 && (
                            <Button 
                                variant="outline" 
                                onClick={handleUnlinkAllPallets}
                                disabled={isUnlinkingAll}
                            >
                                {isUnlinkingAll ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Desvinculando...
                                    </>
                                ) : (
                                    <>
                                        <Unlink className="h-4 w-4 mr-2" />
                                        Desvincular todos
                                    </>
                                )}
                            </Button>
                        )}
                            <Button 
                                variant="outline" 
                                onClick={handleOpenLinkPalletsDialog}
                            >
                            <Link2 className="h-4 w-4 mr-2" />
                            Vincular palets existentes
                        </Button>
                            <Button 
                                onClick={handleOpenNewPallet}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                            Crear palet
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                    {pallets.length === 0 ? (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <EmptyState
                                title={'No existen palets vinculados'}
                                description={'No se han añadido palets a este pedido'}
                            />
                        </div>
                    ) : (
                        <div className="border rounded-md max-h-[500px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Productos</TableHead>
                                        <TableHead>Lotes</TableHead>
                                        <TableHead>Observaciones</TableHead>
                                        <TableHead className="text-right">Cajas</TableHead>
                                        <TableHead className="text-right">Peso Neto</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pallets.map((pallet) => {
                                        const productNames = pallet.productsNames && Array.isArray(pallet.productsNames) && pallet.productsNames.length > 0
                                            ? pallet.productsNames.join('\n')
                                            : '';
                                        const lots = pallet.lots && Array.isArray(pallet.lots) && pallet.lots.length > 0
                                            ? pallet.lots.join(', ')
                                            : '';
                                        const observations = pallet.observations || '';
                                        const belongsToReception = pallet?.receptionId !== null && pallet?.receptionId !== undefined;

                                        return (
                                            <TableRow key={pallet.id} className="border-b border-muted last:border-0 hover:bg-muted/20">
                                                <TableCell className="px-4 py-3">{pallet.id}</TableCell>
                                                <TableCell className="px-4 py-3 whitespace-pre-wrap">{productNames || '-'}</TableCell>
                                                <TableCell className="px-4 py-3 max-w-[150px] truncate" title={lots}>
                                                    {lots || '-'}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 max-w-[200px] truncate" title={observations}>
                                                    {observations || '-'}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-right">{pallet.numberOfBoxes || 0}</TableCell>
                                                <TableCell className="px-4 py-3 text-right text-nowrap">
                                                    {formatDecimalWeight(pallet.netWeight || 0)}
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <div className="flex justify-end gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => handleOpenEditPallet(pallet.id)}
                                                                    title={belongsToReception ? "Ver palet (solo lectura - pertenece a una recepción)" : "Editar palet"}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{belongsToReception ? "Ver palet" : "Editar palet"}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => handleClonePallet(pallet.id)}
                                                                    disabled={belongsToReception || isCloning}
                                                                >
                                                                    <Copy className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Clonar palet</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => handleUnlinkPallet(pallet.id)}
                                                                    disabled={unlinkingPalletId === pallet.id}
                                                                >
                                                                    {unlinkingPalletId === pallet.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Unlink className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Desvincular palet</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => handleDeletePallet(pallet.id)}
                                                                    disabled={belongsToReception}
                                                                    className="text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Eliminar palet</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            )}

            {/* Store Selection Modal */}
            <Dialog open={isStoreSelectionOpen} onOpenChange={handleCloseStoreSelection}>
                <DialogContent className={isMobile ? "max-w-full w-full h-full max-h-full m-0 rounded-none flex flex-col" : "sm:max-w-md"}>
                    <DialogHeader className={isMobile ? "text-center" : ""}>
                        <DialogTitle className={`flex items-center gap-2 ${isMobile ? "justify-center" : ""}`}>
                            <Warehouse className="h-5 w-5" />
                            Seleccionar Almacén
                        </DialogTitle>
                    </DialogHeader>
                    <div className={`space-y-4 ${isMobile ? "flex flex-col items-center justify-center flex-1" : ""}`}>
                        <div className={`space-y-2 ${isMobile ? "w-full max-w-md" : ""}`}>
                            <Label htmlFor="store-select" className={isMobile ? "text-center block" : ""}>Almacén donde se creará el palet</Label>
                            <Combobox
                                options={storeOptions}
                                value={selectedStoreId || ''}
                                onChange={(value) => {
                                    if (value) {
                                        handleStoreSelection(value);
                                    }
                                }}
                                placeholder="Selecciona un almacén"
                                searchPlaceholder="Buscar almacén..."
                                notFoundMessage="No se encontraron almacenes"
                                loading={storesLoading}
                            />
                        </div>
                        <p className={`text-sm text-muted-foreground ${isMobile ? "text-center max-w-md" : ""}`}>
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
                        <Button variant="outline" onClick={handleCancelAction} disabled={unlinkingPalletId !== null}>
                            Cancelar
                        </Button>
                        <Button
                            variant={confirmAction === 'delete' ? 'destructive' : 'default'}
                            onClick={handleConfirmAction}
                            disabled={unlinkingPalletId !== null}
                        >
                            {unlinkingPalletId !== null ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Desvinculando...
                                </>
                            ) : (
                                confirmAction === 'delete' ? 'Eliminar' : 'Desvincular'
                            )}
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

            {/* PalletLabelDialog */}
            <PalletLabelDialog
                isOpen={isPalletLabelDialogOpen}
                onClose={handleClosePalletLabelDialog}
                pallet={selectedPalletForLabel}
            />

            {/* Link Existing Pallets Dialog */}
            <Dialog open={isLinkPalletsDialogOpen} onOpenChange={handleCloseLinkPalletsDialog}>
                <DialogContent className={isMobile ? "max-w-full w-full h-full max-h-full m-0 rounded-none flex flex-col" : "sm:max-w-4xl max-h-[85vh] flex flex-col"}>
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
                        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                            <div className="flex-shrink-0 pb-3 space-y-2">
                                {/* Filtros en fila horizontal */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Filtro por almacén */}
                                    <div className="space-y-1">
                                        <Label htmlFor="store-filter" className="text-xs text-muted-foreground">Filtrar por almacén</Label>
                                        <Combobox
                                            options={[
                                                { value: 'all', label: 'Todos los almacenes' },
                                                ...storeOptions
                                            ]}
                                            value={filterStoreId || 'all'}
                                            onChange={(value) => {
                                                const newStoreId = value === 'all' || value === '' ? null : value;
                                                setFilterStoreId(newStoreId);
                                                setCurrentPage(1);
                                                // Recargar automáticamente cuando cambie el almacén (solo si no hay IDs en los badges)
                                                if (!palletIds.length) {
                                                    handleSearchPallets(1, newStoreId);
                                                }
                                            }}
                                            placeholder="Todos los almacenes"
                                            searchPlaceholder="Buscar almacén..."
                                            notFoundMessage="No se encontraron almacenes"
                                            loading={storesLoading}
                                            disabled={isSearching || isInitialLoading}
                                        />
                                    </div>
                                    
                                    {/* Input para agregar IDs de palets */}
                                    <div className="space-y-1">
                                        <Label htmlFor="pallet-id-input" className="text-xs text-muted-foreground">Buscar por ID de palet</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="text"
                                                id="pallet-id-input"
                                                value={inputPalletId}
                                                onChange={(e) => setInputPalletId(e.target.value)}
                                                onKeyDown={handlePalletIdKeyDown}
                                                placeholder="Ingresa el ID y presiona Enter"
                                                disabled={isSearching || isInitialLoading}
                                                className="flex-1"
                                            />
                                            <Button 
                                                onClick={() => {
                                                    setCurrentPage(1);
                                                    handleSearchPallets(1);
                                                }} 
                                                disabled={isSearching || isInitialLoading}
                                                size="default"
                                            >
                                                <Search className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Badges de IDs de palets (si hay alguno) */}
                                {palletIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-xs text-muted-foreground">IDs:</span>
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

                            {searchResults.length > 0 && (
                                <div className="flex-1 overflow-hidden flex flex-col min-h-0 space-y-3">
                                    <div className="flex items-center justify-between flex-shrink-0">
                                        <Label className="text-sm font-medium">
                                            Palets encontrados ({paginationMeta?.total || searchResults.length})
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
                                    <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-2">
                                        <Masonry
                                            breakpointCols={{
                                                default: 2,
                                                1280: 2, // lg
                                                768: 1,  // md
                                                640: 1,  // sm
                                            }}
                                            className="masonry-grid"
                                            columnClassName="masonry-grid_column"
                                        >
                                            {searchResults.map((pallet) => {
                                                const isSelected = selectedPalletIds.includes(pallet.id);
                                                const isLinkedToOtherOrder = pallet.orderId && pallet.orderId !== order?.id;
                                                
                                                return (
                                                    <div key={pallet.id} className="mb-4">
                                                        <SearchPalletCard
                                                            pallet={pallet}
                                                            isSelected={isSelected}
                                                            isLinkedToOtherOrder={isLinkedToOtherOrder}
                                                            onToggleSelection={() => togglePalletSelection(pallet.id)}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </Masonry>
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
                    <DialogFooter className="flex flex-row gap-2">
                        <Button 
                            variant="outline" 
                            onClick={handleCloseLinkPalletsDialog} 
                            disabled={isLinking}
                            className={isMobile ? "flex-1" : ""}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleLinkSelectedPallets}
                            disabled={selectedPalletIds.length === 0 || isLinking}
                            className={isMobile ? "flex-1" : ""}
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