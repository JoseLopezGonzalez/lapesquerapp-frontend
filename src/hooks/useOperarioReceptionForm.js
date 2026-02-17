'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';import { format } from 'date-fns';
import { createRawMaterialReception } from '@/services/rawMaterialReceptionService';
import { useSupplierOptions } from '@/hooks/useSupplierOptions';
import { speciesService } from '@/services/domain/species/speciesService';
import { productService } from '@/services/domain/products/productService';import { notify } from '@/lib/notifications';
import { calculateNetWeight } from '@/helpers/receptionCalculations';

const CACHE_KEY_LAST_SPECIES = 'operario-reception-last-species';
const CACHE_KEY_PRODUCT_HISTORY = 'operario-reception-product-history';
const MAX_PRODUCT_HISTORY = 100;
const QUICK_PICKS_COUNT = 4;

function getProductHistory(speciesId) {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PRODUCT_HISTORY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return data[String(speciesId)] ?? [];
  } catch {
    return [];
  }
}

export function pushProductToHistory(speciesId, productId) {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PRODUCT_HISTORY);
    const data = raw ? JSON.parse(raw) : {};
    const key = String(speciesId);
    const arr = data[key] ?? [];
    arr.push(String(productId));
    if (arr.length > MAX_PRODUCT_HISTORY) arr.splice(0, arr.length - MAX_PRODUCT_HISTORY);
    data[key] = arr;
    localStorage.setItem(CACHE_KEY_PRODUCT_HISTORY, JSON.stringify(data));
  } catch (_) {}
}

export function getQuickPickProductIds(speciesId, productOptions) {
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

export const STEPS = [
  { id: 0, title: 'Especie', description: 'Seleccione la especie' },
  { id: 1, title: 'Proveedor', description: 'Seleccione el proveedor' },
  { id: 2, title: 'Observaciones', description: 'Observaciones / Lonja (opcional)' },
  { id: 3, title: 'Líneas', description: 'Añada productos, cajas, tara y peso bruto' },
];

export function useOperarioReceptionForm({ onSuccess }) {
  const [step, setStep] = useState(0);
  const [editingLineIndex, setEditingLineIndex] = useState(null);
  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [lineDialogStep, setLineDialogStep] = useState(0);
  const [productStepView, setProductStepView] = useState('quick');
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [speciesLoading, setSpeciesLoading] = useState(true);
  const [productOptionsBySpecies, setProductOptionsBySpecies] = useState([]);
  const [productsBySpeciesLoading, setProductsBySpeciesLoading] = useState(false);

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
        options: groups[letter].sort((a, b) =>
          (a.label || '').localeCompare(b.label || '', 'es')
        ),
      }));
  }, [supplierOptions]);

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
          const cached = localStorage.getItem(CACHE_KEY_LAST_SPECIES);
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
        localStorage.setItem(CACHE_KEY_LAST_SPECIES, String(speciesValue));
      } catch (_) {}
    }
  }, [speciesValue]);

  useEffect(() => {
    if (step !== 3) setEditingLineIndex(null);
  }, [step]);

  useEffect(() => {
    if (!speciesValue) {
      setProductOptionsBySpecies([]);
      return;
    }
    let cancelled = false;
    setProductsBySpeciesLoading(true);
    const speciesId =
      typeof speciesValue === 'object'
        ? speciesValue?.id ?? speciesValue?.value
        : speciesValue;
    productService
      .list({ species: [speciesId] }, { page: 1, perPage: 500 })
      .then((res) => {
        if (cancelled) return;
        const items = res?.data ?? [];
        const opts = items.map((p) => ({
          value: String(p.id),
          label: p.name ?? p.alias ?? String(p.id),
        }));
        setProductOptionsBySpecies(opts);
      })
      .catch(() => {
        if (!cancelled) setProductOptionsBySpecies([]);
      })
      .finally(() => {
        if (!cancelled) setProductsBySpeciesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [speciesValue]);

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
          const net = calculateNetWeight(
            d?.grossWeight,
            d?.boxes ?? 0,
            d?.tare ?? '3'
          );
          return { ...d, _calculatedNet: net };
        })
        .filter((d) => d.product && d._calculatedNet > 0)
        .map((d) => {
          const productId =
            typeof d.product === 'object'
              ? d.product?.id ?? d.product?.value
              : d.product;
          const boxesVal = d.boxes != null && d.boxes !== '' ? parseInt(d.boxes, 10) : 0;
          return {
            product: { id: parseInt(productId) },
            netWeight: parseFloat(d._calculatedNet.toFixed(2)),
            boxes: Number.isNaN(boxesVal) ? 0 : Math.max(0, boxesVal),
          };
        });

      if (validDetails.length === 0) {
        notify.error({
          title: 'Líneas incompletas',
          description: 'Añada al menos una línea con producto, peso bruto y (si aplica) cajas y tara para poder crear la recepción.',
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
        const created = await createRawMaterialReception(payload);
        onSuccess?.(created);
      } catch (err) {
        const message = err?.message || 'No se pudo crear la recepción';
        notify.error({
          title: 'Error al crear la recepción',
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
      notify.error({ title: 'Falta proveedor', description: 'Seleccione un proveedor para continuar.' });
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
        description: 'Añada al menos una línea con producto, peso bruto y (si aplica) cajas y tara para poder crear la recepción.',
      });
      return;
    }
    const someLinesWithoutBoxes = validDetails.some(
      (d) => d.boxes == null || d.boxes === '' || parseInt(d.boxes, 10) === 0
    );
    if (someLinesWithoutBoxes) {
      notify.action(
        {
          title: 'Algunas líneas no tienen cajas',
          description: '¿Desea continuar?',
        },
        {
          title: 'Continuar',
          onClick: () => handleSubmit(handleCreate)(),
        }
      );
      return;
    }
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
    {
      key: 'boxes',
      title: 'Cajas',
      description: 'Número de cajas',
      validate: () => trigger(`details.${formIndex}.boxes`),
    },
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
      {
        key: 'boxes',
        validate: () => trigger(`details.${formIndex}.boxes`),
      },
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
        typeof d.product === 'object'
          ? d.product?.id ?? d.product?.value
          : d.product;
      if (editingLineIndex !== null) {
        handleCloseLineDialog();
      } else {
        if (speciesValue != null && productId != null) {
          pushProductToHistory(speciesValue, productId);
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
