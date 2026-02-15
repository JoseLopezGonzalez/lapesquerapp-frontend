"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RotateCcw, ZoomIn, ZoomOut, Save, Loader2, Settings, Keyboard, Upload, Download, Printer, Trash2, EllipsisVertical } from "lucide-react";

export default function LabelEditorToolbar({
  canvasWidth,
  setCanvasWidth,
  canvasHeight,
  setCanvasHeight,
  rotateCanvas,
  fileInputRef,
  handleImportJSON,
  setShowFieldExamplesDialog,
  setShowKeyboardShortcutsDialog,
  handleOnClickSave,
  isSaving,
  exportJSON,
  labelName,
  handleOnClickPrintLabel,
  handleOnClickDeleteLabel,
  zoom,
  setZoom,
  setLabelName,
  children,
}) {
  return (
    <>
      <div className="p-2 flex justify-center items-center gap-2 w-full">
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
        <Button variant="outline" onClick={() => setShowFieldExamplesDialog(true)} className="gap-2">
          <Settings className="w-4 h-4" />
          Valores de Ejemplo
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => setShowKeyboardShortcutsDialog(true)}>
              <Keyboard className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Atajos de teclado</p>
          </TooltipContent>
        </Tooltip>
        <Button
          variant=""
          onClick={handleOnClickSave}
          disabled={isSaving}
          className="bg-lime-500 hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
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
              <EllipsisVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                <Upload className="w-4 h-4" />
                Importar etiqueta
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportJSON(labelName)} className="cursor-pointer">
                <Download className="w-4 h-4" />
                Exportar etiqueta
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOnClickPrintLabel} className="cursor-pointer">
                <Printer className="w-4 h-4" />
                Imprimir Prueba
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={handleOnClickDeleteLabel}>
              <Trash2 className="w-4 h-4" />
              Eliminar
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {children}

      <div className="p-2 flex flex-col justify-center items-center gap-2 w-full">
        <div className="p-2 flex justify-center items-center gap-2 w-full">
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex">
          <Input placeholder="Nombre" value={labelName} onChange={(e) => setLabelName(e.target.value)} className="w-48" />
        </div>
      </div>
    </>
  );
}
