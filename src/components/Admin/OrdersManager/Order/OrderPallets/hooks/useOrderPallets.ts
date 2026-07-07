import { useState, useCallback, useEffect } from 'react';
import { useOrderContext } from '@/context/OrderContext';
import { useSession } from 'next-auth/react';
import { useStoresOptions } from '@/hooks/useStoresOptions';
import {
  getPallet,
  getAvailablePalletsForOrder,
  createPallet,
  downloadPalletExpeditionLabel,
  downloadPalletExpeditionLabels,
} from '@/services/palletService';
import { getProductOptions } from '@/services/productService';
import { notify } from '@/lib/notifications';
import { roundToTwoDecimals } from '../utils/roundToTwoDecimals';
import type { PalletState } from '@/hooks/pallets/palletHelpers';
import type { SearchPalletCardData } from '../SearchPalletCard';
import type { ConfirmActionDialogAction } from '../dialogs/ConfirmActionDialog';

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface PlannedProductDetailLike {
  id?: number | string;
  product?: { id: number | string; name?: string } | null;
  productId?: number | string;
  boxes?: number | string;
  quantity?: number | string;
  [key: string]: unknown;
}

function getErrorMessageFrom(error: unknown, fallback: string): string {
  const e = error as Record<string, unknown> | undefined;
  const data = e?.data as Record<string, unknown> | undefined;
  const response = e?.response as { data?: Record<string, unknown> } | undefined;
  return (
    (e?.userMessage as string) ||
    (data?.userMessage as string) ||
    (response?.data?.userMessage as string) ||
    (e?.message as string) ||
    fallback
  );
}

/**
 * Hook con estado y lógica de OrderPallets
 */
