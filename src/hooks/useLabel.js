// useLabel.js

import { getLabel, getLabelsOptions } from "@/services/labelService";
import { useSession } from "next-auth/react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";

export const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

export const addDays = (date, days) => {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + (days || 0));
    return d;
};

export const parseDate = (str) => {
    if (!str || typeof str !== "string") return null;
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
};

const extractPlaceholders = (text) => {
    const matches = text?.match(/{{([^}]+)}}/g) || [];
    return matches.map(m => m.slice(2, -2));
};

export const extractFieldsFromLabel = (elements) => {
    const result = {};
    const seen = new Set();

    elements.forEach(el => {
        if (el.type === 'field' && el.field && !seen.has(el.field)) {
            result[el.field] = '';
            seen.add(el.field);
        }

        const contents = [el.html, el.qrContent, el.barcodeContent];
        contents.forEach(content => {
            extractPlaceholders(content).forEach(field => {
                if (!seen.has(field)) {
                    result[field] = '';
                    seen.add(field);
                }
            });
        });
    });

    return result;
};

export const extractManualFieldsFromLabel = (elements) => {
    const result = {};
    const seen = new Set();

    elements.forEach(el => {
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
export const extractFieldMetadataFromLabel = (elements) => {
    const result = {};
    elements.forEach(el => {
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


export function useLabel({ boxes = [], open }) {

    const [label, setLabel] = useState(null);
    const [selectedLabelId, setSelectedLabelId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingLabel, setIsLoadingLabel] = useState(false);
    const { data: session } = useSession();
    const token = session?.user?.accessToken;
    const [manualFields, setManualFields] = useState({});
    const [fieldMetadata, setFieldMetadata] = useState({});
    const [fields, setFields] = useState([]);
    const [labelsOptions, setLabelsOptions] = useState([]);

    // console.log('fields', fields);

    useEffect(() => {

    }, []);

    /* Reestablecer cuando se cierra el modal */
    useEffect(() => {
        if (open) {
            setIsLoading(true);
            getLabelsOptions(token)
                .then((data) => {
                    setLabelsOptions(data);
                })
                .catch((error) => {
                    console.error("Error fetchWithTenanting labels options:", error);
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

    const selectLabel = (labelId) => {
        setSelectedLabelId(labelId);
        setIsLoadingLabel(true);
        getLabel(labelId, token)
            .then((data) => {
                setLabel(data);
                const updatedManualFields = extractManualFieldsFromLabel(data.format.elements);
                setManualFields(updatedManualFields);
                const updatedFieldMetadata = extractFieldMetadataFromLabel(data.format.elements);
                setFieldMetadata(updatedFieldMetadata);
                const updatedFields = extractFieldsFromLabel(data.format.elements);
                // Rellenar cada field con el valor desde la primera caja disponible
                // Función para acceder profundamente con path tipo 'product.species.name'
                // También intenta rutas alternativas para compatibilidad (snake_case, diferentes estructuras)
                const getValueByPath = (obj, path) => {
                    // Intentar la ruta original primero
                    let value = path.split('.').reduce((acc, key) => acc?.[key], obj);
                    
                    // Si no se encuentra, intentar rutas alternativas para captureZone
                    if (!value && (path === 'product.captureZone.name' || path === 'product.species.captureZone.name')) {
                        // Si se busca product.species.captureZone.name, intentar primero product.captureZone.name (estructura real)
                        if (path === 'product.species.captureZone.name') {
                            value = 'product.captureZone.name'.split('.').reduce((acc, key) => acc?.[key], obj);
                        }
                        
                        // Si aún no se encuentra, intentar product.capture_zone.name (snake_case)
                        if (!value) {
                            value = 'product.captureZone.name'.split('.').reduce((acc, key) => {
                                if (key === 'captureZone') {
                                    return acc?.['capture_zone'] || acc?.[key];
                                }
                                return acc?.[key];
                            }, obj);
                        }
                        
                        // Si aún no se encuentra y se buscaba product.captureZone.name, intentar product.species.captureZone.name (estructura antigua)
                        if (!value && path === 'product.captureZone.name') {
                            value = 'product.species.captureZone.name'.split('.').reduce((acc, key) => acc?.[key], obj);
                        }
                    }
                    
                    // Manejar product.species.faoCode -> product.species.fao
                    if (!value && path === 'product.species.faoCode') {
                        value = 'product.species.fao'.split('.').reduce((acc, key) => acc?.[key], obj);
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
                    console.log('Box.product.species?.capture_zone:', boxes[0]?.product?.species?.capture_zone);
                    console.log('Campos a buscar:', Object.keys(updatedFields));
                    console.log('========================================================');
                }

                const filledFieldsArray = boxes.map((box, index) => {
                    // Log detallado para cada campo que se busca
                    if (index === 0) {
                        console.log(`\n🔍 ===== BUSCANDO VALORES EN BOX[${index}] =====`);
                    }

                    const fieldObject = Object.fromEntries(
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
                                console.log('  - box.product?.species?.captureZone:', box?.product?.species?.captureZone);
                                console.log('  - box.product?.species?.capture_zone:', box?.product?.species?.capture_zone);
                            }
                            
                            if (index === 0) {
                                console.log(`  ${key}:`, value || '(vacío)');
                            }
                            
                            return [key, value ?? ''];
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
                console.error("Error fetchWithTenanting label:", error);
            })
            .finally(() => {
                setIsLoadingLabel(false);
            });
    }

    const changeManualField = (key, value) => {
        setManualFields(prev => ({
            ...prev,
            [key]: value
        }));
    }

    /* Unir manual values y computar fechas (system / systemOffset / fieldOffset). Si no hay filas pero sí hay label, una fila para preimpresión con fechas calculadas. */
    const values = useMemo(() => {
        const elements = label?.format?.elements || [];
        const dateElements = elements.filter(el => el.type === 'dateField' && el.key);

        let base = fields.map(field => ({
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
                    const key = el.key;
                    if (el.dateMode === 'manual') continue; // ya viene de manualFields

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