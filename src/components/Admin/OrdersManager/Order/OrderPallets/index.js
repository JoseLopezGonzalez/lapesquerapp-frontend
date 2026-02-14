import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Unlink, Link2, Loader2, Copy, MoreVertical, PackagePlus } from 'lucide-react';
import { useOrderContext } from '@/context/OrderContext';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { useStoresOptions } from '@/hooks/useStoresOptions';
import { useIsMobile } from '@/hooks/use-mobile';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import PalletDialog from '@/components/Admin/Pallets/PalletDialog';
import PalletLabelDialog from '@/components/Admin/Pallets/PalletLabelDialog';
import { getPallet, getAvailablePalletsForOrder, createPallet } from '@/services/palletService';
import { getProductOptions } from '@/services/productService';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import StoreSelectionDialog from './dialogs/StoreSelectionDialog';
import ConfirmActionDialog from './dialogs/ConfirmActionDialog';
import CreateFromForecastDialog from './dialogs/CreateFromForecastDialog';
import LinkPalletsDialog from './dialogs/LinkPalletsDialog';
import OrderPalletCard from './OrderPalletCard';
import OrderPalletTableRow from './OrderPalletTableRow';

const roundToTwoDecimals = (weight) => {
    const num = parseFloat(weight);
    if (isNaN(num)) return 0;
    return parseFloat(num.toFixed(2));
};

