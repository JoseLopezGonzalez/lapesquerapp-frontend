// useLabelEditor.ts
import { createLabel, deleteLabel, updateLabel } from "@/services/labelService";
import { useSession } from "next-auth/react";
import { useState, useRef, useCallback, useEffect, useMemo, type RefObject, type Dispatch, type SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getLabelsQueryKey } from "@/hooks/useLabels";
import toast from "react-hot-toast";
import { getToastTheme } from "@/customs/reactHotToast";
import { usePrintElement } from "@/hooks/usePrintElement";
import { formatDecimal, parseEuropeanNumber } from "@/helpers/formats/numbers/formatNumbers";
import { formatDate, addDays, parseDate } from "@/hooks/useLabel";
import {
    KEY_FIELD_TYPES,
    validateLabelName,
    hasDuplicateFieldKeys,
    hasElementValidationError,
    getElementValidationErrorReason,
    hasAnyElementValidationErrors,
} from "@/hooks/labelEditorValidation";
import type { Label, LabelDraft, LabelElement, LabelElementType, LabelFieldOption, DataContext, LabelFieldsMap, LabelFormat } from "@/types/labelEditor";

/** Return type of useLabelEditor hook */
export interface UseLabelEditorReturn {
    elements: LabelElement[];
    selectedElement: string | null;
    selectedElementData: LabelElement | null;
    zoom: number;
    canvasRef: RefObject<HTMLDivElement | null>;
    addElement: (type: LabelElementType) => void;
    deleteElement: (id: string) => void;
    updateElement: (id: string, updates: Partial<LabelElement>) => void;
    setZoom: Dispatch<SetStateAction<number>>;
    handleMouseDown: (e: React.MouseEvent, elementId: string) => void;
    handleResizeMouseDown: (e: React.MouseEvent, elementId: string, corner: string) => void;
    duplicateElement: (id: string) => void;
    exportJSON: (name?: string) => void;
    getFieldValue: (field: string) => string;
    canvasWidth: number;
    canvasHeight: number;
    canvasRotation: number;
    setCanvasWidth: Dispatch<SetStateAction<number>>;
    setCanvasHeight: Dispatch<SetStateAction<number>>;
    rotateCanvas: () => void;
    selectedLabel: Label | LabelDraft | null;
    labelName: string;
    setLabelName: Dispatch<SetStateAction<string>>;
    labelId: string | null;
    openSelector: boolean;
    setOpenSelector: Dispatch<SetStateAction<boolean>>;
    showManualDialog: boolean;
    setShowManualDialog: Dispatch<SetStateAction<boolean>>;
    manualForm: Record<string, string>;
    setManualForm: Dispatch<SetStateAction<Record<string, string>>>;
    fileInputRef: RefObject<HTMLInputElement | null>;
    handleOnClickSave: () => void;
    handlePrint: () => void;
    handleConfirmManual: () => void;
    handleImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSelectLabel: (label: Label) => void;
    handleCreateNewLabel: () => void;
    handleElementRotationChange: (id: string, angle: number) => void;
    handleSelectElementCard: (elementId: string | null) => void;
    handleDeleteLabel: () => void;
    getDefaultValuesFromElements: () => Record<string, string>;
    fieldOptions: LabelFieldOption[];
    allFieldOptions: LabelFieldOption[];
    getFieldName: (field: string) => string;
    isSaving: boolean;
    clearEditor: () => void;
    fieldExampleValues: Record<string, string>;
    setFieldExampleValues: Dispatch<SetStateAction<Record<string, string>>>;
    showFieldExamplesDialog: boolean;
    setShowFieldExamplesDialog: Dispatch<SetStateAction<boolean>>;
    autoFitToContent: (elementId: string) => void;
    hasElementValidationError: (element: LabelElement) => boolean;
    getElementValidationErrorReason: (element: LabelElement) => string | null;
}

export const labelFields: LabelFieldsMap = {
    "product.name": { label: "Nombre del Producto", defaultValue: "Pulpo Fresco" },
    "product.species.name": { label: "Especie", defaultValue: "Octopus vulgaris" },
    "product.species.faoCode": { label: "Codigo FAO", defaultValue: "OCC" },
    "product.species.scientificName": { label: "Nombre Cientifico", defaultValue: "Octopus vulgaris" },
    "product.species.fishingGear.name": { label: "Arte de Pesca", defaultValue: "Nasas y trampas" },
    "product.captureZone.name": { label: "Zona de Captura", defaultValue: "FAO 27 IX.a Atlántico Nordeste" },
    "product.boxGtin": { label: "GTIN del Producto", defaultValue: "98436613931182" },
    "netWeight": { label: "Peso Neto", defaultValue: "20,000 kg" },
    "lot": { label: "Lote", defaultValue: "120225OCC01001" },
};

const defaultDataContext: DataContext = Object.entries(labelFields).reduce<DataContext>((acc, [path, { defaultValue }]) => {
    const keys = path.split(".");
    let ref = acc as Record<string, unknown>;
    keys.forEach((key, i) => {
        if (i === keys.length - 1) {
            ref[key] = defaultValue;
        } else {
            ref[key] = ref[key] || {};
            ref = ref[key] as Record<string, unknown>;
        }
    });
    return acc;
}, {} as DataContext);

const fieldOptions: LabelFieldOption[] = Object.entries(labelFields).map(([value, { label }]) => ({
    value,
    label,
}));

const getFieldName = (field: string): string => labelFields[field]?.label ?? field;

const pxToMm = (px: number): number => px / 3.78;

/** Escapa caracteres especiales para usar en RegExp. */
const escapeRegex = (str: string): string => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Reemplaza el token {{oldKey}} por {{newKey}} en content (todas las ocurrencias). */
const replacePlaceholderInContent = (content: string | null | undefined, oldKey: string, newKey: string): string => {
    if (content == null || content === '' || !oldKey || !newKey || oldKey === newKey) return content ?? '';
    const token = new RegExp(`\\{\\{${escapeRegex(oldKey)}\\}\\}`, 'g');
    return String(content).replace(token, `{{${newKey}}}`);
};

