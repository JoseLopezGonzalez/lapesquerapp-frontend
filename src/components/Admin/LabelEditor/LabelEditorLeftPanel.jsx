'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from 'lucide-react';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { cn } from '@/lib/utils';
import LabelSelectorSheet from './LabelSelectorSheet';
import {
  hasElementValidationError,
  getElementValidationErrorReason,
} from '@/hooks/labelEditorValidation';

const titleAdd = 'Selecciona una etiqueta para añadir elementos';

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
    <div className="bg-card flex h-full w-90 flex-col border-r p-4">
      <div className="mb-4 flex gap-2">
        <Button className="flex-1" onClick={handleCreateNewLabel}>
          <Plus className="mr-2 h-5 w-5" />
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
            <FolderSearch className="mr-2 h-5 w-5" />
            Seleccionar Etiqueta
          </Button>
        </LabelSelectorSheet>
      </div>
      <div className="flex h-full min-h-0 flex-1 flex-col space-y-4">
        <div>
          <h3 className="mb-3 font-semibold">Añadir Elementos</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => addElement('text')}
              disabled={!selectedLabel}
              title={!selectedLabel ? titleAdd : ''}
            >
              <Type className="h-4 w-4" />
              Texto Fijo
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => addElement('field')}
              disabled={!selectedLabel}
              title={!selectedLabel ? titleAdd : ''}
            >
              <Database className="h-4 w-4" />
              Campo Dinámico
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => addElement('manualField')}
              disabled={!selectedLabel}
              title={!selectedLabel ? titleAdd : ''}
            >
              <BetweenHorizonalEnd className="h-4 w-4" />
              Campo Manual
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => addElement('qr')}
              disabled={!selectedLabel}
              title={!selectedLabel ? titleAdd : ''}
            >
              <QrCode className="h-4 w-4" />
              Código QR
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => addElement('richParagraph')}
              disabled={!selectedLabel}
              title={!selectedLabel ? titleAdd : ''}
            >
              <Pilcrow className="h-4 w-4" />
              Párrafo
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  disabled={!selectedLabel}
                  title={!selectedLabel ? titleAdd : 'Otros tipos de elemento'}
                >
                  <Plus className="h-4 w-4" />
                  Otros campos
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem
                  onClick={() => addElement('selectField')}
                  disabled={!selectedLabel}
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  Campo Select
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => addElement('checkboxField')}
                  disabled={!selectedLabel}
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Campo Checkbox
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addElement('dateField')} disabled={!selectedLabel}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Campo Fecha
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addElement('barcode')} disabled={!selectedLabel}>
                  <Barcode3 className="mr-2 h-4 w-4" />
                  Código de Barras
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addElement('line')} disabled={!selectedLabel}>
                  <Minus className="mr-2 h-4 w-4" />
                  Línea
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => addElement('sanitaryRegister')}
                  disabled={!selectedLabel}
                >
                  <Stamp className="mr-2 h-4 w-4" />
                  Registro Sanitario
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addElement('image')} disabled>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Imagen (no disponible)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {!selectedLabel && (
            <p className="text-muted-foreground mt-2 text-center text-xs">
              Selecciona una etiqueta para comenzar
            </p>
          )}
        </div>
        <Separator />
        <div className="flex min-h-0 flex-1 flex-col">
          {elements.length > 0 ? (
            <div className="flex h-full flex-col">
              <h3 className="mb-3 flex items-center justify-between font-semibold">
                <span>Elementos</span> {elements.length}
              </h3>
              <div className="h-full flex-1 overflow-hidden">
                <ScrollArea ref={scrollAreaRef} className="h-full flex-1 pr-3">
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
                            'group cursor-pointer shadow-sm transition-colors',
                            hasError &&
                              'border-l-destructive border-destructive/40 bg-destructive/10 dark:bg-destructive/15 border-l-4',
                            selectedElement === element.id &&
                              !hasError &&
                              'border-l-primary border-primary/40 bg-primary/10 dark:bg-primary/15 border-l-4',
                            !hasError &&
                              selectedElement !== element.id &&
                              'border-border hover:bg-muted/50 dark:hover:bg-muted/30'
                          )}
                          onClick={() => onSelectElementCard(element.id)}
                        >
                          <CardContent className="p-2">
                            {hasError && (
                              <div className="text-destructive mb-1 flex items-center gap-1 text-xs">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                <span>
                                  {errorReason === 'options' ? 'Sin opciones' : 'Sin nombre'}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex w-full items-center gap-2">
                                {element.type === 'text' && (
                                  <div className="flex w-full flex-col items-center gap-1">
                                    <div className="flex w-full items-center justify-start gap-1">
                                      <Type className="h-3 w-3" />
                                      <span className="text-sm font-medium capitalize">
                                        Texto Fijo
                                      </span>
                                    </div>
                                    <div className="bg-muted flex w-full items-center rounded-md p-2">
                                      <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                                        {element.text}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {element.type === 'field' && (
                                  <div className="flex w-full flex-col items-center gap-1">
                                    <div className="flex w-full items-center justify-start gap-1">
                                      <Database className="h-3 w-3" />
                                      <span className="text-sm font-medium capitalize">
                                        Campo Dinámico
                                      </span>
                                    </div>
                                    <div className="bg-muted flex w-full items-center rounded-md p-2">
                                      <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                                        {getFieldName(element.field || '')}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {element.type === 'manualField' && (
                                  <div className="flex w-full flex-col items-center gap-1">
                                    <div className="flex w-full items-center justify-start gap-1">
                                      <BetweenHorizonalEnd className="h-3 w-3" />
                                      <span className="text-sm font-medium capitalize">
                                        Campo Manual
                                      </span>
                                    </div>
                                    <div className="bg-muted flex w-full items-center rounded-md p-2">
                                      <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                                        {element.sample || `{{${element.key}}}`}
                                      </span>
                                    </div>
                                    {element.visibleOnLabel === false && (
                                      <span className="text-muted-foreground bg-muted/80 self-start rounded px-1.5 py-0.5 text-[10px]">
                                        No visible
                                      </span>
                                    )}
                                  </div>
                                )}
                                {element.type === 'selectField' && (
                                  <div className="flex w-full flex-col items-center gap-1">
                                    <div className="flex w-full items-center justify-start gap-1">
                                      <ListChecks className="h-3 w-3" />
                                      <span className="text-sm font-medium capitalize">
                                        Campo Select
                                      </span>
                                    </div>
                                    <div className="bg-muted flex w-full items-center rounded-md p-2">
                                      <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                                        {element.sample ||
                                          element.key ||
                                          (Array.isArray(element.options) && element.options[0]) ||
                                          ''}
                                      </span>
                                    </div>
                                    {element.visibleOnLabel === false && (
                                      <span className="text-muted-foreground bg-muted/80 self-start rounded px-1.5 py-0.5 text-[10px]">
                                        No visible
                                      </span>
                                    )}
                                  </div>
                                )}
                                {element.type === 'checkboxField' && (
                                  <div className="flex w-full flex-col items-center gap-1">
                                    <div className="flex w-full items-center justify-start gap-1">
                                      <CheckSquare className="h-3 w-3" />
                                      <span className="text-sm font-medium capitalize">
                                        Campo Checkbox
                                      </span>
                                    </div>
                                    <div className="bg-muted flex w-full items-center rounded-md p-2">
                                      <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                                        {element.content || element.key || ''}
                                      </span>
                                    </div>
                                    {element.visibleOnLabel === false && (
                                      <span className="text-muted-foreground bg-muted/80 self-start rounded px-1.5 py-0.5 text-[10px]">
                                        No visible
                                      </span>
                                    )}
                                  </div>
                                )}
                                {element.type === 'dateField' && (
                                  <div className="flex w-full flex-col items-center gap-1">
                                    <div className="flex w-full items-center justify-start gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span className="text-sm font-medium capitalize">
                                        Campo Fecha
                                      </span>
                                    </div>
                                    <div className="bg-muted flex w-full items-center rounded-md p-2">
                                      <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                                        {formatDateDisplay(element.sample || element.key || '')}
                                      </span>
                                    </div>
                                    {element.visibleOnLabel === false && (
                                      <span className="text-muted-foreground bg-muted/80 self-start rounded px-1.5 py-0.5 text-[10px]">
                                        No visible
                                      </span>
                                    )}
                                  </div>
                                )}
                                {element.type === 'sanitaryRegister' && (
                                  <div className="flex w-full flex-col items-center gap-1">
                                    <div className="flex w-full items-center justify-start gap-1">
                                      <Stamp className="h-3 w-3" />
                                      <span className="text-sm font-medium capitalize">
                                        Registro Sanitario
                                      </span>
                                    </div>
                                    <div className="bg-muted flex w-full items-center rounded-md p-2">
                                      <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                                        {`${element.countryCode || ''} ${element.approvalNumber || ''} ${element.suffix || ''}`.trim()}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {element.type === 'richParagraph' && (
                                  <div className="flex w-full flex-col items-center gap-1">
                                    <div className="flex w-full items-center justify-start gap-1">
                                      <Pilcrow className="h-3 w-3" />
                                      <span className="text-sm font-medium capitalize">
                                        Párrafo
                                      </span>
                                    </div>
                                    <div className="bg-muted flex w-full items-center rounded-md p-2">
                                      <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                                        {element.html
                                          ? element.html.replace(/<[^>]+>/g, '')
                                          : element.text || ''}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {element.type === 'qr' && (
                                  <div className="flex items-center gap-1">
                                    <QrCode className="h-3 w-3" />
                                    <span className="text-sm font-medium capitalize">
                                      Código QR
                                    </span>
                                  </div>
                                )}
                                {element.type === 'barcode' && (
                                  <div className="flex items-center gap-1">
                                    <Barcode3 className="h-3 w-3" />
                                    <span className="text-sm font-medium capitalize">
                                      Código de Barras
                                    </span>
                                  </div>
                                )}
                                {element.type === 'image' && (
                                  <div className="flex items-center gap-1">
                                    <ImageIcon className="h-3 w-3" />
                                    <span className="text-sm font-medium capitalize">Imagen</span>
                                  </div>
                                )}
                                {element.type === 'line' && (
                                  <div className="flex w-full flex-col items-center gap-1">
                                    <div className="flex w-full items-center justify-start gap-1">
                                      <Minus className="h-3 w-3" />
                                      <span className="text-sm font-medium capitalize">Línea</span>
                                    </div>
                                    <div className="bg-muted flex w-full items-center rounded-md p-2">
                                      <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                                        {element.direction === 'vertical'
                                          ? 'Vertical'
                                          : 'Horizontal'}{' '}
                                        - {element.strokeWidth || 0.1}mm
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="ml-2 flex gap-1 opacity-0 group-hover:opacity-100">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateElement(element.id);
                                  }}
                                >
                                  <CopyPlus className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteElement(element.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
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
            <div className="flex h-full items-center justify-center py-10">
              <EmptyState
                icon={<CopyPlus className="h-8 w-8" />}
                title="Agrega algún elemento"
                description="Añade elementos desde el panel izquierdo para comenzar."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
