'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { format } from 'date-fns';
import { ceboDispatchService } from '@/services/domain/cebo-dispatches/ceboDispatchService';
import { useSupplierOptions } from '@/hooks/useSupplierOptions';
import { speciesService } from '@/services/domain/species/speciesService';
import { productService } from '@/services/domain/products/productService';
import { notify } from '@/lib/notifications';
import { calculateNetWeight } from '@/helpers/receptionCalculations';

const CACHE_KEY_LAST_SPECIES_CEBO = 'operario-cebo-last-species';
const CACHE_KEY_PRODUCT_HISTORY_CEBO = 'operario-cebo-product-history';
const MAX_PRODUCT_HISTORY = 100;
const QUICK_PICKS_COUNT = 4;
const PRODUCTS_PER_PAGE = 100;

function getProductHistory(speciesId) {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PRODUCT_HISTORY_CEBO);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return data[String(speciesId)] ?? [];
  } catch {
    return [];
  }
}

export function pushProductToHistoryCebo(speciesId, productId) {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PRODUCT_HISTORY_CEBO);
    const data = raw ? JSON.parse(raw) : {};
    const key = String(speciesId);
    const arr = data[key] ?? [];
    arr.push(String(productId));
    if (arr.length > MAX_PRODUCT_HISTORY) arr.splice(0, arr.length - MAX_PRODUCT_HISTORY);
    data[key] = arr;
    localStorage.setItem(CACHE_KEY_PRODUCT_HISTORY_CEBO, JSON.stringify(data));
  } catch (_) {}
}

export function getQuickPickProductIdsCebo(speciesId, productOptions) {
  const history = getProductHistory(speciesId);
  const counts = {};
  for (let i = history.length - 1; i >= 0; i--) {
    const id = history[i];
    counts[id] = (counts[id] ?? 0) + 1;
  }
  const validIds = new Set((productOptions || []).map((o) => String(o.value)));
  return Object.entries(counts)
    .filter(([id]) => validIds.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, QUICK_PICKS_COUNT)
    .map(([id]) => id);
}

function getQuickPickProductIdsUnvalidated(speciesId) {
  const history = getProductHistory(speciesId);
  const counts = {};
  for (let i = history.length - 1; i >= 0; i--) {
    const id = history[i];
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, QUICK_PICKS_COUNT)
    .map(([id]) => id);
}

function extractPagination(res) {
  const meta = res?.meta ?? res ?? {};
  const currentPage = Number(meta.current_page ?? 1) || 1;
  const lastPage = Number(meta.last_page ?? 1) || 1;
  const total = meta.total != null ? Number(meta.total) : null;
  const perPage = meta.per_page != null ? Number(meta.per_page) : null;
  return { currentPage, lastPage, total, perPage };
}

export const STEPS_CEBO = [
  { id: 0, title: 'Especie', description: 'Seleccione la especie' },
  { id: 1, title: 'Proveedor', description: 'Seleccione el proveedor' },
  { id: 2, title: 'Observaciones', description: 'Observaciones / Lonja (opcional)' },
  { id: 3, title: 'Líneas', description: 'Añada productos, tara y peso bruto' },
];