/** Misma normalización que el panel "Nombre del campo": solo [a-zA-Z0-9 ], primera letra mayúscula. */
const normalizeKeyForStorage = (raw: string): string => {
    const filtered = String(raw || '').replace(/[^a-zA-Z0-9 ]/g, '');
    const i = filtered.search(/[a-zA-Z]/);
    if (i < 0) return filtered;
    return filtered.slice(0, i) + filtered[i].toUpperCase() + filtered.slice(i + 1);
};

// Valor por defecto de netWeight para usar cuando no hay valor disponible
const NET_WEIGHT_DEFAULT = "20,000 kg";

// Función para formatear netWeight según el tipo de campo
const formatNetWeightField = (value: string | number, fieldName: string): string | number => {
    if (!value) return value;
    
    // Parsear el valor (puede venir como "20,000 kg" o como número)
    let numValue = typeof value === 'string' 
        ? parseEuropeanNumber(value.replace(/kg/gi, '').trim()) 
        : Number(value) || 0;
    
    if (fieldName === 'netWeightFormatted') {
        // Formato decimal con separadores (ej: 1.234,56)
        return formatDecimal(numValue);
    } else if (fieldName === 'netWeight6digits') {
        // Redondear a 2 decimales y multiplicar por 100 para obtener un entero de 6 dígitos
        // Ejemplo: 20,00 kg → 2000 → 002000
        const roundedValue = Math.round(numValue * 100) / 100; // Redondear a 2 decimales
        const integerValue = Math.round(roundedValue * 100); // Multiplicar por 100 para obtener entero
        return String(integerValue).padStart(6, '0');
    }
    
    // Para netWeight sin formato, devolver valor original
    return value;
};

/**
 * Normaliza un elemento para asegurar que todas las propiedades de formato
 * tengan valores explícitos y canónicos (nunca undefined, nunca números, nunca strings mixtos)
 * 
 * Regla de oro: La UI no interpreta estado, solo lo refleja.
 */
const normalizeElement = (element: LabelElement | null | undefined): LabelElement | null | undefined => {
    if (!element) return element;
    
    // Normalizar fontWeight: "bold" | "normal" (nunca números ni undefined)
    let fontWeight = element.fontWeight;
    if (fontWeight === 700 || fontWeight === "700") {
        fontWeight = "bold";
    } else if (!fontWeight || fontWeight === "normal") {
        fontWeight = "normal";
    }
    
    // Normalizar fontStyle: "italic" | "normal" (nunca undefined)
    let fontStyle = element.fontStyle || "normal";
    if (fontStyle === "oblique") {
        fontStyle = "italic"; // Tratar oblique como italic
    }
    
    // Normalizar textDecoration: "none" | "underline" | "line-through" (nunca undefined)
    let textDecoration = element.textDecoration || "none";
    
    // Normalizar textTransform: "none" | "uppercase" | "lowercase" | "capitalize" (nunca undefined)
    let textTransform = element.textTransform || "none";
    
    // Normalizar horizontalAlign: convertir textAlign legacy a horizontalAlign si es necesario
    let horizontalAlign = element.horizontalAlign;
    if (!horizontalAlign && element.textAlign) {
        // Migración legacy: textAlign -> horizontalAlign
        horizontalAlign = element.textAlign;
    }
    // Asegurar valores válidos
    if (!horizontalAlign || !["left", "center", "right", "justify"].includes(String(horizontalAlign))) {
        horizontalAlign = "left";
    } else {
        horizontalAlign = String(horizontalAlign) as "left" | "center" | "right" | "justify";
    }
    
    // Normalizar verticalAlign: "start" | "end" | "center" (nunca undefined)
    let verticalAlign = element.verticalAlign || "start";
    if (!["start", "end", "center"].includes(String(verticalAlign))) {
        verticalAlign = "start";
    } else {
        verticalAlign = String(verticalAlign) as "start" | "end" | "center";
    }
    
    // Normalizar direction para líneas: "horizontal" | "vertical" (nunca undefined)
    let direction = element.direction;
    if (element.type === "line") {
        direction = direction || "horizontal";
        if (!["horizontal", "vertical"].includes(String(direction))) {
            direction = "horizontal";
        } else {
            direction = String(direction) as "horizontal" | "vertical";
        }
    }
    
    // Normalizar strokeWidth para líneas (siempre número positivo)
    let strokeWidth = element.strokeWidth;
    if (element.type === "line") {
        strokeWidth = typeof strokeWidth === "number" && strokeWidth > 0 ? strokeWidth : 0.1;
    }
    
    const normalized: LabelElement = {
        ...element,
        fontWeight,
        fontStyle,
        textDecoration,
        textTransform,
        horizontalAlign,
        verticalAlign,
        // Mantener textAlign para compatibilidad, pero no usarlo en la UI
        textAlign: horizontalAlign, // Sincronizar con horizontalAlign
    };
    
    // Añadir propiedades específicas de línea si es necesario
    if (element.type === "line") {
        const lineProps = normalized as LabelElement & { direction?: string; strokeWidth?: number };
        lineProps.direction = direction as string;
        lineProps.strokeWidth = strokeWidth as number;
    }
    
    return normalized;
};

/**
 * Normaliza un array de elementos
 */
const normalizeElements = (elements: unknown): LabelElement[] => {
    if (!Array.isArray(elements)) return [];
    return elements.map(normalizeElement).filter((el): el is LabelElement => el != null);
};

