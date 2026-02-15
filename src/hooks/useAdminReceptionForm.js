'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useProductOptions } from '@/hooks/useProductOptions';
import { useSupplierOptions } from '@/hooks/useSupplierOptions';
import { usePriceSynchronization } from '@/hooks/usePriceSynchronization';
import { useAccessibilityAnnouncer } from '@/components/Admin/RawMaterialReceptions/AccessibilityAnnouncer';
import { createRawMaterialReception } from '@/services/rawMaterialReceptionService';
import { getToastTheme } from '@/customs/reactHotToast';
import { normalizeDate, calculateNetWeights } from '@/helpers/receptionCalculations';
import {
  extractGlobalPriceMap,
  transformPalletsToApiFormat,
  transformDetailsToApiFormat,
  buildProductLotSummary,
  mapBackendPalletsToTemporal,
} from '@/helpers/receptionTransformations';
import { formatReceptionError, logReceptionError } from '@/helpers/receptionErrorHandler';
import {
  validateSupplier,
  validateDate,
  validateReceptionDetails,
  validateTemporalPallets,
} from '@/helpers/receptionValidators';

const DEFAULT_DETAIL = {
  product: null,
  grossWeight: '',
  boxes: 1,
  tare: '3',
  netWeight: '',
  price: '',
  lot: '',
};

