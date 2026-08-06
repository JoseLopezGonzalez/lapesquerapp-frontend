// useLabel.ts

import { getLabel, getLabelsOptions } from '@/services/labelService';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { normalizeElements } from '@/hooks/labels/labelEditorHelpers';
import type { Label } from '@/types/labelEditor';

/** Formato interno/API e input type="date": YYYY-MM-DD */
export const formatDate = (date: Date | null | undefined): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Formato visual en etiquetas: DD/MM/AAAA. Acepta Date o string YYYY-MM-DD. */
export const formatDateDisplay = (dateOrString: Date | string | null | undefined): string => {
  if (dateOrString == null || dateOrString === '') return '';
  if (dateOrString instanceof Date) {
    if (isNaN(dateOrString.getTime())) return '';
    const d = String(dateOrString.getDate()).padStart(2, '0');
    const m = String(dateOrString.getMonth() + 1).padStart(2, '0');
    const y = dateOrString.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const s = String(dateOrString).trim();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return s;
};

export const addDays = (date: Date, days: number | null | undefined): Date => {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + (days || 0));
  return d;
};

export const parseDate = (str: string | null | undefined): Date | null => {
  if (!str || typeof str !== 'string') return null;
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const extractPlaceholders = (text: string | null | undefined): string[] => {
  const matches = text?.match(/{{([^}]+)}}/g) || [];
  return matches.map((m) => m.slice(2, -2));
};

interface LabelElementLike {
  type?: string;
  field?: string;
  key?: string;
  html?: string;
  qrContent?: string;
  barcodeContent?: string;
  options?: string[];
  dateMode?: string;
  systemOffsetDays?: number;
  fieldRef?: string;
  fieldOffsetDays?: number;
  content?: string;
  [key: string]: unknown;
}

// 'netWeightFormatted' y 'netWeight6digits' no son propiedades reales de la caja:
// son vistas formateadas de 'netWeight' (ver formatNetWeightField en LabelElement/index.js
// y useLabelEditor.ts). Si no se registra también 'netWeight' aquí, getValueByPath busca
// una propiedad inexistente en la caja, values['netWeight'] queda undefined, y el campo
// cae siempre al valor de ejemplo por defecto (20,000 kg → "002000").
const NET_WEIGHT_DERIVED_FIELDS = ['netWeightFormatted', 'netWeight6digits', 'netWeightLb6digits'];

export const extractFieldsFromLabel = (elements: LabelElementLike[]): Record<string, string> => {
  const result: Record<string, string> = {};
  const seen = new Set<string>();

  const registerField = (field: string) => {
    if (seen.has(field)) return;
    result[field] = '';
    seen.add(field);
    if (NET_WEIGHT_DERIVED_FIELDS.includes(field)) {
      registerField('netWeight');
    }
  };

  elements.forEach((el) => {
    if (el.type === 'field' && el.field) {
      registerField(el.field);
    }

    const contents = [el.html, el.qrContent, el.barcodeContent];
    contents.forEach((content) => {
      extractPlaceholders(content).forEach((field) => registerField(field));
    });
  });

  return result;
};

export const extractManualFieldsFromLabel = (
  elements: LabelElementLike[]
): Record<string, string> => {
  const result: Record<string, string> = {};
  const seen = new Set<string>();

  elements.forEach((el) => {
    if (el.type === 'manualField' && el.key && !seen.has(el.key)) {
      result[el.key] = '';
      seen.add(el.key);
    }
    if (el.type === 'selectField' && el.key && !seen.has(el.key)) {
      const firstOption = Array.isArray(el.options) && el.options.length > 0 ? el.options[0] : '';
      result[el.key] = firstOption;
      seen.add(el.key);
    }
    if (el.type === 'checkboxField' && el.key && !seen.has(el.key)) {
      result[el.key] = ''; // sin marcar por defecto
      seen.add(el.key);
    }
    if (el.type === 'dateField' && el.key && !seen.has(el.key)) {
      result[el.key] = el.dateMode === 'manual' ? formatDate(new Date()) : ''; // manual: hoy por defecto; el resto se computa
      seen.add(el.key);
    }
  });

  return result;
};

/**
 * Metadatos de campos que requieren entrada al imprimir (manual, select, checkbox, date).
 * @returns { Record<string, { type: string, dateMode?: string, systemOffsetDays?: number, fieldRef?: string, fieldOffsetDays?: number, ... }> }
 */
