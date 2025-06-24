// useLabelEditor.js
import { createLabel, deleteLabel, updateLabel } from "@/services/labelService";
import { useSession } from "next-auth/react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { usePrintElement } from "@/hooks/usePrintElement";

// labelFields.js

const labelFields = {
    "product.name": { label: "Nombre del Producto", defaultValue: "Pulpo Fresco" },
    "product.species.name": { label: "Especie", defaultValue: "Octopus vulgaris" },
    "product.species.faoCode": { label: "Código FAO", defaultValue: "OCC" },
    "product.species.scientificName": { label: "Nombre Científico", defaultValue: "Octopus vulgaris" },
    "product.species.fishingGear.name": { label: "Arte de Pesca", defaultValue: "Nasas y trampas" },
    "product.species.captureZone.name": { label: "Zona de Captura", defaultValue: "FAO 27 IX.a Atlántico Nordeste" },
    "product.boxGtin": { label: "GTIN del Producto", defaultValue: "98436613931182" },
    "box.netWeight": { label: "Peso Neto", defaultValue: "20,000 kg" },
    "box.lotNumber": { label: "Número de Lote", defaultValue: "120225OCC01001" },
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


export function useLabelEditor(dataContext = defaultDataContext) {
    const [selectedLabel, setSelectedLabel] = useState(null);
    const [elements, setElements] = useState([]);
    const [labelName, setLabelName] = useState("");
    const [labelId, setLabelId] = useState(null);

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
    const { data: session } = useSession();

    const [openSelector, setOpenSelector] = useState(false);
    const [manualValues, setManualValues] = useState({});
    const [showManualDialog, setShowManualDialog] = useState(false);
    const [manualForm, setManualForm] = useState({});
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
        () => [...fieldOptions, ...manualFieldOptions],
        [manualFieldOptions]
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
                values[el.field] = labelFields[el.field].defaultValue;
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
                        values[field] = labelFields[field]?.defaultValue || '';
                        seenFields.add(field);
                    }
                });
            });
        });

        return values;
    }, [elements]);

    const handleSave = async () => {
        if (!labelName) {
            toast.error("Por favor, introduce un nombre para la etiqueta.");
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


        try {
            let result;
            if (labelId) {
                result = await updateLabel(labelId, labelName, labelFormat, token);
            } else {
                result = await createLabel(labelName, labelFormat, token);
                if (result?.data?.id) {
                    setSelectedLabel(result.data);
                }
            }

            toast.success(`Etiqueta ${selectedLabel?.id ? 'actualizada' : 'guardada'} correctamente.`);
            return result;
        } catch (err) {
            toast.error(err.message || 'Error al guardar etiqueta.');
            console.error(err);
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
                    setSelectedLabel(null);
                    setElements([]);
                    setLabelName("");
                    setLabelId(null);
                })
                .catch((err) => {
                    toast.error(err.message || 'Error al eliminar etiqueta.');
                    console.error(err);
                });
        } catch (err) {
            toast.error(err.message || 'Error al eliminar etiqueta.');
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
            width: ["text", "field", "manualField", "sanitaryRegister", "richParagraph"].includes(type) ? 120 : 80,
            height: type === "richParagraph"
                ? 60
                : ["text", "field", "manualField", "sanitaryRegister"].includes(type)
                    ? 30
                    : 80,
            fontSize: 12,
            fontWeight: "normal",
            textAlign: "left",
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
            borderWidth: type === "sanitaryRegister" ? 1 : undefined,
            color: "#000000",
        };
        setElements((prev) => [...prev, newElement]);
        setSelectedElement(newElement.id);
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
        setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } : el)));
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
        setSelectedElement(elementId);
        setIsDragging(true);
        const element = elements.find((el) => el.id === elementId);
        if (element && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            setDragOffset({
                x: (e.clientX - rect.left) / zoom - element.x,
                y: (e.clientY - rect.top) / zoom - element.y,
            });
        }
    };

    const handleResizeMouseDown = (e, elementId, corner) => {
        e.preventDefault();
        setSelectedElement(elementId);
        setIsResizing(true);
        setResizeCorner(corner);
        const element = elements.find((el) => el.id === elementId);
        if (element && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            setResizeStart({
                x: (e.clientX - rect.left) / zoom,
                y: (e.clientY - rect.top) / zoom,
                width: element.width,
                height: element.height,
                elX: element.x,
                elY: element.y,
            });
        }
    };

    const handleMouseMove = useCallback(
        (e) => {
            if ((!isDragging && !isResizing) || !selectedElement || !canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const curX = (e.clientX - rect.left) / zoom;
            const curY = (e.clientY - rect.top) / zoom;
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
                width = Math.max(10, width);
                height = Math.max(10, height);
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

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
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
            setElements(newElements);
        }
        if (jsonData.canvas) {
            setCanvasWidth(jsonData.canvas.width || canvasWidth);
            setCanvasHeight(jsonData.canvas.height || canvasHeight);
            setCanvasRotation(jsonData.canvas.rotation || 0);
        }
        return jsonData.name || "";
    };

    const handleImportJSON = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                const name = importJSON(data);
                setLabelName(name);
            } catch (err) {
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    const selectedElementData = selectedElement ? elements.find((el) => el.id === selectedElement) : null;

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
        setSelectedLabel(format);
        setCanvasWidth(format.canvas.width);
        setCanvasHeight(format.canvas.height);
        setCanvasRotation(format.canvas.rotation || 0);
        setElements(format.elements || []);
        setLabelName(labelName || "");
        setLabelId(labelId);
    };

    /* Extraer en una constante EmptyLabelData */
    const handleCreateNewLabel = () => {
        const model = { id: null, name: "", canvas: { width: 400, height: 300, rotation: 0 } };
        setSelectedLabel(model);
        setCanvasWidth(model.canvas.width);
        setCanvasHeight(model.canvas.height);
        setCanvasRotation(0);
        setElements([]);
        setLabelName("");
        setLabelId(null);
    };

    /* Podemos inicializar valores al principio y no con un useEffect */
    useEffect(() => {
        handleCreateNewLabel();
    }, []);

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
    };
}