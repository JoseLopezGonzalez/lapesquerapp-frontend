// LabelEditor.js (Versión convertida a JavaScript desde TSX)
"use client"
import { CgFormatUppercase } from "react-icons/cg";

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import QRConfigPanel from "./QRConfigPanel"
import BarcodeConfigPanel from "./BarcodeConfigPanel"
import Barcode from 'react-barcode'
import { serializeBarcode, formatMap } from '@/lib/barcodes'
import {
    Type,
    Database,
    QrCode,
    BarcodeIcon as Barcode3,
    ImageIcon,
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
} from "lucide-react"
import { BoldIcon } from "@heroicons/react/20/solid"
import { EmptyState } from "@/components/Utilities/EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLabelEditor } from "@/hooks/useLabelEditor";
import { usePrintElement } from "@/hooks/usePrintElement";

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
        exportJSON,
        getFieldName,
        getFieldValue,
        fieldOptions,
    } = useLabelEditor();

    const [manualValues, setManualValues] = useState({});
    const [showManualDialog, setShowManualDialog] = useState(false);
    const [manualForm, setManualForm] = useState({});

    const { onPrint } = usePrintElement({ id: 'print-area', width: 100, height: 75 });

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


    return (
        <TooltipProvider>
        <div className="flex h-full w-full  bg-muted/30">
            {/* Sidebar Izquierda */}
            <div className="w-80 border-r bg-card p-4 h-full">
                <div className="space-y-4 h-full flex flex-col min-h-0">
                    <div>
                        <h3 className="font-semibold mb-3">Añadir Elementos</h3>
                        <div className="grid grid-cols-1 gap-2">
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
                                                    className={`p-2 rounded border cursor-pointer transition-colors ${selectedElement === element.id ? " ring-2 ring-foreground-500 " : "border-border hover:bg-foreground-50/50"
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
                                                                        <span className="text-xs text-muted-foreground">{element.text}</span>
                                                                    </div>
                                                                </div>)}
                                                            {element.type === "field" && (
                                                                <div className="flex flex-col items-center gap-1 w-full">
                                                                    <div className="flex items-center gap-1 justify-start w-full">
                                                                        <Database className="w-3 h-3" />
                                                                        <span className="text-sm font-medium capitalize">Campo Dinámico</span>
                                                                    </div>
                                                                    <div className="flex items-center bg-foreground-100 rounded-md p-2 w-full">
                                                                        <span className="text-xs text-muted-foreground">{getFieldName(element.field || "")}</span>
                                                                    </div>
                                                                </div>)}
                                                            {element.type === "manualField" && (
                                                                <div className="flex flex-col items-center gap-1 w-full">
                                                                    <div className="flex items-center gap-1 justify-start w-full">
                                                                        <BetweenHorizonalEnd className="w-3 h-3" />
                                                                        <span className="text-sm font-medium capitalize">Campo Manual</span>
                                                                    </div>
                                                                    <div className="flex items-center bg-foreground-100 rounded-md p-2 w-full">
                                                                        <span className="text-xs text-muted-foreground">{element.sample || `{{${element.key}}}`}</span>
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
                                                        {/* <Badge variant="secondary" className="text-xs">
                                                    {Math.round(element.x)},{Math.round(element.y)}
                                                </Badge> */}
                                                    </div>
                                                    {/*  {element.type === "field" && (
                                                <div className="text-xs text-muted-foreground mt-1">{element.field}</div>
                                            )} */}
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
                {/* Toolbar */}
                <div className=" p-2 flex justify-center items-center gap-2 w-full">
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={400}
                            readOnly
                            className="w-16 text-center"
                        />
                        <span className="text-sm">x</span>
                        <Input
                            type="number"
                            value={300}
                            readOnly
                            className="w-16 text-center"
                        />
                        <Button variant="outline" size="" onClick={() => setZoom(1)}>
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <Button onClick={exportJSON} className="gap-2">
                        <Download className="w-4 h-4" />
                        Exportar JSON
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="gap-2">
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </Button>
                    <Button variant="" onClick={() => console.log("Guardar cambios")} className='bg-lime-500  hover:bg-lime-400'>
                        <Save className="w-4 h-4 " />
                        Guardar
                    </Button>
                </div>

                {/* Canvas */}
                <div className="flex-1 p-8 overflow-auto ">
                    <div className="flex justify-center items-center h-full">
                        <div className="flex flex-col items-center gap-4 mt-4  ">
                            <div className='bg-orange-200 px-4'>
                                <div className="flex flex-col items-center  gap-4"
                                >
                                    <div className="w-full h-20 bg-white rounded-b-xl border-t-0 border bg-card text-card-foreground  shadow">
                                    </div>

                                    <div
                                        ref={canvasRef}
                                        id="print-area"
                                        className="relative bg-white border-2 border-dashed border-border shadow-lg rounded-lg"
                                        style={{
                                            width: 400 * zoom,
                                            height: 300 * zoom,
                                            transform: `scale(${zoom})`,
                                            transformOrigin: "top left",
                                        }}
                                    >
                                        {elements.map((element) => (
                                            <div
                                                key={element.id}
                                                className={`absolute cursor-move border transition-colors ${selectedElement === element.id
                                                    ? "border-primary bg-primary/5 "
                                                    : "border-transparent hover:border-muted-foreground/30"
                                                    }`}
                                                style={{
                                                    left: element.x,
                                                    top: element.y,
                                                    width: element.width,
                                                    height: element.height,
                                                }}
                                                onMouseDown={(e) => handleMouseDown(e, element.id)}
                                            >
                                                {/* Contenido del elemento */}
                                                <div className="w-full h-full flex items-center justify-center p-1"
                                                    style={{
                                                        textAlign: element.textAlign,
                                                        verticalAlign: element.verticalAlign || "center",
                                                        transform: `rotate(${element.rotation || 0}deg)`,
                                                        display: "flex",
                                                        alignItems: element.verticalAlign || "center",
                                                        justifyContent: element.horizontalAlign || "flex-start",
                                                    }}
                                                >
                                                    {element.type === "text" && (
                                                        <span
                                                            style={{
                                                                fontSize: element.fontSize,
                                                                fontWeight: element.fontWeight,
                                                                textAlign: element.textAlign,
                                                                color: element.color,
                                                                textTransform: element.textTransform,
                                                                fontStyle: element.fontStyle,
                                                                textDecoration: element.textDecoration,
                                                            }}
                                                            className="truncate"
                                                        >
                                                            {element.text}
                                                        </span>
                                                    )}
                                                    {element.type === "field" && (
                                                        <span
                                                            style={{
                                                                fontSize: element.fontSize,
                                                                fontWeight: element.fontWeight,
                                                                textAlign: element.textAlign,
                                                                color: element.color,
                                                                textTransform: element.textTransform,
                                                                fontStyle: element.fontStyle,
                                                                textDecoration: element.textDecoration,
                                                            }}
                                                            className="truncate"
                                                        >
                                                            {getFieldValue(element.field || "")}
                                                        </span>
                                                    )}
                                                    {element.type === "manualField" && (
                                                        <span
                                                            style={{
                                                                fontSize: element.fontSize,
                                                                fontWeight: element.fontWeight,
                                                                textAlign: element.textAlign,
                                                                color: element.color,
                                                                textTransform: element.textTransform,
                                                                fontStyle: element.fontStyle,
                                                                textDecoration: element.textDecoration,
                                                            }}
                                                            className="truncate"
                                                        >
                                                            {manualValues[element.key] ? manualValues[element.key] : element.sample || `{{${element.key}}}`}
                                                        </span>
                                                    )}
                                                    {element.type === "qr" && (
                                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                            <QrCode className="w-8 h-8 text-gray-600" />
                                                        </div>
                                                    )}
                                                    {element.type === "barcode" && (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Barcode
                                                                value={serializeBarcode(
                                                                    (element.barcodeContent || '').replace(/{{([^}]+)}}/g, (_, f) => getFieldValue(f)),
                                                                    element.barcodeType || 'ean13'
                                                                ) || '0'}
                                                                format={formatMap[element.barcodeType || 'ean13']}
                                                                width={1}
                                                                height={element.height - 10}
                                                                displayValue={false}
                                                            />
                                                        </div>
                                                    )}
                                                    {element.type === "image" && (
                                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                            <ImageIcon className="w-8 h-8 text-gray-600" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Indicador de selección */}
                                                {selectedElement === element.id && (
                                                    <>
                                                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full"></div>
                                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
                                                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full"></div>
                                                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
                                                    </>
                                                )}
                                            </div>
                                        ))}


                                    </div>

                                    <div className="w-full h-20 bg-white rounded-t-xl  border border-b-0 bg-card text-card-foreground  ">
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <div className=" p-2 flex justify-center items-center gap-2 w-full">
                    <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                    <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                </div>

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
                                    />
                                </div>
                            )}

                            {(selectedElementData.type === "text" || selectedElementData.type === "field" || selectedElementData.type === "manualField" || selectedElementData.type === "qr" || selectedElementData.type === "barcode") && (
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
                                            value={selectedElementData.rotation || 0}
                                            onValueChange={(value) => updateElement(selectedElementData.id, { rotation: Number(value) })}
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
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-8"
                                                        onClick={() => updateElement(selectedElementData.id, { verticalAlign: "start" })}
                                                    >
                                                        <AlignVerticalJustifyStart className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Alinear arriba</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-8"
                                                        onClick={() => updateElement(selectedElementData.id, { verticalAlign: "end" })}
                                                    >
                                                        <AlignVerticalJustifyEnd className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Alinear abajo</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-8"
                                                        onClick={() => updateElement(selectedElementData.id, { verticalAlign: "center" })}
                                                    >
                                                        <AlignVerticalJustifyCenter className="w-4 h-4" />
                                                    </Button>
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
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-8"
                                                        onClick={() => updateElement(selectedElementData.id, { horizontalAlign: "left" })}
                                                    >
                                                        <AlignLeft className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Alinear a la izquierda</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-8"
                                                        onClick={() => updateElement(selectedElementData.id, { horizontalAlign: "center" })}
                                                    >
                                                        <AlignCenter className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Alinear al centro</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-8"
                                                        onClick={() => updateElement(selectedElementData.id, { horizontalAlign: "right" })}
                                                    >
                                                        <AlignRight className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Alinear a la derecha</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-8"
                                                        onClick={() => updateElement(selectedElementData.id, { horizontalAlign: "justify" })}
                                                    >
                                                        <AlignJustify className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Justificar</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            </div>



                            {(selectedElementData.type === "text" || selectedElementData.type === "field" || selectedElementData.type === "manualField") && (
                                <Separator className="my-4" />
                            )}

                            {/* Text properties */}
                            {(selectedElementData.type === "text" || selectedElementData.type === "field" || selectedElementData.type === "manualField") && (
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
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-8"
                                                            onClick={() => updateElement(selectedElementData.id, { fontWeight: selectedElementData.fontWeight === "bold" ? "normal" : "bold" })}
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
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-8"
                                                            onClick={() => updateElement(selectedElementData.id, { fontStyle: selectedElementData.fontStyle === "italic" ? "normal" : "italic" })}
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
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-8"
                                                            onClick={() => updateElement(selectedElementData.id, { textDecoration: selectedElementData.textDecoration === "underline" ? "none" : "underline" })}
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
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-8"
                                                            onClick={() => updateElement(selectedElementData.id, { textDecoration: selectedElementData.textDecoration === "line-through" ? "none" : "line-through" })}
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
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-8 p-0"
                                                            onClick={() => updateElement(selectedElementData.id, { textTransform: selectedElementData.textTransform === "uppercase" ? "none" : "uppercase" })}
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
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-8"
                                                            onClick={() => updateElement(selectedElementData.id, { textDecoration: selectedElementData.textDecoration === "lowercase" ? "none" : "lowercase" })}
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
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-8"
                                                            onClick={() => updateElement(selectedElementData.id, { textDecoration: selectedElementData.textDecoration === "capitalize" ? "none" : "capitalize" })}
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
        </TooltipProvider>
    )
}
