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

    const handleMouseMove = useCallback(
        (e) => {
            if (!isDragging || !selectedElement || !canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const newX = (e.clientX - rect.left) / zoom - dragOffset.x;
            const newY = (e.clientY - rect.top) / zoom - dragOffset.y;
            const element = elements.find(el => el.id === selectedElement);
            const maxX = canvasWidth - (element?.width || 0);
            const maxY = canvasHeight - (element?.height || 0);
            updateElement(selectedElement, {
                x: Math.max(0, Math.min(maxX, newX)),
                y: Math.max(0, Math.min(maxY, newY)),
            });
        },
        [isDragging, selectedElement, dragOffset, zoom, canvasWidth, canvasHeight, elements]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

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
        addElement,
        deleteElement,
        updateElement,
        setSelectedElement,
        setZoom,
        handleMouseDown,
        exportJSON,
        getFieldName,
        getFieldValue,
        fieldOptions,
    };
}