const OrderPallets = () => {
    const isMobile = useIsMobile();
    const { pallets, order, plannedProductDetails, onEditingPallet, onCreatingPallet, onDeletePallet, onUnlinkPallet, onLinkPallets, onUnlinkAllPallets } = useOrderContext();
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

    // Estados para crear palet desde previsión
    const [isCreateFromForecastDialogOpen, setIsCreateFromForecastDialogOpen] = useState(false);
    const [createFromForecastLot, setCreateFromForecastLot] = useState('');
    const [createFromForecastStoreId, setCreateFromForecastStoreId] = useState(null);
    const [isCreatingFromForecast, setIsCreatingFromForecast] = useState(false);
    
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

    const handleSelectAllPallets = () => {
        setSelectedPalletIds(searchResults.map(p => p.id));
    };

    const handleDeselectAllPallets = () => {
        setSelectedPalletIds([]);
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

    // Crear palet automáticamente desde la previsión del pedido
    const handleOpenCreateFromForecastDialog = () => {
        const persistedDetails = (plannedProductDetails || []).filter(d => d?.id && d?.product?.id);
        const detailsWithBoxes = persistedDetails.filter(d => Number(d.boxes) > 0);
        if (detailsWithBoxes.length === 0) {
            toast.error('La previsión no tiene productos con cajas. Añade líneas con cajas en la pestaña Previsión.', getToastTheme());
            return;
        }
        setCreateFromForecastLot('');
        setCreateFromForecastStoreId(null);
        setIsCreateFromForecastDialogOpen(true);
    };

    const handleCloseCreateFromForecastDialog = () => {
        setIsCreateFromForecastDialogOpen(false);
        setCreateFromForecastLot('');
        setCreateFromForecastStoreId(null);
    };

    const handleCreatePalletFromForecast = async () => {
        const lot = (createFromForecastLot || '').trim();
        if (!lot) {
            toast.error('Introduce el lote', getToastTheme());
            return;
        }
        if (!createFromForecastStoreId) {
            toast.error('Selecciona el almacén donde se almacenará el palet', getToastTheme());
            return;
        }

        const token = session?.user?.accessToken;
        if (!token) {
            toast.error('No se pudo obtener el token de autenticación', getToastTheme());
            return;
        }

        const persistedDetails = (plannedProductDetails || []).filter(d => d?.id && d?.product?.id);
        const detailsWithBoxes = persistedDetails.filter(d => Number(d.boxes) > 0);
        if (detailsWithBoxes.length === 0) {
            toast.error('No hay productos en la previsión con cajas', getToastTheme());
            return;
        }

        setIsCreatingFromForecast(true);
        let productOptionsMap = new Map();
        try {
            const products = await getProductOptions(token);
            (Array.isArray(products) ? products : []).forEach(p => {
                const id = p?.id ?? p?.value;
                if (id != null) productOptionsMap.set(String(id), { id, name: p?.name ?? p?.label ?? '', boxGtin: p?.boxGtin ?? null });
            });
        } catch (err) {
            console.error('Error al cargar productos:', err);
        }

        const buildGs1128 = (productId, lotVal, netWeight) => {
            const p = productOptionsMap.get(String(productId));
            const boxGtin = p?.boxGtin;
            if (!boxGtin) return null;
            const w = parseFloat(netWeight) || 0;
            const formatted = w.toFixed(2).replace('.', '').padStart(6, '0');
            return `(01)${boxGtin}(3100)${formatted}(10)${lotVal}`;
        };

        let nextBoxId = Date.now();
        const boxes = [];
        for (const detail of detailsWithBoxes) {
            const numBoxes = Math.max(0, parseInt(detail.boxes, 10) || 0);
            const totalQty = parseFloat(detail.quantity) || 0;
            if (numBoxes <= 0) continue;

            const weightPerBox = totalQty / numBoxes;
            const standardWeight = roundToTwoDecimals(weightPerBox);
            let accumulated = 0;

            for (let i = 0; i < numBoxes; i++) {
                const isLast = i === numBoxes - 1;
                const netWeight = isLast
                    ? roundToTwoDecimals(totalQty - accumulated)
                    : standardWeight;
                accumulated += netWeight;

                const productId = detail.product?.id ?? detail.productId;
                const productName = detail.product?.name ?? '';
                const gs1128 = buildGs1128(productId, lot, netWeight);

                const box = {
                    id: nextBoxId++,
                    new: true,
                    product: { id: productId, name: productName },
                    lot,
                    netWeight,
                    grossWeight: netWeight,
                    ...(gs1128 && { gs1128 }),
                };
                boxes.push(box);
            }
        }

        if (boxes.length === 0) {
            setIsCreatingFromForecast(false);
            toast.error('No se pudieron generar cajas desde la previsión', getToastTheme());
            return;
        }

        const palletData = {
            id: null,
            observations: '',
            state: { id: 1, name: 'Registrado' },
            productsNames: [],
            boxes,
            lots: [lot],
            netWeight: boxes.reduce((sum, b) => sum + parseFloat(b.netWeight || 0), 0),
            numberOfBoxes: boxes.length,
            position: null,
            store: { id: createFromForecastStoreId },
            storeId: createFromForecastStoreId,
            orderId: order?.id,
        };

        try {
            const result = await createPallet(palletData, token);
            const newPallet = result?.data ?? result;
            if (newPallet) {
                await onCreatingPallet(newPallet);
                handleCloseCreateFromForecastDialog();
                toast.success('Palet creado desde la previsión correctamente', getToastTheme());
            }
        } catch (err) {
            console.error('Error al crear palet desde previsión:', err);
            const msg = err?.userMessage ?? err?.data?.userMessage ?? err?.response?.data?.userMessage ?? err?.message ?? 'Error al crear el palet';
            toast.error(msg, getToastTheme());
        } finally {
            setIsCreatingFromForecast(false);
        }
    };

    // console.log('pallets ahiiiiii', pallets);
    return (
        <div className='flex-1 flex flex-col min-h-0'>
            {isMobile ? (
                <div className='flex-1 flex flex-col min-h-0'>
                    {pallets.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center min-h-0">
                            <EmptyState
                                title={'No existen palets vinculados'}
                                description={'No se han añadido palets a este pedido'}
                            />
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="pb-20">
                        <>
                            {isMobile ? (
                                /* Vista Mobile: Cards */
                                <div className="space-y-3">
                                    {pallets.map((pallet) => (
                                        <OrderPalletCard
                                            key={pallet.id}
                                            pallet={pallet}
                                            onEdit={handleOpenEditPallet}
                                            onClone={handleClonePallet}
                                            onUnlink={handleUnlinkPallet}
                                            onDelete={handleDeletePallet}
                                            onPrintLabel={handleOpenPalletLabelDialog}
                                            isCloning={isCloning}
                                            isUnlinking={unlinkingPalletId === pallet.id}
                                        />
                                    ))}
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
                                            {pallets.map((pallet) => (
                                                <OrderPalletTableRow
                                                    key={pallet.id}
                                                    pallet={pallet}
                                                    onEdit={handleOpenEditPallet}
                                                    onClone={handleClonePallet}
                                                    onUnlink={handleUnlinkPallet}
                                                    onDelete={handleDeletePallet}
                                                    isCloning={isCloning}
                                                    unlinkingPalletId={unlinkingPalletId}
                                                />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </>
                            </div>
                        </ScrollArea>
                    )}
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
                            variant="outline"
                            onClick={handleOpenCreateFromForecastDialog}
                            size="sm"
                            className="flex-1 min-h-[44px]"
                        >
                            <PackagePlus className="h-4 w-4 mr-2" />
                            Desde previsión
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
                                variant="outline"
                                onClick={handleOpenCreateFromForecastDialog}
                            >
                                <PackagePlus className="h-4 w-4 mr-2" />
                                Crear desde previsión
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
                        <div className="h-full flex items-center justify-center">
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
                                    {pallets.map((pallet) => (
                                        <OrderPalletTableRow
                                            key={pallet.id}
                                            pallet={pallet}
                                            onEdit={handleOpenEditPallet}
                                            onClone={handleClonePallet}
                                            onUnlink={handleUnlinkPallet}
                                            onDelete={handleDeletePallet}
                                            isCloning={isCloning}
                                            unlinkingPalletId={unlinkingPalletId}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
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