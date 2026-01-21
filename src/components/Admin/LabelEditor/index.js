// LabelEditor.js (Versión convertida a JavaScript desde TSX)
"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import QRConfigPanel from "./QRConfigPanel"
import BarcodeConfigPanel from "./BarcodeConfigPanel"
import RichParagraphConfigPanel from "./RichParagraphConfigPanel"

import {
    Type,
    Database,
    QrCode,
    BarcodeIcon as Barcode3,
    ImageIcon,
    Stamp,
    Pilcrow,
    Trash2,
    Download,
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Italic,
    Underline,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    AlignVerticalJustifyStart,
    AlignVerticalJustifyEnd,
    AlignVerticalJustifyCenter,
    CaseLower,
    CaseUpper,
    CaseSensitive,
    Save,
    BetweenHorizonalEnd,
    Printer,
    CopyPlus,
    Upload,
    EllipsisVertical,
    FolderSearch,
    Loader2,
    Plus,
    Settings,
    Maximize,
} from "lucide-react"
import { BoldIcon } from "@heroicons/react/20/solid"
import { EmptyState } from "@/components/Utilities/EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLabelEditor } from "@/hooks/useLabelEditor";
import LabelSelectorSheet from "./LabelSelectorSheet";
import LabelEditorPreview from "./LabelEditorPreview";
import FieldExamplesDialog from "./FieldExamplesDialog";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePrintElement } from "@/hooks/usePrintElement"
import LabelRender from "./LabelRender"
import toast from "react-hot-toast"
import { getToastTheme } from "@/customs/reactHotToast"

