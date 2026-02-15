"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Type,
  Database,
  QrCode,
  BarcodeIcon as Barcode3,
  ImageIcon,
  Stamp,
  Pilcrow,
  CopyPlus,
  Trash2,
  Plus,
  Minus,
  ListChecks,
  CheckSquare,
  Calendar,
  AlertTriangle,
  BetweenHorizonalEnd,
  FolderSearch,
} from "lucide-react";
import { EmptyState } from "@/components/Utilities/EmptyState";
import { cn } from "@/lib/utils";
import LabelSelectorSheet from "./LabelSelectorSheet";
import { hasElementValidationError, getElementValidationErrorReason } from "@/hooks/labelEditorValidation";

const titleAdd = "Selecciona una etiqueta para añadir elementos";

export default function LabelEditorLeftPanel({
  selectedLabel,
  labelId,
  clearEditor,
  openSelector,
  setOpenSelector,
  handleSelectLabel,
  handleCreateNewLabel,
  addElement,
  elements,
  scrollAreaRef,
  elementRefs,
  selectedElement,
  onSelectElementCard,
  getFieldName,
  duplicateElement,
  deleteElement,
  formatDateDisplay,
}) {
  return (
    <div className="w-90 border-r bg-card p-4 h-full flex flex-col">
      <div className="flex gap-2 mb-4">
        <Button className="flex-1" onClick={handleCreateNewLabel}>
          <Plus className="h-5 w-5 mr-2" />
          Crear Nueva
        </Button>
        <LabelSelectorSheet
          open={openSelector}
          onOpenChange={setOpenSelector}
          onSelect={handleSelectLabel}
          onNew={handleCreateNewLabel}
          onDelete={(deletedLabelId) => {
            if (labelId === deletedLabelId) clearEditor();
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
            <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("text")} disabled={!selectedLabel} title={!selectedLabel ? titleAdd : ""}>
              <Type className="w-4 h-4" />
              Texto Fijo
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("field")} disabled={!selectedLabel} title={!selectedLabel ? titleAdd : ""}>
              <Database className="w-4 h-4" />
              Campo Dinámico
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("manualField")} disabled={!selectedLabel} title={!selectedLabel ? titleAdd : ""}>
              <BetweenHorizonalEnd className="w-4 h-4" />
              Campo Manual
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("qr")} disabled={!selectedLabel} title={!selectedLabel ? titleAdd : ""}>
              <QrCode className="w-4 h-4" />
              Código QR
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("richParagraph")} disabled={!selectedLabel} title={!selectedLabel ? titleAdd : ""}>
              <Pilcrow className="w-4 h-4" />
              Párrafo
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-start gap-2" disabled={!selectedLabel} title={!selectedLabel ? titleAdd : "Otros tipos de elemento"}>
                  <Plus className="w-4 h-4" />
                  Otros campos
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => addElement("selectField")} disabled={!selectedLabel}>
                  <ListChecks className="w-4 h-4 mr-2" />
                  Campo Select
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addElement("checkboxField")} disabled={!selectedLabel}>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Campo Checkbox
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addElement("dateField")} disabled={!selectedLabel}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Campo Fecha
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addElement("barcode")} disabled={!selectedLabel}>
                  <Barcode3 className="w-4 h-4 mr-2" />
                  Código de Barras
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addElement("line")} disabled={!selectedLabel}>
                  <Minus className="w-4 h-4 mr-2" />
                  Línea
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addElement("sanitaryRegister")} disabled={!selectedLabel}>
                  <Stamp className="w-4 h-4 mr-2" />
                  Registro Sanitario
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addElement("image")} disabled>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Imagen (no disponible)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {!selectedLabel && (
            <p className="text-xs text-muted-foreground mt-2 text-center">Selecciona una etiqueta para comenzar</p>
          )}
        </div>
        <Separator />
        <div className="flex-1 flex flex-col min-h-0">
          {elements.length > 0 ? (
            <div className="h-full flex flex-col">
              <h3 className="font-semibold mb-3 flex items-center justify-between">
                <span>Elementos</span> {elements.length}
              </h3>
              <div className="flex-1 overflow-hidden h-full">
                <ScrollArea ref={scrollAreaRef} className="flex-1 h-full pr-3">
                  <div className="flex flex-col gap-2 p-2">
                    {elements.map((element) => {
                      const hasError = hasElementValidationError(element);
                      const errorReason = getElementValidationErrorReason(element);
                      return (
                        <Card
                          key={element.id}
                          ref={(el) => {
                            if (el) elementRefs.current[element.id] = el;
                            else delete elementRefs.current[element.id];
                          }}
                          className={cn(
                            "group cursor-pointer transition-colors shadow-sm",
                            hasError && "border-l-4 border-l-destructive border-destructive/40 bg-destructive/10 dark:bg-destructive/15",
                            selectedElement === element.id && !hasError && "border-l-4 border-l-primary border-primary/40 bg-primary/10 dark:bg-primary/15",
                            !hasError && selectedElement !== element.id && "border-border hover:bg-muted/50 dark:hover:bg-muted/30"
                          )}
                          onClick={() => onSelectElementCard(element.id)}
                        >
                          <CardContent className="p-2">
                            {hasError && (
                              <div className="flex items-center gap-1 text-destructive text-xs mb-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>{errorReason === "options" ? "Sin opciones" : "Sin nombre"}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 w-full">
                                {element.type === "text" && (
                                  <div className="flex flex-col items-center gap-1 w-full">
                                    <div className="flex items-center gap-1 justify-start w-full">
                                      <Type className="w-3 h-3" />
                                      <span className="text-sm font-medium capitalize">Texto Fijo</span>
                                    </div>
                                    <div className="flex items-center bg-muted rounded-md p-2 w-full">
                                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{element.text}</span>
                                    </div>
                                  </div>
                                )}
                                {element.type === "field" && (
                                  <div className="flex flex-col items-center gap-1 w-full">
                                    <div className="flex items-center gap-1 justify-start w-full">
                                      <Database className="w-3 h-3" />
                                      <span className="text-sm font-medium capitalize">Campo Dinámico</span>
                                    </div>
                                    <div className="flex items-center bg-muted rounded-md p-2 w-full">
                                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{getFieldName(element.field || "")}</span>
                                    </div>
                                  </div>
                                )}
                                {element.type === "manualField" && (
                                  <div className="flex flex-col items-center gap-1 w-full">
                                    <div className="flex items-center gap-1 justify-start w-full">
                                      <BetweenHorizonalEnd className="w-3 h-3" />
                                      <span className="text-sm font-medium capitalize">Campo Manual</span>
                                    </div>
                                    <div className="flex items-center bg-muted rounded-md p-2 w-full">
                                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{element.sample || `{{${element.key}}}`}</span>
                                    </div>
                                    {element.visibleOnLabel === false && (
                                      <span className="self-start text-[10px] text-muted-foreground bg-muted/80 rounded px-1.5 py-0.5">No visible</span>
                                    )}
                                  </div>
                                )}
                                {element.type === "selectField" && (
                                  <div className="flex flex-col items-center gap-1 w-full">
                                    <div className="flex items-center gap-1 justify-start w-full">
                                      <ListChecks className="w-3 h-3" />
                                      <span className="text-sm font-medium capitalize">Campo Select</span>
                                    </div>
                                    <div className="flex items-center bg-muted rounded-md p-2 w-full">
                                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{element.sample || element.key || (Array.isArray(element.options) && element.options[0]) || ""}</span>
                                    </div>
                                    {element.visibleOnLabel === false && (
                                      <span className="self-start text-[10px] text-muted-foreground bg-muted/80 rounded px-1.5 py-0.5">No visible</span>
                                    )}
                                  </div>
                                )}
                                {element.type === "checkboxField" && (
                                  <div className="flex flex-col items-center gap-1 w-full">
                                    <div className="flex items-center gap-1 justify-start w-full">
                                      <CheckSquare className="w-3 h-3" />
                                      <span className="text-sm font-medium capitalize">Campo Checkbox</span>
                                    </div>
                                    <div className="flex items-center bg-muted rounded-md p-2 w-full">
                                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{element.content || element.key || ""}</span>
                                    </div>
                                    {element.visibleOnLabel === false && (
                                      <span className="self-start text-[10px] text-muted-foreground bg-muted/80 rounded px-1.5 py-0.5">No visible</span>
                                    )}
                                  </div>
                                )}
                                {element.type === "dateField" && (
                                  <div className="flex flex-col items-center gap-1 w-full">
                                    <div className="flex items-center gap-1 justify-start w-full">
                                      <Calendar className="w-3 h-3" />
                                      <span className="text-sm font-medium capitalize">Campo Fecha</span>
                                    </div>
                                    <div className="flex items-center bg-muted rounded-md p-2 w-full">
                                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{formatDateDisplay(element.sample || element.key || "")}</span>
                                    </div>
                                    {element.visibleOnLabel === false && (
                                      <span className="self-start text-[10px] text-muted-foreground bg-muted/80 rounded px-1.5 py-0.5">No visible</span>
                                    )}
                                  </div>
                                )}
                                {element.type === "sanitaryRegister" && (
                                  <div className="flex flex-col items-center gap-1 w-full">
                                    <div className="flex items-center gap-1 justify-start w-full">
                                      <Stamp className="w-3 h-3" />
                                      <span className="text-sm font-medium capitalize">Registro Sanitario</span>
                                    </div>
                                    <div className="flex items-center bg-muted rounded-md p-2 w-full">
                                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{`${element.countryCode || ""} ${element.approvalNumber || ""} ${element.suffix || ""}`.trim()}</span>
                                    </div>
                                  </div>
                                )}
                                {element.type === "richParagraph" && (
                                  <div className="flex flex-col items-center gap-1 w-full">
                                    <div className="flex items-center gap-1 justify-start w-full">
                                      <Pilcrow className="w-3 h-3" />
                                      <span className="text-sm font-medium capitalize">Párrafo</span>
                                    </div>
                                    <div className="flex items-center bg-muted rounded-md p-2 w-full">
                                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                        {element.html ? element.html.replace(/<[^>]+>/g, "") : element.text || ""}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {element.type === "qr" && (
                                  <div className="flex items-center gap-1">
                                    <QrCode className="w-3 h-3" />
                                    <span className="text-sm font-medium capitalize">Código QR</span>
                                  </div>
                                )}
                                {element.type === "barcode" && (
                                  <div className="flex items-center gap-1">
                                    <Barcode3 className="w-3 h-3" />
                                    <span className="text-sm font-medium capitalize">Código de Barras</span>
                                  </div>
                                )}
                                {element.type === "image" && (
                                  <div className="flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" />
                                    <span className="text-sm font-medium capitalize">Imagen</span>
                                  </div>
                                )}
                                {element.type === "line" && (
                                  <div className="flex flex-col items-center gap-1 w-full">
                                    <div className="flex items-center gap-1 justify-start w-full">
                                      <Minus className="w-3 h-3" />
                                      <span className="text-sm font-medium capitalize">Línea</span>
                                    </div>
                                    <div className="flex items-center bg-muted rounded-md p-2 w-full">
                                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                        {element.direction === "vertical" ? "Vertical" : "Horizontal"} - {element.strokeWidth || 0.1}mm
                                      </span>
                                    </div>
                                  </div>
                                )}
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
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center py-10">
              <EmptyState icon={<CopyPlus className="w-8 h-8" />} title="Agrega algún elemento" description="Añade elementos desde el panel izquierdo para comenzar." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
