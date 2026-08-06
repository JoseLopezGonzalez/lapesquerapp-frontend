// useLabelEditor.ts
import {
  useState,
  useCallback,
  useMemo,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { formatDecimal, parseEuropeanNumber } from '@/helpers/formats/numbers/formatNumbers';
import { formatDate, addDays, parseDate } from '@/hooks/useLabel';
import {
  KEY_FIELD_TYPES,
  hasElementValidationError,
  getElementValidationErrorReason,
} from '@/hooks/labels/labelValidation';
import { normalizeElement, cssFontWeight } from '@/hooks/labels/labelEditorHelpers';
import { useLabelCanvasInteraction } from '@/hooks/labels/useLabelCanvasInteraction';
import { useLabelPersistence } from '@/hooks/labels/useLabelPersistence';
import { useLabelPrint } from '@/hooks/labels/useLabelPrint';
import { notify } from '@/lib/notifications';
import type {
  Label,
  LabelDraft,
  LabelElement,
  LabelElementType,
  LabelFieldOption,
  DataContext,
  LabelFieldsMap,
} from '@/types/labelEditor';

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
  'product.name': { label: 'Nombre del Producto', defaultValue: 'Pulpo Fresco' },
  'product.species.name': { label: 'Especie', defaultValue: 'Octopus vulgaris' },
  'product.species.faoCode': { label: 'Codigo FAO', defaultValue: 'OCC' },
  'product.species.scientificName': {
    label: 'Nombre Cientifico',
    defaultValue: 'Octopus vulgaris',
  },
  'product.species.fishingGear.name': { label: 'Arte de Pesca', defaultValue: 'Nasas y trampas' },
  'product.captureZone.name': {
    label: 'Zona de Captura',
    defaultValue: 'FAO 27 IX.a Atlántico Nordeste',
  },
  'product.boxGtin': { label: 'GTIN del Producto', defaultValue: '98436613931182' },
  netWeight: { label: 'Peso Neto', defaultValue: '20,000 kg' },
  lot: { label: 'Lote', defaultValue: '120225OCC01001' },
};

const defaultDataContext: DataContext = Object.entries(labelFields).reduce<DataContext>(
  (acc, [path, { defaultValue }]) => {
    const keys = path.split('.');
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
  },
  {} as DataContext
);

const fieldOptions: LabelFieldOption[] = Object.entries(labelFields).map(([value, { label }]) => ({
  value,
  label,
}));

const getFieldName = (field: string): string => labelFields[field]?.label ?? field;

const pxToMm = (px: number): number => px / 3.78;

const escapeRegex = (str: string): string =>
  String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const replacePlaceholderInContent = (
  content: string | null | undefined,
  oldKey: string,
  newKey: string
): string => {
  if (content == null || content === '' || !oldKey || !newKey || oldKey === newKey)
    return content ?? '';
  const token = new RegExp(`\\{\\{${escapeRegex(oldKey)}\\}\\}`, 'g');
  return String(content).replace(token, `{{${newKey}}}`);
};

const normalizeKeyForStorage = (raw: string): string => {
  const filtered = String(raw || '').replace(/[^a-zA-Z0-9 ]/g, '');
  const i = filtered.search(/[a-zA-Z]/);
  if (i < 0) return filtered;
  return filtered.slice(0, i) + filtered[i].toUpperCase() + filtered.slice(i + 1);
};

const NET_WEIGHT_DEFAULT = '20,000 kg';

// Factor de conversión kg -> lb (avoirdupois), usado para el campo GS1 AI 3202
const KG_TO_LB = 2.20462262185;

