'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
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

export function useAdminCeboForm({ onSuccess }) {
  const router = useRouter();
  const { productOptions, loading: productsLoading } = useProductOptions();
  const { supplierOptions, loading: suppliersLoading } = useSupplierOptions();
  const { announce, Announcer } = useAccessibilityAnnouncer();

  const [recalcKey, setRecalcKey] = useState(0);

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

  const handleCreate = useCallback(
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

        const transformedDetails = transformDetailsToApiFormat(data.details);

        if (transformedDetails.length === 0) {
          notify.error({
            title: 'Debe completar al menos una línea válida con producto y peso neto',
          });
          return;
        }

        // Cebo: no enviamos lot ni boxes (no se gestionan)
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

        const created = await ceboDispatchService.create(payload);

        notify.success({ title: 'Salida de cebo creada correctamente' });

        if (onSuccess) {
          onSuccess(created);
        } else {
          router.push(`/admin/cebo-dispatches/${created.id}/edit`);
        }
      } catch (error) {
        const message = error?.message || error?.response?.data?.message || 'No se pudo crear la salida de cebo';
        notify.error({ title: 'Error al crear la salida de cebo', description: message });
      }
    },
    [onSuccess, router]
  );

  const handleSaveClick = useCallback(() => {
    handleSubmit(handleCreate, (submitErrors) => {
      if (submitErrors && Object.keys(submitErrors).length > 0) {
        notify.error({ title: 'Por favor, complete todos los campos requeridos' });
      } else {
        handleCreate(getValues());
      }
    })();
  }, [handleSubmit, handleCreate, getValues]);

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
    handleCreate,
    handleSaveClick,
    productOptions,
    productsLoading,
    supplierOptions,
    suppliersLoading,
    announce,
    Announcer,
  };
}
