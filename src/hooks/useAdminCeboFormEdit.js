'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { format } from 'date-fns';
import { useProductOptions } from '@/hooks/useProductOptions';
import { useSupplierOptions } from '@/hooks/useSupplierOptions';
import { useAccessibilityAnnouncer } from '@/components/Admin/RawMaterialReceptions/AccessibilityAnnouncer';
import { ceboDispatchService } from '@/services/domain/cebo-dispatches/ceboDispatchService';
import { normalizeDate, calculateNetWeights } from '@/helpers/receptionCalculations';
import { transformDetailsToApiFormat } from '@/helpers/receptionTransformations';
import { notify } from '@/lib/notifications';
import {
  validateSupplier,
  validateDate,
  validateReceptionDetails,
} from '@/helpers/receptionValidators';

const DEFAULT_DETAIL = {
  product: null,
  grossWeight: '',
  boxes: 0,
  tare: '3',
  netWeight: '',
  price: '',
  lot: '',
};

/**
 * Maps API dispatch response to form defaultValues.
 * API shape: { id, supplier: { id, name }, date, notes, details: [ { product: { id, ... }, netWeight, price } ] }
 */
function mapDispatchToFormValues(dispatch) {
  if (!dispatch) return null;
  const supplierId = dispatch.supplier?.id ?? dispatch.supplier;
  const date = normalizeDate(dispatch.date || new Date());
  const notes = dispatch.notes ?? '';
  const details = Array.isArray(dispatch.details)
    ? dispatch.details.map((d) => {
        const netWeight = d.netWeight != null ? String(d.netWeight) : '';
        const productId = d.product && typeof d.product === 'object' ? d.product?.id : d.product;
        return {
          product: productId != null ? String(productId) : null,
          grossWeight: netWeight,
          boxes: 0,
          tare: '3',
          netWeight,
          price: d.price != null && d.price !== '' ? String(d.price) : '',
          lot: '',
        };
      })
    : [{ ...DEFAULT_DETAIL }];
  if (details.length === 0) details.push({ ...DEFAULT_DETAIL });
  const exportType = dispatch.exportType ?? dispatch.export_type ?? null;
  return {
    supplier: supplierId != null ? String(supplierId) : null,
    date,
    notes,
    exportType: exportType === 'a3erp' || exportType === 'facilcom' ? exportType : null,
    details,
  };
}

export function useAdminCeboFormEdit({ dispatchId, onSuccess }) {
  const { productOptions, loading: productsLoading } = useProductOptions();
  const { supplierOptions, loading: suppliersLoading } = useSupplierOptions();
  const { announce, Announcer } = useAccessibilityAnnouncer();

  const [loading, setLoading] = useState(true);
  const [recalcKey, setRecalcKey] = useState(0);
  const loadedIdRef = useRef(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      supplier: null,
      date: normalizeDate(new Date()),
      notes: '',
      exportType: null,
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

  // Load dispatch by id and reset form
  useEffect(() => {
    if (!dispatchId) {
      setLoading(false);
      return;
    }
    if (loadedIdRef.current === dispatchId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadedIdRef.current = null;

    ceboDispatchService
      .getById(dispatchId)
      .then((dispatch) => {
        if (cancelled) return;
        const values = mapDispatchToFormValues(dispatch);
        if (values) {
          reset(values);
        }
        loadedIdRef.current = dispatchId;
      })
      .catch(() => {
        if (!cancelled) {
          notify.error({ title: 'No se pudo cargar la salida de cebo' });
          loadedIdRef.current = dispatchId;
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatchId, reset]);

  const handleUpdate = useCallback(
    async (data) => {
      try {
        const supplierError = validateSupplier(data.supplier);
        if (supplierError) {
          notify.error({ title: supplierError });
          return;
        }

        const dateError = validateDate(data.date);
        if (dateError) {
          notify.error({ title: dateError });
          return;
        }

        const detailsError = validateReceptionDetails(data.details);
        if (detailsError) {
          notify.error({ title: detailsError });
          return;
        }

        // Normalize product to id for transform (form may have product as object when loaded from API)
        const detailsWithProductId = data.details.map((d) => ({
          ...d,
          product: d.product?.id ?? d.product,
        }));
        const transformedDetails = transformDetailsToApiFormat(detailsWithProductId);

        if (transformedDetails.length === 0) {
          notify.error({
            title: 'Debe completar al menos una línea válida con producto y peso neto',
          });
          return;
        }

        const detailsForCebo = transformedDetails.map(({ product, netWeight, price }) => ({
          product,
          netWeight,
          ...(price != null && price !== '' && !Number.isNaN(parseFloat(price)) && { price: parseFloat(price) }),
        }));

        const payload = {
          supplier: { id: data.supplier },
          date: format(data.date, 'yyyy-MM-dd'),
          notes: data.notes || '',
          details: detailsForCebo,
        };
        if (data.exportType === 'a3erp' || data.exportType === 'facilcom') {
          payload.exportType = data.exportType;
        }

        const updated = await ceboDispatchService.update(dispatchId, payload);

        // Actualizar el formulario con la respuesta (el backend puede rellenar precios con el último conocido)
        const nextValues = mapDispatchToFormValues(updated);
        if (nextValues) {
          reset(nextValues);
        }

        notify.success({ title: 'Salida de cebo actualizada correctamente' });

        if (onSuccess) {
          onSuccess(updated);
        }
      } catch (error) {
        const message = error?.message || error?.response?.data?.message || 'No se pudo actualizar la salida de cebo';
        notify.error({ title: 'Error al actualizar la salida de cebo', description: message });
      }
    },
    [dispatchId, onSuccess, reset]
  );

  const handleSaveClick = useCallback(() => {
    handleSubmit(handleUpdate, (submitErrors) => {
      if (submitErrors && Object.keys(submitErrors).length > 0) {
        notify.error({ title: 'Por favor, complete todos los campos requeridos' });
      } else {
        handleUpdate(getValues());
      }
    })();
  }, [handleSubmit, handleUpdate, getValues]);

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
    handleCreate: handleUpdate,
    handleSaveClick,
    productOptions,
    productsLoading,
    supplierOptions,
    suppliersLoading,
    announce,
    Announcer,
    loading,
  };
}
