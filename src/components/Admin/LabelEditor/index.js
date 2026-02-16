// LabelEditor.js (Versión convertida a JavaScript desde TSX)
"use client"

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
    Keyboard,
    Minus,
    ListChecks,
    CheckSquare,
    Calendar,
    AlertTriangle,
} from "lucide-react"
import { BoldIcon } from "@heroicons/react/20/solid"
import { EmptyState } from "@/components/Utilities/EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLabelEditor } from "@/hooks/useLabelEditor";
import { formatDate, formatDateDisplay, addDays, parseDate } from "@/hooks/useLabel";
import { cn } from "@/lib/utils";
import LabelSelectorSheet from "./LabelSelectorSheet";
import LabelEditorPreview from "./LabelEditorPreview";
import LabelEditorLeftPanel from "./LabelEditorLeftPanel";
import LabelEditorToolbar from "./LabelEditorToolbar";
import LabelEditorPropertyPanel from "./LabelEditorPropertyPanel";
import FieldExamplesDialog from "./FieldExamplesDialog";

import { notify } from '@/lib/notifications';
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
    const capitalizeFirst = (s) => (s && s.length > 0) ? s.charAt(0).toUpperCase() + s.slice(1) : (s || '');

    /** Solo letras, números y espacios; mayúscula en la primera letra. Sin trim para no romper espacios al escribir. */
    const normalizeFieldKey = (raw) => {
        const filtered = String(raw || '').replace(/[^a-zA-Z0-9 ]/g, '');
        const i = filtered.search(/[a-zA-Z]/);
        if (i < 0) return filtered;
        return filtered.slice(0, i) + filtered[i].toUpperCase() + filtered.slice(i + 1);
    };

    /** Vista previa de fecha para dateField: manual → sample; system (con offset opcional) / fieldOffset → calculado. */
    const getDateFieldPreview = (el, elementsList, visited = new Set()) => {
        if (!el || el.type !== 'dateField' || !el.key) return '';
        if (visited.has(el.key)) return '';
        const mode = el.dateMode || 'system';
        if (mode === 'manual') return el.sample || '';
        visited.add(el.key);
        const today = new Date();
        if (mode === 'system' || mode === 'systemOffset') return formatDate(addDays(today, el.systemOffsetDays ?? 0));
        if (mode === 'fieldOffset' && el.fieldRef) {
            const refKey = String(el.fieldRef).trim();
            const refEl = elementsList.find(e => e.type === 'dateField' && String(e.key || '').trim() === refKey);
            let refStr = refEl ? getDateFieldPreview(refEl, elementsList, visited) : '';
            if (!refStr && refEl?.dateMode === 'manual') refStr = formatDate(today);
            const refDate = parseDate(refStr);
            return refDate ? formatDate(addDays(refDate, el.fieldOffsetDays ?? 0)) : (refStr || '');
        }
        return '';
    };

    // Estado local del panel de propiedades (snapshot editable)
    // Este es la única fuente de verdad para los controles del panel
    const [activeElementState, setActiveElementState] = useState(null);
    
    // Estado para el diálogo de atajos de teclado
    const [showKeyboardShortcutsDialog, setShowKeyboardShortcutsDialog] = useState(false);

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
        const id = activeElementState.id;
        setActiveElementState((prev) => (prev ? { ...prev, ...updates } : null));
        updateElement(id, updates);
    }, [activeElementState, updateElement]);

    const keyFieldTypes = ['manualField', 'selectField', 'checkboxField', 'dateField'];
    const hasDuplicateKey = useMemo(() => {
        if (!activeElementState?.key || !String(activeElementState.key).trim()) return false;
        const currentKey = String(activeElementState.key).trim();
        return elements.some((el) =>
            keyFieldTypes.includes(el.type) && el.id !== activeElementState.id && String(el.key || '').trim() === currentKey
        );
    }, [activeElementState?.id, activeElementState?.key, elements]);

    const handleOnClickElementCard = (elementId) => {
        isClickingFromListRef.current = true;
        handleSelectElementCard(elementId);
        setTimeout(() => {
            isClickingFromListRef.current = false;
        }, 100);
    }

    // Manejar movimiento con teclado (flechas)
    useEffect(() => {
        if (!selectedElement || !selectedElementData) return;

        const handleKeyDown = (e) => {
            // Ignorar si el usuario está escribiendo en un input, textarea o contenteditable
            const target = e.target;
            const isInputElement = 
                target.tagName === 'INPUT' || 
                target.tagName === 'TEXTAREA' || 
                target.isContentEditable ||
                target.closest('[contenteditable="true"]') ||
                target.closest('input') ||
                target.closest('textarea');

            if (isInputElement) return;

            // Manejar tecla Suprimir/Delete para eliminar el elemento
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                deleteElement(selectedElement);
                return;
            }

            // Solo procesar teclas de flecha
            const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (!arrowKeys.includes(e.key)) return;

            e.preventDefault();

            // Determinar el paso de movimiento (0.1mm normal, 1mm con Shift)
            const step = e.shiftKey ? 1 : 0.1;
            
            const element = selectedElementData;
            let newX = element.x;
            let newY = element.y;

            // Calcular nueva posición según la tecla presionada
            switch (e.key) {
                case 'ArrowUp':
                    newY = element.y - step;
                    break;
                case 'ArrowDown':
                    newY = element.y + step;
                    break;
                case 'ArrowLeft':
                    newX = element.x - step;
                    break;
                case 'ArrowRight':
                    newX = element.x + step;
                    break;
                default:
                    return;
            }

            // Limitar movimiento dentro de los límites del canvas
            const maxX = canvasWidth - (element.width || 0);
            const maxY = canvasHeight - (element.height || 0);
            
            newX = Math.max(0, Math.min(maxX, newX));
            newY = Math.max(0, Math.min(maxY, newY));

            // Actualizar posición del elemento
            updateElement(element.id, {
                x: newX,
                y: newY,
            });

            // Actualizar también el estado local para mantener sincronizado el panel de propiedades
            if (activeElementState && activeElementState.id === element.id) {
                setActiveElementState((prev) => {
                    if (!prev) return null;
                    return { ...prev, x: newX, y: newY };
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedElement, selectedElementData, canvasWidth, canvasHeight, updateElement, deleteElement]);

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
                    <LabelEditorLeftPanel
                        selectedLabel={selectedLabel}
                        labelId={labelId}
                        clearEditor={clearEditor}
                        openSelector={openSelector}
                        setOpenSelector={setOpenSelector}
                        handleSelectLabel={handleSelectLabel}
                        handleCreateNewLabel={handleCreateNewLabel}
                        addElement={addElement}
                        elements={elements}
                        scrollAreaRef={scrollAreaRef}
                        elementRefs={elementRefs}
                        selectedElement={selectedElement}
                        onSelectElementCard={handleOnClickElementCard}
                        getFieldName={getFieldName}
                        duplicateElement={duplicateElement}
                        deleteElement={deleteElement}
                        formatDateDisplay={formatDateDisplay}
                    />

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
                                <LabelEditorToolbar
                                    canvasWidth={canvasWidth}
                                    setCanvasWidth={setCanvasWidth}
                                    canvasHeight={canvasHeight}
                                    setCanvasHeight={setCanvasHeight}
                                    rotateCanvas={rotateCanvas}
                                    fileInputRef={fileInputRef}
                                    handleImportJSON={handleImportJSON}
                                    setShowFieldExamplesDialog={setShowFieldExamplesDialog}
                                    setShowKeyboardShortcutsDialog={setShowKeyboardShortcutsDialog}
                                    handleOnClickSave={handleOnClickSave}
                                    isSaving={isSaving}
                                    exportJSON={exportJSON}
                                    labelName={labelName}
                                    handleOnClickPrintLabel={handleOnClickPrintLabel}
                                    handleOnClickDeleteLabel={handleOnClickDeleteLabel}
                                    zoom={zoom}
                                    setZoom={setZoom}
                                    setLabelName={setLabelName}
                                >
                                    <div className="flex-1 p-8 overflow-auto h-full flex items-center justify-center ">
                                        <div className="flex justify-center items-center h-full w-full">
                                            {zoom === 1 ? (
                                                <div className="flex flex-col items-center gap-4 mt-4">
                                                    <div className="bg-orange-200 px-4">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="w-full h-20 bg-white rounded-b-xl border-t-0 border shadow" />
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
                                                            <div className="w-full h-20 bg-white rounded-t-xl border border-b-0" />
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
                                </LabelEditorToolbar>
                            </div>
                        )}

                    </div>

                    {/* Panel Derecho - Propiedades */}
                    {activeElementState && (
                        <LabelEditorPropertyPanel
                            activeElementState={activeElementState}
                            updateActiveElement={updateActiveElement}
                            deleteElement={deleteElement}
                            hasDuplicateKey={hasDuplicateKey}
                            normalizeFieldKey={normalizeFieldKey}
                            fieldOptions={fieldOptions}
                            allFieldOptions={allFieldOptions}
                            getFieldValue={getFieldValue}
                            elements={elements}
                            borderWidthOptions={borderWidthOptions}
                            handleElementRotationChange={handleElementRotationChange}
                            autoFitToContent={autoFitToContent}
                        />
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

                {/* Diálogo de Atajos de Teclado */}
                <Dialog open={showKeyboardShortcutsDialog} onOpenChange={setShowKeyboardShortcutsDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Keyboard className="w-5 h-5" />
                                Atajos de Teclado
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-sm font-semibold mb-2 text-foreground">Movimiento</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Mover elemento</span>
                                            <div className="flex items-center gap-1">
                                                <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">↑</kbd>
                                                <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">↓</kbd>
                                                <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">←</kbd>
                                                <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">→</kbd>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Mover rápido (5mm)</span>
                                            <div className="flex items-center gap-1">
                                                <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">Shift</kbd>
                                                <span className="text-xs text-muted-foreground">+</span>
                                                <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">↑</kbd>
                                                <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">↓</kbd>
                                                <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">←</kbd>
                                                <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">→</kbd>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="text-sm font-semibold mb-2 text-foreground">Acciones</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Eliminar elemento</span>
                                            <div className="flex items-center gap-1">
                                                <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">Delete</kbd>
                                                <span className="text-xs text-muted-foreground">o</span>
                                                <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">Backspace</kbd>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-muted/50 border border-muted rounded-lg px-3 py-2">
                                <p className="text-xs text-muted-foreground">
                                    <strong>Nota:</strong> Los atajos solo funcionan cuando un elemento está seleccionado y no estás escribiendo en un campo de texto.
                                </p>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </TooltipProvider >
        </>
    )
}
