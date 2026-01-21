// useLabelEditor.js

import { getLabel, getLabelsOptions } from "@/services/labelService";
import { useSession } from "next-auth/react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";



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

    // Solo extraemos manualFields explícitos
    elements.forEach(el => {
        if (el.type === 'manualField' && el.key && !seen.has(el.key)) {
            result[el.key] = '';
            seen.add(el.key);
        }
    });

    return result;
};


export function useLabel({ boxes = [], open }) {

    const [label, setLabel] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingLabel, setIsLoadingLabel] = useState(false);
    const { data: session } = useSession();
    const token = session?.user?.accessToken;
    const [manualFields, setManualFields] = useState({});
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
                setManualFields({});
                setFields([]);
                setLabelsOptions([]);
                setIsLoading(false);
                setIsLoadingLabel(false);
            }, 500); // Esperar un poco para que el modal se cierre antes de resetear
        }

    }, [open]);

    const selectLabel = (labelId) => {
        setIsLoadingLabel(true);
        getLabel(labelId, token)
            .then((data) => {
                setLabel(data);
                const updatedManualFields = extractManualFieldsFromLabel(data.format.elements);
                setManualFields(updatedManualFields);
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

    /* Unir  manual Values a cada elemento de fields en variable Values*/
    const values = fields.map(field => ({
        ...manualFields,
        ...field,
    }));

    const isSomeManualFieldEmpty = Object.values(manualFields).some(value => value === '');

    const disabledPrintButton = isLoading || isSomeManualFieldEmpty || !label;

    return {
        label,
        labelsOptions,
        selectLabel,
        manualFields,
        fields,
        changeManualField,
        values,
        disabledPrintButton,
        isLoading,
        isLoadingLabel,
    };
}