export function useOperarioCeboForm({ onSuccess, initialSupplierId = null }) {
  const [step, setStep] = useState(0);
  const [editingLineIndex, setEditingLineIndex] = useState(null);
  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [lineDialogStep, setLineDialogStep] = useState(0);
  const [productStepView, setProductStepView] = useState('quick');
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [speciesLoading, setSpeciesLoading] = useState(true);
  const [productOptionsBySpecies, setProductOptionsBySpecies] = useState([]);
  const [productsBySpeciesLoading, setProductsBySpeciesLoading] = useState(false);
  const [productsBySpeciesLoadingMore, setProductsBySpeciesLoadingMore] = useState(false);
  const [productsBySpeciesPage, setProductsBySpeciesPage] = useState(1);
  const [productsBySpeciesLastPage, setProductsBySpeciesLastPage] = useState(1);
  const [productsBySpeciesTotal, setProductsBySpeciesTotal] = useState(null);
  const [quickPickOptionsBySpecies, setQuickPickOptionsBySpecies] = useState([]);

  const { supplierOptions, loading: suppliersLoading } = useSupplierOptions();

  const {
    register,
    handleSubmit,
    getValues,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      species: null,
      supplier: null,
      notes: '',
      details: [
        {
          product: null,
          grossWeight: '',
          boxes: 0,
          tare: '3',
          netWeight: '',
        },
      ],
    },
    mode: 'onChange',
  });

  const speciesValue = watch('species');
  const supplierValue = watch('supplier');
  const watchedDetails = watch('details') || [];

  const { fields, append, remove } = useFieldArray({ control, name: 'details' });

  const suppliersByLetter = useMemo(() => {
    const groups = {};
    (supplierOptions || []).forEach((opt) => {
      const letter = (opt.label || '').trim().toUpperCase().charAt(0);
      const key = /[A-ZÁÉÍÓÚÑ]/.test(letter) ? letter : '#';
      if (!groups[key]) groups[key] = [];
      groups[key].push(opt);
    });
    return Object.keys(groups)
      .sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
      .map((letter) => ({
        letter,
        options: groups[letter].sort((a, b) => (a.label || '').localeCompare(b.label || '', 'es')),
      }));
  }, [supplierOptions]);

  const initialSupplierApplied = useRef(false);
  useEffect(() => {
    if (!initialSupplierId || suppliersLoading || initialSupplierApplied.current) return;
    if (!supplierOptions?.length) return;
    const match = supplierOptions.find(
      (opt) => String(opt.value?.id ?? opt.value) === String(initialSupplierId)
    );
    if (match) {
      initialSupplierApplied.current = true;
      setValue('supplier', match.value, { shouldValidate: false });
    }
  }, [initialSupplierId, suppliersLoading, supplierOptions, setValue]);

  useEffect(() => {
    let cancelled = false;
    speciesService
      .getOptions()
      .then((opts) => {
        if (cancelled) return;
        const mapped = (opts || []).map((o) => ({
          value: String(o.value ?? o.id),
          label: o.label ?? o.name ?? String(o.value ?? o.id),
        }));
        setSpeciesOptions(mapped);
        try {
          const cached = localStorage.getItem(CACHE_KEY_LAST_SPECIES_CEBO);
          if (cached && mapped.some((o) => String(o.value) === cached)) {
            setValue('species', cached, { shouldValidate: false });
          }
        } catch (_) {}
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSpeciesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setValue]);

  useEffect(() => {
    if (speciesValue != null) {
      try {
        localStorage.setItem(CACHE_KEY_LAST_SPECIES_CEBO, String(speciesValue));
      } catch (_) {}
    }
  }, [speciesValue]);

  useEffect(() => {
    if (step !== 3) setEditingLineIndex(null);
  }, [step]);

  useEffect(() => {
    if (!speciesValue) {
      setProductOptionsBySpecies([]);
      setQuickPickOptionsBySpecies([]);
      setProductsBySpeciesPage(1);
      setProductsBySpeciesLastPage(1);
      setProductsBySpeciesTotal(null);
      return;
    }
    let cancelled = false;
    setProductsBySpeciesLoading(true);
    setProductsBySpeciesLoadingMore(false);
    const speciesId =
      typeof speciesValue === 'object' ? (speciesValue?.id ?? speciesValue?.value) : speciesValue;
    const loadInitial = async () => {
      try {
        const res = await productService.list(
          { species: [speciesId] },
          { page: 1, perPage: PRODUCTS_PER_PAGE }
        );
        if (cancelled) return;

        const items = Array.isArray(res?.data) ? res.data : [];
        const opts = items.map((p) => ({
          value: String(p.id),
          label: p.name ?? p.alias ?? String(p.id),
        }));
        const { currentPage, lastPage, total } = extractPagination(res);
        setProductsBySpeciesPage(currentPage);
        setProductsBySpeciesLastPage(lastPage);
        setProductsBySpeciesTotal(total);
        setProductOptionsBySpecies(opts);

        const quickPickIds = getQuickPickProductIdsUnvalidated(speciesValue);
        const byId = new Map(opts.map((o) => [String(o.value), o]));
        const missingIds = quickPickIds.filter((id) => !byId.has(String(id)));
        let hydrated = [];
        if (missingIds.length > 0) {
          const resByIds = await productService.list(
            { species: [speciesId], ids: missingIds },
            { page: 1, perPage: missingIds.length }
          );
          if (cancelled) return;
          const itemsByIds = Array.isArray(resByIds?.data) ? resByIds.data : [];
          hydrated = itemsByIds.map((p) => ({
            value: String(p.id),
            label: p.name ?? p.alias ?? String(p.id),
          }));
          hydrated.forEach((o) => byId.set(String(o.value), o));
        }

        if (hydrated.length > 0) {
          setProductOptionsBySpecies((prev) => {
            const base = Array.isArray(prev) && prev.length > 0 ? prev : opts;
            const seen = new Set(base.map((o) => String(o.value)));
            const merged = [...base];
            hydrated.forEach((o) => {
              const k = String(o.value);
              if (!seen.has(k)) {
                seen.add(k);
                merged.push(o);
              }
            });
            return merged;
          });
        }
        const quickPickOpts = quickPickIds.map((id) => byId.get(String(id))).filter(Boolean);
        setQuickPickOptionsBySpecies(quickPickOpts);
      } catch {
        if (!cancelled) {
          setProductOptionsBySpecies([]);
          setQuickPickOptionsBySpecies([]);
          setProductsBySpeciesPage(1);
          setProductsBySpeciesLastPage(1);
          setProductsBySpeciesTotal(null);
        }
      } finally {
        if (!cancelled) setProductsBySpeciesLoading(false);
      }
    };

    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [speciesValue]);

  const canLoadMoreProductsBySpecies =
    !productsBySpeciesLoading &&
    !productsBySpeciesLoadingMore &&
    productsBySpeciesPage < productsBySpeciesLastPage;

  const loadMoreProductsBySpecies = useCallback(async () => {
    if (!speciesValue) return;
    if (!canLoadMoreProductsBySpecies) return;
    setProductsBySpeciesLoadingMore(true);
    const speciesId =
      typeof speciesValue === 'object' ? (speciesValue?.id ?? speciesValue?.value) : speciesValue;
    try {
      const nextPage = productsBySpeciesPage + 1;
      const res = await productService.list(
        { species: [speciesId] },
        { page: nextPage, perPage: PRODUCTS_PER_PAGE }
      );
      const items = Array.isArray(res?.data) ? res.data : [];
      const newOpts = items.map((p) => ({
        value: String(p.id),
        label: p.name ?? p.alias ?? String(p.id),
      }));
      const { currentPage, lastPage, total } = extractPagination(res);
      setProductsBySpeciesPage(currentPage);
      setProductsBySpeciesLastPage(lastPage);
      setProductsBySpeciesTotal(total);
      setProductOptionsBySpecies((prev) => {
        const seen = new Set((prev || []).map((o) => String(o.value)));
        const merged = [...(prev || [])];
        newOpts.forEach((o) => {
          const k = String(o.value);
          if (!seen.has(k)) {
            seen.add(k);
            merged.push(o);
          }
        });
        return merged;
      });
    } finally {
      setProductsBySpeciesLoadingMore(false);
    }
  }, [speciesValue, canLoadMoreProductsBySpecies, productsBySpeciesPage]);

  const handleCreate = useCallback(
    async (data) => {
      const supplierId = data.supplier?.id ?? data.supplier;
      if (!supplierId) {
        notify.error({
          title: 'Falta proveedor',
          description: 'Seleccione un proveedor para continuar.',
        });
        return;
      }

      const validDetails = (data.details || [])
        .map((d) => {
          const net = calculateNetWeight(d?.grossWeight, d?.boxes ?? 0, d?.tare ?? '3');
          return { ...d, _calculatedNet: net };
        })
        .filter((d) => d.product && d._calculatedNet > 0)
        .map((d) => {
          const productId =
            typeof d.product === 'object' ? (d.product?.id ?? d.product?.value) : d.product;
          return {
            product: { id: parseInt(productId) },
            netWeight: parseFloat(d._calculatedNet.toFixed(2)),
          };
        });

      if (validDetails.length === 0) {
        notify.error({
          title: 'Líneas incompletas',
          description:
            'Añada al menos una línea con producto, tara y peso bruto para poder crear la salida de cebo.',
        });
        return;
      }

      const payload = {
        supplier: { id: parseInt(String(supplierId)) },
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: data.notes || '',
        details: validDetails,
      };

      try {
        const created = await ceboDispatchService.create(payload);
        onSuccess?.(created);
      } catch (err) {
        const message = err?.message || 'No se pudo crear la salida de cebo';
        notify.error({
          title: 'Error al crear la salida de cebo',
          description: message,
        });
      }
    },
    [onSuccess]
  );

  const goNext = useCallback(() => {
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    const data = getValues();
    const supplierId = data.supplier?.id ?? data.supplier;
    if (!supplierId) {
      notify.error({
        title: 'Falta proveedor',
        description: 'Seleccione un proveedor para continuar.',
      });
      return;
    }
    const validDetails = (data.details || [])
      .map((d) => {
        const net = calculateNetWeight(d?.grossWeight, d?.boxes ?? 0, d?.tare ?? '3');
        return { ...d, _calculatedNet: net };
      })
      .filter((d) => d.product && d._calculatedNet > 0);
    if (validDetails.length === 0) {
      notify.error({
        title: 'Líneas incompletas',
        description:
          'Añada al menos una línea con producto, tara y peso bruto para poder crear la salida de cebo.',
      });
      return;
    }
    // Cebo operario: no aviso "Algunas líneas no tienen cajas"; envío directo
    handleSubmit(handleCreate)();
  }, [step, getValues, handleSubmit, handleCreate]);

  const goBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const openAddLineDialog = useCallback(() => {
    setEditingLineIndex(null);
    setLineDialogStep(0);
    setLineDialogOpen(true);
  }, []);

  const handleCloseLineDialog = useCallback(() => {
    setLineDialogOpen(false);
    setLineDialogStep(0);
    setProductStepView('quick');
    setEditingLineIndex(null);
  }, []);

  const handleOpenLineDialog = useCallback((forEditIndex = null) => {
    if (forEditIndex !== null) setEditingLineIndex(forEditIndex);
    setLineDialogStep(0);
    setProductStepView('quick');
    setLineDialogOpen(true);
  }, []);

  const formIndex = editingLineIndex !== null ? editingLineIndex : fields.length - 1;

  const LINE_DIALOG_STEPS = [
    {
      key: 'product',
      title: 'Producto',
      description: 'Seleccione el artículo',
      validate: () => trigger(`details.${formIndex}.product`),
    },
    { key: 'boxes', title: 'Cajas', description: 'Número de cajas' },
    { key: 'tare', title: 'Tara', description: 'Peso de cada caja vacía (kg)' },
    {
      key: 'grossWeight',
      title: 'Peso bruto',
      description: 'Peso total en kg',
      validate: () => trigger(`details.${formIndex}.grossWeight`),
    },
  ];

  const handleLineDialogNext = useCallback(async () => {
    const steps = [
      {
        key: 'product',
        validate: () => trigger(`details.${formIndex}.product`),
      },
      { key: 'boxes' },
      { key: 'tare' },
      {
        key: 'grossWeight',
        validate: () => trigger(`details.${formIndex}.grossWeight`),
      },
    ];
    const current = steps[lineDialogStep];
    if (current?.validate) {
      const valid = await current.validate();
      if (!valid) return;
    }
    if (lineDialogStep < steps.length - 1) {
      if (lineDialogStep === 0) setProductStepView('quick');
      if (lineDialogStep === 1) {
        const boxesVal = watchedDetails[formIndex]?.boxes;
        const boxesNum = boxesVal != null && boxesVal !== '' ? parseInt(boxesVal, 10) : 0;
        setLineDialogStep(Number.isNaN(boxesNum) || boxesNum === 0 ? 3 : 2);
      } else {
        setLineDialogStep(lineDialogStep + 1);
      }
    } else {
      const d = watchedDetails[formIndex];
      const net = calculateNetWeight(d?.grossWeight, d?.boxes ?? 0, d?.tare ?? '3');
      if (!d?.product || net <= 0) return;
      const productId =
        typeof d.product === 'object' ? (d.product?.id ?? d.product?.value) : d.product;
      if (editingLineIndex !== null) {
        handleCloseLineDialog();
      } else {
        if (speciesValue != null && productId != null) {
          pushProductToHistoryCebo(speciesValue, productId);
        }
        append({
          product: null,
          grossWeight: '',
          boxes: 0,
          tare: '3',
          netWeight: '',
        });
        handleCloseLineDialog();
      }
    }
  }, [
    lineDialogStep,
    formIndex,
    watchedDetails,
    editingLineIndex,
    speciesValue,
    append,
    handleCloseLineDialog,
    trigger,
  ]);

  return {
    step,
    setStep,
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    errors,
    isSubmitting,
    fields,
    append,
    remove,
    speciesOptions,
    speciesLoading,
    speciesValue,
    supplierOptions,
    suppliersLoading,
    supplierValue,
    suppliersByLetter,
    productOptionsBySpecies,
    productsBySpeciesLoading,
    productsBySpeciesLoadingMore,
    productsBySpeciesPage,
    productsBySpeciesLastPage,
    productsBySpeciesTotal,
    canLoadMoreProductsBySpecies,
    loadMoreProductsBySpecies,
    quickPickOptionsBySpecies,
    editingLineIndex,
    setEditingLineIndex,
    lineDialogOpen,
    lineDialogStep,
    setLineDialogStep,
    productStepView,
    setProductStepView,
    formIndex,
    LINE_DIALOG_STEPS,
    handleCreate,
    goNext,
    goBack,
    openAddLineDialog,
    handleCloseLineDialog,
    handleOpenLineDialog,
    handleLineDialogNext,
    watchedDetails,
  };
}