export default function LabelEditor() {
    const {
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
        isSaving,
        clearEditor,
        labelId,
        fieldExampleValues,
        setFieldExampleValues,
        showFieldExamplesDialog,
        setShowFieldExamplesDialog,
        autoFitToContent,

    } = useLabelEditor();

    const scrollAreaRef = useRef(null);
    const elementRefs = useRef({});
    const isClickingFromListRef = useRef(false);

    // Estado local del panel de propiedades (snapshot editable)
    // Este es la única fuente de verdad para los controles del panel
    const [activeElementState, setActiveElementState] = useState(null);

    // Sincronizar snapshot cuando cambia el elemento seleccionado
    // Solo cuando cambia el ID, no cuando cambian las propiedades
    useEffect(() => {
        if (selectedElement && selectedElementData) {
            // Crear un snapshot completo del elemento (objeto nuevo)
            setActiveElementState({ ...selectedElementData });
        } else {
            setActiveElementState(null);
        }
    }, [selectedElement]); // Solo cuando cambia el ID del elemento seleccionado

    // Función para actualizar el estado local y sincronizar con el canvas
    const updateActiveElement = useCallback((updates) => {
        if (!activeElementState) return;
        
        // Actualizar estado local primero (para UI inmediata)
        setActiveElementState((prev) => {
            if (!prev) return null;
            const updated = { ...prev, ...updates };
            // Sincronizar inmediatamente con el canvas
            updateElement(prev.id, updates);
            return updated;
        });
    }, [activeElementState, updateElement]);

    const handleOnClickElementCard = (elementId) => {
        isClickingFromListRef.current = true;
        handleSelectElementCard(elementId);
        setTimeout(() => {
            isClickingFromListRef.current = false;
        }, 100);
    }

    // Scroll automático cuando se selecciona un elemento desde la previsualización
    useEffect(() => {
        if (!selectedElement || isClickingFromListRef.current) return;
        
        const elementRef = elementRefs.current[selectedElement];
        if (elementRef && scrollAreaRef.current) {
            // Obtener el contenedor del ScrollArea (Radix UI usa un viewport interno)
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                // Calcular la posición del elemento relativa al contenedor
                const containerRect = scrollContainer.getBoundingClientRect();
                const elementRect = elementRef.getBoundingClientRect();
                
                // Calcular la posición relativa dentro del contenedor
                const relativeTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;
                const containerHeight = containerRect.height;
                const elementHeight = elementRect.height;
                
                // Calcular la posición centrada
                const targetScrollTop = relativeTop - (containerHeight / 2) + (elementHeight / 2);
                
                // Hacer scroll suave
                scrollContainer.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                });
            }
        }
    }, [selectedElement]);

    const handleOnClickDeleteLabel = () => {
        handleDeleteLabel();
    }

    const labelData = {
        name: labelName,
        elements: elements,
        canvas: {
            width: canvasWidth,
            height: canvasHeight,
            rotation: canvasRotation,
        },
    }

    const { onPrint } = usePrintElement({ id: 'print-area-id', width: canvasWidth, height: canvasHeight });

    const handleOnClickPrintLabel = () => {
        onPrint();
    }

    const borderWidthOptions = ['0.10', '0.15', '0.30', '0.50', '0.75'];


    return (
        <>
            <TooltipProvider>
                <div className="flex h-full w-full  bg-muted/30">
                    {/* Sidebar Izquierda */}
                    <div className="w-90 border-r bg-card p-4 h-full flex flex-col">
                        <div className="flex gap-2 mb-4">
                            <Button 
                                className="flex-1"
                                onClick={handleCreateNewLabel}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Crear Nueva
                            </Button>
                            <LabelSelectorSheet 
                                open={openSelector} 
                                onOpenChange={setOpenSelector} 
                                onSelect={handleSelectLabel} 
                                onNew={handleCreateNewLabel}
                                onDelete={(deletedLabelId) => {
                                    // Si se eliminó la etiqueta que estaba siendo editada, limpiar el editor
                                    if (labelId === deletedLabelId) {
                                        clearEditor();
                                    }
                                }}
                            >
                                <Button className="flex-1" variant="outline">
                                    <FolderSearch className="h-5 w-5 mr-2" />
                                    Seleccionar Etiqueta
                                </Button>
                            </LabelSelectorSheet>
                        </div>
                        <div className="space-y-4 h-full flex-1 flex flex-col min-h-0">
                            <div>
                                <h3 className="font-semibold mb-3">Añadir Elementos</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button 
                                        variant="outline" 
                                        className="justify-start gap-2" 
                                        onClick={() => addElement("text")}
                                        disabled={!selectedLabel}
                                        title={!selectedLabel ? "Selecciona una etiqueta para añadir elementos" : ""}
                                    >
                                        <Type className="w-4 h-4" />
                                        Texto Fijo
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="justify-start gap-2" 
                                        onClick={() => addElement("field")}
                                        disabled={!selectedLabel}
                                        title={!selectedLabel ? "Selecciona una etiqueta para añadir elementos" : ""}
                                    >
                                        <Database className="w-4 h-4" />
                                        Campo Dinámico
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="justify-start gap-2" 
                                        onClick={() => addElement("manualField")}
                                        disabled={!selectedLabel}
                                        title={!selectedLabel ? "Selecciona una etiqueta para añadir elementos" : ""}
                                    >
                                        <BetweenHorizonalEnd className="w-4 h-4" />
                                        Campo Manual
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="justify-start gap-2" 
                                        onClick={() => addElement("sanitaryRegister")}
                                        disabled={!selectedLabel}
                                        title={!selectedLabel ? "Selecciona una etiqueta para añadir elementos" : ""}
                                    >
                                        <Stamp className="w-4 h-4" />
                                        Registro Sanitario
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="justify-start gap-2" 
                                        onClick={() => addElement("richParagraph")}
                                        disabled={!selectedLabel}
                                        title={!selectedLabel ? "Selecciona una etiqueta para añadir elementos" : ""}
                                    >
                                        <Pilcrow className="w-4 h-4" />
                                        Párrafo
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="justify-start gap-2" 
                                        onClick={() => addElement("qr")}
                                        disabled={!selectedLabel}
                                        title={!selectedLabel ? "Selecciona una etiqueta para añadir elementos" : ""}
                                    >
                                        <QrCode className="w-4 h-4" />
                                        Código QR
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="justify-start gap-2" 
                                        onClick={() => addElement("barcode")}
                                        disabled={!selectedLabel}
                                        title={!selectedLabel ? "Selecciona una etiqueta para añadir elementos" : ""}
                                    >
                                        <Barcode3 className="w-4 h-4" />
                                        Código de Barras
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="justify-start gap-2" 
                                        onClick={() => addElement("image")}
                                        disabled={!selectedLabel}
                                        title={!selectedLabel ? "Selecciona una etiqueta para añadir elementos" : ""}
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        Imagen
                                    </Button>
                                </div>
                                {!selectedLabel && (
                                    <p className="text-xs text-muted-foreground mt-2 text-center">
                                        Selecciona una etiqueta para comenzar
                                    </p>
                                )}
                            </div>
                            <Separator />
                            <div className="flex-1 flex flex-col min-h-0">
                                {elements.length > 0 ? (
                                    <div className="h-full flex flex-col">
                                        <h3 className="font-semibold mb-3 flex items-center justify-between">
                                            <span>Elementos</span>  {elements.length}</h3>
                                        <div className="flex-1 overflow-hidden h-full">
                                            <ScrollArea ref={scrollAreaRef} className="flex-1 h-full pr-3">
                                                <div className="flex flex-col gap-2 p-2"> {/* aquí sí el gap y padding-bottom para evitar cortar por el scroll */}

                                                    {elements.map((element) => (
                                                        <div
                                                            key={element.id}
                                                            ref={(el) => {
                                                                if (el) {
                                                                    elementRefs.current[element.id] = el;
                                                                } else {
                                                                    delete elementRefs.current[element.id];
                                                                }
                                                            }}
                                                            className={`group relative p-2 rounded border cursor-pointer transition-colors ${selectedElement === element.id ? " ring-2 ring-foreground-500 " : "border-border hover:bg-foreground-50/50"
                                                                }`}
                                                            onClick={() => handleOnClickElementCard(element.id)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 w-full">
                                                                    {element.type === "text" && (
                                                                        <div className="flex flex-col items-center gap-1 w-full">
                                                                            <div className="flex items-center gap-1 justify-start w-full">
                                                                                <Type className="w-3 h-3" />
                                                                                <span className="text-sm font-medium capitalize">Texto Fijo</span>
                                                                            </div>
                                                                            <div className="flex items-center bg-foreground-100 rounded-md p-2 w-full">
                                                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{element.text}</span>
                                                                            </div>
                                                                        </div>)}
                                                                    {element.type === "field" && (
                                                                        <div className="flex flex-col items-center gap-1 w-full">
                                                                            <div className="flex items-center gap-1 justify-start w-full">
                                                                                <Database className="w-3 h-3" />
                                                                                <span className="text-sm font-medium capitalize">Campo Dinámico</span>
                                                                            </div>
                                                                            <div className="flex items-center bg-foreground-100 rounded-md p-2 w-full">
                                                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{getFieldName(element.field || "")}</span>
                                                                            </div>
                                                                        </div>)}
                                                                    {element.type === "manualField" && (
                                                                        <div className="flex flex-col items-center gap-1 w-full">
                                                                            <div className="flex items-center gap-1 justify-start w-full">
                                                                                <BetweenHorizonalEnd className="w-3 h-3" />
                                                                                <span className="text-sm font-medium capitalize">Campo Manual</span>
                                                                            </div>
                                                                            <div className="flex items-center bg-foreground-100 rounded-md p-2 w-full">
                                                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{element.sample || `{{${element.key}}}`}</span>
                                                                            </div>
                                                                        </div>)}
                                                                    {element.type === "sanitaryRegister" && (
                                                                        <div className="flex flex-col items-center gap-1 w-full">
                                                                            <div className="flex items-center gap-1 justify-start w-full">
                                                                                <Stamp className="w-3 h-3" />
                                                                                <span className="text-sm font-medium capitalize">Registro Sanitario</span>
                                                                            </div>
                                                                            <div className="flex items-center bg-foreground-100 rounded-md p-2 w-full">
                                                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{`${element.countryCode || ''} ${element.approvalNumber || ''} ${element.suffix || ''}`.trim()}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {element.type === "richParagraph" && (
                                                                        <div className="flex flex-col items-center gap-1 w-full">
                                                                            <div className="flex items-center gap-1 justify-start w-full">
                                                                                <Pilcrow className="w-3 h-3" />
                                                                                <span className="text-sm font-medium capitalize">Párrafo</span>
                                                                            </div>
                                                                            <div className="flex items-center bg-foreground-100 rounded-md p-2 w-full">
                                                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                                    {element.html ? element.html.replace(/<[^>]+>/g, '') : element.text || ''}
                                                                                </span>
                                                                            </div>
                                                                        </div>)}
                                                                    {element.type === "qr" && (
                                                                        <div className="flex items-center gap-1">
                                                                            <QrCode className="w-3 h-3" />
                                                                            <span className="text-sm font-medium capitalize">Código QR</span>
                                                                        </div>)}
                                                                    {element.type === "barcode" && (
                                                                        <div className="flex items-center gap-1">
                                                                            <Barcode3 className="w-3 h-3" />
                                                                            <span className="text-sm font-medium capitalize">Código de Barras</span>
                                                                        </div>)}
                                                                    {element.type === "image" && (
                                                                        <div className="flex items-center gap-1">
                                                                            <ImageIcon className="w-3 h-3" />
                                                                            <span className="text-sm font-medium capitalize">Imagen</span>
                                                                        </div>)}
                                                                </div>
                                                                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100">
                                                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); duplicateElement(element.id); }}>
                                                                        <CopyPlus className="w-3 h-3" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteElement(element.id); }}>
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center py-10">
                                        <EmptyState
                                            icon={<CopyPlus className="w-8 h-8" />}
                                            title="Agrega algún elemento"
                                            description="Añade elementos desde el panel izquierdo para comenzar."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Zona Central - Canvas */}
                    <div className="flex-1 flex flex-col h-full pb-5">
                        {!selectedLabel && (
                            <div className="flex-1 flex items-center justify-center">
                                <EmptyState
                                    title="Selecciona un modelo de etiqueta"
                                    description="Selecciona un modelo de etiqueta para comenzar la edición"
                                    button={{ name: "Elegir modelo", onClick: () => setOpenSelector(true) }}
                                />
                            </div>
                        )}
                        {selectedLabel && (
                            <div className="h-full flex flex-col ">
                                {/* Toolbar */}
                                <div className=" p-2 flex justify-center items-center gap-2 w-full">
                                    <div className="flex items-center gap-2">

                                        <Input
                                            type="number"
                                            value={canvasWidth}
                                            onChange={(e) => setCanvasWidth(Number(e.target.value))}
                                            className="w-16 text-center"
                                        />
                                        <span className="text-sm">x</span>
                                        <Input
                                            type="number"
                                            value={canvasHeight}
                                            onChange={(e) => setCanvasHeight(Number(e.target.value))}
                                            className="w-16 text-center"
                                        />
                                        <Button variant="outline" size="" onClick={rotateCanvas}>
                                            <RotateCcw className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <input type="file" accept="application/json" ref={fileInputRef} onChange={handleImportJSON} className="hidden" />
                                    <Separator orientation="vertical" className="h-6" />
                                    <Button 
                                        variant="outline"
                                        onClick={() => setShowFieldExamplesDialog(true)}
                                        className="gap-2"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Valores de Ejemplo
                                    </Button>
                                    <Button 
                                        variant=""
                                        onClick={handleOnClickSave}
                                        disabled={isSaving}
                                        className='bg-lime-500 hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed'>
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Guardar
                                            </>
                                        )}
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" className="w-9 h-9">
                                                <EllipsisVertical className="w-4 h-4 " />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56" align="start">
                                            <DropdownMenuLabel>
                                                Opciones
                                            </DropdownMenuLabel>
                                            <DropdownMenuGroup>
                                                <DropdownMenuItem
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="cursor-pointer"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    Importar etiqueta
                                                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => exportJSON(labelName)}
                                                    className="cursor-pointer"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Exportar etiqueta
                                                    <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={handleOnClickPrintLabel}
                                                    className="cursor-pointer"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                    Imprimir Prueba
                                                    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                                                </DropdownMenuItem>
                                            </DropdownMenuGroup>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive cursor-pointer"
                                                onClick={handleOnClickDeleteLabel}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Eliminar
                                                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>


                                </div>

                                {/* Canvas */}
                                <div className="flex-1 p-8 overflow-auto h-full flex items-center justify-center ">
                                    <div className="flex justify-center items-center h-full w-full">
                                        {zoom === 1 ? (
                                            <div className="flex flex-col items-center gap-4 mt-4">
                                                <div className='bg-orange-200 px-4'>
                                                    <div className="flex flex-col items-center  gap-4"
                                                    >
                                                        <div className="w-full h-20 bg-white rounded-b-xl border-t-0 border bg-card text-card-foreground  shadow">
                                                        </div>



                                                        <LabelEditorPreview
                                                            canvasRef={canvasRef}
                                                            zoom={zoom}
                                                            canvasWidth={canvasWidth}
                                                            canvasHeight={canvasHeight}
                                                            elements={elements}
                                                            selectedElement={selectedElement}
                                                            handleMouseDown={handleMouseDown}
                                                            handleResizeMouseDown={handleResizeMouseDown}
                                                            values={getDefaultValuesFromElements()}
                                                        />

                                                        <div className="w-full h-20 bg-white rounded-t-xl  border border-b-0 bg-card text-card-foreground  ">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full">
                                                <LabelEditorPreview
                                                    canvasRef={canvasRef}
                                                    zoom={zoom}
                                                    canvasWidth={canvasWidth}
                                                    canvasHeight={canvasHeight}
                                                    elements={elements}
                                                    selectedElement={selectedElement}
                                                    handleMouseDown={handleMouseDown}
                                                    handleResizeMouseDown={handleResizeMouseDown}
                                                    values={getDefaultValuesFromElements()}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>


                                <div className="p-2 flex flex-col justify-center items-center gap-2 w-full">
                                    <div className=" p-2 flex justify-center items-center gap-2 w-full">
                                        <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                                            <ZoomOut className="w-4 h-4" />
                                        </Button>
                                        <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                                        <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
                                            <ZoomIn className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex">
                                        <Input
                                            placeholder="Nombre"
                                            value={labelName}
                                            onChange={(e) => setLabelName(e.target.value)}
                                            className="w-48"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Panel Derecho - Propiedades */}
                    {activeElementState && (
                        <div className="w-80 p-4 overflow-y-auto">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">

                                        {activeElementState.type === "text" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <Type className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Texto</h4>
                                            </div>
                                        )}
                                        {activeElementState.type === "field" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <Database className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Campo Dinámico</h4>
                                            </div>
                                        )}
                                        {activeElementState.type === "manualField" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <BetweenHorizonalEnd className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Campo Manual</h4>
                                            </div>
                                        )}
                                        {activeElementState.type === "sanitaryRegister" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <Stamp className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Registro Sanitario</h4>
                                            </div>
                                        )}
                                        {activeElementState.type === "richParagraph" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <Pilcrow className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Párrafo</h4>
                                            </div>
                                        )}
                                        {activeElementState.type === "qr" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <QrCode className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Código QR</h4>
                                            </div>
                                        )}
                                        {activeElementState.type === "barcode" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <Barcode3 className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Código de Barras</h4>
                                            </div>
                                        )}
                                        {activeElementState.type === "image" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <ImageIcon className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Imagen</h4>
                                            </div>
                                        )}
                                        <Button
                                            className='text-red-500 hover:bg-red-500/10 hover:text-red-600'
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteElement(activeElementState.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-6">

                                    {/* Campo dinámico */}
                                    {activeElementState.type === "field" && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Campo dinámico</h4>
                                            <Select
                                                value={activeElementState.field}
                                                onValueChange={(value) => updateActiveElement({ field: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {fieldOptions.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                                                <strong></strong> {getFieldValue(activeElementState.field || "")}
                                            </div>
                                        </div>
                                    )}

                                    {activeElementState.type === "manualField" && (
                                        <div className="space-y-2">
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Nombre del campo</h4>
                                                <Input
                                                    value={activeElementState.key}
                                                    onChange={(e) => {
                                                        const oldValue = activeElementState.key || ''
                                                        const newValue = e.target.value
                                                        
                                                        // Filtrar solo letras
                                                        const filteredValue = newValue.replace(/[^a-zA-Z]/g, '')
                                                        
                                                        // Si el valor filtrado es diferente al nuevo valor, hay caracteres inválidos
                                                        if (filteredValue !== newValue) {
                                                            // Encontrar los caracteres que se eliminaron
                                                            const invalidChars = newValue.split('').filter(char => !/[a-zA-Z]/.test(char))
                                                            
                                                            // Agrupar por tipo de carácter
                                                            const charTypes = {
                                                                espacios: invalidChars.filter(c => c === ' ').length > 0,
                                                                numeros: invalidChars.some(c => /[0-9]/.test(c)),
                                                                tildes: invalidChars.some(c => /[áéíóúñÁÉÍÓÚÑ]/.test(c)),
                                                                guiones: invalidChars.some(c => c === '-'),
                                                                guionesBajos: invalidChars.some(c => c === '_'),
                                                                puntos: invalidChars.some(c => c === '.'),
                                                                comas: invalidChars.some(c => c === ','),
                                                                dosPuntos: invalidChars.some(c => c === ':'),
                                                                otros: invalidChars.filter(c => 
                                                                    c !== ' ' && 
                                                                    !/[0-9]/.test(c) && 
                                                                    !/[áéíóúñÁÉÍÓÚÑ]/.test(c) &&
                                                                    c !== '-' && c !== '_' && c !== '.' && c !== ',' && c !== ':'
                                                                )
                                                            }
                                                            
                                                            const messages = []
                                                            if (charTypes.espacios) messages.push('espacios')
                                                            if (charTypes.numeros) messages.push('números')
                                                            if (charTypes.tildes) messages.push('letras con tilde (á, é, í, ó, ú, ñ)')
                                                            if (charTypes.guiones) messages.push('guiones (-)')
                                                            if (charTypes.guionesBajos) messages.push('guiones bajos (_)')
                                                            if (charTypes.puntos) messages.push('puntos (.)')
                                                            if (charTypes.comas) messages.push('comas (,)')
                                                            if (charTypes.dosPuntos) messages.push('dos puntos (:)')
                                                            if (charTypes.otros.length > 0) {
                                                                const otrosChars = [...new Set(charTypes.otros)].map(c => `"${c}"`).join(', ')
                                                                messages.push(`otros caracteres (${otrosChars})`)
                                                            }
                                                            
                                                            toast.error(
                                                                `Solo se permiten letras (a-z, A-Z). No se permiten: ${messages.join(', ')}`,
                                                                getToastTheme()
                                                            )
                                                        }
                                                        
                                                        // Actualizar con el valor filtrado
                                                        updateActiveElement({ key: filteredValue })
                                                    }}
                                                    placeholder="Solo letras"
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Valor de prueba</h4>
                                                <Input
                                                    value={activeElementState.sample || ''}
                                                    onChange={(e) => updateActiveElement({ sample: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {activeElementState.type === "sanitaryRegister" && (
                                        <div className="space-y-2">
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Código de país</h4>
                                                <Input
                                                    value={activeElementState.countryCode || ''}
                                                    onChange={(e) => updateActiveElement({ countryCode: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Número de aprobación</h4>
                                                <Input
                                                    value={activeElementState.approvalNumber || ''}
                                                    onChange={(e) => updateActiveElement({ approvalNumber: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Sufijo</h4>
                                                <Input
                                                    value={activeElementState.suffix || ''}
                                                    onChange={(e) => updateActiveElement({ suffix: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-xs text-muted-foreground">Color Borde</span>
                                                    <Input
                                                        type="color"
                                                        value={activeElementState.borderColor || '#000000'}
                                                        onChange={(e) => updateActiveElement({ borderColor: e.target.value })}
                                                        className="w-10 h-8 p-0"
                                                    />
                                                </div>
                                                {/*  <div className="flex flex-col flex-1">
                                                    <span className="text-xs text-muted-foreground">Grosor</span>
                                                    <Input
                                                        type="number"
                                                        value={activeElementState.borderWidth || 1}
                                                        onChange={(e) => updateActiveElement({ borderWidth: Number(e.target.value) })}
                                                    />
                                                </div> */}
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-xs text-muted-foreground">Grosor</span>
                                                    <Select
                                                        value={String(activeElementState.borderWidth || '0.10')}
                                                        onValueChange={(value) =>
                                                            updateActiveElement({ borderWidth: value })
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {borderWidthOptions.map((value) => (
                                                                <SelectItem key={value} value={value}>
                                                                    {value}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeElementState.type === "richParagraph" && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Párrafo</h4>
                                            <RichParagraphConfigPanel
                                                key={activeElementState.id}
                                                html={activeElementState.html || ''}
                                                onChange={(val) => updateActiveElement({ html: val })}
                                                fieldOptions={allFieldOptions}
                                            />
                                        </div>
                                    )}

                                    {activeElementState.type === "text" && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Contenido</h4>
                                            <div className="flex w-full gap-2 items-center justify-between">
                                                <Input
                                                    id="text"
                                                    value={activeElementState.text}
                                                    onChange={(e) => updateActiveElement({ text: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {activeElementState.type === "qr" && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Contenido QR</h4>
                                            <QRConfigPanel
                                                value={activeElementState.qrContent || ""}
                                                onChange={(val) => updateActiveElement({ qrContent: val })}
                                                fieldOptions={allFieldOptions}
                                            />
                                        </div>
                                    )}

                                    {activeElementState.type === "barcode" && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Código de Barras</h4>
                                            <BarcodeConfigPanel
                                                value={activeElementState.barcodeContent || ""}
                                                onChange={(val) => updateActiveElement({ barcodeContent: val })}
                                                fieldOptions={allFieldOptions}
                                                type={activeElementState.barcodeType || 'ean13'}
                                                onTypeChange={(val) => updateActiveElement({ barcodeType: val })}
                                                getFieldValue={getFieldValue}
                                                showValue={!!activeElementState.showValue}
                                                onShowValueChange={(val) => updateActiveElement({ showValue: val })}
                                            />
                                        </div>
                                    )}

                                    {(activeElementState.type === "text" || activeElementState.type === "field" || activeElementState.type === "manualField" || activeElementState.type === "qr" || activeElementState.type === "barcode" || activeElementState.type === "sanitaryRegister" || activeElementState.type === "richParagraph") && (
                                        <Separator className="my-4" />
                                    )}

                                    {/* Layout */}
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">
                                            Formato
                                        </h4>
                                        <div className="flex flex-col items-center w-full gap-3">
                                            <div className="flex w-full gap-2 items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    Posición
                                                </span>
                                                <div className="flex items-center gap-2 max-w-36">
                                                    <Input
                                                        id="x"
                                                        type="number"
                                                        value={Math.round(activeElementState.x)}
                                                        onChange={(e) => updateActiveElement({ x: Number(e.target.value) })}
                                                    />
                                                    <Input
                                                        id="y"
                                                        type="number"
                                                        value={Math.round(activeElementState.y)}
                                                        onChange={(e) => updateActiveElement({ y: Number(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex w-full gap-2 items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    Tamaño
                                                </span>
                                                <div className="flex items-center gap-2 max-w-36">
                                                    <Input
                                                        id="width"
                                                        type="number"
                                                        value={activeElementState.width}
                                                        onChange={(e) => updateActiveElement({ width: Number(e.target.value) })}
                                                    />
                                                    <Input
                                                        id="height"
                                                        type="number"
                                                        value={activeElementState.height}
                                                        onChange={(e) => updateActiveElement({ height: Number(e.target.value) })}
                                                    />
                                                </div>

                                            </div>
                                            {(activeElementState.type === "text" || activeElementState.type === "field" || activeElementState.type === "manualField" || activeElementState.type === "richParagraph" || activeElementState.type === "sanitaryRegister") && (
                                                <div className="flex w-full gap-2 items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">
                                                        Ajustar al contenido
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => autoFitToContent(activeElementState.id)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Maximize className="w-4 h-4" />
                                                        <span className="text-xs">Ajustar</span>
                                                    </Button>
                                                </div>
                                            )}
                                            {/* Rotate */}
                                            <div className="flex w-full gap-2 items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    Rotación
                                                </span>

                                                {/* Select angle */}
                                                <Select
                                                    value={String(activeElementState.rotation || 0)}
                                                    onValueChange={(value) => handleElementRotationChange(activeElementState.id, Number(value))}
                                                >
                                                    <SelectTrigger className="w-24">
                                                        <SelectValue placeholder="Ángulo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">0°</SelectItem>
                                                        <SelectItem value="90">90°</SelectItem>
                                                        <SelectItem value="180">180°</SelectItem>
                                                        <SelectItem value="270">270°</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex w-full gap-2 items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    Alineación
                                                </span>
                                                <div className="flex items-center gap-2 ">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant={activeElementState.verticalAlign === "start" ? "default" : "outline"} size="sm" className="w-8" onClick={() => updateActiveElement({ verticalAlign: "start" })}><AlignVerticalJustifyStart className="w-4 h-4" /></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Alinear arriba</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant={activeElementState.verticalAlign === "end" ? "default" : "outline"} size="sm" className="w-8" onClick={() => updateActiveElement({ verticalAlign: "end" })}><AlignVerticalJustifyEnd className="w-4 h-4" /></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Alinear abajo</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant={activeElementState.verticalAlign === "center" ? "default" : "outline"} size="sm" className="w-8" onClick={() => updateActiveElement({ verticalAlign: "center" })}><AlignVerticalJustifyCenter className="w-4 h-4" /></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Centro vertical</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            <div className="flex w-full gap-2 items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    {/* space code */} &nbsp;
                                                </span>
                                                <div className="flex items-center gap-2 ">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant={activeElementState.horizontalAlign === "left" ? "default" : "outline"} size="sm" className="w-8" onClick={() => updateActiveElement({ horizontalAlign: "left" })}><AlignLeft className="w-4 h-4" /></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Alinear a la izquierda</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant={activeElementState.horizontalAlign === "center" ? "default" : "outline"} size="sm" className="w-8" onClick={() => updateActiveElement({ horizontalAlign: "center" })}><AlignCenter className="w-4 h-4" /></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Alinear al centro</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant={activeElementState.horizontalAlign === "right" ? "default" : "outline"} size="sm" className="w-8" onClick={() => updateActiveElement({ horizontalAlign: "right" })}><AlignRight className="w-4 h-4" /></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Alinear a la derecha</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant={activeElementState.horizontalAlign === "justify" ? "default" : "outline"} size="sm" className="w-8" onClick={() => updateActiveElement({ horizontalAlign: "justify" })}><AlignJustify className="w-4 h-4" /></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Justificar</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </div>
                                    </div>



                                    {(activeElementState.type === "text" || activeElementState.type === "field" || activeElementState.type === "manualField" || activeElementState.type === "sanitaryRegister" || activeElementState.type === "richParagraph") && (
                                        <Separator className="my-4" />
                                    )}

                                    {/* Text properties */}
                                    {(activeElementState.type === "text" || activeElementState.type === "field" || activeElementState.type === "manualField" || activeElementState.type === "sanitaryRegister" || activeElementState.type === "richParagraph" || activeElementState.type === "barcode"

                                    ) && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Texto</h4>
                                                <div className="flex flex-col items-center w-full gap-3">
                                                    <div className="flex w-full gap-2 items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">
                                                            Tamaño
                                                        </span>
                                                        <Select
                                                            key={`fontSize-${activeElementState.id}-${activeElementState.fontSize}`}
                                                            value={activeElementState.fontSize?.toString() || '2.5'}
                                                            onValueChange={(value) => {
                                                                updateActiveElement({ fontSize: Number(value) });
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-24">
                                                                <SelectValue placeholder="Tamaño" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="1">1</SelectItem>
                                                                <SelectItem value="1.5">1.5</SelectItem>
                                                                <SelectItem value="2">2</SelectItem>
                                                                <SelectItem value="2.5">2.5</SelectItem>
                                                                <SelectItem value="3">3</SelectItem>
                                                                <SelectItem value="3.5">3.5</SelectItem>
                                                                <SelectItem value="4">4</SelectItem>
                                                                <SelectItem value="4.5">4.5</SelectItem>
                                                                <SelectItem value="5">5</SelectItem>
                                                                <SelectItem value="5.5">5.5</SelectItem>
                                                                <SelectItem value="6">6</SelectItem>
                                                                <SelectItem value="6.5">6.5</SelectItem>
                                                                <SelectItem value="7">7</SelectItem>
                                                                <SelectItem value="8">8</SelectItem>
                                                                <SelectItem value="10">10</SelectItem>
                                                                <SelectItem value="12">12</SelectItem>
                                                                <SelectItem value="14">14</SelectItem>
                                                                <SelectItem value="16">16</SelectItem>
                                                                <SelectItem value="18">18</SelectItem>
                                                                <SelectItem value="20">20</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex w-full gap-2 items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">
                                                            Color
                                                        </span>
                                                        <Input
                                                            id="color"
                                                            type="color"
                                                            value={activeElementState.color}
                                                            onChange={(e) => updateActiveElement({ color: e.target.value })}
                                                            className="w-9 h-9 p-1 cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="flex w-full gap-2 items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">
                                                            Estilos
                                                        </span>
                                                        <div className="flex items-center gap-2 w-fit">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant={activeElementState.fontWeight === "bold" ? "default" : "outline"}
                                                                        size="sm"
                                                                        className="w-8"
                                                                        onClick={() => {
                                                                            updateActiveElement({ fontWeight: activeElementState.fontWeight === "bold" ? "normal" : "bold" });
                                                                        }}
                                                                    >
                                                                        <BoldIcon className="w-4 h-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Negrita</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant={activeElementState.fontStyle === "italic" ? "default" : "outline"}
                                                                        size="sm"
                                                                        className="w-8"
                                                                        onClick={() => {
                                                                            updateActiveElement({ fontStyle: activeElementState.fontStyle === "italic" ? "normal" : "italic" });
                                                                        }}
                                                                    >
                                                                        <Italic className="w-4 h-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Cursiva</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant={activeElementState.textDecoration === "underline" ? "default" : "outline"}
                                                                        size="sm"
                                                                        className="w-8"
                                                                        onClick={() => {
                                                                            updateActiveElement({ textDecoration: activeElementState.textDecoration === "underline" ? "none" : "underline" });
                                                                        }}
                                                                    >
                                                                        <Underline className="w-4 h-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Subrayado</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant={activeElementState.textDecoration === "line-through" ? "default" : "outline"}
                                                                        size="sm"
                                                                        className="w-8"
                                                                        onClick={() => {
                                                                            updateActiveElement({ textDecoration: activeElementState.textDecoration === "line-through" ? "none" : "line-through" });
                                                                        }}
                                                                    >
                                                                        <Strikethrough className="w-4 h-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Tachado</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                    <div className="flex w-full gap-2 items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">
                                                            Caracter
                                                        </span>
                                                        <div className="flex items-center gap-2 w-fit">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant={activeElementState.textTransform === "uppercase" ? "default" : "outline"}
                                                                        size="sm"
                                                                        className="w-8 p-0"
                                                                        onClick={() => updateActiveElement({ textTransform: activeElementState.textTransform === "uppercase" ? "none" : "uppercase" })}
                                                                    >
                                                                        <CaseUpper className="w-5 h-5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Mayúsculas</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant={activeElementState.textTransform === "lowercase" ? "default" : "outline"}
                                                                        size="sm"
                                                                        className="w-8"
                                                                        onClick={() => updateActiveElement({ textTransform: activeElementState.textTransform === "lowercase" ? "none" : "lowercase" })}
                                                                    >
                                                                        <CaseLower className="w-5 h-5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Minúsculas</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant={activeElementState.textTransform === "capitalize" ? "default" : "outline"}
                                                                        size="sm"
                                                                        className="w-8"
                                                                        onClick={() => updateActiveElement({ textTransform: activeElementState.textTransform === "capitalize" ? "none" : "capitalize" })}
                                                                    >
                                                                        <CaseSensitive className="w-5 h-5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Capitalizar</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Impresión */}

                    <div id="print-area-id" className="hidden print:block">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="page ">
                                <LabelRender
                                    label={labelData}
                                    values={getDefaultValuesFromElements()}
                                />
                            </div>
                        ))}
                    </div>


                </div>
                <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Completa campos manuales</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {Object.keys(manualForm).map((key) => (
                                <div key={key} className="flex flex-col gap-1">
                                    <Label className="text-sm">{key}</Label>
                                    <Input value={manualForm[key]} onChange={(e) => setManualForm({ ...manualForm, [key]: e.target.value })} />
                                </div>
                            ))}
                        </div>
                        <DialogFooter className="pt-4">
                            <Button onClick={handleConfirmManual}>Imprimir</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <FieldExamplesDialog
                    open={showFieldExamplesDialog}
                    onClose={() => setShowFieldExamplesDialog(false)}
                    fieldExampleValues={fieldExampleValues}
                    setFieldExampleValues={setFieldExampleValues}
                />
            </TooltipProvider >
        </>
    )
}
