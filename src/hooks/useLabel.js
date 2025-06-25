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
    const { data: session } = useSession();
    const token = session?.user?.accessToken;
    const [manualFields, setManualFields] = useState({});
    const [fields, setFields] = useState([]);
    const [labelsOptions, setLabelsOptions] = useState([]);

    console.log('fields', fields);

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
                    console.error("Error fetching labels options:", error);
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
            }, 500); // Esperar un poco para que el modal se cierre antes de resetear
        }

    }, [open]);

    const selectLabel = (labelId) => {
        getLabel(labelId, token)
            .then((data) => {
                setLabel(data);
                const updatedManualFields = extractManualFieldsFromLabel(data.format.elements);
                setManualFields(updatedManualFields);
                const updatedFields = extractFieldsFromLabel(data.format.elements);
                // Rellenar cada field con el valor desde la primera caja disponible
                // Función para acceder profundamente con path tipo 'product.species.name'
                const getValueByPath = (obj, path) => {
                    return path.split('.').reduce((acc, key) => acc?.[key], obj);
                };

                const filledFieldsArray = boxes.map((box, index) => {
                    console.log(`🧊 Procesando box[${index}]`, box);

                    const fieldObject = Object.fromEntries(
                        Object.keys(updatedFields).map((key) => {
                            const value = getValueByPath(box, key);
                            console.log(`🔍 Buscando "${key}" en box[${index}] →`, value);
                            return [key, value ?? ''];
                        })
                    );

                    console.log(`📦 Resultado para box[${index}] →`, fieldObject);
                    return fieldObject;
                });
                console.log('📝 Campos rellenados:', filledFieldsArray);

                setFields(filledFieldsArray);
            })
            .catch((error) => {
                console.error("Error fetching label:", error);
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

    };
}