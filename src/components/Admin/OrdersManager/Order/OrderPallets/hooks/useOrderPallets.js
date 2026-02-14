import { useState, useCallback } from 'react';
import { useOrderContext } from '@/context/OrderContext';
import { useSession } from 'next-auth/react';
import { useStoresOptions } from '@/hooks/useStoresOptions';
import { getPallet, getAvailablePalletsForOrder, createPallet } from '@/services/palletService';
import { getProductOptions } from '@/services/productService';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { roundToTwoDecimals } from '../utils/roundToTwoDecimals';

/**
 * Hook con estado y lógica de OrderPallets
 */
export function useOrderPallets() {
  const {
    pallets,
    order,
    plannedProductDetails,
    onEditingPallet,
    onCreatingPallet,
    onDeletePallet,
    onUnlinkPallet,
    onLinkPallets,
    onUnlinkAllPallets,
  } = useOrderContext();
  const { data: session } = useSession();
  const { storeOptions, loading: storesLoading } = useStoresOptions();

  const [isPalletDialogOpen, setIsPalletDialogOpen] = useState(false);
  const [selectedPalletId, setSelectedPalletId] = useState(null);
  const [isStoreSelectionOpen, setIsStoreSelectionOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmPalletId, setConfirmPalletId] = useState(null);
  const [isPalletLabelDialogOpen, setIsPalletLabelDialogOpen] = useState(false);
  const [selectedPalletForLabel, setSelectedPalletForLabel] = useState(null);

  const [isLinkPalletsDialogOpen, setIsLinkPalletsDialogOpen] = useState(false);
  const [palletIds, setPalletIds] = useState([]);
  const [inputPalletId, setInputPalletId] = useState('');
  const [filterStoreId, setFilterStoreId] = useState(null);
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

  const [isCreateFromForecastDialogOpen, setIsCreateFromForecastDialogOpen] = useState(false);
  const [createFromForecastLot, setCreateFromForecastLot] = useState('');
  const [createFromForecastStoreId, setCreateFromForecastStoreId] = useState(null);
  const [isCreatingFromForecast, setIsCreatingFromForecast] = useState(false);

  const generateUniqueBoxId = useCallback(() => {
    return Date.now() + Math.random();
  }, []);

  const handleOpenNewPallet = useCallback(() => {
    setIsStoreSelectionOpen(true);
  }, []);

  const handleOpenEditPallet = useCallback((palletId) => {
    setSelectedPalletId(palletId);
    setIsPalletDialogOpen(true);
  }, []);

  const handleClosePalletDialog = useCallback(() => {
    setIsPalletDialogOpen(false);
    setSelectedPalletId(null);
    setSelectedStoreId(null);
    setClonedPallet(null);
  }, []);

  const handleStoreSelection = useCallback((storeId) => {
    setSelectedStoreId(storeId);
    setIsStoreSelectionOpen(false);
    setSelectedPalletId('new');
    setIsPalletDialogOpen(true);
  }, []);

  const handleCloseStoreSelection = useCallback(() => {
    setIsStoreSelectionOpen(false);
    setSelectedStoreId(null);
  }, []);

  const handlePalletChange = useCallback(
    async (pallet) => {
      const isPalletVinculated = pallets.some((p) => p.id === pallet.id);
      try {
        if (isPalletVinculated) {
          await onEditingPallet(pallet);
        } else {
          await onCreatingPallet(pallet);
        }
      } catch (error) {
        console.error('Error al actualizar palet:', error);
      }
    },
    [pallets, onEditingPallet, onCreatingPallet]
  );

  const handleDeletePallet = useCallback((palletId) => {
    setConfirmAction('delete');
    setConfirmPalletId(palletId);
    setIsConfirmDialogOpen(true);
  }, []);

  const handleUnlinkPallet = useCallback((palletId) => {
    setConfirmAction('unlink');
    setConfirmPalletId(palletId);
    setIsConfirmDialogOpen(true);
  }, []);

  const handleOpenPalletLabelDialog = useCallback((palletId) => {
    const pallet = pallets.find((p) => p.id === palletId);
    if (!pallet) return;
    setSelectedPalletForLabel(pallet);
    setIsPalletLabelDialogOpen(true);
  }, [pallets]);

  const handleClosePalletLabelDialog = useCallback(() => {
    setIsPalletLabelDialogOpen(false);
    setTimeout(() => setSelectedPalletForLabel(null), 1000);
  }, []);

  const handleClonePallet = useCallback(
    async (palletId) => {
      const token = session?.user?.accessToken;
      if (!token) {
        toast.error('No se pudo obtener el token de autenticación', getToastTheme());
        return;
      }
      try {
        setIsCloning(true);
        const originalPallet = await getPallet(palletId, token);
        const clonedPalletData = {
          ...originalPallet,
          id: null,
          receptionId: null,
          boxes:
            originalPallet.boxes?.map((box) => ({
              ...box,
              id: generateUniqueBoxId(),
              new: true,
            })) || [],
          store: originalPallet.store ? { id: originalPallet.store.id } : null,
          storeId: originalPallet.storeId || originalPallet.store?.id,
          orderId: order?.id,
        };
        setClonedPallet(clonedPalletData);
        setSelectedStoreId(originalPallet.storeId || originalPallet.store?.id);
        setSelectedPalletId('new');
        setIsPalletDialogOpen(true);
        toast.success('Palet clonado. Puedes editarlo antes de guardarlo.', getToastTheme());
      } catch (error) {
        console.error('Error al clonar el palet:', error);
        const msg =
          error.userMessage ||
          error.data?.userMessage ||
          error.response?.data?.userMessage ||
          error.message ||
          'Error al clonar el palet';
        toast.error(msg, getToastTheme());
      } finally {
        setIsCloning(false);
      }
    },
    [session, order?.id, generateUniqueBoxId]
  );

  const handleConfirmAction = useCallback(async () => {
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
      if (confirmAction === 'unlink') setUnlinkingPalletId(null);
    }
  }, [confirmAction, confirmPalletId, onDeletePallet, onUnlinkPallet]);

  const handleCancelAction = useCallback(() => {
    setIsConfirmDialogOpen(false);
    setConfirmAction(null);
    setConfirmPalletId(null);
    setUnlinkingPalletId(null);
  }, []);

  const handleOpenLinkPalletsDialog = useCallback(async () => {
    setIsLinkPalletsDialogOpen(true);
    setPalletIds([]);
    setInputPalletId('');
    setFilterStoreId(null);
    setSearchResults([]);
    setSelectedPalletIds([]);
    setCurrentPage(1);
    const token = session?.user?.accessToken;
    if (token && order?.id) {
      try {
        setIsInitialLoading(true);
        const result = await getAvailablePalletsForOrder(
          { orderId: order.id, perPage: 50, page: 1 },
          token
        );
        setSearchResults(result.data || []);
        setPaginationMeta(result.meta || null);
      } catch (error) {
        console.error('Error al cargar palets disponibles:', error);
        toast.error('Error al cargar palets disponibles', getToastTheme());
      } finally {
        setIsInitialLoading(false);
      }
    }
  }, [session, order?.id]);

  const handleCloseLinkPalletsDialog = useCallback(() => {
    setIsLinkPalletsDialogOpen(false);
    setPalletIds([]);
    setInputPalletId('');
    setFilterStoreId(null);
    setSearchResults([]);
    setSelectedPalletIds([]);
    setPaginationMeta(null);
    setCurrentPage(1);
  }, []);

  const handleAddPalletId = useCallback(() => {
    const trimmed = inputPalletId.trim();
    if (!trimmed) return;
    if (!/^\d+$/.test(trimmed)) {
      toast.error('Por favor ingresa un ID numérico válido', getToastTheme());
      return;
    }
    const id = parseInt(trimmed, 10);
    if (palletIds.includes(id)) {
      toast.error('Este ID ya está en la lista', getToastTheme());
      return;
    }
    if (pallets.some((p) => p.id === id)) {
      toast.error('Este palet ya está vinculado a este pedido', getToastTheme());
      return;
    }
    setPalletIds([...palletIds, id]);
    setInputPalletId('');
  }, [inputPalletId, pallets, palletIds]);

  const handleRemovePalletId = useCallback((idToRemove) => {
    setPalletIds((prev) => prev.filter((id) => id !== idToRemove));
  }, []);

  const handlePalletIdKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddPalletId();
      }
    },
    [handleAddPalletId]
  );

  const handleSearchPallets = useCallback(
    async (page = 1, storeIdOverride = null) => {
      const token = session?.user?.accessToken;
      if (!token) {
        toast.error('No se pudo obtener el token de autenticación', getToastTheme());
        return;
      }
      try {
        setIsSearching(true);
        setCurrentPage(page);
        const storeIdToUse = storeIdOverride !== null ? storeIdOverride : filterStoreId;
        let foundPallets = [];
        let meta = null;

        if (palletIds.length > 0) {
          if (palletIds.length > 50) {
            toast.error('Máximo 50 IDs a la vez. Por favor, reduce la cantidad', getToastTheme());
            setIsSearching(false);
            return;
          }
          const linkedPalletIds = pallets.map((p) => p.id);
          const idsToSearch = palletIds.filter((id) => !linkedPalletIds.includes(id));
          if (idsToSearch.length === 0) {
            toast.info('Todos los palets especificados ya están vinculados a este pedido', getToastTheme());
            setIsSearching(false);
            return;
          }
          if (idsToSearch.length < palletIds.length) {
            toast.info(
              `${palletIds.length - idsToSearch.length} palet(s) ya están vinculados y se omitirán`,
              getToastTheme()
            );
          }
          const result = await getAvailablePalletsForOrder(
            {
              orderId: order?.id,
              ids: idsToSearch.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id)),
              perPage: 50,
              page: 1,
            },
            token
          );
          foundPallets = result.data || [];
          meta = result.meta || null;
          if (foundPallets.length === 0) {
            toast.error('No se encontraron palets disponibles con los IDs especificados', getToastTheme());
            setIsSearching(false);
            return;
          }
          if (foundPallets.length < idsToSearch.length) {
            toast.info(
              `${idsToSearch.length - foundPallets.length} palet(s) no se encontraron o no están disponibles`,
              getToastTheme()
            );
          }
          setPaginationMeta(null);
        } else {
          const result = await getAvailablePalletsForOrder(
            { orderId: order?.id, storeId: storeIdToUse, perPage: 50, page },
            token
          );
          foundPallets = result.data || [];
          meta = result.meta || null;
        }
        setSearchResults(foundPallets);
        setPaginationMeta(meta);
      } catch (error) {
        console.error('Error al buscar palets:', error);
        const msg =
          error.userMessage ||
          error.data?.userMessage ||
          error.response?.data?.userMessage ||
          error.message ||
          'Error al buscar palets';
        toast.error(msg, getToastTheme());
      } finally {
        setIsSearching(false);
      }
    },
    [session, order?.id, palletIds, pallets, filterStoreId]
  );

  const togglePalletSelection = useCallback((palletId) => {
    setSelectedPalletIds((prev) =>
      prev.includes(palletId) ? prev.filter((id) => id !== palletId) : [...prev, palletId]
    );
  }, []);

  const handleSelectAllPallets = useCallback(() => {
    setSelectedPalletIds(searchResults.map((p) => p.id));
  }, [searchResults]);

  const handleDeselectAllPallets = useCallback(() => {
    setSelectedPalletIds([]);
  }, []);

  const handleLinkSelectedPallets = useCallback(async () => {
    if (selectedPalletIds.length === 0) {
      toast.error('Por favor selecciona al menos un palet', getToastTheme());
      return;
    }
    try {
      setIsLinking(true);
      await onLinkPallets(selectedPalletIds);
      setIsLinkPalletsDialogOpen(false);
      setPalletIds([]);
      setInputPalletId('');
      setFilterStoreId(null);
      setSearchResults([]);
      setSelectedPalletIds([]);
      setPaginationMeta(null);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error al vincular palets:', error);
    } finally {
      setIsLinking(false);
    }
  }, [selectedPalletIds, onLinkPallets]);

  const handleUnlinkAllPallets = useCallback(async () => {
    if (!pallets?.length) {
      toast.error('No hay palets para desvincular', getToastTheme());
      return;
    }
    const palletsToUnlink = pallets.filter((p) => !p.receptionId);
    if (palletsToUnlink.length === 0) {
      toast.error('No hay palets disponibles para desvincular. Todos pertenecen a recepciones.', getToastTheme());
      return;
    }
    const ids = palletsToUnlink.map((p) => p.id);
    try {
      setIsUnlinkingAll(true);
      await onUnlinkAllPallets(ids);
    } catch (error) {
      console.error('Error al desvincular todos los palets:', error);
    } finally {
      setIsUnlinkingAll(false);
    }
  }, [pallets, onUnlinkAllPallets]);

  const handleOpenCreateFromForecastDialog = useCallback(() => {
    const detailsWithBoxes = (plannedProductDetails || [])
      .filter((d) => d?.id && d?.product?.id && Number(d.boxes) > 0);
    if (detailsWithBoxes.length === 0) {
      toast.error(
        'La previsión no tiene productos con cajas. Añade líneas con cajas en la pestaña Previsión.',
        getToastTheme()
      );
      return;
    }
    setCreateFromForecastLot('');
    setCreateFromForecastStoreId(null);
    setIsCreateFromForecastDialogOpen(true);
  }, [plannedProductDetails]);

  const handleCloseCreateFromForecastDialog = useCallback(() => {
    setIsCreateFromForecastDialogOpen(false);
    setCreateFromForecastLot('');
    setCreateFromForecastStoreId(null);
  }, []);

  const handleCreatePalletFromForecast = useCallback(async () => {
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
    const detailsWithBoxes = (plannedProductDetails || [])
      .filter((d) => d?.id && d?.product?.id && Number(d.boxes) > 0);
    if (detailsWithBoxes.length === 0) {
      toast.error('No hay productos en la previsión con cajas', getToastTheme());
      return;
    }

    setIsCreatingFromForecast(true);
    let productOptionsMap = new Map();
    try {
      const products = await getProductOptions(token);
      (Array.isArray(products) ? products : []).forEach((p) => {
        const id = p?.id ?? p?.value;
        if (id != null)
          productOptionsMap.set(String(id), {
            id,
            name: p?.name ?? p?.label ?? '',
            boxGtin: p?.boxGtin ?? null,
          });
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

        boxes.push({
          id: nextBoxId++,
          new: true,
          product: { id: productId, name: productName },
          lot,
          netWeight,
          grossWeight: netWeight,
          ...(gs1128 && { gs1128 }),
        });
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
      const msg =
        err.userMessage ||
        err.data?.userMessage ||
        err.response?.data?.userMessage ||
        err.message ||
        'Error al crear el palet desde previsión';
      toast.error(msg, getToastTheme());
    } finally {
      setIsCreatingFromForecast(false);
    }
  }, [
    createFromForecastLot,
    createFromForecastStoreId,
    session,
    plannedProductDetails,
    order?.id,
    onCreatingPallet,
  ]);

  return {
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
  };
}