const formatNetWeightField = (value: string | number, fieldName: string): string | number => {
  if (!value) return value;
  let numValue =
    typeof value === 'string'
      ? parseEuropeanNumber(value.replace(/kg/gi, '').trim())
      : Number(value) || 0;
  if (fieldName === 'netWeightFormatted') {
    return formatDecimal(numValue);
  } else if (fieldName === 'netWeight6digits') {
    const roundedValue = Math.round(numValue * 100) / 100;
    const integerValue = Math.round(roundedValue * 100);
    return String(integerValue).padStart(6, '0');
  } else if (fieldName === 'netWeightLb6digits') {
    // Igual que netWeight6digits pero convirtiendo kg -> lb primero (GS1 AI 3202)
    const lbValue = numValue * KG_TO_LB;
    const roundedValue = Math.round(lbValue * 100) / 100;
    const integerValue = Math.round(roundedValue * 100);
    return String(integerValue).padStart(6, '0');
  }
  return value;
};

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
    const v = formatDate(addDays(today, (el.systemOffsetDays as number | undefined) ?? 0));
    if (valuesCache) valuesCache[key] = v;
    return v;
  }
  if (mode === 'fieldOffset' && el.fieldRef) {
    const refKey = String(el.fieldRef).trim();
    const refEl = elementsList.find(
      (e) => e.type === 'dateField' && String(e.key || '').trim() === refKey
    );
    const refKeyCache = refEl ? String(refEl.key ?? '') : '';
    let refStr =
      valuesCache && refKeyCache && valuesCache[refKeyCache] !== undefined
        ? valuesCache[refKeyCache]
        : refEl
          ? getDateFieldPreviewValue(refEl, elementsList, visited, valuesCache)
          : '';
    if (!refStr && refEl?.dateMode === 'manual') refStr = formatDate(today);
    const refDate = parseDate(refStr);
    const v = refDate
      ? formatDate(addDays(refDate, (el.fieldOffsetDays as number | undefined) ?? 0))
      : refStr || '';
    if (valuesCache) valuesCache[key] = v;
    return v;
  }
  if (valuesCache) valuesCache[key] = '';
  return '';
}

