// LabelEditor.js (Versión convertida a JavaScript desde TSX)
"use client"
import { CgFormatUppercase } from "react-icons/cg";

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
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
    Move,
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
    Ticket,
    FolderSearch,
} from "lucide-react"
import { BoldIcon } from "@heroicons/react/20/solid"
import { EmptyState } from "@/components/Utilities/EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLabelEditor } from "@/hooks/useLabelEditor";
import { usePrintElement } from "@/hooks/usePrintElement";
import LabelSelectorSheet from "./LabelSelectorSheet";
import LabelEditorPreview from "./LabelEditorPreview";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@nextui-org/react";

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
        setSelectedElement,
        setZoom,
        handleMouseDown,
        handleResizeMouseDown,
        duplicateElement,
        exportJSON,
        getFieldName,
        getFieldValue,
        fieldOptions,
        canvasWidth,
        canvasHeight,
        canvasRotation,
        setCanvasWidth,
        setCanvasHeight,
        rotateCanvas,
        rotateCanvasTo,
        setElements,
        importJSON,
        handleSave,
    } = useLabelEditor();

    const [manualValues, setManualValues] = useState({});
    const [showManualDialog, setShowManualDialog] = useState(false);
    const [manualForm, setManualForm] = useState({});
    const [selectedLabel, setSelectedLabel] = useState(null);
    const [openSelector, setOpenSelector] = useState(false);
    const [labelName, setLabelName] = useState("");
    const fileInputRef = useRef(null);

    const labelData = {
        elements,
        canvas: { width: canvasWidth, height: canvasHeight, rotation: canvasRotation },
    };

    const { onPrint } = usePrintElement({ id: 'print-area', width: canvasWidth / 4, height: canvasHeight / 4 });

    const handleOnClickSave = () => {
        handleSave(labelData?.id, labelName);
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

    const handleSelectLabel = (model) => {
        setSelectedLabel(model);
        setCanvasWidth(model.canvas.width);
        setCanvasHeight(model.canvas.height);
        setElements(model.elements || []);
        setLabelName(model.name || "");
    };

    const handleCreateNewLabel = () => {
        const model = { id: Date.now().toString(), name: "", width: 400, height: 300 };
        setSelectedLabel(model);
        setCanvasWidth(model.width);
        setCanvasHeight(model.height);
        setElements([]);
        setLabelName("");
    };

    useEffect(() => {
        handleCreateNewLabel();
    }, []);


    return (
        <>
            <TooltipProvider>
                <div className="flex h-full w-full  bg-muted/30">
                    {/* Sidebar Izquierda */}
                    <div className="w-90 border-r bg-card p-4 h-full flex flex-col">
                        <LabelSelectorSheet open={openSelector} onOpenChange={setOpenSelector} onSelect={handleSelectLabel}>
                            <Button className="w-full mb-4">
                                <FolderSearch className=" h-5 w-5" />
                                Seleccionar Etiqueta
                            </Button>
                        </LabelSelectorSheet>
                        <div className="space-y-4 h-full flex-1 flex flex-col min-h-0">
                            <div>
                                <h3 className="font-semibold mb-3">Añadir Elementos</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("text")}>
                                        <Type className="w-4 h-4" />
                                        Texto Fijo
                                    </Button>
                                    <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("field")}>
                                        <Database className="w-4 h-4" />
                                        Campo Dinámico
                                    </Button>
                                    <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("manualField")}>
                                        <BetweenHorizonalEnd className="w-4 h-4" />
                                        Campo Manual
                                    </Button>
                                    <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("sanitaryRegister")}>
                                        <Stamp className="w-4 h-4" />
                                        Registro Sanitario
                                    </Button>
                                    <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("richParagraph")}>
                                        <Pilcrow className="w-4 h-4" />
                                        Párrafo
                                    </Button>
                                    <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("qr")}>
                                        <QrCode className="w-4 h-4" />
                                        Código QR
                                    </Button>
                                    <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("barcode")}>
                                        <Barcode3 className="w-4 h-4" />
                                        Código de Barras
                                    </Button>
                                    <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("image")}>
                                        <ImageIcon className="w-4 h-4" />
                                        Imagen
                                    </Button>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex-1 flex flex-col min-h-0">
                                {elements.length > 0 ? (
                                    <div className="h-full flex flex-col">
                                        <h3 className="font-semibold mb-3 flex items-center justify-between">
                                            <span>Elementos</span>  {elements.length}</h3>
                                        <div className="flex-1 overflow-hidden h-full">
                                            <ScrollArea className="flex-1 h-full pr-3">
                                                <div className="flex flex-col gap-2 p-2"> {/* aquí sí el gap y padding-bottom para evitar cortar por el scroll */}

                                                    {elements.map((element) => (
                                                        <div
                                                            key={element.id}
                                                            className={`group relative p-2 rounded border cursor-pointer transition-colors ${selectedElement === element.id ? " ring-2 ring-foreground-500 " : "border-border hover:bg-foreground-50/50"
                                                                }`}
                                                            onClick={() => setSelectedElement(element.id)}
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
                                    <Button variant=""
                                        onClick={handleOnClickSave}
                                        className='bg-lime-500  hover:bg-lime-400'>
                                        <Save className="w-4 h-4 " />
                                        Guardar
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
                                                    onClick={handlePrint}
                                                    className="cursor-pointer"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                    Imprimir Prueba
                                                    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                                                </DropdownMenuItem>
                                            </DropdownMenuGroup>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                                                <Trash2 className="w-4 h-4" />
                                                Eliminar
                                                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>


                                </div>

                                {/* Canvas */}
                                <div className="flex-1 p-8 overflow-auto h-full flex items-center justify-center ">
                                    <div className="flex justify-center items-center h-full">
                                        <div className="flex flex-col items-center gap-4 mt-4  ">
                                            <div className='bg-orange-200 px-4'>
                                                <div className="flex flex-col items-center  gap-4"
                                                >
                                                    <div className="w-full h-20 bg-white rounded-b-xl border-t-0 border bg-card text-card-foreground  shadow">
                                                    </div>

                                                    {/* <div
                                                            ref={canvasRef}
                                                            id="print-area"
                                                            className="relative bg-white border-2 border-dashed border-border shadow-lg rounded-lg"
                                                            style={{
                                                                width: canvasWidth,
                                                                height: canvasHeight,
                                                                transform: `scale(${zoom})`,
                                                                transformOrigin: "top left",
                                                            }}
                                                        >
                                                            {elements.map((element) => (
                                                                <div
                                                                    key={element.id}
                                                                    className={`absolute cursor-move border transition-colors ${selectedElement === element.id
                                                                        ? "border-primary bg-primary/5 "
                                                                        : "border-transparent hover:border-muted-foreground/30"}`}
                                                                    style={{
                                                                        left: element.x,
                                                                        top: element.y,
                                                                        width: (element.rotation || 0) % 180 === 0 ? element.width : element.height,
                                                                        height: (element.rotation || 0) % 180 === 0 ? element.height : element.width,
                                                                        transform: `rotate(${element.rotation || 0}deg)`,
                                                                        transformOrigin: "center",
                                                                    }}
                                                                    onMouseDown={(e) => handleMouseDown(e, element.id)}
                                                                >
                                                                    {selectedElement === element.id && (
                                                                        <>
                                                                            <div onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'nw')} className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full cursor-nwse-resize"></div>
                                                                            <div onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'ne')} className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full cursor-nesw-resize"></div>
                                                                            <div onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'sw')} className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full cursor-nesw-resize"></div>
                                                                            <div onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'se')} className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full cursor-nwse-resize"></div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div> */}

                                                    <LabelEditorPreview
                                                        canvasRef={canvasRef}
                                                        zoom={zoom}
                                                        canvasWidth={canvasWidth}
                                                        canvasHeight={canvasHeight}
                                                        elements={elements}
                                                        selectedElement={selectedElement}
                                                        handleMouseDown={handleMouseDown}
                                                        handleResizeMouseDown={handleResizeMouseDown}
                                                        getFieldValue={getFieldValue}
                                                        manualValues={manualValues}
                                                    />

                                                    {/* <LabelRender label={labelData} getFieldValue={getFieldValue} manualValues={manualValues} /> */}




                                                    <div className="w-full h-20 bg-white rounded-t-xl  border border-b-0 bg-card text-card-foreground  ">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

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
                    <div className="w-80 p-4 overflow-y-auto">
                        {selectedElementData && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">

                                        {selectedElementData.type === "text" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <Type className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Texto</h4>
                                            </div>
                                        )}
                                        {selectedElementData.type === "field" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <Database className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Campo Dinámico</h4>
                                            </div>
                                        )}
                                        {selectedElementData.type === "manualField" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <BetweenHorizonalEnd className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Campo Manual</h4>
                                            </div>
                                        )}
                                        {selectedElementData.type === "sanitaryRegister" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <Stamp className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Registro Sanitario</h4>
                                            </div>
                                        )}
                                        {selectedElementData.type === "richParagraph" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <Pilcrow className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Párrafo</h4>
                                            </div>
                                        )}
                                        {selectedElementData.type === "qr" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <QrCode className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Código QR</h4>
                                            </div>
                                        )}
                                        {selectedElementData.type === "barcode" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <Barcode3 className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Código de Barras</h4>
                                            </div>
                                        )}
                                        {selectedElementData.type === "image" && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <ImageIcon className="w-4 h-4" />
                                                <h4 className="capitalize text-xl font-normal">Imagen</h4>
                                            </div>
                                        )}
                                        <Button
                                            className='text-red-500 hover:bg-red-500/10 hover:text-red-600'
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteElement(selectedElementData.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-6">

                                    {/* Campo dinámico */}
                                    {selectedElementData.type === "field" && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Campo dinámico</h4>
                                            <Select
                                                value={selectedElementData.field}
                                                onValueChange={(value) => updateElement(selectedElementData.id, { field: value })}
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
                                                <strong></strong> {getFieldValue(selectedElementData.field || "")}
                                            </div>
                                        </div>
                                    )}

                                    {selectedElementData.type === "manualField" && (
                                        <div className="space-y-2">
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Nombre del campo</h4>
                                                <Input
                                                    value={selectedElementData.key}
                                                    onChange={(e) => updateElement(selectedElementData.id, { key: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Valor de prueba</h4>
                                                <Input
                                                    value={selectedElementData.sample || ''}
                                                    onChange={(e) => updateElement(selectedElementData.id, { sample: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedElementData.type === "sanitaryRegister" && (
                                        <div className="space-y-2">
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Código de país</h4>
                                                <Input
                                                    value={selectedElementData.countryCode || ''}
                                                    onChange={(e) => updateElement(selectedElementData.id, { countryCode: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Número de aprobación</h4>
                                                <Input
                                                    value={selectedElementData.approvalNumber || ''}
                                                    onChange={(e) => updateElement(selectedElementData.id, { approvalNumber: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Sufijo</h4>
                                                <Input
                                                    value={selectedElementData.suffix || ''}
                                                    onChange={(e) => updateElement(selectedElementData.id, { suffix: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-xs text-muted-foreground">Color Borde</span>
                                                    <Input
                                                        type="color"
                                                        value={selectedElementData.borderColor || '#000000'}
                                                        onChange={(e) => updateElement(selectedElementData.id, { borderColor: e.target.value })}
                                                        className="w-10 h-8 p-0"
                                                    />
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-xs text-muted-foreground">Grosor</span>
                                                    <Input
                                                        type="number"
                                                        value={selectedElementData.borderWidth || 1}
                                                        onChange={(e) => updateElement(selectedElementData.id, { borderWidth: Number(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedElementData.type === "richParagraph" && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Párrafo</h4>
                                            <RichParagraphConfigPanel
                                                html={selectedElementData.html || ''}
                                                onChange={(val) => updateElement(selectedElementData.id, { html: val })}
                                            />
                                        </div>
                                    )}

                                    {selectedElementData.type === "text" && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Contenido</h4>
                                            <div className="flex w-full gap-2 items-center justify-between">
                                                <Input
                                                    id="text"
                                                    value={selectedElementData.text}
                                                    onChange={(e) => updateElement(selectedElementData.id, { text: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedElementData.type === "qr" && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Contenido QR</h4>
                                            <QRConfigPanel
                                                value={selectedElementData.qrContent || ""}
                                                onChange={(val) => updateElement(selectedElementData.id, { qrContent: val })}
                                                fieldOptions={fieldOptions}
                                            />
                                        </div>
                                    )}

                                    {selectedElementData.type === "barcode" && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Código de Barras</h4>
                                            <BarcodeConfigPanel
                                                value={selectedElementData.barcodeContent || ""}
                                                onChange={(val) => updateElement(selectedElementData.id, { barcodeContent: val })}
                                                fieldOptions={fieldOptions}
                                                type={selectedElementData.barcodeType || 'ean13'}
                                                onTypeChange={(val) => updateElement(selectedElementData.id, { barcodeType: val })}
                                                getFieldValue={getFieldValue}
                                                showValue={!!selectedElementData.showValue}
                                                onShowValueChange={(val) => updateElement(selectedElementData.id, { showValue: val })}
                                            />
                                        </div>
                                    )}

                                    {(selectedElementData.type === "text" || selectedElementData.type === "field" || selectedElementData.type === "manualField" || selectedElementData.type === "qr" || selectedElementData.type === "barcode" || selectedElementData.type === "sanitaryRegister" || selectedElementData.type === "richParagraph") && (
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
                                                        value={Math.round(selectedElementData.x)}
                                                        onChange={(e) => updateElement(selectedElementData.id, { x: Number(e.target.value) })}
                                                    />
                                                    <Input
                                                        id="y"
                                                        type="number"
                                                        value={Math.round(selectedElementData.y)}
                                                        onChange={(e) => updateElement(selectedElementData.id, { y: Number(e.target.value) })}
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
                                                        value={selectedElementData.width}
                                                        onChange={(e) => updateElement(selectedElementData.id, { width: Number(e.target.value) })}
                                                    />
                                                    <Input
                                                        id="height"
                                                        type="number"
                                                        value={selectedElementData.height}
                                                        onChange={(e) => updateElement(selectedElementData.id, { height: Number(e.target.value) })}
                                                    />
                                                </div>

                                            </div>
                                            {/* Rotate */}
                                            <div className="flex w-full gap-2 items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    Rotación
                                                </span>

                                                {/* Select angle */}
                                                <Select
                                                    value={String(selectedElementData.rotation || 0)}
                                                    onValueChange={(value) => handleElementRotationChange(selectedElementData.id, Number(value))}
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
                                                            <Toggle variant="outline" size="sm" className="w-8" pressed={selectedElementData.verticalAlign === "start"} onPressedChange={() => updateElement(selectedElementData.id, { verticalAlign: "start" })}><AlignVerticalJustifyStart className="w-4 h-4" /></Toggle>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Alinear arriba</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Toggle variant="outline" size="sm" className="w-8" pressed={selectedElementData.verticalAlign === "end"} onPressedChange={() => updateElement(selectedElementData.id, { verticalAlign: "end" })}><AlignVerticalJustifyEnd className="w-4 h-4" /></Toggle>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Alinear abajo</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Toggle variant="outline" size="sm" className="w-8" pressed={selectedElementData.verticalAlign === "center"} onPressedChange={() => updateElement(selectedElementData.id, { verticalAlign: "center" })}><AlignVerticalJustifyCenter className="w-4 h-4" /></Toggle>
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
                                                            <Toggle variant="outline" size="sm" className="w-8" pressed={selectedElementData.horizontalAlign === "left"} onPressedChange={() => updateElement(selectedElementData.id, { horizontalAlign: "left" })}><AlignLeft className="w-4 h-4" /></Toggle>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Alinear a la izquierda</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Toggle variant="outline" size="sm" className="w-8" pressed={selectedElementData.horizontalAlign === "center"} onPressedChange={() => updateElement(selectedElementData.id, { horizontalAlign: "center" })}><AlignCenter className="w-4 h-4" /></Toggle>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Alinear al centro</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Toggle variant="outline" size="sm" className="w-8" pressed={selectedElementData.horizontalAlign === "right"} onPressedChange={() => updateElement(selectedElementData.id, { horizontalAlign: "right" })}><AlignRight className="w-4 h-4" /></Toggle>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Alinear a la derecha</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Toggle variant="outline" size="sm" className="w-8" pressed={selectedElementData.horizontalAlign === "justify"} onPressedChange={() => updateElement(selectedElementData.id, { horizontalAlign: "justify" })}><AlignJustify className="w-4 h-4" /></Toggle>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Justificar</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </div>
                                    </div>



                                    {(selectedElementData.type === "text" || selectedElementData.type === "field" || selectedElementData.type === "manualField" || selectedElementData.type === "sanitaryRegister" || selectedElementData.type === "richParagraph") && (
                                        <Separator className="my-4" />
                                    )}

                                    {/* Text properties */}
                                    {(selectedElementData.type === "text" || selectedElementData.type === "field" || selectedElementData.type === "manualField" || selectedElementData.type === "sanitaryRegister" || selectedElementData.type === "richParagraph") && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Texto</h4>
                                            <div className="flex flex-col items-center w-full gap-3">
                                                <div className="flex w-full gap-2 items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">
                                                        Tamaño
                                                    </span>
                                                    <Select
                                                        value={selectedElementData.fontSize.toString()}
                                                        onValueChange={(value) => updateElement(selectedElementData.id, { fontSize: Number(value) })}
                                                    >
                                                        <SelectTrigger className="w-24">
                                                            <SelectValue placeholder="Tamaño" />
                                                        </SelectTrigger>
                                                        <SelectContent>
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
                                                        value={selectedElementData.color}
                                                        onChange={(e) => updateElement(selectedElementData.id, { color: e.target.value })}
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
                                                                <Toggle
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-8"
                                                                    pressed={selectedElementData.fontWeight === "bold"}
                                                                    onPressedChange={() => updateElement(selectedElementData.id, { fontWeight: selectedElementData.fontWeight === "bold" ? "normal" : "bold" })}
                                                                >
                                                                    <BoldIcon className="w-4 h-4" />
                                                                </Toggle>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Negrita</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Toggle
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-8"
                                                                    pressed={selectedElementData.fontStyle === "italic"}
                                                                    onPressedChange={() => updateElement(selectedElementData.id, { fontStyle: selectedElementData.fontStyle === "italic" ? "normal" : "italic" })}
                                                                >
                                                                    <Italic className="w-4 h-4" />
                                                                </Toggle>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Cursiva</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Toggle
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-8"
                                                                    pressed={selectedElementData.textDecoration === "underline"}
                                                                    onPressedChange={() => updateElement(selectedElementData.id, { textDecoration: selectedElementData.textDecoration === "underline" ? "none" : "underline" })}
                                                                >
                                                                    <Underline className="w-4 h-4" />
                                                                </Toggle>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Subrayado</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Toggle
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-8"
                                                                    pressed={selectedElementData.textDecoration === "line-through"}
                                                                    onPressedChange={() => updateElement(selectedElementData.id, { textDecoration: selectedElementData.textDecoration === "line-through" ? "none" : "line-through" })}
                                                                >
                                                                    <Strikethrough className="w-4 h-4" />
                                                                </Toggle>
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
                                                                <Toggle
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-8 p-0"
                                                                    pressed={selectedElementData.textTransform === "uppercase"}
                                                                    onPressedChange={() => updateElement(selectedElementData.id, { textTransform: selectedElementData.textTransform === "uppercase" ? "none" : "uppercase" })}
                                                                >
                                                                    <CaseUpper className="w-5 h-5" />
                                                                </Toggle>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Mayúsculas</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Toggle
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-8"
                                                                    pressed={selectedElementData.textDecoration === "lowercase"}
                                                                    onPressedChange={() => updateElement(selectedElementData.id, { textDecoration: selectedElementData.textDecoration === "lowercase" ? "none" : "lowercase" })}
                                                                >
                                                                    <CaseLower className="w-5 h-5" />
                                                                </Toggle>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Minúsculas</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Toggle
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-8"
                                                                    pressed={selectedElementData.textDecoration === "capitalize"}
                                                                    onPressedChange={() => updateElement(selectedElementData.id, { textDecoration: selectedElementData.textDecoration === "capitalize" ? "none" : "capitalize" })}
                                                                >
                                                                    <CaseSensitive className="w-5 h-5" />
                                                                </Toggle>
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
                        )}

                        {/* Datos de contexto */}
                        {/* <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="text-sm">Datos de Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs space-y-1 text-muted-foreground">
                            <div>
                                <strong>Producto:</strong> {dataContext.product.name}
                            </div>
                            <div>
                                <strong>Especie:</strong> {dataContext.product.species.name}
                            </div>
                            <div>
                                <strong>Lote:</strong> {dataContext.lot_number}
                            </div>
                            <div>
                                <strong>Origen:</strong> {dataContext.origin}
                            </div>
                        </div>
                    </CardContent>
                </Card> */}
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
            </TooltipProvider >
        </>
    )
}