/** Clave localStorage para datos de preimpresión: etiqueta + producto (una entrada por cada producto distinto). */
const LABEL_PRINT_STORAGE_PREFIX = 'brisapp-label-print';

interface BoxProductLike {
  id?: string | number;
  captureZone?: unknown;
  capture_zone?: unknown;
  species?: {
    captureZone?: unknown;
    capture_zone?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface BoxLike {
  id?: string | number;
  productId?: string | number;
  product?: BoxProductLike;
  [key: string]: unknown;
}

function getProductKeyFromBox(box: BoxLike | null | undefined): string | number {
  if (!box) return 'default';
  return box?.product?.id ?? box?.productId ?? box?.id ?? 'default';
}

function getLabelPrintStorageKey(
  labelId: string | number | null | undefined,
  productKey: string | number
): string | null {
  if (!labelId) return null;
  return `${LABEL_PRINT_STORAGE_PREFIX}:${labelId}:${String(productKey)}`;
}

/** Obtiene las claves de producto distintas en las cajas (una por producto para guardar en varias entradas). */
function getDistinctProductKeys(boxes: BoxLike[] = []): (string | number)[] {
  if (boxes.length === 0) return ['preview'];
  const seen = new Set<string | number>();
  return boxes
    .map((b) => getProductKeyFromBox(b))
    .filter((k) => {
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}

function loadLabelPrintData(
  labelId: string | number | null | undefined,
  boxes: BoxLike[]
): Record<string, string> | null {
  const productKey = boxes.length > 0 ? getProductKeyFromBox(boxes[0]) : 'preview';
  const key = getLabelPrintStorageKey(labelId, productKey);
  if (!key || typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** Guarda los mismos datos bajo una clave por cada producto distinto en boxes. */
function saveLabelPrintData(
  labelId: string | number | null | undefined,
  boxes: BoxLike[],
  data: Record<string, string> | null | undefined
): void {
  if (!data || typeof window === 'undefined' || !window.localStorage) return;
  const productKeys = getDistinctProductKeys(boxes);
  try {
    productKeys.forEach((productKey) => {
      const key = getLabelPrintStorageKey(labelId, productKey);
      if (key) window.localStorage.setItem(key, JSON.stringify(data));
    });
  } catch {}
}

interface FieldMetadataEntry {
  type: string;
  dateMode?: string;
  systemOffsetDays?: number;
  fieldRef?: string;
  fieldOffsetDays?: number;
  options?: string[];
  content?: string;
}

export const extractFieldMetadataFromLabel = (
  elements: LabelElementLike[]
): Record<string, FieldMetadataEntry> => {
  const result: Record<string, FieldMetadataEntry> = {};
  elements.forEach((el) => {
    if (el.type === 'manualField' && el.key) {
      result[el.key] = { type: 'manual' };
    }
    if (el.type === 'selectField' && el.key) {
      const opts = (Array.isArray(el.options) ? el.options : []).filter(Boolean);
      result[el.key] = {
        type: 'select',
        options: opts.length > 0 ? opts : ['Opción 1', 'Opción 2'],
      };
    }
    if (el.type === 'checkboxField' && el.key) {
      result[el.key] = {
        type: 'checkbox',
        content: el.content || '',
      };
    }
    if (el.type === 'dateField' && el.key) {
      result[el.key] = {
        type: 'date',
        dateMode: el.dateMode || 'system',
        systemOffsetDays: el.systemOffsetDays ?? 0,
        fieldRef: el.fieldRef || '',
        fieldOffsetDays: el.fieldOffsetDays ?? 0,
      };
    }
  });
  return result;
};

interface UseLabelParams {
  boxes?: BoxLike[];
  open: boolean;
}

export function useLabel({ boxes = [], open }: UseLabelParams) {
  const [label, setLabel] = useState<Label | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLabel, setIsLoadingLabel] = useState(false);
  const [manualFields, setManualFields] = useState<Record<string, string>>({});
  const [fieldMetadata, setFieldMetadata] = useState<Record<string, FieldMetadataEntry>>({});
  const [fields, setFields] = useState<Record<string, string>[]>([]);
  const [labelsOptions, setLabelsOptions] = useState<unknown[]>([]);

  // console.log('fields', fields);

  useEffect(() => {}, []);

  /* Reestablecer cuando se cierra el modal */
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      getLabelsOptions()
        .then((data) => {
          setLabelsOptions((data as unknown[]) ?? []);
        })
        .catch((error) => {
          console.error('Error fetchWithTenanting labels options:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setTimeout(() => {
        setLabel(null);
        setSelectedLabelId(null);
        setManualFields({});
        setFieldMetadata({});
        setFields([]);
        setLabelsOptions([]);
        setIsLoading(false);
        setIsLoadingLabel(false);
      }, 500); // Esperar un poco para que el modal se cierre antes de resetear
    }
  }, [open]);

  const selectLabel = (labelId: string) => {
    setSelectedLabelId(labelId);
    setIsLoadingLabel(true);
    getLabel(labelId)
      .then((data) => {
        // Normalizar los elementos igual que hace el editor al cargar una etiqueta
        // (canoniza fontWeight y otras propiedades de formato) — sin esto, la impresión
        // real de una caja podía desincronizarse de lo que se ve en el editor.
        const normalizedData = data.format
          ? {
              ...data,
              format: { ...data.format, elements: normalizeElements(data.format.elements) },
            }
          : data;
        setLabel(normalizedData);
        const elements = (normalizedData.format?.elements ?? []) as LabelElementLike[];
        const updatedManualFields = extractManualFieldsFromLabel(elements);
        const stored = loadLabelPrintData(labelId, boxes);
        let mergedManualFields = updatedManualFields;
        if (stored && typeof stored === 'object') {
          mergedManualFields = { ...updatedManualFields };
          Object.keys(stored).forEach((k) => {
            if (k in updatedManualFields) mergedManualFields[k] = stored[k];
          });
        }
        setManualFields(mergedManualFields);
        const updatedFieldMetadata = extractFieldMetadataFromLabel(elements);
        setFieldMetadata(updatedFieldMetadata);
        const updatedFields = extractFieldsFromLabel(elements);
        // Rellenar cada field con el valor desde la primera caja disponible
        // Función para acceder profundamente con path tipo 'product.species.name'
        // También intenta rutas alternativas para compatibilidad (snake_case, diferentes estructuras)
        const getValueByPath = (obj: unknown, path: string): unknown => {
          // Intentar la ruta original primero
          let value = path
            .split('.')
            .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);

          // Si no se encuentra, intentar rutas alternativas para captureZone
          if (
            !value &&
            (path === 'product.captureZone.name' || path === 'product.species.captureZone.name')
          ) {
            // Si se busca product.species.captureZone.name, intentar primero product.captureZone.name (estructura real)
            if (path === 'product.species.captureZone.name') {
              value = 'product.captureZone.name'
                .split('.')
                .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);
            }

            // Si aún no se encuentra, intentar product.capture_zone.name (snake_case)
            if (!value) {
              value = 'product.captureZone.name'.split('.').reduce<unknown>((acc, key) => {
                const rec = acc as Record<string, unknown>;
                if (key === 'captureZone') {
                  return rec?.['capture_zone'] || rec?.[key];
                }
                return rec?.[key];
              }, obj);
            }

            // Si aún no se encuentra y se buscaba product.captureZone.name, intentar product.species.captureZone.name (estructura antigua)
            if (!value && path === 'product.captureZone.name') {
              value = 'product.species.captureZone.name'
                .split('.')
                .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);
            }
          }

          // Manejar product.species.faoCode -> product.species.fao
          if (!value && path === 'product.species.faoCode') {
            value = 'product.species.fao'
              .split('.')
              .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);
          }

          return value;
        };

        // Log completo de la primera caja para debugging
        if (boxes.length > 0) {
          console.log('📦 ===== ESTRUCTURA COMPLETA DEL BOX (primera caja) =====');
          console.log('Box completo:', JSON.stringify(boxes[0], null, 2));
          console.log('Box.product:', boxes[0]?.product);
          console.log('Box.product.captureZone:', boxes[0]?.product?.captureZone);
          console.log('Box.product.capture_zone:', boxes[0]?.product?.capture_zone);
          console.log('Box.product.species:', boxes[0]?.product?.species);
          console.log('Box.product.species?.captureZone:', boxes[0]?.product?.species?.captureZone);
          console.log(
            'Box.product.species?.capture_zone:',
            boxes[0]?.product?.species?.capture_zone
          );
          console.log('Campos a buscar:', Object.keys(updatedFields));
          console.log('========================================================');
        }

        const filledFieldsArray = boxes.map((box, index) => {
          // Log detallado para cada campo que se busca
          if (index === 0) {
            console.log(`\n🔍 ===== BUSCANDO VALORES EN BOX[${index}] =====`);
          }

          const fieldObject: Record<string, string> = Object.fromEntries(
            Object.keys(updatedFields).map((key) => {
              const value = getValueByPath(box, key);

              // Log específico para captureZone
              if (key === 'product.captureZone.name' && index === 0) {
                console.log(`\n🎯 Campo: ${key}`);
                console.log('  - Valor encontrado:', value);
                console.log('  - box.product:', box?.product);
                console.log('  - box.product?.captureZone:', box?.product?.captureZone);
                console.log('  - box.product?.capture_zone:', box?.product?.capture_zone);
                console.log('  - box.product?.species:', box?.product?.species);
                console.log(
                  '  - box.product?.species?.captureZone:',
                  box?.product?.species?.captureZone
                );
                console.log(
                  '  - box.product?.species?.capture_zone:',
                  box?.product?.species?.capture_zone
                );
              }

              if (index === 0) {
                console.log(`  ${key}:`, value || '(vacío)');
              }

              return [key, value != null ? String(value) : ''];
            })
          );

          if (index === 0) {
            console.log(`\n📋 Resultado final para box[${index}]:`, fieldObject);
            console.log('========================================================\n');
          }

          // console.log(`📦 Resultado para box[${index}] →`, fieldObject);
          return fieldObject;
        });
        // console.log('📝 Campos rellenados:', filledFieldsArray);

        setFields(filledFieldsArray);
      })
      .catch((error) => {
        console.error('Error fetchWithTenanting label:', error);
      })
      .finally(() => {
        setIsLoadingLabel(false);
      });
  };

  const changeManualField = useCallback(
    (key: string, value: string) => {
      setManualFields((prev) => {
        const next = { ...prev, [key]: value };
        saveLabelPrintData(selectedLabelId, boxes, next);
        return next;
      });
    },
    [selectedLabelId, boxes]
  );

  /* Unir manual values y computar fechas (system / systemOffset / fieldOffset). Si no hay filas pero sí hay label, una fila para preimpresión con fechas calculadas. */
  const values = useMemo(() => {
    const elements = ((label?.format?.elements ?? []) as LabelElementLike[]) || [];
    const dateElements = elements.filter((el) => el.type === 'dateField' && el.key);

    let base: Record<string, string>[] = fields.map((field) => ({
      ...field,
      ...manualFields,
    }));

    if (base.length === 0 && label?.format?.elements?.length) {
      base = [{ ...manualFields }];
    }

    if (dateElements.length === 0) return base;

    const today = new Date();

    return base.map((row) => {
      const computed = { ...row };

      for (let pass = 0; pass < 15; pass++) {
        let changed = false;
        for (const el of dateElements) {
          const key = el.key as string;
          if (el.dateMode === 'manual') continue; // ya viene de manualFields
          if (computed[key]) continue; // respetar override manual del usuario en fechas calculadas

          if (el.dateMode === 'system' || el.dateMode === 'systemOffset') {
            const d = addDays(today, el.systemOffsetDays ?? 0);
            computed[key] = formatDate(d);
            continue;
          }
          if (el.dateMode === 'fieldOffset' && el.fieldRef) {
            const refVal = computed[el.fieldRef];
            if (refVal) {
              const refDate = parseDate(refVal);
              if (refDate) {
                computed[key] = formatDate(addDays(refDate, el.fieldOffsetDays ?? 0));
                changed = true;
              }
            }
          }
        }
        if (!changed) break;
      }
      return computed;
    });
  }, [fields, manualFields, label?.format?.elements]);

  const isSomeManualFieldEmpty = useMemo(() => {
    return Object.entries(manualFields).some(([key, value]) => {
      const meta = fieldMetadata[key];
      if (meta?.type === 'checkbox') return false; // checkbox vacío (desmarcado) es válido
      if (meta?.type === 'date' && meta?.dateMode !== 'manual') return false; // fecha computada no requiere valor
      return value === '';
    });
  }, [manualFields, fieldMetadata]);

  const disabledPrintButton = isLoading || isSomeManualFieldEmpty || !label;

  return {
    label,
    selectedLabelId,
    labelsOptions,
    selectLabel,
    manualFields,
    fieldMetadata,
    fields,
    changeManualField,
    values,
    disabledPrintButton,
    isLoading,
    isLoadingLabel,
  };
}
