"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Type, Database, QrCode, BarcodeIcon as Barcode3, ImageIcon, Stamp, Pilcrow, Trash2, Plus, Minus,
  ListChecks, CheckSquare, Calendar, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  AlignVerticalJustifyStart, AlignVerticalJustifyEnd, AlignVerticalJustifyCenter, Maximize,
} from "lucide-react";
import { BoldIcon } from "@heroicons/react/20/solid";
import QRConfigPanel from "./QRConfigPanel";
import BarcodeConfigPanel from "./BarcodeConfigPanel";
import RichParagraphConfigPanel from "./RichParagraphConfigPanel";

export default function LabelEditorPropertyPanel({
  activeElementState,
  updateActiveElement,
  deleteElement,
  hasDuplicateKey,
  normalizeFieldKey,
  fieldOptions,
  allFieldOptions,
  getFieldValue,
  elements,
  borderWidthOptions,
  handleElementRotationChange,
  autoFitToContent,
}) {
  return (
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
                    {activeElementState.type === "selectField" && (
                        <div className="flex items-center gap-2 justify-center">
                            <ListChecks className="w-4 h-4" />
                            <h4 className="capitalize text-xl font-normal">Campo Select</h4>
                        </div>
                    )}
                    {activeElementState.type === "checkboxField" && (
                        <div className="flex items-center gap-2 justify-center">
                            <CheckSquare className="w-4 h-4" />
                            <h4 className="capitalize text-xl font-normal">Campo Checkbox</h4>
                        </div>
                    )}
                    {activeElementState.type === "dateField" && (
                        <div className="flex items-center gap-2 justify-center">
                            <Calendar className="w-4 h-4" />
                            <h4 className="capitalize text-xl font-normal">Campo Fecha</h4>
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
                    {activeElementState.type === "line" && (
                        <div className="flex items-center gap-2 justify-center">
                            <Minus className="w-4 h-4" />
                            <h4 className="capitalize text-xl font-normal">Línea</h4>
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
                                value={activeElementState.key || ''}
                                onChange={(e) => updateActiveElement({ key: normalizeFieldKey(e.target.value) })}
                                placeholder="Nombre del campo"
                            />
                            {hasDuplicateKey && <p className="text-xs text-red-600 mt-1">Ya hay otro campo con el mismo nombre.</p>}
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

                {activeElementState.type === "selectField" && (
                    <div className="space-y-2">
                        <div>
                            <h4 className="text-sm font-medium mb-2">Nombre del campo</h4>
                            <Input
                                value={activeElementState.key || ''}
                                onChange={(e) => updateActiveElement({ key: normalizeFieldKey(e.target.value) })}
                                placeholder="Nombre del campo"
                            />
                            {hasDuplicateKey && <p className="text-xs text-red-600 mt-1">Ya hay otro campo con el mismo nombre.</p>}
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-2">Opciones</h4>
                            <div className="space-y-2">
                                {(Array.isArray(activeElementState.options) ? activeElementState.options : []).map((opt, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <Input
                                            value={opt}
                                            onChange={(e) => {
                                                const next = [...(activeElementState.options || [])];
                                                next[index] = e.target.value;
                                                const validOpts = next.filter(Boolean);
                                                const sample = validOpts.includes(activeElementState.sample) ? activeElementState.sample : (validOpts[0] ?? '');
                                                updateActiveElement({ options: next, sample });
                                            }}
                                            placeholder={`Opción ${index + 1}`}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 text-muted-foreground hover:text-destructive"
                                            onClick={() => {
                                                const next = (activeElementState.options || []).filter((_, i) => i !== index);
                                                const validOpts = next.filter(Boolean);
                                                const sample = validOpts.includes(activeElementState.sample) ? activeElementState.sample : (validOpts[0] ?? '');
                                                updateActiveElement({ options: next, sample });
                                            }}
                                            title="Quitar opción"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2"
                                    onClick={() => {
                                        const current = activeElementState.options || [];
                                        updateActiveElement({ options: [...current, ""] });
                                    }}
                                >
                                    <Plus className="w-4 h-4" />
                                    Añadir opción
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Estas opciones se mostrarán al imprimir</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-2">Valor vista previa</h4>
                            {(() => {
                                const opts = (activeElementState.options || []).filter(Boolean);
                                const currentSample = activeElementState.sample || '';
                                const valueInOptions = opts.includes(currentSample) ? currentSample : (opts[0] ?? '');
                                if (opts.length === 0) {
                                    return (
                                        <p className="text-sm text-muted-foreground">Añade opciones arriba para elegir el valor de vista previa.</p>
                                    );
                                }
                                return (
                                    <Select
                                        value={valueInOptions}
                                        onValueChange={(val) => updateActiveElement({ sample: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona opción para vista previa" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {opts.map((opt) => (
                                                <SelectItem key={opt} value={opt}>
                                                    {opt}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {activeElementState.type === "checkboxField" && (
                    <div className="space-y-2">
                        <div>
                            <h4 className="text-sm font-medium mb-2">Nombre del campo</h4>
                            <Input
                                value={activeElementState.key || ''}
                                onChange={(e) => updateActiveElement({ key: normalizeFieldKey(e.target.value) })}
                                placeholder="Nombre del campo"
                            />
                            {hasDuplicateKey && <p className="text-xs text-red-600 mt-1">Ya hay otro campo con el mismo nombre.</p>}
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-2">Contenido cuando está marcado</h4>
                            <Input
                                value={activeElementState.content || ''}
                                onChange={(e) => updateActiveElement({ content: e.target.value })}
                                placeholder="Texto que se mostrará al marcar el checkbox"
                            />
                        </div>
                    </div>
                )}

                {activeElementState.type === "dateField" && (
                    <div className="space-y-2">
                        <div>
                            <h4 className="text-sm font-medium mb-2">Nombre del campo</h4>
                            <Input
                                value={activeElementState.key || ''}
                                onChange={(e) => updateActiveElement({ key: normalizeFieldKey(e.target.value) })}
                                placeholder="Nombre del campo"
                            />
                            {hasDuplicateKey && <p className="text-xs text-red-600 mt-1">Ya hay otro campo con el mismo nombre.</p>}
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-2">Origen de la fecha al imprimir</h4>
                            <Select
                                value={activeElementState.dateMode || 'system'}
                                onValueChange={(val) => updateActiveElement({ dateMode: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manual">Manual</SelectItem>
                                    <SelectItem value="system">Fecha actual del sistema</SelectItem>
                                    <SelectItem value="fieldOffset">Relativo a otra fecha</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {(activeElementState.dateMode === 'system') && (
                            <div>
                                <h4 className="text-sm font-medium mb-2">Desplazamiento (días, opcional)</h4>
                                <Input
                                    type="number"
                                    value={activeElementState.systemOffsetDays ?? 0}
                                    onChange={(e) => updateActiveElement({ systemOffsetDays: parseInt(e.target.value, 10) || 0 })}
                                    placeholder="0"
                                />
                            </div>
                        )}
                        {(activeElementState.dateMode === 'fieldOffset') && (
                            <>
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Campo fecha de referencia</h4>
                                    <Select
                                        value={activeElementState.fieldRef || ''}
                                        onValueChange={(val) => updateActiveElement({ fieldRef: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un campo fecha" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {elements.filter(el => el.type === 'dateField' && el.key && el.id !== activeElementState.id).map((el) => (
                                                <SelectItem key={el.id} value={el.key}>
                                                    {el.key}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Desplazamiento (días, opcional)</h4>
                                    <Input
                                        type="number"
                                        value={activeElementState.fieldOffsetDays ?? 0}
                                        onChange={(e) => updateActiveElement({ fieldOffsetDays: parseInt(e.target.value, 10) || 0 })}
                                        placeholder="0"
                                    />
                                </div>
                            </>
                        )}
                        <div>
                            <h4 className="text-sm font-medium mb-2">Vista previa</h4>
                            {activeElementState.dateMode === 'manual' ? (
                                <>
                                    <Input
                                        type="date"
                                        value={activeElementState.sample || ''}
                                        onChange={(e) => updateActiveElement({ sample: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Valor vista previa</p>
                                </>
                            ) : (
                                <p className="text-sm py-2 text-muted-foreground">
                                    {formatDateDisplay(getDateFieldPreview(activeElementState, elements)) || '—'}
                                </p>
                            )}
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

                {activeElementState.type === "line" && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium mb-2">Dirección</h4>
                            <div className="flex gap-2">
                                <Button
                                    variant={activeElementState.direction === "horizontal" ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                        const currentWidth = activeElementState.width;
                                        const currentHeight = activeElementState.height;
                                        // Si es vertical, intercambiar dimensiones para horizontal
                                        if (activeElementState.direction === "vertical") {
                                            updateActiveElement({ 
                                                direction: "horizontal",
                                                width: currentHeight,
                                                height: currentWidth
                                            });
                                        } else {
                                            updateActiveElement({ direction: "horizontal" });
                                        }
                                    }}
                                >
                                    Horizontal
                                </Button>
                                <Button
                                    variant={activeElementState.direction === "vertical" ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                        const currentWidth = activeElementState.width;
                                        const currentHeight = activeElementState.height;
                                        // Si es horizontal, intercambiar dimensiones para vertical
                                        if (activeElementState.direction === "horizontal") {
                                            updateActiveElement({ 
                                                direction: "vertical",
                                                width: currentHeight,
                                                height: currentWidth
                                            });
                                        } else {
                                            updateActiveElement({ direction: "vertical" });
                                        }
                                    }}
                                >
                                    Vertical
                                </Button>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-2">Grosor</h4>
                            <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max="5"
                                value={activeElementState.strokeWidth || 0.1}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0.1;
                                    updateActiveElement({ strokeWidth: value });
                                }}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Grosor en mm (0.01 - 5)</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-2">Color</h4>
                            <Input
                                type="color"
                                value={activeElementState.color || "#000000"}
                                onChange={(e) => updateActiveElement({ color: e.target.value })}
                                className="w-full h-10 cursor-pointer"
                            />
                        </div>
                    </div>
                )}

                {(activeElementState.type === "text" || activeElementState.type === "field" || activeElementState.type === "manualField" || activeElementState.type === "selectField" || activeElementState.type === "checkboxField" || activeElementState.type === "dateField" || activeElementState.type === "qr" || activeElementState.type === "barcode" || activeElementState.type === "sanitaryRegister" || activeElementState.type === "richParagraph") && (
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
                        {(activeElementState.type === "text" || activeElementState.type === "field" || activeElementState.type === "manualField" || activeElementState.type === "selectField" || activeElementState.type === "checkboxField" || activeElementState.type === "dateField" || activeElementState.type === "richParagraph" || activeElementState.type === "sanitaryRegister") && (
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



                {(activeElementState.type === "text" || activeElementState.type === "field" || activeElementState.type === "manualField" || activeElementState.type === "selectField" || activeElementState.type === "checkboxField" || activeElementState.type === "dateField" || activeElementState.type === "sanitaryRegister" || activeElementState.type === "richParagraph") && (
                    <Separator className="my-4" />
                )}

                {/* Text properties */}
                {(activeElementState.type === "text" || activeElementState.type === "field" || activeElementState.type === "manualField" || activeElementState.type === "selectField" || activeElementState.type === "checkboxField" || activeElementState.type === "dateField" || activeElementState.type === "sanitaryRegister" || activeElementState.type === "richParagraph" || activeElementState.type === "barcode"

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

                {(activeElementState.type === "manualField" || activeElementState.type === "selectField" || activeElementState.type === "checkboxField" || activeElementState.type === "dateField") && (
                    <>
                        <Separator />
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="visible-on-label"
                                checked={activeElementState.visibleOnLabel !== false}
                                onCheckedChange={(checked) => updateActiveElement({ visibleOnLabel: !!checked })}
                            />
                            <Label htmlFor="visible-on-label" className="text-sm font-normal cursor-pointer">
                                Visible
                            </Label>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
