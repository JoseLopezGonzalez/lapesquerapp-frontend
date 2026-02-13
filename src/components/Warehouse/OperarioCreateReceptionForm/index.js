"use client";

import React, { useCallback, useState, useEffect, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ArrowRight, ArrowLeft, Loader2, Check, Pencil, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSupplierOptions } from "@/hooks/useSupplierOptions";
import { speciesService } from "@/services/domain/species/speciesService";
import { productService } from "@/services/domain/products/productService";
import Loader from "@/components/Utilities/Loader";
import { getToastTheme } from "@/customs/reactHotToast";
import toast from "react-hot-toast";
import { createRawMaterialReception } from "@/services/rawMaterialReceptionService";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { calculateNetWeight } from "@/helpers/receptionCalculations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const TARE_OPTIONS = [
  { value: "1", label: "1 kg" },
  { value: "2", label: "2 kg" },
  { value: "3", label: "3 kg" },
  { value: "4", label: "4 kg" },
  { value: "5", label: "5 kg" },
];

const CACHE_KEY_LAST_SPECIES = "operario-reception-last-species";
const CACHE_KEY_PRODUCT_HISTORY = "operario-reception-product-history";
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

function pushProductToHistory(speciesId, productId) {
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

function getQuickPickProductIds(speciesId, productOptions) {
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

const STEPS = [
  { id: 0, title: "Especie", description: "Seleccione la especie" },
  { id: 1, title: "Proveedor", description: "Seleccione el proveedor" },
  { id: 2, title: "Observaciones", description: "Observaciones / Lonja (opcional)" },
  { id: 3, title: "Líneas", description: "Añada productos, cajas, tara y peso bruto" },
];

/**
 * Formulario stepper para creación de recepción (rol operario).
 * Paso 0: Especie → Paso 1: Proveedor → Paso 2: Observaciones → Paso 3: Líneas.
 * La fecha se envía siempre como el día actual.
 * UI táctil con shadcn nativo.
 */
export default function OperarioCreateReceptionForm({ onSuccess, onCancel, storeId = null }) {
  const [step, setStep] = useState(0);
  const [editingLineIndex, setEditingLineIndex] = useState(null);
  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [lineDialogStep, setLineDialogStep] = useState(0);
  const [productStepView, setProductStepView] = useState("quick"); // 'quick' | 'search'
  const { supplierOptions, loading: suppliersLoading } = useSupplierOptions();
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [speciesLoading, setSpeciesLoading] = useState(true);
  const [productOptionsBySpecies, setProductOptionsBySpecies] = useState([]);
  const [productsBySpeciesLoading, setProductsBySpeciesLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      species: null,
      supplier: null,
      notes: "",
      details: [
        {
          product: null,
          grossWeight: "",
          boxes: 1,
          tare: "3",
          netWeight: "",
        },
      ],
    },
    mode: "onChange",
  });

  const speciesValue = watch("species");
  const supplierValue = watch("supplier");
  const watchedDetails = watch("details") || [];

  const { fields, append, remove } = useFieldArray({ control, name: "details" });

  const suppliersByLetter = useMemo(() => {
    const groups = {};
    (supplierOptions || []).forEach((opt) => {
      const letter = (opt.label || "").trim().toUpperCase().charAt(0);
      const key = /[A-ZÁÉÍÓÚÑ]/.test(letter) ? letter : "#";
      if (!groups[key]) groups[key] = [];
      groups[key].push(opt);
    });
    return Object.keys(groups)
      .sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)))
      .map((letter) => ({
        letter,
        options: groups[letter].sort((a, b) =>
          (a.label || "").localeCompare(b.label || "", "es")
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
            setValue("species", cached, { shouldValidate: false });
          }
        } catch (_) {}
      })
      .catch((err) => {
        if (!cancelled) console.error("Error cargando especies:", err);
      })
      .finally(() => {
        if (!cancelled) setSpeciesLoading(false);
      });
    return () => { cancelled = true; };
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
    if (step === 0 && speciesValue != null && !speciesLoading) {
      const id = `species-opt-${speciesValue}`;
      const scrollToSelected = () => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      };
      const t = setTimeout(scrollToSelected, 50);
      return () => clearTimeout(t);
    }
  }, [step, speciesValue, speciesLoading]);

  useEffect(() => {
    if (!speciesValue) {
      setProductOptionsBySpecies([]);
      return;
    }
    let cancelled = false;
    setProductsBySpeciesLoading(true);
    const speciesId = typeof speciesValue === "object" ? speciesValue?.id ?? speciesValue?.value : speciesValue;
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
      .catch((err) => {
        if (!cancelled) {
          console.error("Error cargando productos por especie:", err);
          setProductOptionsBySpecies([]);
        }
      })
      .finally(() => {
        if (!cancelled) setProductsBySpeciesLoading(false);
      });
    return () => { cancelled = true; };
  }, [speciesValue]);

  const handleCreate = useCallback(
    async (data) => {
      const supplierId = data.supplier?.id ?? data.supplier;
      if (!supplierId) {
        toast.error("Seleccione un proveedor", getToastTheme());
        return;
      }

      const validDetails = (data.details || [])
        .map((d) => {
          const net = calculateNetWeight(
            d?.grossWeight,
            d?.boxes ?? 1,
            d?.tare ?? "3"
          );
          return { ...d, _calculatedNet: net };
        })
        .filter((d) => d.product && d._calculatedNet > 0)
        .map((d) => {
          const productId =
            typeof d.product === "object"
              ? d.product?.id ?? d.product?.value
              : d.product;
          return {
            product: { id: parseInt(productId) },
            netWeight: parseFloat(d._calculatedNet.toFixed(2)),
            boxes: d.boxes ? parseInt(d.boxes) : undefined,
          };
        });

      if (validDetails.length === 0) {
        toast.error(
          "Complete al menos una línea con producto, peso bruto, cajas y tara",
          getToastTheme()
        );
        return;
      }

      const payload = {
        supplier: { id: parseInt(String(supplierId)) },
        date: format(new Date(), "yyyy-MM-dd"),
        notes: data.notes || "",
        details: validDetails,
      };

      try {
        const created = await createRawMaterialReception(payload);
        toast.success("Recepción creada correctamente", getToastTheme());
        onSuccess?.(created);
      } catch (err) {
        console.error("Error al crear recepción:", err);
        toast.error(err?.message || "No se pudo crear la recepción", getToastTheme());
      }
    },
    [onSuccess]
  );

  const goNext = () => {
    if (step < 3) setStep((s) => s + 1);
    else handleSubmit(handleCreate)();
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const openAddLineDialog = () => {
    setEditingLineIndex(null);
    setLineDialogStep(0);
    setLineDialogOpen(true);
  };

  if (speciesLoading || suppliersLoading) {
    return (
      <div className="w-full flex justify-center py-12">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* Timeline - arriba */}
      <div className="shrink-0 flex flex-col items-center gap-3 pb-4">
        <h2 className="text-lg font-semibold">Nueva recepción de materia prima</h2>
        <div className="flex items-center gap-2 w-full max-w-[420px]">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  "flex items-center justify-center min-w-[2.5rem] h-10 rounded-full text-sm font-medium transition-colors touch-manipulation",
                  step === i
                    ? "bg-primary text-primary-foreground"
                    : step > i
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
                aria-label={`Paso ${i + 1}: ${s.title}`}
              >
                {step > i ? <Check className="h-4 w-4" /> : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 rounded-full min-w-[1rem]",
                    step > i ? "bg-primary/30" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
        {step === 3 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[44px] touch-manipulation"
            onClick={openAddLineDialog}
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir línea
          </Button>
        )}
      </div>

      {/* Contenido - medio, scrollable */}
      <form
        onSubmit={handleSubmit(handleCreate)}
        className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto"
      >
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-6 w-full flex-1 min-h-0",
            step === 3 ? "max-w-[min(1400px,95vw)] mx-auto" : "max-w-[420px] mx-auto"
          )}
        >
        {/* Paso 0: Especie - lista scrollable */}
        {step === 0 && (
          <div
            className="w-full max-w-[420px] h-[min(480px,72vh)] rounded-lg border overflow-y-auto overflow-x-hidden"
            style={{ minHeight: 0 }}
          >
            <div className="flex flex-col gap-2 p-3 pr-4">
                  {speciesLoading ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
                  ) : (
                    speciesOptions.map((opt, idx) => {
                      const isSelected =
                        speciesValue != null && String(opt.value) === String(speciesValue);
                      return (
                        <button
                          id={isSelected ? `species-opt-${opt.value}` : undefined}
                          key={opt.value ?? idx}
                          type="button"
                          onClick={() =>
                            setValue("species", isSelected ? null : opt.value, {
                              shouldValidate: true,
                            })
                          }
                          className={cn(
                            "w-full text-left rounded-lg border-2 px-4 py-3 transition-colors touch-manipulation min-h-[56px] flex flex-col justify-center gap-0.5",
                            isSelected
                              ? "border-primary border-l-4 bg-primary/5"
                              : "border-border hover:border-primary/40 hover:bg-muted/50"
                          )}
                        >
                          <span className="font-medium text-foreground">{opt.label}</span>
                        </button>
                      );
                    })
                  )}
                </div>
          </div>
        )}

        {/* Paso 1: Proveedor - lista scrollable */}
        {step === 1 && (
          <div
            className="w-full max-w-[420px] h-[min(480px,72vh)] rounded-lg border overflow-y-auto overflow-x-hidden"
            style={{ minHeight: 0 }}
          >
            <div className="flex flex-col gap-2 p-3 pr-4">
                  {suppliersLoading ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
                  ) : (
                    suppliersByLetter.map(({ letter, options }) => (
                      <div key={letter} className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-2 first:pt-0">
                          {letter}
                        </p>
                        {options.map((opt, idx) => {
                          const optVal = opt.value;
                          const isSelected =
                            supplierValue != null &&
                            (typeof optVal === "object"
                              ? optVal?.id === supplierValue?.id || optVal?.value === supplierValue
                              : String(optVal) === String(supplierValue));
                          return (
                            <button
                              key={optVal?.id ?? optVal ?? idx}
                              type="button"
                              onClick={() =>
                                setValue("supplier", isSelected ? null : opt.value, {
                                  shouldValidate: true,
                                })
                              }
                              className={cn(
                                "w-full text-left rounded-lg border-2 px-4 py-3 transition-colors touch-manipulation min-h-[56px] flex flex-col justify-center gap-0.5",
                                isSelected
                                  ? "border-primary border-l-4 bg-primary/5"
                                  : "border-border hover:border-primary/40 hover:bg-muted/50"
                              )}
                            >
                              <span className="font-medium text-foreground">{opt.label}</span>
                              {opt.secondaryLabel && (
                                <span className="text-sm text-muted-foreground">
                                  {opt.secondaryLabel}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
          </div>
        )}

        {/* Paso 2: Observaciones */}
        {step === 2 && (
          <div className="w-full max-w-[420px]">
            <Textarea
              {...register("notes")}
              placeholder="Observaciones / Lonja (opcional)..."
              className="w-full min-h-[120px] touch-manipulation text-base"
            />
          </div>
        )}

        {/* Paso 3: Líneas */}
        {step === 3 && (() => {
          const formIndex = editingLineIndex !== null ? editingLineIndex : fields.length - 1;
          const confirmedLines = watchedDetails
            .map((d, i) => ({ d, i }))
            .filter(
              ({ d, i }) =>
                i !== formIndex &&
                d?.product &&
                (parseFloat(d?.grossWeight) || 0) > 0 &&
                calculateNetWeight(d?.grossWeight, d?.boxes ?? 1, d?.tare ?? "3") > 0
            );
          const getProductLabel = (val) => {
            if (val == null) return "-";
            const id = typeof val === "object" ? val?.id ?? val?.value : val;
            const opt = (productOptionsBySpecies || []).find(
              (o) => String(o.value) === String(id)
            );
            return opt?.label ?? String(id);
          };
          const getTareLabel = (val) =>
            TARE_OPTIONS.find((o) => o.value === val)?.label ?? val ?? "-";

          const handleCloseLineDialog = () => {
            setLineDialogOpen(false);
            setLineDialogStep(0);
            setProductStepView("quick");
            setEditingLineIndex(null);
          };

          const handleOpenLineDialog = (forEditIndex = null) => {
            if (forEditIndex !== null) setEditingLineIndex(forEditIndex);
            setLineDialogStep(0);
            setProductStepView("quick");
            setLineDialogOpen(true);
          };

          const LINE_DIALOG_STEPS = [
            { key: "product", title: "Producto", description: "Seleccione el artículo", validate: () => trigger(`details.${formIndex}.product`) },
            { key: "boxes", title: "Cajas", description: "Número de cajas", validate: () => trigger(`details.${formIndex}.boxes`) },
            { key: "tare", title: "Tara", description: "Peso de cada caja vacía (kg)" },
            { key: "grossWeight", title: "Peso bruto", description: "Peso total en kg", validate: () => trigger(`details.${formIndex}.grossWeight`) },
          ];

          const handleLineDialogNext = async () => {
            const current = LINE_DIALOG_STEPS[lineDialogStep];
            if (current?.validate) {
              const valid = await current.validate();
              if (!valid) return;
            }
            if (lineDialogStep < LINE_DIALOG_STEPS.length - 1) {
              if (lineDialogStep === 0) setProductStepView("quick");
              setLineDialogStep(lineDialogStep + 1);
            } else {
              const d = watchedDetails[formIndex];
              const net = calculateNetWeight(d?.grossWeight, d?.boxes ?? 1, d?.tare ?? "3");
              if (!d?.product || net <= 0) return;
              const productId = typeof d.product === "object" ? d.product?.id ?? d.product?.value : d.product;
              if (editingLineIndex !== null) {
                handleCloseLineDialog();
              } else {
                if (speciesValue != null && productId != null) {
                  pushProductToHistory(speciesValue, productId);
                }
                append({ product: null, grossWeight: "", boxes: 1, tare: "3", netWeight: "" });
                handleCloseLineDialog();
              }
            }
          };

          return (
            <div className="w-full space-y-6">
              {/* Tabla de líneas ya creadas */}
              {confirmedLines.length > 0 && (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Artículo</TableHead>
                        <TableHead className="w-20 whitespace-nowrap">Cajas</TableHead>
                        <TableHead className="w-24 whitespace-nowrap">Tara</TableHead>
                        <TableHead className="w-28 text-right whitespace-nowrap">Peso bruto (kg)</TableHead>
                        <TableHead className="w-20 whitespace-nowrap" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {confirmedLines.map(({ d, i }) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">
                              {getProductLabel(d?.product)}
                            </TableCell>
                            <TableCell>{d?.boxes ?? 1}</TableCell>
                            <TableCell>{getTareLabel(d?.tare)}</TableCell>
                            <TableCell className="text-right">
                              {parseFloat(d?.grossWeight) > 0
                                ? parseFloat(d.grossWeight).toFixed(2)
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 touch-manipulation"
                                  onClick={() => handleOpenLineDialog(i)}
                                  aria-label="Editar línea"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-destructive touch-manipulation"
                                  onClick={() => {
                                    remove(i);
                                    if (
                                      editingLineIndex !== null &&
                                      i < editingLineIndex
                                    )
                                      setEditingLineIndex(editingLineIndex - 1);
                                  }}
                                  aria-label="Quitar línea"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Dialog de edición/creación de línea - por pasos */}
              <Dialog open={lineDialogOpen} onOpenChange={(open) => !open && handleCloseLineDialog()}>
                <DialogContent className="sm:max-w-md flex flex-col gap-4 min-h-[420px]" hideClose>
                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-semibold">
                      {LINE_DIALOG_STEPS[lineDialogStep]?.title ?? "Línea"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {LINE_DIALOG_STEPS[lineDialogStep]?.description ?? ""}
                    </p>
                  </div>
                  <div className="min-h-[220px] py-4 flex flex-col items-center justify-center w-full flex-1">
                    {lineDialogStep === 0 && (
                      <Controller
                        name={`details.${formIndex}.product`}
                        control={control}
                        rules={{ required: "Seleccione producto" }}
                        render={({ field: { onChange, value } }) => {
                          const productValue = typeof value === "object" ? value?.id ?? value?.value : value;
                          const quickPickIds = getQuickPickProductIds(speciesValue, productOptionsBySpecies);
                          const quickPickOpts = quickPickIds
                            .map((id) => productOptionsBySpecies?.find((o) => String(o.value) === id))
                            .filter(Boolean);

                          if (productStepView === "search") {
                            return (
                              <div className="w-full flex flex-col gap-2 flex-1 min-h-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="self-start -ml-1 touch-manipulation"
                                  onClick={() => setProductStepView("quick")}
                                >
                                  <ArrowLeft className="h-4 w-4 mr-1" />
                                  Volver
                                </Button>
                                <div
                                  className="flex-1 min-h-[200px] max-h-[min(320px,50vh)] rounded-lg border overflow-y-auto overflow-x-hidden"
                                  style={{ minHeight: 0 }}
                                >
                                  <div className="flex flex-col gap-2 p-3 pr-4">
                                    {productsBySpeciesLoading ? (
                                      <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
                                    ) : (productOptionsBySpecies || []).length === 0 ? (
                                      <p className="py-6 text-center text-sm text-muted-foreground">Sin productos</p>
                                    ) : (
                                      (productOptionsBySpecies || []).map((opt, idx) => {
                                        const isSelected = productValue != null && String(opt.value) === String(productValue);
                                        return (
                                          <button
                                            key={opt.value ?? idx}
                                            type="button"
                                            onClick={() => onChange(opt.value)}
                                            className={cn(
                                              "w-full text-left rounded-lg border-2 px-4 py-3 transition-colors touch-manipulation min-h-[56px] flex flex-col justify-center",
                                              isSelected
                                                ? "border-primary border-l-4 bg-primary/5"
                                                : "border-border hover:border-primary/40 hover:bg-muted/50"
                                            )}
                                          >
                                            <span className="font-medium text-foreground">{opt.label}</span>
                                          </button>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="w-full space-y-3">
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full min-h-[44px] touch-manipulation"
                                onClick={() => setProductStepView("search")}
                              >
                                <Search className="h-4 w-4 mr-2" />
                                Buscar más
                              </Button>
                              <div className="flex flex-col gap-2">
                                {quickPickOpts.map((opt) => {
                                  const isSelected = productValue != null && String(opt.value) === String(productValue);
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => onChange(opt.value)}
                                      className={cn(
                                        "w-full text-left rounded-lg border-2 px-4 py-3 transition-colors touch-manipulation min-h-[52px] flex items-center",
                                        isSelected
                                          ? "border-primary border-l-4 bg-primary/5"
                                          : "border-border hover:border-primary/40 hover:bg-muted/50"
                                      )}
                                    >
                                      <span className="font-medium text-foreground">{opt.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              {errors.details?.[formIndex]?.product && (
                                <p className="text-xs text-destructive text-center">
                                  {errors.details[formIndex].product.message}
                                </p>
                              )}
                            </div>
                          );
                        }}
                      />
                    )}
                    {lineDialogStep === 1 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="h-14 w-14 p-0 touch-manipulation rounded-full"
                          onClick={() => {
                            const v = parseInt(watch(`details.${formIndex}.boxes`), 10) || 1;
                            if (v > 1) setValue(`details.${formIndex}.boxes`, v - 1);
                          }}
                        >
                          -
                        </Button>
                        <Controller
                          name={`details.${formIndex}.boxes`}
                          control={control}
                          rules={{ required: "Obligatorio", min: { value: 1, message: "Mín. 1" } }}
                          render={({ field }) => (
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              value={field.value ?? 1}
                              className="w-24 text-center min-h-[56px] text-xl touch-manipulation"
                            />
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="h-14 w-14 p-0 touch-manipulation rounded-full"
                          onClick={() => {
                            const v = parseInt(watch(`details.${formIndex}.boxes`), 10) || 1;
                            setValue(`details.${formIndex}.boxes`, v + 1);
                          }}
                        >
                          +
                        </Button>
                        </div>
                        {errors.details?.[formIndex]?.boxes && (
                          <p className="text-xs text-destructive text-center">
                            {errors.details[formIndex].boxes.message}
                          </p>
                        )}
                      </div>
                    )}
                    {lineDialogStep === 2 && (
                      <div className="w-full max-w-[320px]">
                        <Controller
                          name={`details.${formIndex}.tare`}
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="min-h-[44px] touch-manipulation w-full">
                                <SelectValue placeholder="Seleccione tara" />
                              </SelectTrigger>
                              <SelectContent>
                                {TARE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    )}
                    {lineDialogStep === 3 && (
                      <div className="w-full max-w-[320px]">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Peso bruto (kg)"
                          {...register(`details.${formIndex}.grossWeight`, {
                            required: "Obligatorio",
                            min: { value: 0.01, message: "Mín. 0.01" },
                          })}
                          className="text-right min-h-[44px] touch-manipulation w-full text-lg"
                        />
                        {errors.details?.[formIndex]?.grossWeight && (
                          <p className="text-xs text-destructive mt-1">
                            {errors.details[formIndex].grossWeight.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 w-full pt-2">
                    {lineDialogStep > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-[40px] flex-1 touch-manipulation text-sm"
                        onClick={() => {
                          if (lineDialogStep === 1) setProductStepView("quick");
                          setLineDialogStep(lineDialogStep - 1);
                        }}
                      >
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Anterior
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-[40px] flex-1 touch-manipulation text-sm"
                        onClick={handleCloseLineDialog}
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-[40px] flex-1 touch-manipulation text-sm"
                      onClick={handleLineDialogNext}
                    >
                      {lineDialogStep < LINE_DIALOG_STEPS.length - 1 ? (
                        <>
                          Siguiente
                          <ArrowRight className="h-4 w-4 ml-1.5" />
                        </>
                      ) : editingLineIndex !== null ? (
                        "Guardar"
                      ) : (
                        "Añadir"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          );
        })()}

        </div>
      </form>

      {/* Botones - abajo */}
      <div className="shrink-0 flex gap-2 pt-4 w-full justify-center">
        <div className="flex gap-2 w-full max-w-[420px]">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goBack}
              className="min-h-[40px] flex-1 touch-manipulation text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Anterior
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          <Button
            type="button"
            size="sm"
            onClick={goNext}
            disabled={(step === 0 && !speciesValue) || (step === 1 && !supplierValue)}
            className="min-h-[40px] flex-1 touch-manipulation text-sm"
          >
            {step < 3 ? (
              <>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Guardando
              </>
            ) : (
              <>
                Crear recepción
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