export function useOrderPallets() {
  const {
    pallets,
    order,
    plannedProductDetails: rawPlannedProductDetails,
    onEditingPallet,
    onCreatingPallet,
    onDeletePallet,
    onUnlinkPallet,
    onLinkPallets,
    onUnlinkAllPallets,
  } = useOrderContext();
  const plannedProductDetails = rawPlannedProductDetails as unknown as PlannedProductDetailLike[];
  const { data: session } = useSession();
  const rawRole = session?.user?.role;
  const roles = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];
  const canPrintExpeditionLabels = !roles.includes('comercial');
  const { storeOptions, loading: storesLoading } = useStoresOptions();

  const [isPalletDialogOpen, setIsPalletDialogOpen] = useState(false);
  const [selectedPalletId, setSelectedPalletId] = useState<number | string | null>(null);
  const [isStoreSelectionOpen, setIsStoreSelectionOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionDialogAction | null>(null);
  const [confirmPalletId, setConfirmPalletId] = useState<number | string | null>(null);
  const [isPalletLabelDialogOpen, setIsPalletLabelDialogOpen] = useState(false);
  const [selectedPalletForLabel, setSelectedPalletForLabel] = useState<unknown>(null);

  const [isLinkPalletsDialogOpen, setIsLinkPalletsDialogOpen] = useState(false);
  const [palletIds, setPalletIds] = useState<number[]>([]);
  const [inputPalletId, setInputPalletId] = useState('');
  const [filterStoreId, setFilterStoreId] = useState<number | string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchPalletCardData[]>([]);
  const [selectedPalletIds, setSelectedPalletIds] = useState<(number | string)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [clonedPallet, setClonedPallet] = useState<PalletState | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [unlinkingPalletId, setUnlinkingPalletId] = useState<number | string | null>(null);
  const [isUnlinkingAll, setIsUnlinkingAll] = useState(false);
  const [selectedLinkedPalletIds, setSelectedLinkedPalletIds] = useState<(number | string)[]>([]);
  const [isPrintingExpeditionLabels, setIsPrintingExpeditionLabels] = useState(false);

  const [isCreateFromForecastDialogOpen, setIsCreateFromForecastDialogOpen] = useState(false);
  const [createFromForecastLot, setCreateFromForecastLot] = useState('');
  const [createFromForecastStoreId, setCreateFromForecastStoreId] = useState<
    number | string | null
  >(null);
  const [isCreatingFromForecast, setIsCreatingFromForecast] = useState(false);

  useEffect(() => {
    const linkedIds = new Set((pallets || []).map((p) => p.id));
    setSelectedLinkedPalletIds((prev) => {
      const next = prev.filter((id) => linkedIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [pallets]);

  const generateUniqueBoxId = useCallback(() => {
    return Date.now() + Math.random();
  }, []);

  const handleOpenNewPallet = useCallback(() => {
    setIsStoreSelectionOpen(true);
  }, []);

  const handleOpenEditPallet = useCallback((palletId: number | string) => {
    setSelectedPalletId(palletId);
    setIsPalletDialogOpen(true);
  }, []);

  const handleClosePalletDialog = useCallback(() => {
    setIsPalletDialogOpen(false);
    setSelectedPalletId(null);
    setSelectedStoreId(null);
    setClonedPallet(null);
  }, []);

  const handleStoreSelection = useCallback((storeId: number | string) => {
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
    async (pallet: unknown) => {
      const palletId = (pallet as { id: number | string })?.id;
      const isPalletVinculated = pallets.some((p) => p.id === palletId);
      try {
        if (isPalletVinculated) {
          await onEditingPallet(pallet as Record<string, unknown>);
        } else {
          await onCreatingPallet(pallet as Record<string, unknown>);
        }
      } catch (error) {
        console.error('Error al actualizar palet:', error);
        const msg = getErrorMessageFrom(error, 'No se pudo actualizar el palet. Intente de nuevo.');
        notify.error({ title: 'Error al actualizar palet', description: msg });
      }
    },
    [pallets, onEditingPallet, onCreatingPallet]
  );

  const handleDeletePallet = useCallback((palletId: number | string) => {
    setConfirmAction('delete');
    setConfirmPalletId(palletId);
    setIsConfirmDialogOpen(true);
  }, []);

  const handleUnlinkPallet = useCallback((palletId: number | string) => {
    setConfirmAction('unlink');
    setConfirmPalletId(palletId);
    setIsConfirmDialogOpen(true);
  }, []);

  const handleOpenPalletLabelDialog = useCallback(
    (palletId: number | string) => {
      const pallet = pallets.find((p) => p.id === palletId);
      if (!pallet) return;
      setSelectedPalletForLabel(pallet);
      setIsPalletLabelDialogOpen(true);
    },
    [pallets]
  );

  const handleClosePalletLabelDialog = useCallback(() => {
    setIsPalletLabelDialogOpen(false);
    setTimeout(() => setSelectedPalletForLabel(null), 1000);
  }, []);

  const handleToggleLinkedPalletSelection = useCallback((palletId: number | string) => {
    setSelectedLinkedPalletIds((prev) =>
      prev.includes(palletId) ? prev.filter((id) => id !== palletId) : [...prev, palletId]
    );
  }, []);

  const handleSelectAllLinkedPallets = useCallback(() => {
    setSelectedLinkedPalletIds((pallets || []).map((p) => p.id));
  }, [pallets]);

  const handleDeselectAllLinkedPallets = useCallback(() => {
    setSelectedLinkedPalletIds([]);
  }, []);

  const handlePrintPalletExpeditionLabel = useCallback(
    async (palletId: number | string) => {
      if (!canPrintExpeditionLabels) {
        notify.error({
          title: 'Documento no disponible',
          description: 'Este documento no está disponible para el rol Comercial.',
        });
        return;
      }
      if (!palletId) return;

      await notify.promise(downloadPalletExpeditionLabel(palletId), {
        loading: {
          title: 'Generando etiqueta',
          description: `Preparando la etiqueta de expedición del palet #${palletId}.`,
        },
        success: {
          title: 'Etiqueta generada',
          description: 'El PDF ya está listo para descarga.',
        },
        error: (error: unknown) => ({
          title: 'Error al generar la etiqueta',
          description: getErrorMessageFrom(error, 'No se pudo generar la etiqueta de expedición.'),
        }),
      });
    },
    [canPrintExpeditionLabels]
  );

  const handlePrintSelectedPalletExpeditionLabels = useCallback(async () => {
    if (!canPrintExpeditionLabels) {
      notify.error({
        title: 'Documento no disponible',
        description: 'Este documento no está disponible para el rol Comercial.',
      });
      return;
    }
    if (selectedLinkedPalletIds.length === 0) {
      notify.error({ title: 'Selecciona al menos un palet' });
      return;
    }

    setIsPrintingExpeditionLabels(true);
    try {
      await notify.promise(downloadPalletExpeditionLabels(selectedLinkedPalletIds), {
        loading: {
          title: 'Generando etiquetas',
          description: `Preparando ${selectedLinkedPalletIds.length} etiqueta(s) de expedición.`,
        },
        success: {
          title: 'Etiquetas generadas',
          description: 'El PDF ya está listo para descarga.',
        },
        error: (error: unknown) => ({
          title: 'Error al generar etiquetas',
          description: getErrorMessageFrom(
            error,
            'No se pudieron generar las etiquetas de expedición.'
          ),
        }),
      });
    } finally {
      setIsPrintingExpeditionLabels(false);
    }
  }, [canPrintExpeditionLabels, selectedLinkedPalletIds]);

  const handleClonePallet = useCallback(
    async (palletId: number | string) => {
      try {
        setIsCloning(true);
        const originalPallet = (await getPallet(palletId)) as PalletState & {
          store?: { id: number | string } | null;
          storeId?: number | string;
        };
        const clonedPalletData: PalletState = {
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
        setSelectedStoreId(originalPallet.storeId || originalPallet.store?.id || null);
        setSelectedPalletId('new');
        setIsPalletDialogOpen(true);
        notify.success({
          title: 'Palet clonado',
          description: 'Puedes editarlo antes de guardarlo.',
        });
      } catch (error) {
        console.error('Error al clonar el palet:', error);
        const msg = getErrorMessageFrom(error, 'No se pudo clonar el palet. Intente de nuevo.');
        notify.error({ title: 'Error al clonar el palet', description: msg });
      } finally {
        setIsCloning(false);
      }
    },
    [order?.id, generateUniqueBoxId]
  );

  const handleConfirmAction = useCallback(async () => {
    try {
      if (confirmAction === 'delete') {
        if (confirmPalletId !== null) await onDeletePallet(confirmPalletId);
      } else if (confirmAction === 'unlink') {
        setUnlinkingPalletId(confirmPalletId);
        try {
          if (confirmPalletId !== null) await onUnlinkPallet(confirmPalletId);
        } finally {
          setUnlinkingPalletId(null);
        }
      } else if (confirmAction === 'unlinkAll') {
        if (!pallets?.length) {
          notify.error({ title: 'No hay palets para desvincular' });
          setIsConfirmDialogOpen(false);
          setConfirmAction(null);
          setConfirmPalletId(null);
          return;
        }
        const ids = pallets.map((p) => p.id);
        setIsUnlinkingAll(true);
        try {
          await onUnlinkAllPallets(ids);
        } finally {
          setIsUnlinkingAll(false);
        }
      }
      setIsConfirmDialogOpen(false);
      setConfirmAction(null);
      setConfirmPalletId(null);
    } catch (error) {
      console.error('Error al ejecutar la acción:', error);
      const msg = getErrorMessageFrom(error, 'No se pudo ejecutar la acción. Intente de nuevo.');
      notify.error({ title: 'Error al ejecutar la acción', description: msg });
      if (confirmAction === 'unlink') setUnlinkingPalletId(null);
    }
  }, [confirmAction, confirmPalletId, pallets, onDeletePallet, onUnlinkPallet, onUnlinkAllPallets]);

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
    if (order?.id) {
      try {
        setIsInitialLoading(true);
        const result = await getAvailablePalletsForOrder({
          orderId: order.id,
          perPage: 50,
          page: 1,
        });
        setSearchResults((result.data as SearchPalletCardData[]) || []);
        setPaginationMeta(result.meta || null);
      } catch (error) {
        console.error('Error al cargar palets disponibles:', error);
        notify.error({
          title: 'Error al cargar palets',
          description: 'No se pudieron cargar los palets disponibles. Intente de nuevo.',
        });
      } finally {
        setIsInitialLoading(false);
      }
    }
  }, [order?.id]);

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
      notify.error({ title: 'Por favor ingresa un ID numérico válido' });
      return;
    }
    const id = parseInt(trimmed, 10);
    if (palletIds.includes(id)) {
      notify.error({ title: 'Este ID ya está en la lista' });
      return;
    }
    if (pallets.some((p) => p.id === id)) {
      notify.error({ title: 'Este palet ya está vinculado a este pedido' });
      return;
    }
    setPalletIds([...palletIds, id]);
    setInputPalletId('');
  }, [inputPalletId, pallets, palletIds]);

  const handleRemovePalletId = useCallback((idToRemove: number) => {
    setPalletIds((prev) => prev.filter((id) => id !== idToRemove));
  }, []);

  const handlePalletIdKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddPalletId();
      }
    },
    [handleAddPalletId]
  );

  const handleSearchPallets = useCallback(
    async (page = 1, storeIdOverride: number | string | null = null) => {
      try {
        setIsSearching(true);
        setCurrentPage(page);
        const storeIdToUse = storeIdOverride !== null ? storeIdOverride : filterStoreId;
        let foundPallets: SearchPalletCardData[] = [];
        let meta: PaginationMeta | null = null;

        if (palletIds.length > 0) {
          if (palletIds.length > 50) {
            notify.error({ title: 'Máximo 50 IDs a la vez. Por favor, reduce la cantidad' });
            setIsSearching(false);
            return;
          }
          const linkedPalletIds = pallets.map((p) => p.id);
          const idsToSearch = palletIds.filter((id) => !linkedPalletIds.includes(id));
          if (idsToSearch.length === 0) {
            notify.info({
              title: 'Todos los palets especificados ya están vinculados a este pedido',
            });
            setIsSearching(false);
            return;
          }
          if (idsToSearch.length < palletIds.length) {
            notify.info({
              title: `${palletIds.length - idsToSearch.length} palet(s) ya están vinculados y se omitirán`,
            });
          }
          const result = await getAvailablePalletsForOrder({
            orderId: order?.id as number | string,
            ids: idsToSearch.map((id) => parseInt(String(id), 10)).filter((id) => !isNaN(id)),
            perPage: 50,
            page: 1,
          });
          foundPallets = (result.data as SearchPalletCardData[]) || [];
          meta = result.meta || null;
          if (foundPallets.length === 0) {
            notify.error({
              title: 'No se encontraron palets disponibles con los IDs especificados',
            });
            setIsSearching(false);
            return;
          }
          if (foundPallets.length < idsToSearch.length) {
            notify.info({
              title: `${idsToSearch.length - foundPallets.length} palet(s) no se encontraron o no están disponibles`,
            });
          }
          setPaginationMeta(null);
        } else {
          const result = await getAvailablePalletsForOrder({
            orderId: order?.id as number | string,
            storeId: storeIdToUse,
            perPage: 50,
            page,
          });
          foundPallets = (result.data as SearchPalletCardData[]) || [];
          meta = result.meta || null;
        }
        setSearchResults(foundPallets);
        setPaginationMeta(meta);
      } catch (error) {
        console.error('Error al buscar palets:', error);
        const msg = getErrorMessageFrom(
          error,
          'No se pudieron buscar los palets. Intente de nuevo.'
        );
        notify.error({ title: 'Error al buscar palets', description: msg });
      } finally {
        setIsSearching(false);
      }
    },
    [order?.id, palletIds, pallets, filterStoreId]
  );

  const togglePalletSelection = useCallback((palletId: number | string) => {
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
      notify.error({ title: 'Por favor selecciona al menos un palet' });
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
      const msg = getErrorMessageFrom(
        error,
        'No se pudieron vincular los palets. Intente de nuevo.'
      );
      notify.error({ title: 'Error al vincular palets', description: msg });
    } finally {
      setIsLinking(false);
    }
  }, [selectedPalletIds, onLinkPallets]);

  const handleUnlinkAllPallets = useCallback(() => {
    if (!pallets?.length) {
      notify.error({ title: 'No hay palets para desvincular' });
      return;
    }
    setConfirmAction('unlinkAll');
    setIsConfirmDialogOpen(true);
  }, [pallets]);

  const handleOpenCreateFromForecastDialog = useCallback(() => {
    const detailsWithBoxes = (plannedProductDetails || []).filter(
      (d) => d?.id && d?.product?.id && Number(d.boxes) > 0
    );
    if (detailsWithBoxes.length === 0) {
      notify.error({
        title:
          'La previsión no tiene productos con cajas. Añade líneas con cajas en la pestaña Previsión.',
      });
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
      notify.error({ title: 'Introduce el lote' });
      return;
    }
    if (!createFromForecastStoreId) {
      notify.error({
        title: 'Almacén requerido',
        description: 'Selecciona el almacén donde se almacenará el palet.',
      });
      return;
    }
    const detailsWithBoxes = (plannedProductDetails || []).filter(
      (d) => d?.id && d?.product?.id && Number(d.boxes) > 0
    );
    if (detailsWithBoxes.length === 0) {
      notify.error({
        title: 'Sin productos con cajas',
        description: 'No hay productos en la previsión con cajas. Añade cajas a la previsión.',
      });
      return;
    }

    setIsCreatingFromForecast(true);
    const productOptionsMap = new Map<
      string,
      { id: number | string; name: string; boxGtin: string | null }
    >();
    try {
      const products = await getProductOptions();
      (Array.isArray(products) ? products : []).forEach((p) => {
        const product = p as unknown as {
          id?: number | string;
          value?: number | string;
          name?: string;
          label?: string;
          boxGtin?: string | null;
        };
        const id = product?.id ?? product?.value;
        if (id != null)
          productOptionsMap.set(String(id), {
            id,
            name: product?.name ?? product?.label ?? '',
            boxGtin: product?.boxGtin ?? null,
          });
      });
    } catch (err) {
      console.error('Error al cargar productos:', err);
      notify.warning({
        title: 'No se pudieron cargar los productos',
        description:
          'El palet se creará igualmente, pero el nombre o GTIN del producto puede no mostrarse correctamente.',
      });
    }

    // AI GS1 3102: peso neto codificado con 2 decimales implícitos. No usar 3100 (0
    // decimales) — un lector GS1-128 externo decodificaría el peso como 100 veces el real.
    // Mismo criterio que usePalletBoxOperations.ts. Ver GAP-V2-078/GAP-V2-109.
    const buildGs1128 = (
      productId: number | string | undefined,
      lotVal: string,
      netWeight: number
    ) => {
      const p = productOptionsMap.get(String(productId));
      const normalizedBoxGtin = String(p?.boxGtin ?? '').replace(/\D/g, '');
      const fallbackGtinFromProduct = String(productId ?? '')
        .replace(/\D/g, '')
        .padStart(14, '0')
        .slice(-14);
      const gtin = normalizedBoxGtin || fallbackGtinFromProduct || '00000000000000';
      const w = netWeight || 0;
      const formatted = w.toFixed(2).replace('.', '').padStart(6, '0');
      return `(01)${gtin}(3102)${formatted}(10)${lotVal}`;
    };

    let nextBoxId = Date.now();
    const boxes: Array<{
      id: number;
      new: boolean;
      product: { id: number | string | undefined; name: string };
      lot: string;
      netWeight: number;
      grossWeight: number;
      gs1128: string;
    }> = [];
    for (const detail of detailsWithBoxes) {
      const numBoxes = Math.max(0, parseInt(String(detail.boxes), 10) || 0);
      const totalQty = parseFloat(String(detail.quantity)) || 0;
      if (numBoxes <= 0) continue;

      const weightPerBox = totalQty / numBoxes;
      const standardWeight = roundToTwoDecimals(weightPerBox);
      let accumulated = 0;

      for (let i = 0; i < numBoxes; i++) {
        const isLast = i === numBoxes - 1;
        const netWeight = isLast ? roundToTwoDecimals(totalQty - accumulated) : standardWeight;
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
          gs1128,
        });
      }
    }

    if (boxes.length === 0) {
      setIsCreatingFromForecast(false);
      notify.error({ title: 'No se pudieron generar cajas desde la previsión' });
      return;
    }

    const palletData = {
      id: null,
      observations: '',
      state: { id: 1, name: 'Registrado' },
      productsNames: [] as string[],
      boxes,
      lots: [lot],
      netWeight: boxes.reduce((sum, b) => sum + (b.netWeight || 0), 0),
      numberOfBoxes: boxes.length,
      position: null,
      store: { id: createFromForecastStoreId },
      storeId: createFromForecastStoreId,
      orderId: order?.id,
    };

    try {
      const result = (await createPallet(palletData)) as
        | { data?: Record<string, unknown> }
        | Record<string, unknown>
        | null;
      const newPallet =
        (result as { data?: Record<string, unknown> })?.data ??
        (result as Record<string, unknown> | null);
      if (newPallet) {
        await onCreatingPallet(newPallet);
        handleCloseCreateFromForecastDialog();
        notify.success({
          title: 'Palet creado',
          description: 'El palet se ha creado desde la previsión correctamente.',
        });
      }
    } catch (err) {
      console.error('Error al crear palet desde previsión:', err);
      const msg = getErrorMessageFrom(
        err,
        'No se pudo crear el palet desde la previsión. Intente de nuevo.'
      );
      notify.error({ title: 'Error al crear el palet desde previsión', description: msg });
    } finally {
      setIsCreatingFromForecast(false);
    }
  }, [
    createFromForecastLot,
    createFromForecastStoreId,
    plannedProductDetails,
    order?.id,
    onCreatingPallet,
    handleCloseCreateFromForecastDialog,
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