/** Calcula la fecha de vista previa para un dateField (system con offset opcional, fieldOffset). Evita referencias circulares. */
function getDateFieldPreviewValue(
    el: LabelElement | null | undefined,
    elementsList: LabelElement[],
    visited: Set<string> = new Set(),
    valuesCache: Record<string, string> | null = null
): string {
    if (!el || el.type !== 'dateField' || !el.key) return '';
    const key = String(el.key);
    if (visited.has(key)) return '';
    if (valuesCache && valuesCache[key] !== undefined) return valuesCache[key];
    const mode = el.dateMode || 'system';
    if (mode === 'manual') {
        const v = String(el.sample ?? '');
        if (valuesCache) valuesCache[key] = v;
        return v;
    }
    visited.add(key);
    const today = new Date();
    if (mode === 'system' || mode === 'systemOffset') {
        const v = formatDate(addDays(today, el.systemOffsetDays ?? 0));
        if (valuesCache) valuesCache[key] = v;
        return v;
    }
    if (mode === 'fieldOffset' && el.fieldRef) {
        const refKey = String(el.fieldRef).trim();
        const refEl = elementsList.find((e) => e.type === 'dateField' && String(e.key || '').trim() === refKey);
        const refKeyCache = refEl ? String(refEl.key ?? '') : '';
        let refStr = (valuesCache && refKeyCache && valuesCache[refKeyCache] !== undefined) ? valuesCache[refKeyCache] : (refEl ? getDateFieldPreviewValue(refEl, elementsList, visited, valuesCache) : '');
        if (!refStr && refEl?.dateMode === 'manual') refStr = formatDate(today);
        const refDate = parseDate(refStr);
        const v = refDate ? formatDate(addDays(refDate, el.fieldOffsetDays ?? 0)) : (refStr || '');
        if (valuesCache) valuesCache[key] = v;
        return v;
    }
    if (valuesCache) valuesCache[key] = '';
    return '';
}