export function useLabelEditor(
  dataContext: DataContext = defaultDataContext
): UseLabelEditorReturn {
  const [selectedLabel, setSelectedLabel] = useState<Label | LabelDraft | null>(null);
  const [elements, setElements] = useState<LabelElement[]>([]);
  const [labelName, setLabelName] = useState('');
  const [labelId, setLabelId] = useState<string | null>(null);

  const [fieldExampleValues, setFieldExampleValues] = useState<Record<string, string>>(() => {
    const initialValues: Record<string, string> = {};
    Object.keys(labelFields).forEach((key) => {
      initialValues[key] = labelFields[key].defaultValue;
    });
    return initialValues;
  });
  const [showFieldExamplesDialog, setShowFieldExamplesDialog] = useState(false);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(400);
  const [canvasHeight, setCanvasHeight] = useState(300);
  const [canvasRotation, setCanvasRotation] = useState(0);
  const [openSelector, setOpenSelector] = useState(false);

  const clearEditor = () => {
    setSelectedLabel(null);
    setElements([]);
    setLabelName('');
    setLabelId(null);
    setSelectedElement(null);
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
          if (el.qrContent)
            next.qrContent = replacePlaceholderInContent(el.qrContent as string, oldKey, newKey);
          if (el.html) next.html = replacePlaceholderInContent(el.html as string, oldKey, newKey);
          if (el.barcodeContent)
            next.barcodeContent = replacePlaceholderInContent(
              el.barcodeContent as string,
              oldKey,
              newKey
            );
          return next as LabelElement;
        });
      }

      return updated;
    });
  };

  const { canvasRef, handleMouseDown, handleResizeMouseDown } = useLabelCanvasInteraction({
    selectedElement,
    setSelectedElement,
    zoom,
    canvasWidth,
    canvasHeight,
    elements,
    updateElement,
  });

  const {
    fileInputRef,
    isSaving,
    handleOnClickSave,
    handleDeleteLabel,
    handleSelectLabel,
    handleCreateNewLabel,
    exportJSON,
    handleImportJSON,
  } = useLabelPersistence({
    elements,
    labelName,
    labelId,
    canvasWidth,
    canvasHeight,
    canvasRotation,
    setLabelId,
    setSelectedLabel,
    setElements,
    setLabelName,
    setCanvasWidth,
    setCanvasHeight,
    setCanvasRotation,
    setSelectedElement,
    clearEditor,
  });

  const {
    showManualDialog,
    setShowManualDialog,
    manualForm,
    setManualForm,
    handlePrint,
    handleConfirmManual,
  } = useLabelPrint({ elements, canvasWidth, canvasHeight });

  const manualFieldOptions = useMemo((): LabelFieldOption[] => {
    const seen = new Set<string>();
    return elements
      .filter(
        (el) =>
          (el.type === 'manualField' ||
            el.type === 'selectField' ||
            el.type === 'checkboxField' ||
            el.type === 'dateField') &&
          el.key
      )
      .filter((el) => {
        const k = String(el.key ?? '');
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .map((el) => ({ value: String(el.key ?? ''), label: String(el.key ?? '') }));
  }, [elements]);

  const allFieldOptions = useMemo((): LabelFieldOption[] => {
    const baseOptions: LabelFieldOption[] = [...fieldOptions, ...manualFieldOptions];
    const netWeightField = fieldOptions.find((opt) => opt.value === 'netWeight');
    if (netWeightField) {
      return [
        ...baseOptions,
        { value: 'netWeightFormatted', label: netWeightField.label },
        { value: 'netWeight6digits', label: `${netWeightField.label} (6 dígitos)` },
        { value: 'netWeightLb6digits', label: `${netWeightField.label} (lb, 6 dígitos - AI 3202)` },
      ];
    }
    return baseOptions;
  }, [manualFieldOptions]);

  const getDefaultValuesFromElements = useCallback((): Record<string, string> => {
    const values: Record<string, string> = {};

    const extractPlaceholders = (text: string | null | undefined): string[] => {
      const matches = text?.match(/{{([^}]+)}}/g) || [];
      return matches.map((m) => m.slice(2, -2));
    };

    const seenFields = new Set<string>();

    elements.forEach((el) => {
      const fieldStr = el.field != null ? String(el.field) : '';
      if (el.type === 'field' && fieldStr && labelFields[fieldStr] && !seenFields.has(fieldStr)) {
        values[fieldStr] = fieldExampleValues[fieldStr] || labelFields[fieldStr].defaultValue;
        seenFields.add(fieldStr);
      }

      const keyStr = el.key != null ? String(el.key) : '';
      if (el.type === 'manualField' && keyStr && !seenFields.has(keyStr)) {
        values[keyStr] = String(el.sample ?? '');
        seenFields.add(keyStr);
      }

      if (el.type === 'selectField' && keyStr && !seenFields.has(keyStr)) {
        values[keyStr] = String(el.sample ?? (Array.isArray(el.options) && el.options[0]) ?? '');
        seenFields.add(keyStr);
      }

      if (el.type === 'checkboxField' && keyStr && !seenFields.has(keyStr)) {
        values[keyStr] = String(el.content ?? '');
        seenFields.add(keyStr);
      }

      if (el.type === 'dateField' && keyStr && !seenFields.has(keyStr)) {
        values[keyStr] =
          String(
            el.dateMode === 'manual'
              ? (el.sample ?? '')
              : getDateFieldPreviewValue(el, elements, new Set(), values)
          ) || '';
        seenFields.add(keyStr);
      }

      const contents = [el.html, el.qrContent, el.barcodeContent];
      contents.forEach((content) => {
        extractPlaceholders(typeof content === 'string' ? content : undefined).forEach((field) => {
          if (!seenFields.has(field)) {
            values[field] = fieldExampleValues[field] || labelFields[field]?.defaultValue || '';
            seenFields.add(field);
          }
        });
      });
    });

    return values;
  }, [elements, fieldExampleValues]);

  const addElement = (type: LabelElementType) => {
    const newElement = {
      id: `element-${Date.now()}`,
      type,
      x: 50,
      y: 50,
      width:
        type === 'line'
          ? 30
          : [
                'text',
                'field',
                'manualField',
                'selectField',
                'checkboxField',
                'dateField',
                'sanitaryRegister',
                'richParagraph',
              ].includes(type)
            ? 20
            : 20,
      height:
        type === 'line'
          ? 1
          : type === 'richParagraph'
            ? 15
            : [
                  'text',
                  'field',
                  'manualField',
                  'selectField',
                  'checkboxField',
                  'dateField',
                  'sanitaryRegister',
                ].includes(type)
              ? 10
              : 10,
      fontSize: type === 'sanitaryRegister' ? 2 : 2.5,
      fontWeight: 'normal',
      lineHeight: 1.2,
      fontStyle: 'normal',
      textDecoration: 'none',
      textTransform: 'none',
      horizontalAlign: 'left',
      verticalAlign: 'start',
      textAlign: 'left',
      text: type === 'text' ? 'Texto ejemplo' : undefined,
      countryCode: type === 'sanitaryRegister' ? 'ES' : undefined,
      approvalNumber: type === 'sanitaryRegister' ? '12.021462/H' : undefined,
      suffix: type === 'sanitaryRegister' ? 'C.E.' : undefined,
      field: type === 'field' ? 'product.name' : undefined,
      key:
        type === 'manualField'
          ? 'Campo'
          : type === 'selectField'
            ? 'Destino'
            : type === 'checkboxField'
              ? 'Marcar'
              : type === 'dateField'
                ? 'Fecha'
                : undefined,
      sample:
        type === 'manualField'
          ? 'Valor'
          : type === 'selectField'
            ? 'Nacional'
            : type === 'dateField'
              ? (() => {
                  const d = new Date();
                  return (
                    d.getFullYear() +
                    '-' +
                    String(d.getMonth() + 1).padStart(2, '0') +
                    '-' +
                    String(d.getDate()).padStart(2, '0')
                  );
                })()
              : undefined,
      content: type === 'checkboxField' ? 'Texto cuando está marcado' : undefined,
      dateMode: type === 'dateField' ? 'system' : undefined,
      systemOffsetDays: type === 'dateField' ? 0 : undefined,
      fieldRef: type === 'dateField' ? '' : undefined,
      fieldOffsetDays: type === 'dateField' ? 0 : undefined,
      visibleOnLabel: ['manualField', 'selectField', 'checkboxField', 'dateField'].includes(type)
        ? true
        : undefined,
      options: type === 'selectField' ? ['Nacional', 'Exportación', 'Otro'] : undefined,
      qrContent: type === 'qr' ? '' : undefined,
      barcodeContent: type === 'barcode' ? '' : undefined,
      barcodeType: type === 'barcode' ? 'ean13' : undefined,
      showValue: type === 'barcode' ? false : undefined,
      html: type === 'richParagraph' ? '<span>Texto de ejemplo</span>' : undefined,
      borderColor: type === 'sanitaryRegister' ? '#000000' : undefined,
      borderWidth: type === 'sanitaryRegister' ? 0.1 : undefined,
      color: '#000000',
      direction: type === 'line' ? 'horizontal' : undefined,
      strokeWidth: type === 'line' ? 0.1 : undefined,
    };
    const normalizedElement = normalizeElement(newElement) ?? (newElement as LabelElement);
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

  const getFieldValue = (field: string): string => {
    const keys = field.split('.');
    let value: unknown = dataContext;
    for (const key of keys) {
      value = (value as Record<string, unknown>)?.[key];
    }
    return value != null ? String(value) : field;
  };

  const handleSelectElementCard = (elementId: string | null) => {
    elementId === selectedElement ? setSelectedElement(null) : setSelectedElement(elementId);
  };

  const selectedElementData = useMemo((): LabelElement | null => {
    if (!selectedElement) return null;
    const element = elements.find((el) => el.id === selectedElement);
    if (!element) return null;
    return normalizeElement({ ...element }) ?? null;
  }, [selectedElement, elements]);

  const rotateCanvasTo = useCallback(
    (angle: number) => {
      const diff = (angle - canvasRotation + 360) % 360;
      if (diff === 0) return;
      setElements((prev) =>
        prev.map((el) => {
          let { x, y, width: w, height: h, rotation = 0 } = el;
          switch (diff) {
            case 90:
              return {
                ...el,
                x: canvasHeight - y - h,
                y: x,
                width: h,
                height: w,
                rotation: (rotation + 90) % 360,
              };
            case 180:
              return {
                ...el,
                x: canvasWidth - x - w,
                y: canvasHeight - y - h,
                rotation: (rotation + 180) % 360,
              };
            case 270:
              return {
                ...el,
                x: y,
                y: canvasWidth - x - w,
                width: h,
                height: w,
                rotation: (rotation + 270) % 360,
              };
            default:
              return el;
          }
        })
      );
      if (diff === 90 || diff === 270) {
        setCanvasWidth(canvasHeight);
        setCanvasHeight(canvasWidth);
      }
      setCanvasRotation(angle);
    },
    [canvasRotation, canvasHeight, canvasWidth]
  );

  const rotateCanvas = useCallback(() => {
    const next = (canvasRotation + 90) % 360;
    rotateCanvasTo(next);
  }, [canvasRotation, rotateCanvasTo]);

  const handleElementRotationChange = (id: string, angle: number) => {
    const element = elements.find((el) => el.id === id);
    if (!element) return;
    const prevMod = (element.rotation || 0) % 180;
    const newMod = angle % 180;
    let { width, height } = element;
    if (prevMod !== newMod) {
      [width, height] = [height, width];
    }
    updateElement(id, { rotation: angle, width, height });
  };

  const autoFitToContent = (elementId: string) => {
    if (!elementId || !canvasRef.current) return;

    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    const textTypes = ['text', 'field', 'manualField', 'richParagraph', 'sanitaryRegister'];
    if (!textTypes.includes(element.type)) {
      notify.error({ title: 'Esta función solo está disponible para elementos de texto' });
      return;
    }

    const getExampleValue = (key: string): string => {
      if (
        key === 'netWeightFormatted' ||
        key === 'netWeight6digits' ||
        key === 'netWeightLb6digits'
      ) {
        const baseValue =
          fieldExampleValues['netWeight'] ||
          labelFields['netWeight']?.defaultValue ||
          NET_WEIGHT_DEFAULT;
        return String(formatNetWeightField(baseValue, key));
      }
      return fieldExampleValues[key] || labelFields[key]?.defaultValue || '';
    };

    const replacePlaceholders = (str: string): string => {
      if (!str) return '';
      return str.replace(/{{([^}]+)}}/g, (_, field) => {
        const value = getExampleValue(field);
        return value || `{{${field}}}`;
      });
    };

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
      tempElement.style.fontWeight = String(cssFontWeight(element.fontWeight ?? 'normal'));
      tempElement.style.fontStyle = String(element.fontStyle ?? 'normal');
      tempElement.style.textDecoration = String(element.textDecoration ?? 'none');
      tempElement.style.textTransform = String(element.textTransform ?? 'none');
      tempElement.style.color = String(element.color ?? '#000000');
      tempElement.style.fontFamily = 'inherit';
      tempElement.style.lineHeight = String(Number(element.lineHeight) || 1.2);

      if (element.type === 'richParagraph') {
        if (element.horizontalAlign === 'justify') {
          tempElement.style.width = `${element.width || 50}mm`;
        } else {
          tempElement.style.width = 'max-content';
        }
        tempElement.style.whiteSpace = 'normal';
        tempElement.style.wordWrap = 'break-word';
      }

      if (element.type === 'text') {
        tempElement.textContent = String(element.text ?? '');
      } else if (element.type === 'field') {
        const fieldKey = String(element.field ?? '');
        const exampleValue = getExampleValue(fieldKey);
        tempElement.textContent = exampleValue || fieldKey;
      } else if (element.type === 'manualField') {
        tempElement.textContent = String(
          element.sample ?? getExampleValue(String(element.key ?? '')) ?? ''
        );
      } else if (element.type === 'richParagraph') {
        const htmlWithExamples = replacePlaceholders(String(element.html ?? ''));
        const processHtml = (html: string): string => {
          if (!html) return '';
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const removeFontSize = (node: Node): void => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              if (el.style) el.style.removeProperty('font-size');
              Array.from(node.childNodes).forEach((child) => removeFontSize(child));
            }
          };
          removeFontSize(doc.body);
          return doc.body.innerHTML;
        };
        tempElement.innerHTML = processHtml(htmlWithExamples);
      } else if (element.type === 'sanitaryRegister') {
        const parts: string[] = [];
        if (element.countryCode) parts.push(String(element.countryCode));
        if (element.approvalNumber) parts.push(String(element.approvalNumber));
        if (element.suffix) parts.push(String(element.suffix));
        tempElement.textContent = parts.join(' ');
      }

      tempContainer.appendChild(tempElement);
      tempContainer.offsetHeight;

      const rect = tempElement.getBoundingClientRect();
      const widthMm = pxToMm(rect.width);
      const heightMm = pxToMm(rect.height);

      document.body.removeChild(tempContainer);

      const minSize = 5;
      const margin = 1;
      updateElement(elementId, {
        width: Math.max(minSize, widthMm + margin),
        height: Math.max(minSize, heightMm + margin),
      });

      notify.success({ title: 'Tamaño ajustado al contenido' });
    } catch (error) {
      console.error('Error al ajustar tamaño:', error);
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      notify.error({ title: 'Error al ajustar el tamaño' });
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
