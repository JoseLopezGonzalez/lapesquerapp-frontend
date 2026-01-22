// useLabelEditor.js
import { createLabel, deleteLabel, updateLabel } from "@/services/labelService";
import { useSession } from "next-auth/react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { getToastTheme } from "@/customs/reactHotToast";
import { usePrintElement } from "@/hooks/usePrintElement";
import { formatDecimal, parseEuropeanNumber } from "@/helpers/formats/numbers/formatNumbers";

// labelFields.js

export const labelFields = {
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

const defaultDataContext = Object.entries(labelFields).reduce((acc, [path, { defaultValue }]) => {
    const keys = path.split(".");
    let ref = acc;
    keys.forEach((key, i) => {
        if (i === keys.length - 1) {
            ref[key] = defaultValue;
        } else {
            ref[key] = ref[key] || {};
            ref = ref[key];
        }
    });
    return acc;
}, {});

const fieldOptions = Object.entries(labelFields).map(([value, { label }]) => ({
    value,
    label,
}));

const getFieldName = (field) => labelFields[field]?.label || field;

const pxToMm = (px) => px / 3.78;

// Valor por defecto de netWeight para usar cuando no hay valor disponible
const NET_WEIGHT_DEFAULT = "20,000 kg";

// Función para formatear netWeight según el tipo de campo
const formatNetWeightField = (value, fieldName) => {
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
const normalizeElement = (element) => {
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
    if (!horizontalAlign || !["left", "center", "right", "justify"].includes(horizontalAlign)) {
        horizontalAlign = "left";
    }
    
    // Normalizar verticalAlign: "start" | "end" | "center" (nunca undefined)
    let verticalAlign = element.verticalAlign || "start";
    if (!["start", "end", "center"].includes(verticalAlign)) {
        verticalAlign = "start";
    }
    
    // Normalizar direction para líneas: "horizontal" | "vertical" (nunca undefined)
    let direction = element.direction;
    if (element.type === "line") {
        direction = direction || "horizontal";
        if (!["horizontal", "vertical"].includes(direction)) {
            direction = "horizontal";
        }
    }
    
    // Normalizar strokeWidth para líneas (siempre número positivo)
    let strokeWidth = element.strokeWidth;
    if (element.type === "line") {
        strokeWidth = typeof strokeWidth === "number" && strokeWidth > 0 ? strokeWidth : 0.1;
    }
    
    const normalized = {
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
        normalized.direction = direction;
        normalized.strokeWidth = strokeWidth;
    }
    
    return normalized;
};

/**
 * Normaliza un array de elementos
 */
const normalizeElements = (elements) => {
    if (!Array.isArray(elements)) return [];
    return elements.map(normalizeElement);
};

export function useLabelEditor(dataContext = defaultDataContext) {
    const [selectedLabel, setSelectedLabel] = useState(null);
    const [elements, setElements] = useState([]);
    const [labelName, setLabelName] = useState("");
    const [labelId, setLabelId] = useState(null);
    
    const [fieldExampleValues, setFieldExampleValues] = useState(() => {
        // Inicializar con los valores por defecto de labelFields
        const initialValues = {};
        Object.keys(labelFields).forEach(key => {
            initialValues[key] = labelFields[key].defaultValue;
        });
        return initialValues;
    });
    const [showFieldExamplesDialog, setShowFieldExamplesDialog] = useState(false);

    const [selectedElement, setSelectedElement] = useState(null);

    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeCorner, setResizeCorner] = useState(null);
    const [resizeStart, setResizeStart] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [canvasWidth, setCanvasWidth] = useState(400);
    const [canvasHeight, setCanvasHeight] = useState(300);
    const [canvasRotation, setCanvasRotation] = useState(0);
    const canvasRef = useRef(null);
    const mouseDownPosRef = useRef(null);
    const wasSelectedOnMouseDownRef = useRef(false);
    const clickedElementIdRef = useRef(null);
    const { data: session } = useSession();

    const [openSelector, setOpenSelector] = useState(false);
    const [manualValues, setManualValues] = useState({});
    const [showManualDialog, setShowManualDialog] = useState(false);
    const [manualForm, setManualForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);
    const { onPrint } = usePrintElement({ id: 'print-area', width: canvasWidth / 4, height: canvasHeight / 4 });




    const manualFieldOptions = useMemo(
        () => {
            const seen = new Set();
            return elements
                .filter(el => el.type === 'manualField')
                .filter(el => {
                    if (seen.has(el.key)) return false;
                    seen.add(el.key);
                    return true;
                })
                .map(el => ({ value: el.key, label: el.key }));
        },
        [elements]
    );

    const allFieldOptions = useMemo(
        () => {
            const baseOptions = [...fieldOptions, ...manualFieldOptions];
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

    const getDefaultValuesFromElements = useCallback(() => {
        const values = {};

        const extractPlaceholders = (text) => {
            const matches = text?.match(/{{([^}]+)}}/g) || [];
            return matches.map(m => m.slice(2, -2));
        };

        const seenFields = new Set();

        elements.forEach(el => {
            // 🔹 Campos dinámicos directos tipo "field"
            if (el.type === 'field' && el.field && labelFields[el.field] && !seenFields.has(el.field)) {
                values[el.field] = fieldExampleValues[el.field] || labelFields[el.field].defaultValue;
                seenFields.add(el.field);
            }

            // 🔹 Campos manuales tipo "manualField"
            if (el.type === 'manualField' && el.key && !seenFields.has(el.key)) {
                values[el.key] = el.sample || '';
                seenFields.add(el.key);
            }

            // 🔹 Campos usados como {{placeholders}} en QR, Barcode, Parrafos ricos...
            const contents = [el.html, el.qrContent, el.barcodeContent];
            contents.forEach(content => {
                extractPlaceholders(content).forEach(field => {
                    if (!seenFields.has(field)) {
                        values[field] = fieldExampleValues[field] || labelFields[field]?.defaultValue || '';
                        seenFields.add(field);
                    }
                });
            });
        });

        return values;
    }, [elements, fieldExampleValues]);

    const validateLabelName = (name) => {
        if (!name || name.trim().length === 0) {
            return "El nombre no puede estar vacío";
        }
        if (name.length > 100) {
            return "El nombre no puede exceder 100 caracteres";
        }
        // Permitir paréntesis para casos como "Nombre (Copia)"
        if (!/^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ()]+$/.test(name)) {
            return "El nombre contiene caracteres no permitidos";
        }
        return null;
    };

    const handleSave = async () => {
        const validationError = validateLabelName(labelName);
        if (validationError) {
            toast.error(validationError, getToastTheme());
            return;
        }
        const token = session?.user?.accessToken;

        const labelFormat = {
            elements,
            canvas: {
                width: canvasWidth,
                height: canvasHeight,
                rotation: canvasRotation,
            },
        };

        setIsSaving(true);
        try {
            let result;
            if (labelId) {
                result = await updateLabel(labelId, labelName, labelFormat, token);
            } else {
                result = await createLabel(labelName, labelFormat, token);
                if (result?.data?.id) {
                    setLabelId(result.data.id);
                    setSelectedLabel(result.data);
                }
            }

            toast.success(`Etiqueta ${labelId ? 'actualizada' : 'guardada'} correctamente.`);
            return result;
        } catch (err) {
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al guardar etiqueta.';
            toast.error(errorMessage);
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteLabel = async () => {
        const token = session?.user?.accessToken;
        try {
            if (!labelId) {
                toast.error("No hay etiqueta seleccionada para eliminar.");
                return;
            }
            deleteLabel(labelId, token)
                .then(() => {
                    toast.success("Etiqueta eliminada correctamente.");
                    clearEditor(); // Limpiar el editor completamente
                })
                .catch((err) => {
                    // Priorizar userMessage sobre message para mostrar errores en formato natural
                    const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al eliminar etiqueta.';
                    toast.error(errorMessage);
                    console.error(err);
                });
        } catch (err) {
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al eliminar etiqueta.';
            toast.error(errorMessage);
            console.error(err);
        }
    };

    /* Mejorable, se puede extraer a initial element por cada tipo */
    const addElement = (type) => {
        const newElement = {
            id: `element-${Date.now()}`,
            type,
            x: 50,
            y: 50,
            width: type === "line" 
                ? 30 
                : ["text", "field", "manualField", "sanitaryRegister", "richParagraph"].includes(type) ? 20 : 20,
            height: type === "line"
                ? 1
                : type === "richParagraph"
                    ? 15
                    : ["text", "field", "manualField", "sanitaryRegister"].includes(type)
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
            key: type === "manualField" ? "campo" : undefined,
            sample: type === "manualField" ? "Valor" : undefined,
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
        const normalizedElement = normalizeElement(newElement);
        setElements((prev) => [...prev, normalizedElement]);
        setSelectedElement(normalizedElement.id);
    };

    const deleteElement = (id) => {
        setElements((prev) => prev.filter((el) => el.id !== id));
        if (selectedElement === id) setSelectedElement(null);
    };

    const duplicateElement = (id) => {
        const el = elements.find((e) => e.id === id);
        if (!el) return;
        const copy = { ...el, id: `element-${Date.now()}`, x: el.x + 10, y: el.y + 10 };
        setElements((prev) => [...prev, copy]);
        setSelectedElement(copy.id);
    };

    const updateElement = (id, updates) => {
        setElements((prev) => {
            const updated = prev.map((el) => {
                if (el.id === id) {
                    const merged = { ...el, ...updates };
                    // Normalizar el elemento actualizado antes de guardarlo
                    // Crear un objeto completamente nuevo para forzar re-render
                    return { ...normalizeElement(merged) };
                }
                return el;
            });
            return updated;
        });
    };

    const getFieldValue = (field) => {
        const keys = field.split(".");
        let value = dataContext;
        for (const key of keys) {
            value = value?.[key];
        }
        return value?.toString() || field;
    };

    const handleMouseDown = (e, elementId) => {
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

    const handleResizeMouseDown = (e, elementId, corner) => {
        e.preventDefault();
        e.stopPropagation(); // Prevenir que el evento se propague y seleccione otros elementos
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
        (e) => {
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

    const handleMouseUp = useCallback((e) => {
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

    const handleSelectElementCard = (elementId) => {
        elementId === selectedElement ? setSelectedElement(null) : setSelectedElement(elementId);
    }

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

    const importJSON = (jsonData) => {
        if (!jsonData) return;
        if (Array.isArray(jsonData.elements)) {
            const newElements = jsonData.elements.map((el, i) => ({ id: `element-${Date.now()}-${i}`, ...el }));
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

    const validateLabelJSON = (data) => {
        if (!data || typeof data !== 'object') {
            throw new Error('El archivo JSON no es válido');
        }
        if (!Array.isArray(data.elements)) {
            throw new Error('El formato de elementos no es válido. Debe ser un array.');
        }
        if (!data.canvas || typeof data.canvas.width !== 'number' || typeof data.canvas.height !== 'number') {
            throw new Error('El formato del canvas no es válido. Debe tener width y height numéricos.');
        }
        return true;
    };

    const handleImportJSON = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                validateLabelJSON(data);
                const name = importJSON(data);
                setLabelName(name);
                toast.success('Etiqueta importada correctamente', getToastTheme());
            } catch (err) {
                const errorMessage = err.message || 'Error al importar la etiqueta';
                toast.error(errorMessage, getToastTheme());
                console.error('Error al importar etiqueta:', err);
            }
        };
        reader.readAsText(file);
    };

    // Normalizar el elemento seleccionado antes de pasarlo a la UI
    // Usar useMemo para hacerlo reactivo y forzar re-render cuando cambia
    // Crear un objeto nuevo para forzar detección de cambios en React
    const selectedElementData = useMemo(() => {
        if (!selectedElement) return null;
        const element = elements.find((el) => el.id === selectedElement);
        if (!element) return null;
        // Crear un objeto completamente nuevo para forzar detección de cambios
        return normalizeElement({ ...element });
    }, [selectedElement, elements]);

    const rotateCanvasTo = useCallback((angle) => {
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

    const handleElementRotationChange = (id, angle) => {
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

    const handleCanvasRotationChange = (angle) => {
        rotateCanvasTo(angle);
    };

    const handleSelectLabel = (label) => {
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
    };


    const handlePrint = () => {
        const manualFields = elements.filter(el => el.type === 'manualField');
        if (manualFields.length > 0) {
            const formValues = {};
            manualFields.forEach(el => {
                formValues[el.key] = manualValues[el.key] || el.sample || '';
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
    const autoFitToContent = (elementId) => {
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
        const getExampleValue = (key) => {
            // Si es un campo de netWeight con formato específico, aplicar el formato
            if (key === 'netWeightFormatted' || key === 'netWeight6digits') {
                // Usar el valor de netWeight si existe, si no usar el valor por defecto
                const baseValue = fieldExampleValues['netWeight'] || labelFields['netWeight']?.defaultValue || NET_WEIGHT_DEFAULT;
                return formatNetWeightField(baseValue, key);
            }
            // Usar fieldExampleValues primero, luego defaultValue de labelFields, o el sample para campos manuales
            return fieldExampleValues[key] || labelFields[key]?.defaultValue || '';
        };

        // Función para reemplazar placeholders en texto/HTML con valores de ejemplo
        const replacePlaceholders = (str) => {
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
            tempElement.style.fontSize = `${element.fontSize || 2.5}mm`;
            tempElement.style.fontWeight = element.fontWeight || 'normal';
            tempElement.style.fontStyle = element.fontStyle || 'normal';
            tempElement.style.textDecoration = element.textDecoration || 'none';
            tempElement.style.textTransform = element.textTransform || 'none';
            tempElement.style.color = element.color || '#000000';
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
                tempElement.textContent = element.text || '';
            } else if (element.type === 'field') {
                // Usar valores de ejemplo en lugar de getFieldValue
                const exampleValue = getExampleValue(element.field || '');
                tempElement.textContent = exampleValue || element.field || '';
            } else if (element.type === 'manualField') {
                // Usar sample si existe, sino usar valor de ejemplo
                tempElement.textContent = element.sample || getExampleValue(element.key || '') || '';
            } else if (element.type === 'richParagraph') {
                // Para richParagraph, reemplazar placeholders con valores de ejemplo antes de medir
                const htmlWithExamples = replacePlaceholders(element.html || '');
                // Limpiar fontSize inline para que use el del contenedor
                const processHtml = (html) => {
                    if (!html) return '';
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const removeFontSize = (node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.style) {
                                node.style.removeProperty('font-size');
                            }
                            Array.from(node.children).forEach(child => removeFontSize(child));
                        }
                    };
                    removeFontSize(doc.body);
                    return doc.body.innerHTML;
                };
                tempElement.innerHTML = processHtml(htmlWithExamples);
            } else if (element.type === 'sanitaryRegister') {
                // Para sanitaryRegister, construir el texto
                const parts = [];
                if (element.countryCode) parts.push(element.countryCode);
                if (element.approvalNumber) parts.push(element.approvalNumber);
                if (element.suffix) parts.push(element.suffix);
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
    };
}