export function useLabelEditor(dataContext: DataContext = defaultDataContext): UseLabelEditorReturn {
    const [selectedLabel, setSelectedLabel] = useState<Label | LabelDraft | null>(null);
    const [elements, setElements] = useState<LabelElement[]>([]);
    const [labelName, setLabelName] = useState("");
    const [labelId, setLabelId] = useState<string | null>(null);
    
    const [fieldExampleValues, setFieldExampleValues] = useState<Record<string, string>>(() => {
        // Inicializar con los valores por defecto de labelFields
        const initialValues: Record<string, string> = {};
        Object.keys(labelFields).forEach(key => {
            initialValues[key] = labelFields[key].defaultValue;
        });
        return initialValues;
    });
    const [showFieldExamplesDialog, setShowFieldExamplesDialog] = useState(false);

    const [selectedElement, setSelectedElement] = useState<string | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeCorner, setResizeCorner] = useState<string | null>(null);
    const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number; elX: number; elY: number } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [canvasWidth, setCanvasWidth] = useState(400);
    const [canvasHeight, setCanvasHeight] = useState(300);
    const [canvasRotation, setCanvasRotation] = useState(0);
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
    const wasSelectedOnMouseDownRef = useRef(false);
    const clickedElementIdRef = useRef<string | null>(null);
    const { data: session } = useSession();

    const [openSelector, setOpenSelector] = useState(false);
    const [manualValues, setManualValues] = useState<Record<string, string>>({});
    const [showManualDialog, setShowManualDialog] = useState(false);
    const [manualForm, setManualForm] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { onPrint } = usePrintElement({ id: 'print-area', width: canvasWidth / 4, height: canvasHeight / 4 });




    const manualFieldOptions = useMemo(
        (): LabelFieldOption[] => {
            const seen = new Set<string>();
            return elements
                .filter(el => (el.type === 'manualField' || el.type === 'selectField' || el.type === 'checkboxField' || el.type === 'dateField') && el.key)
                .filter(el => {
                    const k = String(el.key ?? '');
                    if (seen.has(k)) return false;
                    seen.add(k);
                    return true;
                })
                .map(el => ({ value: String(el.key ?? ''), label: String(el.key ?? '') }));
        },
        [elements]
    );

    const allFieldOptions = useMemo(
        (): LabelFieldOption[] => {
            const baseOptions: LabelFieldOption[] = [...fieldOptions, ...manualFieldOptions];
            // Agregar campos virtuales para netWeight con formatos específicos
            const netWeightField = fieldOptions.find(opt => opt.value === 'netWeight');
            if (netWeightField) {
                return [
                    ...baseOptions,
                    { value: 'netWeightFormatted', label: netWeightField.label },
                    { value: 'netWeight6digits', label: `${netWeightField.label} (6 dígitos)` }
                ];
            }
            return baseOptions;
        },
        [manualFieldOptions, fieldOptions]
    );

    const getDefaultValuesFromElements = useCallback((): Record<string, string> => {
        const values: Record<string, string> = {};

        const extractPlaceholders = (text: string | null | undefined): string[] => {
            const matches = text?.match(/{{([^}]+)}}/g) || [];
            return matches.map(m => m.slice(2, -2));
        };

        const seenFields = new Set<string>();

        elements.forEach(el => {
            // 🔹 Campos dinámicos directos tipo "field"
            const fieldStr = el.field != null ? String(el.field) : '';
            if (el.type === 'field' && fieldStr && labelFields[fieldStr] && !seenFields.has(fieldStr)) {
                values[fieldStr] = fieldExampleValues[fieldStr] || labelFields[fieldStr].defaultValue;
                seenFields.add(fieldStr);
            }

            // 🔹 Campos manuales tipo "manualField"
            const keyStr = el.key != null ? String(el.key) : '';
            if (el.type === 'manualField' && keyStr && !seenFields.has(keyStr)) {
                values[keyStr] = String(el.sample ?? '');
                seenFields.add(keyStr);
            }

            // 🔹 Campos select tipo "selectField" (se rellenan al imprimir, en editor usamos sample)
            if (el.type === 'selectField' && keyStr && !seenFields.has(keyStr)) {
                values[keyStr] = String(el.sample ?? (Array.isArray(el.options) && el.options[0]) ?? '');
                seenFields.add(keyStr);
            }

            // 🔹 Campos checkbox tipo "checkboxField" (en editor mostramos el contenido; al imprimir depende del check)
            if (el.type === 'checkboxField' && keyStr && !seenFields.has(keyStr)) {
                values[keyStr] = String(el.content ?? '');
                seenFields.add(keyStr);
            }

            // 🔹 Campos fecha tipo "dateField" (manual → sample; resto → calculado para vista previa; fieldOffset usa cache)
            if (el.type === 'dateField' && keyStr && !seenFields.has(keyStr)) {
                values[keyStr] = String(el.dateMode === 'manual' ? (el.sample ?? '') : getDateFieldPreviewValue(el, elements, new Set(), values)) || '';
                seenFields.add(keyStr);
            }

            // 🔹 Campos usados como {{placeholders}} en QR, Barcode, Parrafos ricos...
            const contents = [el.html, el.qrContent, el.barcodeContent];
            contents.forEach(content => {
                extractPlaceholders(typeof content === 'string' ? content : undefined).forEach(field => {
                    if (!seenFields.has(field)) {
                        values[field] = fieldExampleValues[field] || labelFields[field]?.defaultValue || '';
                        seenFields.add(field);
                    }
                });
            });
        });

        return values;
    }, [elements, fieldExampleValues]);

    const queryClient = useQueryClient();
    type SaveMutationVars = { labelId?: string; labelName: string; labelFormat: LabelFormat; token?: string };
    const saveMutation = useMutation({
        mutationFn: async ({ labelId: id, labelName: name, labelFormat: format, token: t }: SaveMutationVars) => {
            const token = t ?? '';
            if (id) return updateLabel(id, name, format, token);
            return createLabel(name, format, token);
        },
        onSuccess: (data, variables) => {
            if (!variables.labelId && data?.data) {
                setLabelId(data.data.id);
                setSelectedLabel(data.data);
            }
            toast.success(`Etiqueta ${variables.labelId ? 'actualizada' : 'guardada'} correctamente.`, getToastTheme());
            queryClient.invalidateQueries({ queryKey: getLabelsQueryKey() });
        },
        onError: (err: Error) => {
            const e = err as Error & { userMessage?: string; data?: { userMessage?: string }; response?: { data?: { userMessage?: string } } };
            const msg = e?.userMessage || e?.data?.userMessage || e?.response?.data?.userMessage || e?.message || 'Error al guardar etiqueta.';
            toast.error(msg, getToastTheme());
        },
    });
    type DeleteMutationVars = { labelId: string; token?: string };
    const deleteMutation = useMutation({
        mutationFn: ({ labelId: id, token: t }: DeleteMutationVars) => deleteLabel(id, t ?? ''),
        onSuccess: () => {
            toast.success("Etiqueta eliminada correctamente.", getToastTheme());
            clearEditor();
            queryClient.invalidateQueries({ queryKey: getLabelsQueryKey() });
        },
        onError: (err: Error) => {
            const e = err as Error & { userMessage?: string; data?: { userMessage?: string } };
            const msg = e?.userMessage || e?.data?.userMessage || e?.message || 'Error al eliminar etiqueta.';
            toast.error(msg, getToastTheme());
        },
    });

    const isSaving = saveMutation.isPending;

    const handleSave = async () => {
        const validationError = validateLabelName(labelName);
        if (validationError) {
            toast.error(validationError, getToastTheme());
            return;
        }
        if (hasDuplicateFieldKeys(elements)) {
            toast.error('Error: hay campos con el mismo nombre.', getToastTheme());
            return;
        }
        if (hasAnyElementValidationErrors(elements)) {
            toast.error('Completa el nombre de todos los campos y las opciones de los campos tipo select antes de guardar.', getToastTheme());
            return;
        }
        const token = session?.user?.accessToken;
        const labelFormat = {
            elements,
            canvas: { width: canvasWidth, height: canvasHeight, rotation: canvasRotation },
        };
        saveMutation.mutate({ labelId: labelId || undefined, labelName, labelFormat, token });
    };

    const handleDeleteLabel = async () => {
        if (!labelId) {
            toast.error("No hay etiqueta seleccionada para eliminar.", getToastTheme());
            return;
        }
        deleteMutation.mutate({ labelId, token: session?.user?.accessToken });
    };

    /* Mejorable, se puede extraer a initial element por cada tipo */
    const addElement = (type: LabelElementType) => {
        const newElement = {
            id: `element-${Date.now()}`,
            type,
            x: 50,
            y: 50,
            width: type === "line" 
                ? 30 
                : ["text", "field", "manualField", "selectField", "checkboxField", "dateField", "sanitaryRegister", "richParagraph"].includes(type) ? 20 : 20,
            height: type === "line"
                ? 1
                : type === "richParagraph"
                    ? 15
                    : ["text", "field", "manualField", "selectField", "checkboxField", "dateField", "sanitaryRegister"].includes(type)
                        ? 10
                        : 10,
            fontSize: type === 'sanitaryRegister' ? 2 : 2.5,
            fontWeight: "normal",
            fontStyle: "normal",
            textDecoration: "none",
            textTransform: "none",
            horizontalAlign: "left",
            verticalAlign: "start",
            textAlign: "left", // Mantener para compatibilidad
            text: type === "text" ? "Texto ejemplo" : undefined,
            countryCode: type === "sanitaryRegister" ? "ES" : undefined,
            approvalNumber: type === "sanitaryRegister" ? "12.021462/H" : undefined,
            suffix: type === "sanitaryRegister" ? "C.E." : undefined,
            field: type === "field" ? "product.name" : undefined,
            key: type === "manualField" ? "Campo" : type === "selectField" ? "Destino" : type === "checkboxField" ? "Marcar" : type === "dateField" ? "Fecha" : undefined,
            sample: type === "manualField" ? "Valor" : type === "selectField" ? "Nacional" : type === "dateField" ? (() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })() : undefined,
            content: type === "checkboxField" ? "Texto cuando está marcado" : undefined,
            dateMode: type === "dateField" ? "system" : undefined,
            systemOffsetDays: type === "dateField" ? 0 : undefined,
            fieldRef: type === "dateField" ? "" : undefined,
            fieldOffsetDays: type === "dateField" ? 0 : undefined,
            visibleOnLabel: ["manualField", "selectField", "checkboxField", "dateField"].includes(type) ? true : undefined,
            options: type === "selectField" ? ["Nacional", "Exportación", "Otro"] : undefined,
            qrContent: type === "qr" ? "" : undefined,
            barcodeContent: type === "barcode" ? "" : undefined,
            barcodeType: type === "barcode" ? "ean13" : undefined,
            showValue: type === "barcode" ? false : undefined,
            html: type === "richParagraph" ? "<span>Texto de ejemplo</span>" : undefined,
            borderColor: type === "sanitaryRegister" ? "#000000" : undefined,
            borderWidth: type === "sanitaryRegister" ? 0.10 : undefined,
            color: "#000000",
            direction: type === "line" ? "horizontal" : undefined,
            strokeWidth: type === "line" ? 0.1 : undefined,
        };
        // Normalizar antes de agregar
        const normalizedElement = normalizeElement(newElement) ?? newElement as LabelElement;
        setElements((prev) => [...prev, normalizedElement]);
        setSelectedElement(normalizedElement.id);
    };

    const deleteElement = (id: string) => {
        setElements((prev) => prev.filter((el) => el.id !== id));
        if (selectedElement === id) setSelectedElement(null);
    };

    const duplicateElement = (id: string) => {
        const el = elements.find((e) => e.id === id);
        if (!el) return;
        let copy: LabelElement = { ...el, id: `element-${Date.now()}`, x: el.x + 10, y: el.y + 10 };
        if (KEY_FIELD_TYPES.includes(el.type as string) && el.key) {
            const existingKeys = new Set(
                elements
                    .filter((e) => KEY_FIELD_TYPES.includes(e.type as string))
                    .map((e) => String(e.key || '').trim())
                    .filter(Boolean)
            );
            const baseKey = String(el.key || '').trim();
            let candidate = normalizeKeyForStorage(`${baseKey} copia`);
            let n = 2;
            while (existingKeys.has(candidate)) {
                candidate = normalizeKeyForStorage(`${baseKey} ${n}`);
                n += 1;
            }
            copy = { ...copy, key: candidate };
        }
        setElements((prev) => [...prev, copy]);
        setSelectedElement(copy.id);
    };

    const updateElement = (id: string, updates: Partial<LabelElement>) => {
        setElements((prev) => {
            const target = prev.find((el) => el.id === id);
            const isKeyField = target && KEY_FIELD_TYPES.includes(target.type);
            const newKey = updates.key !== undefined ? String(updates.key || '').trim() : '';
            const oldKey = target ? String(target.key || '').trim() : '';
            const shouldReplicateKey = isKeyField && oldKey !== '' && newKey !== '' && oldKey !== newKey;

            let updated: LabelElement[] = prev.map((el) => {
                if (el.id === id) {
                    const merged = { ...el, ...updates };
                    const normalized = normalizeElement(merged);
                    return (normalized ?? merged) as LabelElement;
                }
                return el;
            });

            if (shouldReplicateKey) {
                updated = updated.map((el) => {
                    const hasContent = el.qrContent || el.html || el.barcodeContent;
                    if (!hasContent) return el;
                    const next = { ...el };
                    if (el.qrContent) next.qrContent = replacePlaceholderInContent(el.qrContent as string, oldKey, newKey);
                    if (el.html) next.html = replacePlaceholderInContent(el.html as string, oldKey, newKey);
                    if (el.barcodeContent) next.barcodeContent = replacePlaceholderInContent(el.barcodeContent as string, oldKey, newKey);
                    return next as LabelElement;
                });
            }

            return updated;
        });
    };

    const getFieldValue = (field: string): string => {
        const keys = field.split(".");
        let value: unknown = dataContext;
        for (const key of keys) {
            value = (value as Record<string, unknown>)?.[key];
        }
        return value != null ? String(value) : field;
    };

    const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
        e.preventDefault();
        
        // Guardar el elementId y si el elemento ya estaba seleccionado
        clickedElementIdRef.current = elementId;
        wasSelectedOnMouseDownRef.current = selectedElement === elementId;
        
        // Guardar la posición inicial del mouse
        mouseDownPosRef.current = {
            x: e.clientX,
            y: e.clientY
        };
        
        // Si el elemento ya estaba seleccionado, no seleccionarlo de nuevo todavía
        // Esperaremos a ver si hay movimiento en handleMouseMove
        if (!wasSelectedOnMouseDownRef.current) {
            setSelectedElement(elementId);
        }
        
        setIsDragging(true);
        const element = elements.find((el) => el.id === elementId);
        if (element && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            setDragOffset({
                x: pxToMm(e.clientX - rect.left) / zoom - element.x,
                y: pxToMm(e.clientY - rect.top) / zoom - element.y,
            });
        }
    };

    const handleResizeMouseDown = (e: React.MouseEvent, elementId: string, corner: string) => {
        e.preventDefault();
        setSelectedElement(elementId);
        setIsResizing(true);
        setResizeCorner(corner);
        const element = elements.find((el) => el.id === elementId);
        if (element && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            setResizeStart({
                x: pxToMm(e.clientX - rect.left) / zoom,
                y: pxToMm(e.clientY - rect.top) / zoom,
                width: element.width,
                height: element.height,
                elX: element.x,
                elY: element.y,
            });
        }
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if ((!isDragging && !isResizing) || !canvasRef.current) return;

            // Si el elemento estaba seleccionado y ahora hay movimiento, seleccionarlo y empezar a arrastrar
            if (isDragging && wasSelectedOnMouseDownRef.current && mouseDownPosRef.current && clickedElementIdRef.current) {
                const movedX = Math.abs(e.clientX - mouseDownPosRef.current.x);
                const movedY = Math.abs(e.clientY - mouseDownPosRef.current.y);
                const threshold = 3; // 3 píxeles de umbral para considerar movimiento
                
                if (movedX > threshold || movedY > threshold) {
                    // Hay movimiento significativo, seleccionar el elemento y continuar con el arrastre
                    if (!selectedElement) {
                        setSelectedElement(clickedElementIdRef.current);
                    }
                }
            }

            if (!selectedElement) return;

            const rect = canvasRef.current.getBoundingClientRect();
            const curX = pxToMm(e.clientX - rect.left) / zoom;
            const curY = pxToMm(e.clientY - rect.top) / zoom;

            if (isDragging) {
                const newX = curX - dragOffset.x;
                const newY = curY - dragOffset.y;
                const element = elements.find(el => el.id === selectedElement);
                const maxX = canvasWidth - (element?.width || 0);
                const maxY = canvasHeight - (element?.height || 0);
                updateElement(selectedElement, {
                    x: Math.max(0, Math.min(maxX, newX)),
                    y: Math.max(0, Math.min(maxY, newY)),
                });
            }

            if (isResizing && resizeStart) {
                const dx = curX - resizeStart.x;
                const dy = curY - resizeStart.y;
                let { width, height, elX, elY } = resizeStart;
                let newProps = {};

                switch (resizeCorner) {
                    case 'se': width += dx; height += dy; break;
                    case 'sw': width -= dx; height += dy; elX += dx; break;
                    case 'ne': width += dx; height -= dy; elY += dy; break;
                    case 'nw': width -= dx; height -= dy; elX += dx; elY += dy; break;
                    default: break;
                }

                width = Math.max(10 / 3.78, width);  // ≈2.65mm mínimo
                height = Math.max(10 / 3.78, height);
                const maxX = canvasWidth - width;
                const maxY = canvasHeight - height;

                newProps = {
                    x: Math.max(0, Math.min(maxX, elX)),
                    y: Math.max(0, Math.min(maxY, elY)),
                    width,
                    height,
                };

                updateElement(selectedElement, newProps);
            }
        },
        [isDragging, isResizing, selectedElement, dragOffset, resizeStart, resizeCorner, zoom, canvasWidth, canvasHeight, elements]
    );

    const handleMouseUp = useCallback((e: MouseEvent) => {
        // Si el elemento ya estaba seleccionado y no hubo movimiento significativo, deseleccionarlo
        if (wasSelectedOnMouseDownRef.current && mouseDownPosRef.current && e && clickedElementIdRef.current) {
            const movedX = Math.abs(e.clientX - mouseDownPosRef.current.x);
            const movedY = Math.abs(e.clientY - mouseDownPosRef.current.y);
            const threshold = 3; // 3 píxeles de umbral
            
            if (movedX <= threshold && movedY <= threshold) {
                // No hubo movimiento significativo, deseleccionar
                setSelectedElement(null);
            }
        }
        
        setIsDragging(false);
        setIsResizing(false);
        mouseDownPosRef.current = null;
        wasSelectedOnMouseDownRef.current = false;
        clickedElementIdRef.current = null;
    }, []);

    const handleSelectElementCard = (elementId: string | null) => {
        elementId === selectedElement ? setSelectedElement(null) : setSelectedElement(elementId);
    };

    useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    const exportJSON = (name = "label-structure.json") => {
        const jsonData = {
            name,
            elements: elements.map(({ id, ...el }) => el),
            canvas: { width: canvasWidth, height: canvasHeight, rotation: canvasRotation },
        };
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name.endsWith('.json') ? name : `${name}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importJSON = (jsonData: { elements?: unknown[]; canvas?: { width?: number; height?: number; rotation?: number }; name?: string }) => {
        if (!jsonData) return;
        if (Array.isArray(jsonData.elements)) {
            const newElements = jsonData.elements.map((el: unknown, i: number) => ({ id: `element-${Date.now()}-${i}`, ...(el as object) }));
            // Normalizar elementos al importar JSON
            const normalizedElements = normalizeElements(newElements);
            setElements(normalizedElements);
        }
        if (jsonData.canvas) {
            setCanvasWidth(jsonData.canvas.width || canvasWidth);
            setCanvasHeight(jsonData.canvas.height || canvasHeight);
            setCanvasRotation(jsonData.canvas.rotation || 0);
        }
        return jsonData.name || "";
    };

    const validateLabelJSON = (data: unknown): boolean => {
        if (!data || typeof data !== 'object') {
            throw new Error('El archivo JSON no es válido');
        }
        const d = data as { elements?: unknown; canvas?: { width?: number; height?: number } };
        if (!Array.isArray(d.elements)) {
            throw new Error('El formato de elementos no es válido. Debe ser un array.');
        }
        if (!d.canvas || typeof d.canvas.width !== 'number' || typeof d.canvas.height !== 'number') {
            throw new Error('El formato del canvas no es válido. Debe tener width y height numéricos.');
        }
        return true;
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev: ProgressEvent<FileReader>) => {
            try {
                const result = ev.target?.result;
                if (typeof result !== 'string') return;
                const data = JSON.parse(result);
                validateLabelJSON(data);
                const name = importJSON(data);
                setLabelName(name ?? '');
                toast.success('Etiqueta importada correctamente', getToastTheme());
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error al importar la etiqueta';
                toast.error(errorMessage, getToastTheme());
                console.error('Error al importar etiqueta:', err);
            }
        };
        reader.readAsText(file);
    };

    // Normalizar el elemento seleccionado antes de pasarlo a la UI
    // Usar useMemo para hacerlo reactivo y forzar re-render cuando cambia
    // Crear un objeto nuevo para forzar detección de cambios en React
    const selectedElementData = useMemo((): LabelElement | null => {
        if (!selectedElement) return null;
        const element = elements.find((el) => el.id === selectedElement);
        if (!element) return null;
        // Crear un objeto completamente nuevo para forzar detección de cambios
        return normalizeElement({ ...element }) ?? null;
    }, [selectedElement, elements]);

    const rotateCanvasTo = useCallback((angle: number) => {
        const diff = (angle - canvasRotation + 360) % 360;
        if (diff === 0) return;
        setElements((prev) => prev.map((el) => {
            let { x, y, width: w, height: h, rotation = 0 } = el;
            switch (diff) {
                case 90: return { ...el, x: canvasHeight - y - h, y: x, width: h, height: w, rotation: (rotation + 90) % 360 };
                case 180: return { ...el, x: canvasWidth - x - w, y: canvasHeight - y - h, rotation: (rotation + 180) % 360 };
                case 270: return { ...el, x: y, y: canvasWidth - x - w, width: h, height: w, rotation: (rotation + 270) % 360 };
                default: return el;
            }
        }));
        if (diff === 90 || diff === 270) {
            setCanvasWidth(canvasHeight);
            setCanvasHeight(canvasWidth);
        }
        setCanvasRotation(angle);
    }, [canvasRotation, canvasHeight, canvasWidth]);

    const rotateCanvas = useCallback(() => {
        const next = (canvasRotation + 90) % 360;
        rotateCanvasTo(next);
    }, [canvasRotation, rotateCanvasTo]);

    const handleElementRotationChange = (id: string, angle: number) => {
        const element = elements.find(el => el.id === id);
        if (!element) return;
        const prevMod = (element.rotation || 0) % 180;
        const newMod = angle % 180;
        let { width, height } = element;
        if (prevMod !== newMod) {
            [width, height] = [height, width];
        }
        updateElement(id, { rotation: angle, width, height });
    };

    const handleCanvasRotationChange = (angle: number) => {
        rotateCanvasTo(angle);
    };

    const handleSelectLabel = (label: Label) => {
        const labelId = label.id
        const labelName = label.name || "";
        const format = label.format
        setSelectedLabel(label); // ✅ Guardar el objeto completo, no solo el formato
        setCanvasWidth(format.canvas.width);
        setCanvasHeight(format.canvas.height);
        setCanvasRotation(format.canvas.rotation || 0);
        // Normalizar elementos al cargar desde la BD
        const normalizedElements = normalizeElements(format.elements || []);
        setElements(normalizedElements);
        setLabelName(labelName || "");
        setLabelId(labelId);
        setSelectedElement(null); // Reset panel derecho al cambiar de formato
    };

    /* Limpiar editor - usado cuando se elimina la etiqueta actual */
    const clearEditor = () => {
        setSelectedLabel(null);
        setElements([]);
        setLabelName("");
        setLabelId(null);
        setSelectedElement(null);
        // Mantener dimensiones del canvas por si el usuario quiere crear nueva
    };

    /* Extraer en una constante EmptyLabelData */
    const handleCreateNewLabel = () => {
        const model = { id: null, name: "", canvas: { width: 110, height: 90, rotation: 0 } };
        setSelectedLabel(model);
        setCanvasWidth(model.canvas.width);
        setCanvasHeight(model.canvas.height);
        setCanvasRotation(0);
        setElements([]);
        setLabelName("");
        setLabelId(null);
        setSelectedElement(null); // Reset panel derecho
    };


    const handlePrint = () => {
            const manualFields = elements.filter(el => el.type === 'manualField');
            if (manualFields.length > 0) {
                const formValues: Record<string, string> = {};
                manualFields.forEach(el => {
                    const k = String(el.key ?? '');
                    formValues[k] = manualValues[k] || String(el.sample ?? '') || '';
                });
            setManualForm(formValues);
            setShowManualDialog(true);
        } else {
            onPrint();
        }
    };

    const handleConfirmManual = () => {
        setManualValues(manualForm);
        setShowManualDialog(false);
        setTimeout(() => {
            onPrint();
            setManualValues({});
        }, 0);
    };

    const handleOnClickSave = () => {
        handleSave();
    };

    /**
     * Ajusta automáticamente el tamaño del elemento seleccionado al contenido
     */
    const autoFitToContent = (elementId: string) => {
        if (!elementId || !canvasRef.current) return;
        
        const element = elements.find(el => el.id === elementId);
        if (!element) return;

        // Solo funciona para elementos de texto
        const textTypes = ['text', 'field', 'manualField', 'richParagraph', 'sanitaryRegister'];
        if (!textTypes.includes(element.type)) {
            toast.error('Esta función solo está disponible para elementos de texto', getToastTheme());
            return;
        }

        // Función auxiliar para obtener valores de ejemplo (similar a LabelElement)
        const getExampleValue = (key: string): string => {
            // Si es un campo de netWeight con formato específico, aplicar el formato
            if (key === 'netWeightFormatted' || key === 'netWeight6digits') {
                // Usar el valor de netWeight si existe, si no usar el valor por defecto
                const baseValue = fieldExampleValues['netWeight'] || labelFields['netWeight']?.defaultValue || NET_WEIGHT_DEFAULT;
                return String(formatNetWeightField(baseValue, key));
            }
            // Usar fieldExampleValues primero, luego defaultValue de labelFields, o el sample para campos manuales
            return fieldExampleValues[key] || labelFields[key]?.defaultValue || '';
        };

        // Función para reemplazar placeholders en texto/HTML con valores de ejemplo
        const replacePlaceholders = (str: string): string => {
            if (!str) return '';
            return str.replace(/{{([^}]+)}}/g, (_, field) => {
                const value = getExampleValue(field);
                return value || `{{${field}}}`;
            });
        };

        // Crear un elemento temporal fuera del DOM para medir
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.visibility = 'hidden';
        tempContainer.style.top = '-9999px';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = 'auto';
        tempContainer.style.height = 'auto';
        tempContainer.style.whiteSpace = element.type === 'richParagraph' ? 'normal' : 'nowrap';
        document.body.appendChild(tempContainer);

        try {
            const tempElement = document.createElement('div');
            tempElement.style.fontSize = `${Number(element.fontSize) || 2.5}mm`;
            tempElement.style.fontWeight = String(element.fontWeight ?? 'normal');
            tempElement.style.fontStyle = String(element.fontStyle ?? 'normal');
            tempElement.style.textDecoration = String(element.textDecoration ?? 'none');
            tempElement.style.textTransform = String(element.textTransform ?? 'none');
            tempElement.style.color = String(element.color ?? '#000000');
            tempElement.style.fontFamily = 'inherit';
            tempElement.style.lineHeight = '1.2';
            
            // Para richParagraph, permitir múltiples líneas
            if (element.type === 'richParagraph') {
                // Si es justify, usar el ancho actual para medir correctamente
                if (element.horizontalAlign === 'justify') {
                    tempElement.style.width = `${element.width || 50}mm`;
                } else {
                    tempElement.style.width = 'max-content';
                }
                tempElement.style.whiteSpace = 'normal';
                tempElement.style.wordWrap = 'break-word';
            }

            // Obtener el contenido según el tipo usando valores de ejemplo
            if (element.type === 'text') {
                tempElement.textContent = String(element.text ?? '');
            } else if (element.type === 'field') {
                // Usar valores de ejemplo en lugar de getFieldValue
                const fieldKey = String(element.field ?? '');
                const exampleValue = getExampleValue(fieldKey);
                tempElement.textContent = exampleValue || fieldKey;
            } else if (element.type === 'manualField') {
                // Usar sample si existe, sino usar valor de ejemplo
                tempElement.textContent = String(element.sample ?? getExampleValue(String(element.key ?? '')) ?? '');
            } else if (element.type === 'richParagraph') {
                // Para richParagraph, reemplazar placeholders con valores de ejemplo antes de medir
                const htmlWithExamples = replacePlaceholders(String(element.html ?? ''));
                // Limpiar fontSize inline para que use el del contenedor
                const processHtml = (html: string): string => {
                    if (!html) return '';
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const removeFontSize = (node: Node): void => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const el = node as HTMLElement;
                            if (el.style) el.style.removeProperty('font-size');
                            Array.from(node.childNodes).forEach(child => removeFontSize(child));
                        }
                    };
                    removeFontSize(doc.body);
                    return doc.body.innerHTML;
                };
                tempElement.innerHTML = processHtml(htmlWithExamples);
            } else if (element.type === 'sanitaryRegister') {
                // Para sanitaryRegister, construir el texto
                const parts: string[] = [];
                if (element.countryCode) parts.push(String(element.countryCode));
                if (element.approvalNumber) parts.push(String(element.approvalNumber));
                if (element.suffix) parts.push(String(element.suffix));
                tempElement.textContent = parts.join(' ');
            }

            tempContainer.appendChild(tempElement);

            // Forzar reflow para que el navegador calcule el tamaño
            tempContainer.offsetHeight;

            // Medir el tamaño
            const rect = tempElement.getBoundingClientRect();
            const widthMm = pxToMm(rect.width);
            const heightMm = pxToMm(rect.height);

            // Limpiar
            document.body.removeChild(tempContainer);
            
            // Actualizar el elemento con un pequeño margen
            const minSize = 5; // Mínimo 5mm
            const margin = 1; // Margen de 1mm
            updateElement(elementId, {
                width: Math.max(minSize, widthMm + margin),
                height: Math.max(minSize, heightMm + margin),
            });

            toast.success('Tamaño ajustado al contenido', getToastTheme());
        } catch (error) {
            console.error('Error al ajustar tamaño:', error);
            if (document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
            }
            toast.error('Error al ajustar el tamaño', getToastTheme());
        }
    };

    return {
        elements,
        selectedElement,
        selectedElementData,
        zoom,
        canvasRef,
        addElement,
        deleteElement,
        updateElement,
        setZoom,
        handleMouseDown,
        handleResizeMouseDown,
        duplicateElement,
        exportJSON,
        getFieldValue,
        canvasWidth,
        canvasHeight,
        canvasRotation,
        setCanvasWidth,
        setCanvasHeight,
        rotateCanvas,
        selectedLabel,
        labelName,
        setLabelName,
        labelId,
        openSelector,
        setOpenSelector,
        showManualDialog,
        setShowManualDialog,
        manualForm,
        setManualForm,
        fileInputRef,
        handleOnClickSave,
        handlePrint,
        handleConfirmManual,
        handleImportJSON,
        handleSelectLabel,
        handleCreateNewLabel,
        handleElementRotationChange,
        handleSelectElementCard,
        handleDeleteLabel,
        getDefaultValuesFromElements,
        fieldOptions,
        allFieldOptions,
        getFieldName,
        isSaving,
        clearEditor,
        fieldExampleValues,
        setFieldExampleValues,
        showFieldExamplesDialog,
        setShowFieldExamplesDialog,
        autoFitToContent,
        hasElementValidationError,
        getElementValidationErrorReason,
    };
}