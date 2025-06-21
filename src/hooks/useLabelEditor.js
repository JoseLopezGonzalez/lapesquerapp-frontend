import { useState, useRef, useCallback, useEffect } from "react";

const defaultDataContext = {
    product: {
        name: "Pulpo Fresco",
        species: {
            name: "Octopus vulgaris",
            fao_code: "OCC",
        },
        weight: "2.5 kg",
        price: "€15.99",
    },
    lot_number: "LOT-2024-001",
    expiry_date: "2024-12-31",
    origin: "Galicia, España",
    batch_id: "BCH-789",
};

export function useLabelEditor(dataContext = defaultDataContext) {
    const [elements, setElements] = useState([]);
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

    const addElement = (type) => {
        const newElement = {
            id: `element-${Date.now()}`,
            type,
            x: 50,
            y: 50,
            width: type === "text" || type === "field" || type === "manualField" ? 120 : 80,
            height: type === "text" || type === "field" || type === "manualField" ? 30 : 80,
            fontSize: 12,
            fontWeight: "normal",
            textAlign: "left",
            text: type === "text" ? "Texto ejemplo" : undefined,
            field: type === "field" ? "product.name" : undefined,
            key: type === "manualField" ? "campo" : undefined,
            sample: type === "manualField" ? "Valor" : undefined,
            qrContent: type === "qr" ? "" : undefined,
            barcodeContent: type === "barcode" ? "" : undefined,
            barcodeType: type === "barcode" ? "ean13" : undefined,
            showValue: type === "barcode" ? false : undefined,
            color: "#000000",
        };
        setElements((prev) => [...prev, newElement]);
        setSelectedElement(newElement.id);
    };

    const deleteElement = (id) => {
        setElements((prev) => prev.filter((el) => el.id !== id));
        if (selectedElement === id) {
            setSelectedElement(null);
        }
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
                    case 'se':
                        width = width + dx;
                        height = height + dy;
                        break;
                    case 'sw':
                        width = width - dx;
                        height = height + dy;
                        elX = elX + dx;
                        break;
                    case 'ne':
                        width = width + dx;
                        height = height - dy;
                        elY = elY + dy;
                        break;
                    case 'nw':
                        width = width - dx;
                        height = height - dy;
                        elX = elX + dx;
                        elY = elY + dy;
                        break;
                    default:
                        break;
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

    const exportJSON = () => {
        const jsonData = {
            elements: elements.map(({ id, ...el }) => el),
            canvas: { width: canvasWidth, height: canvasHeight, rotation: canvasRotation },
        };
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "label-structure.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const getFieldName = (field) => {
        const fieldNames = {
            "product.name": "Nombre del Producto",
            "product.species.name": "Especie",
            "product.species.fao_code": "Código FAO",
            "product.weight": "Peso",
            "product.price": "Precio",
            "lot_number": "Número de Lote",
            "expiry_date": "Fecha de Caducidad",
            "origin": "Origen",
            "batch_id": "ID de Lote",
        };
        return fieldNames[field] || field;
    };

    const fieldOptions = [
        { value: "product.name", label: "Nombre del Producto" },
        { value: "product.species.name", label: "Especie" },
        { value: "product.species.fao_code", label: "Código FAO" },
        { value: "product.weight", label: "Peso" },
        { value: "product.price", label: "Precio" },
        { value: "lot_number", label: "Número de Lote" },
        { value: "expiry_date", label: "Fecha de Caducidad" },
        { value: "origin", label: "Origen" },
        { value: "batch_id", label: "ID de Lote" },
    ];

    const selectedElementData = selectedElement ? elements.find((el) => el.id === selectedElement) : null;

    const rotateCanvasTo = useCallback((angle) => {
        const diff = (angle - canvasRotation + 360) % 360;
        if (diff === 0) return;
        setElements((prev) => prev.map((el) => {
            let { x, y, width: w, height: h, rotation = 0 } = el;
            switch (diff) {
                case 90: {
                    const newX = canvasHeight - y - h;
                    const newY = x;
                    return {
                        ...el,
                        x: newX,
                        y: newY,
                        width: h,
                        height: w,
                        rotation: (rotation + 90) % 360,
                    };
                }
                case 180:
                    return {
                        ...el,
                        x: canvasWidth - x - w,
                        y: canvasHeight - y - h,
                        rotation: (rotation + 180) % 360,
                    };
                case 270: {
                    const newX = y;
                    const newY = canvasWidth - x - w;
                    return {
                        ...el,
                        x: newX,
                        y: newY,
                        width: h,
                        height: w,
                        rotation: (rotation + 270) % 360,
                    };
                }
                default:
                    return el;
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

    return {
        elements,
        selectedElement,
        selectedElementData,
        zoom,
        canvasRef,
        canvasWidth,
        canvasHeight,
        canvasRotation,
        setCanvasWidth,
        setCanvasHeight,
        setCanvasRotation,
        rotateCanvas,
        rotateCanvasTo,
        addElement,
        deleteElement,
        duplicateElement,
        updateElement,
        setSelectedElement,
        setZoom,
        handleMouseDown,
        handleResizeMouseDown,
        exportJSON,
        getFieldName,
        getFieldValue,
        fieldOptions,
    };
}