export function useAdminReceptionForm({ onSuccess }) {
  const router = useRouter();
  const { productOptions, loading: productsLoading } = useProductOptions();
  const { supplierOptions, loading: suppliersLoading } = useSupplierOptions();
  const { announce, Announcer } = useAccessibilityAnnouncer();

  const [mode, setMode] = useState('automatic');
  const [temporalPallets, setTemporalPallets] = useState([]);
  const [isPalletDialogOpen, setIsPalletDialogOpen] = useState(false);
  const [selectedPalletId, setSelectedPalletId] = useState(null);
  const [editingPalletIndex, setEditingPalletIndex] = useState(null);
  const [palletMetadata, setPalletMetadata] = useState({ prices: {}, observations: '' });
  const [isModeChangeDialogOpen, setIsModeChangeDialogOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  const [recalcKey, setRecalcKey] = useState(0);

  const { updatePrice } = usePriceSynchronization(temporalPallets, setTemporalPallets);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      supplier: null,
      date: normalizeDate(new Date()),
      notes: '',
      details: [DEFAULT_DETAIL],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'details' });

  const watchedDetails = watch('details');
  const currentDetails = watchedDetails || [];

  const triggerRecalc = useCallback(() => {
    setRecalcKey((prev) => prev + 1);
  }, []);

  const calculatedNetWeights = useMemo(() => {
    if (!currentDetails || !Array.isArray(currentDetails)) return [];
    return calculateNetWeights(currentDetails);
  }, [currentDetails, recalcKey]);

  useEffect(() => {
    if (
      calculatedNetWeights.length > 0 &&
      currentDetails &&
      Array.isArray(currentDetails)
    ) {
      calculatedNetWeights.forEach((netWeight, index) => {
        if (index < currentDetails.length) {
          const calculatedWeight = parseFloat(netWeight.toFixed(2));
          const currentNetWeight = parseFloat(currentDetails[index]?.netWeight) || 0;
          if (Math.abs(currentNetWeight - calculatedWeight) > 0.001) {
            setValue(`details.${index}.netWeight`, calculatedWeight.toFixed(2), {
              shouldValidate: false,
              shouldDirty: false,
              shouldTouch: false,
            });
            setTimeout(() => triggerRecalc(), 10);
          }
        }
      });
    }
  }, [calculatedNetWeights, currentDetails, setValue, triggerRecalc]);

  const detailsSerialized = useMemo(() => {
    if (!watchedDetails || !Array.isArray(watchedDetails)) return '';
    return JSON.stringify(
      watchedDetails.map((d) => ({
        grossWeight: d?.grossWeight || '',
        boxes: d?.boxes ?? 1,
        tare: d?.tare ?? '3',
        netWeight: d?.netWeight || '',
        price: d?.price || '',
      }))
    );
  }, [watchedDetails]);

  useEffect(() => {
    if (detailsSerialized) {
      const timer = setTimeout(() => setRecalcKey((prev) => prev + 1), 10);
      return () => clearTimeout(timer);
    }
  }, [detailsSerialized]);

  const linesTotals = useMemo(() => {
    if (!currentDetails || !Array.isArray(currentDetails)) {
      return { totalKg: 0, totalAmount: 0 };
    }
    let totalKg = 0;
    let totalAmount = 0;
    currentDetails.forEach((detail) => {
      const netWeight = parseFloat(detail?.netWeight) || 0;
      const price = parseFloat(detail?.price) || 0;
      totalKg += netWeight;
      totalAmount += netWeight * price;
    });
    return { totalKg, totalAmount };
  }, [currentDetails, recalcKey]);

  const palletsDisplayData = useMemo(() => {
    return temporalPallets.map((item) => {
      const pallet = item.pallet;
      const productLotCombinations = buildProductLotSummary(pallet);
      return { item, pallet, productLotCombinations };
    });
  }, [temporalPallets]);

  const hasDataInCurrentMode = useCallback(() => {
    if (mode === 'automatic') {
      const details = getValues('details') || [];
      if (details.length > 1) return true;
      return details.some(
        (detail) =>
          detail.product ||
          (detail.grossWeight && parseFloat(detail.grossWeight) > 0) ||
          (detail.price && parseFloat(detail.price) > 0) ||
          (detail.lot && detail.lot.trim() !== '')
      );
    }
    return temporalPallets && temporalPallets.length > 0;
  }, [mode, temporalPallets, getValues]);

  const handleModeChange = useCallback(
    (newMode) => {
      if (!hasDataInCurrentMode()) {
        setMode(newMode);
        return;
      }
      setPendingMode(newMode);
      setIsModeChangeDialogOpen(true);
    },
    [hasDataInCurrentMode]
  );

  const handleConfirmModeChange = useCallback(() => {
    if (mode === 'automatic') {
      setValue('details', [{ ...DEFAULT_DETAIL }]);
    } else {
      setTemporalPallets([]);
    }
    setMode(pendingMode);
    setIsModeChangeDialogOpen(false);
    setPendingMode(null);
  }, [mode, pendingMode, setValue]);

  const handleCancelModeChange = useCallback(() => {
    setIsModeChangeDialogOpen(false);
    setPendingMode(null);
  }, []);

  const handleCreate = useCallback(
    async (data) => {
      try {
        const supplierError = validateSupplier(data.supplier);
        if (supplierError) {
          toast.error(supplierError, getToastTheme());
          return;
        }

        const dateError = validateDate(data.date);
        if (dateError) {
          toast.error(dateError, getToastTheme());
          return;
        }

        let payload;

        if (mode === 'automatic') {
          const detailsError = validateReceptionDetails(data.details);
          if (detailsError) {
            toast.error(detailsError, getToastTheme());
            return;
          }

          const transformedDetails = transformDetailsToApiFormat(data.details);

          if (transformedDetails.length === 0) {
            toast.error(
              'Debe completar al menos una línea válida con producto y peso neto',
              getToastTheme()
            );
            return;
          }

          payload = {
            supplier: { id: data.supplier },
            date: format(data.date, 'yyyy-MM-dd'),
            notes: data.notes || '',
            details: transformedDetails,
          };
        } else {
          const palletsError = validateTemporalPallets(temporalPallets);
          if (palletsError) {
            toast.error(palletsError, getToastTheme());
            return;
          }

          const globalPriceMap = extractGlobalPriceMap(temporalPallets);
          const prices = Array.from(globalPriceMap.values());
          const convertedPallets = transformPalletsToApiFormat(temporalPallets);

          if (convertedPallets.length === 0) {
            toast.error(
              'Debe completar al menos un palet válido con producto y cajas',
              getToastTheme()
            );
            return;
          }

          payload = {
            supplier: { id: data.supplier },
            date: format(data.date, 'yyyy-MM-dd'),
            notes: data.notes || '',
            prices,
            pallets: convertedPallets,
          };
        }

        const createdReception = await createRawMaterialReception(payload);

        if (
          mode === 'manual' &&
          createdReception?.pallets &&
          createdReception.pallets.length > 0
        ) {
          const globalPriceMap = extractGlobalPriceMap(temporalPallets);
          const globalPricesObj = Object.fromEntries(
            Array.from(globalPriceMap.entries()).map(([key, value]) => [key, value.price])
          );
          const updatedTemporalPallets = mapBackendPalletsToTemporal(
            createdReception.pallets,
            temporalPallets,
            globalPricesObj
          );
          setTemporalPallets(updatedTemporalPallets);
        }

        toast.success('Recepción creada exitosamente', getToastTheme());

        if (onSuccess) {
          onSuccess(createdReception);
        } else {
          router.push(`/admin/raw-material-receptions/${createdReception.id}/edit`);
        }
      } catch (error) {
        logReceptionError(error, 'create', {
          mode,
          hasPallets: temporalPallets.length,
        });
        toast.error(formatReceptionError(error, 'create'), getToastTheme());
      }
    },
    [mode, temporalPallets, onSuccess, router]
  );

  const handleSaveClick = useCallback(() => {
    handleSubmit(handleCreate, (submitErrors) => {
      if (submitErrors && Object.keys(submitErrors).length > 0) {
        if (mode === 'manual' && submitErrors.details) {
          delete submitErrors.details;
        }
        if (Object.keys(submitErrors).length > 0) {
          toast.error('Por favor, complete todos los campos requeridos', getToastTheme());
        } else {
          handleCreate(watch());
        }
      }
    })();
  }, [handleSubmit, handleCreate, mode, watch]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!isSubmitting) handleSaveClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, handleSaveClick]);

  const openAddPallet = useCallback(() => {
    setSelectedPalletId('new');
    setEditingPalletIndex(null);
    setIsPalletDialogOpen(true);
  }, []);

  const openEditPallet = useCallback((index) => {
    setSelectedPalletId('new');
    setEditingPalletIndex(index);
    setPalletMetadata({
      prices: temporalPallets[index]?.prices || {},
      observations: temporalPallets[index]?.observations || '',
    });
    setIsPalletDialogOpen(true);
  }, [temporalPallets]);

  const handlePalletSave = useCallback(
    (pallet) => {
      if (editingPalletIndex !== null) {
        setTemporalPallets((prev) => {
          const updated = [...prev];
          updated[editingPalletIndex] = {
            pallet,
            prices: palletMetadata.prices || {},
            observations: palletMetadata.observations || pallet.observations || '',
          };
          return updated;
        });
      } else {
        setTemporalPallets((prev) => [
          ...prev,
          {
            pallet,
            prices: {},
            observations: pallet.observations || '',
          },
        ]);
      }
      setIsPalletDialogOpen(false);
      setSelectedPalletId(null);
      setEditingPalletIndex(null);
      setPalletMetadata({ prices: {}, observations: '' });
    },
    [editingPalletIndex, palletMetadata]
  );

  const handlePalletClose = useCallback(() => {
    setIsPalletDialogOpen(false);
    setSelectedPalletId(null);
    setEditingPalletIndex(null);
  }, []);

  const removePallet = useCallback((index) => {
    setTemporalPallets((prev) => prev.filter((_, i) => i !== index));
    announce(`Palet ${index + 1} eliminado`, 'polite');
  }, [announce]);

  const updatePalletPrice = useCallback(
    (index, priceKey, newPrice) => {
      setTemporalPallets((prev) => {
        const updated = [...prev];
        if (!updated[index].prices) updated[index].prices = {};
        updated[index].prices = {
          ...updated[index].prices,
          [priceKey]: newPrice,
        };
        return updated;
      });
      updatePrice(priceKey, newPrice);
    },
    [updatePrice]
  );

  const appendDetail = useCallback(() => {
    append({ ...DEFAULT_DETAIL });
    announce(`Línea ${fields.length + 1} agregada`, 'polite');
  }, [append, fields.length, announce]);

  const removeDetail = useCallback(
    (index) => {
      remove(index);
      announce(`Línea ${index + 1} eliminada`, 'polite');
    },
    [remove, announce]
  );

  return {
    // Form
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    errors,
    isSubmitting,
    fields,
    remove: removeDetail,
    append: appendDetail,
    currentDetails,
    linesTotals,
    triggerRecalc,

    // Mode
    mode,
    handleModeChange,
    handleConfirmModeChange,
    handleCancelModeChange,
    isModeChangeDialogOpen,
    setIsModeChangeDialogOpen,
    pendingMode,

    // Pallets
    temporalPallets,
    setTemporalPallets,
    palletsDisplayData,
    updatePalletPrice,
    removePallet,
    openAddPallet,
    openEditPallet,

    // Pallet dialog
    isPalletDialogOpen,
    selectedPalletId,
    editingPalletIndex,
    palletMetadata,
    handlePalletSave,
    handlePalletClose,
    initialPalletForEdit:
      editingPalletIndex !== null ? temporalPallets[editingPalletIndex]?.pallet : null,

    // Submit
    handleCreate,
    handleSaveClick,

    // Options
    productOptions,
    productsLoading,
    supplierOptions,
    suppliersLoading,

    // Accessibility
    announce,
    Announcer,
  };
}
