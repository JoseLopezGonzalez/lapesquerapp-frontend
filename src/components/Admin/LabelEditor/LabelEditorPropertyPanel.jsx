'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Type,
  Database,
  QrCode,
  BarcodeIcon as Barcode3,
  ImageIcon,
  Stamp,
  Pilcrow,
  Trash2,
  Plus,
  Minus,
  ListChecks,
  CheckSquare,
  Calendar,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyCenter,
  Maximize,
  BetweenHorizonalEnd,
  Italic,
  Underline,
  Strikethrough,
  CaseUpper,
  CaseLower,
  CaseSensitive,
  Bold,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import QRConfigPanel from './QRConfigPanel';
import BarcodeConfigPanel from './BarcodeConfigPanel';
import RichParagraphConfigPanel from './RichParagraphConfigPanel';

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
    <div className="w-80 overflow-y-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {activeElementState.type === 'text' && (
              <div className="flex items-center justify-center gap-2">
                <Type className="h-4 w-4" />
                <h4 className="text-xl font-normal capitalize">Texto</h4>
              </div>
            )}
            {activeElementState.type === 'field' && (
              <div className="flex items-center justify-center gap-2">
                <Database className="h-4 w-4" />
                <h4 className="text-xl font-normal capitalize">Campo Dinámico</h4>
              </div>
            )}
            {activeElementState.type === 'manualField' && (
              <div className="flex items-center justify-center gap-2">
                <BetweenHorizonalEnd className="h-4 w-4" />
                <h4 className="text-xl font-normal capitalize">Campo Manual</h4>
              </div>
            )}
            {activeElementState.type === 'selectField' && (
              <div className="flex items-center justify-center gap-2">
                <ListChecks className="h-4 w-4" />
                <h4 className="text-xl font-normal capitalize">Campo Select</h4>
              </div>
            )}
            {activeElementState.type === 'checkboxField' && (
              <div className="flex items-center justify-center gap-2">
                <CheckSquare className="h-4 w-4" />
                <h4 className="text-xl font-normal capitalize">Campo Checkbox</h4>
              </div>
            )}
            {activeElementState.type === 'dateField' && (
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                <h4 className="text-xl font-normal capitalize">Campo Fecha</h4>
              </div>
            )}
            {activeElementState.type === 'sanitaryRegister' && (
              <div className="flex items-center justify-center gap-2">
                <Stamp className="h-4 w-4" />
                <h4 className="text-xl font-normal capitalize">Registro Sanitario</h4>
              </div>
            )}
            {activeElementState.type === 'richParagraph' && (
              <div className="flex items-center justify-center gap-2">
                <Pilcrow className="h-4 w-4" />
                <h4 className="text-xl font-normal capitalize">Párrafo</h4>
              </div>
            )}
            {activeElementState.type === 'qr' && (
              <div className="flex items-center justify-center gap-2">
                <QrCode className="h-4 w-4" />
                <h4 className="text-xl font-normal capitalize">Código QR</h4>
              </div>
            )}
            {activeElementState.type === 'barcode' && (
              <div className="flex items-center justify-center gap-2">
                <Barcode3 className="h-4 w-4" />
                <h4 className="text-xl font-normal capitalize">Código de Barras</h4>
              </div>
            )}
            {activeElementState.type === 'image' && (
              <div className="flex items-center justify-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <h4 className="text-xl font-normal capitalize">Imagen</h4>
              </div>
            )}
            {activeElementState.type === 'line' && (
              <div className="flex items-center justify-center gap-2">
                <Minus className="h-4 w-4" />
                <h4 className="text-xl font-normal capitalize">Línea</h4>
              </div>
            )}
            <Button
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
              variant="ghost"
              size="sm"
              onClick={() => deleteElement(activeElementState.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Campo dinámico */}
          {activeElementState.type === 'field' && (
            <div>
              <h4 className="mb-2 text-sm font-medium">Campo dinámico</h4>
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
              <div className="bg-muted mt-2 rounded p-2 text-sm">
                <strong></strong> {getFieldValue(activeElementState.field || '')}
              </div>
            </div>
          )}

          {activeElementState.type === 'manualField' && (
            <div className="space-y-2">
              <div>
                <h4 className="mb-2 text-sm font-medium">Nombre del campo</h4>
                <Input
                  value={activeElementState.key || ''}
                  onChange={(e) => updateActiveElement({ key: normalizeFieldKey(e.target.value) })}
                  placeholder="Nombre del campo"
                />
                {hasDuplicateKey && (
                  <p className="mt-1 text-xs text-red-600">
                    Ya hay otro campo con el mismo nombre.
                  </p>
                )}
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Valor de prueba</h4>
                <Input
                  value={activeElementState.sample || ''}
                  onChange={(e) => updateActiveElement({ sample: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeElementState.type === 'selectField' && (
            <div className="space-y-2">
              <div>
                <h4 className="mb-2 text-sm font-medium">Nombre del campo</h4>
                <Input
                  value={activeElementState.key || ''}
                  onChange={(e) => updateActiveElement({ key: normalizeFieldKey(e.target.value) })}
                  placeholder="Nombre del campo"
                />
                {hasDuplicateKey && (
                  <p className="mt-1 text-xs text-red-600">
                    Ya hay otro campo con el mismo nombre.
                  </p>
                )}
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Opciones</h4>
                <div className="space-y-2">
                  {(Array.isArray(activeElementState.options)
                    ? activeElementState.options
                    : []
                  ).map((opt, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const next = [...(activeElementState.options || [])];
                          next[index] = e.target.value;
                          const validOpts = next.filter(Boolean);
                          const sample = validOpts.includes(activeElementState.sample)
                            ? activeElementState.sample
                            : (validOpts[0] ?? '');
                          updateActiveElement({ options: next, sample });
                        }}
                        placeholder={`Opción ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => {
                          const next = (activeElementState.options || []).filter(
                            (_, i) => i !== index
                          );
                          const validOpts = next.filter(Boolean);
                          const sample = validOpts.includes(activeElementState.sample)
                            ? activeElementState.sample
                            : (validOpts[0] ?? '');
                          updateActiveElement({ options: next, sample });
                        }}
                        title="Quitar opción"
                      >
                        <Trash2 className="h-4 w-4" />
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
                      updateActiveElement({ options: [...current, ''] });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Añadir opción
                  </Button>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Estas opciones se mostrarán al imprimir
                </p>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Valor vista previa</h4>
                {(() => {
                  const opts = (activeElementState.options || []).filter(Boolean);
                  const currentSample = activeElementState.sample || '';
                  const valueInOptions = opts.includes(currentSample)
                    ? currentSample
                    : (opts[0] ?? '');
                  if (opts.length === 0) {
                    return (
                      <p className="text-muted-foreground text-sm">
                        Añade opciones arriba para elegir el valor de vista previa.
                      </p>
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

          {activeElementState.type === 'checkboxField' && (
            <div className="space-y-2">
              <div>
                <h4 className="mb-2 text-sm font-medium">Nombre del campo</h4>
                <Input
                  value={activeElementState.key || ''}
                  onChange={(e) => updateActiveElement({ key: normalizeFieldKey(e.target.value) })}
                  placeholder="Nombre del campo"
                />
                {hasDuplicateKey && (
                  <p className="mt-1 text-xs text-red-600">
                    Ya hay otro campo con el mismo nombre.
                  </p>
                )}
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Contenido cuando está marcado</h4>
                <Input
                  value={activeElementState.content || ''}
                  onChange={(e) => updateActiveElement({ content: e.target.value })}
                  placeholder="Texto que se mostrará al marcar el checkbox"
                />
              </div>
            </div>
          )}

          {activeElementState.type === 'dateField' && (
            <div className="space-y-2">
              <div>
                <h4 className="mb-2 text-sm font-medium">Nombre del campo</h4>
                <Input
                  value={activeElementState.key || ''}
                  onChange={(e) => updateActiveElement({ key: normalizeFieldKey(e.target.value) })}
                  placeholder="Nombre del campo"
                />
                {hasDuplicateKey && (
                  <p className="mt-1 text-xs text-red-600">
                    Ya hay otro campo con el mismo nombre.
                  </p>
                )}
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Origen de la fecha al imprimir</h4>
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
              {activeElementState.dateMode === 'system' && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">Desplazamiento (días, opcional)</h4>
                  <Input
                    type="number"
                    value={activeElementState.systemOffsetDays ?? 0}
                    onChange={(e) =>
                      updateActiveElement({ systemOffsetDays: parseInt(e.target.value, 10) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
              )}
              {activeElementState.dateMode === 'fieldOffset' && (
                <>
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Campo fecha de referencia</h4>
                    <Select
                      value={activeElementState.fieldRef || ''}
                      onValueChange={(val) => updateActiveElement({ fieldRef: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un campo fecha" />
                      </SelectTrigger>
                      <SelectContent>
                        {elements
                          .filter(
                            (el) =>
                              el.type === 'dateField' && el.key && el.id !== activeElementState.id
                          )
                          .map((el) => (
                            <SelectItem key={el.id} value={el.key}>
                              {el.key}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Desplazamiento (días, opcional)</h4>
                    <Input
                      type="number"
                      value={activeElementState.fieldOffsetDays ?? 0}
                      onChange={(e) =>
                        updateActiveElement({ fieldOffsetDays: parseInt(e.target.value, 10) || 0 })
                      }
                      placeholder="0"
                    />
                  </div>
                </>
              )}
              <div>
                <h4 className="mb-2 text-sm font-medium">Vista previa</h4>
                {activeElementState.dateMode === 'manual' ? (
                  <>
                    <Input
                      type="date"
                      value={activeElementState.sample || ''}
                      onChange={(e) => updateActiveElement({ sample: e.target.value })}
                    />
                    <p className="text-muted-foreground mt-1 text-xs">Valor vista previa</p>
                  </>
                ) : (
                  <p className="text-muted-foreground py-2 text-sm">
                    {formatDateDisplay(getDateFieldPreview(activeElementState, elements)) || '—'}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeElementState.type === 'sanitaryRegister' && (
            <div className="space-y-2">
              <div>
                <h4 className="mb-2 text-sm font-medium">Código de país</h4>
                <Input
                  value={activeElementState.countryCode || ''}
                  onChange={(e) => updateActiveElement({ countryCode: e.target.value })}
                />
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Número de aprobación</h4>
                <Input
                  value={activeElementState.approvalNumber || ''}
                  onChange={(e) => updateActiveElement({ approvalNumber: e.target.value })}
                />
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Sufijo</h4>
                <Input
                  value={activeElementState.suffix || ''}
                  onChange={(e) => updateActiveElement({ suffix: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 flex-col">
                  <span className="text-muted-foreground text-xs">Color Borde</span>
                  <Input
                    type="color"
                    value={activeElementState.borderColor || '#000000'}
                    onChange={(e) => updateActiveElement({ borderColor: e.target.value })}
                    className="h-8 w-10 p-0"
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
                <div className="flex flex-1 flex-col">
                  <span className="text-muted-foreground text-xs">Grosor</span>
                  <Select
                    value={String(activeElementState.borderWidth || '0.10')}
                    onValueChange={(value) => updateActiveElement({ borderWidth: value })}
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

          {activeElementState.type === 'richParagraph' && (
            <div>
              <h4 className="mb-2 text-sm font-medium">Párrafo</h4>
              <RichParagraphConfigPanel
                key={activeElementState.id}
                html={activeElementState.html || ''}
                onChange={(val) => updateActiveElement({ html: val })}
                fieldOptions={allFieldOptions}
              />
            </div>
          )}

          {activeElementState.type === 'text' && (
            <div>
              <h4 className="mb-2 text-sm font-medium">Contenido</h4>
              <div className="flex w-full items-center justify-between gap-2">
                <Input
                  id="text"
                  value={activeElementState.text}
                  onChange={(e) => updateActiveElement({ text: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeElementState.type === 'qr' && (
            <div>
              <h4 className="mb-2 text-sm font-medium">Contenido QR</h4>
              <QRConfigPanel
                value={activeElementState.qrContent || ''}
                onChange={(val) => updateActiveElement({ qrContent: val })}
                fieldOptions={allFieldOptions}
              />
            </div>
          )}

          {activeElementState.type === 'barcode' && (
            <div>
              <h4 className="mb-2 text-sm font-medium">Código de Barras</h4>
              <BarcodeConfigPanel
                value={activeElementState.barcodeContent || ''}
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

          {activeElementState.type === 'line' && (
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-sm font-medium">Dirección</h4>
                <div className="flex gap-2">
                  <Button
                    variant={activeElementState.direction === 'horizontal' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const currentWidth = activeElementState.width;
                      const currentHeight = activeElementState.height;
                      // Si es vertical, intercambiar dimensiones para horizontal
                      if (activeElementState.direction === 'vertical') {
                        updateActiveElement({
                          direction: 'horizontal',
                          width: currentHeight,
                          height: currentWidth,
                        });
                      } else {
                        updateActiveElement({ direction: 'horizontal' });
                      }
                    }}
                  >
                    Horizontal
                  </Button>
                  <Button
                    variant={activeElementState.direction === 'vertical' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const currentWidth = activeElementState.width;
                      const currentHeight = activeElementState.height;
                      // Si es horizontal, intercambiar dimensiones para vertical
                      if (activeElementState.direction === 'horizontal') {
                        updateActiveElement({
                          direction: 'vertical',
                          width: currentHeight,
                          height: currentWidth,
                        });
                      } else {
                        updateActiveElement({ direction: 'vertical' });
                      }
                    }}
                  >
                    Vertical
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Grosor</h4>
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
                <p className="text-muted-foreground mt-1 text-xs">Grosor en mm (0.01 - 5)</p>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Color</h4>
                <Input
                  type="color"
                  value={activeElementState.color || '#000000'}
                  onChange={(e) => updateActiveElement({ color: e.target.value })}
                  className="h-10 w-full cursor-pointer"
                />
              </div>
            </div>
          )}

          {(activeElementState.type === 'text' ||
            activeElementState.type === 'field' ||
            activeElementState.type === 'manualField' ||
            activeElementState.type === 'selectField' ||
            activeElementState.type === 'checkboxField' ||
            activeElementState.type === 'dateField' ||
            activeElementState.type === 'qr' ||
            activeElementState.type === 'barcode' ||
            activeElementState.type === 'sanitaryRegister' ||
            activeElementState.type === 'richParagraph') && <Separator className="my-4" />}

          {/* Layout */}
          <div>
            <h4 className="mb-2 text-sm font-medium">Formato</h4>
            <div className="flex w-full flex-col items-center gap-3">
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">Posición</span>
                <div className="flex max-w-36 items-center gap-2">
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
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">Tamaño</span>
                <div className="flex max-w-36 items-center gap-2">
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
              {(activeElementState.type === 'text' ||
                activeElementState.type === 'field' ||
                activeElementState.type === 'manualField' ||
                activeElementState.type === 'selectField' ||
                activeElementState.type === 'checkboxField' ||
                activeElementState.type === 'dateField' ||
                activeElementState.type === 'richParagraph' ||
                activeElementState.type === 'sanitaryRegister') && (
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">Ajustar al contenido</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => autoFitToContent(activeElementState.id)}
                    className="flex items-center gap-2"
                  >
                    <Maximize className="h-4 w-4" />
                    <span className="text-xs">Ajustar</span>
                  </Button>
                </div>
              )}
              {/* Rotate */}
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">Rotación</span>

                {/* Select angle */}
                <Select
                  value={String(activeElementState.rotation || 0)}
                  onValueChange={(value) =>
                    handleElementRotationChange(activeElementState.id, Number(value))
                  }
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
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">Alineación</span>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          activeElementState.verticalAlign === 'start' ? 'default' : 'outline'
                        }
                        size="sm"
                        className="w-8"
                        onClick={() => updateActiveElement({ verticalAlign: 'start' })}
                      >
                        <AlignVerticalJustifyStart className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Alinear arriba</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeElementState.verticalAlign === 'end' ? 'default' : 'outline'}
                        size="sm"
                        className="w-8"
                        onClick={() => updateActiveElement({ verticalAlign: 'end' })}
                      >
                        <AlignVerticalJustifyEnd className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Alinear abajo</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          activeElementState.verticalAlign === 'center' ? 'default' : 'outline'
                        }
                        size="sm"
                        className="w-8"
                        onClick={() => updateActiveElement({ verticalAlign: 'center' })}
                      >
                        <AlignVerticalJustifyCenter className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Centro vertical</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">{/* space code */} &nbsp;</span>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          activeElementState.horizontalAlign === 'left' ? 'default' : 'outline'
                        }
                        size="sm"
                        className="w-8"
                        onClick={() => updateActiveElement({ horizontalAlign: 'left' })}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Alinear a la izquierda</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          activeElementState.horizontalAlign === 'center' ? 'default' : 'outline'
                        }
                        size="sm"
                        className="w-8"
                        onClick={() => updateActiveElement({ horizontalAlign: 'center' })}
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Alinear al centro</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          activeElementState.horizontalAlign === 'right' ? 'default' : 'outline'
                        }
                        size="sm"
                        className="w-8"
                        onClick={() => updateActiveElement({ horizontalAlign: 'right' })}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Alinear a la derecha</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          activeElementState.horizontalAlign === 'justify' ? 'default' : 'outline'
                        }
                        size="sm"
                        className="w-8"
                        onClick={() => updateActiveElement({ horizontalAlign: 'justify' })}
                      >
                        <AlignJustify className="h-4 w-4" />
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

          {(activeElementState.type === 'text' ||
            activeElementState.type === 'field' ||
            activeElementState.type === 'manualField' ||
            activeElementState.type === 'selectField' ||
            activeElementState.type === 'checkboxField' ||
            activeElementState.type === 'dateField' ||
            activeElementState.type === 'sanitaryRegister' ||
            activeElementState.type === 'richParagraph') && <Separator className="my-4" />}

          {/* Text properties */}
          {(activeElementState.type === 'text' ||
            activeElementState.type === 'field' ||
            activeElementState.type === 'manualField' ||
            activeElementState.type === 'selectField' ||
            activeElementState.type === 'checkboxField' ||
            activeElementState.type === 'dateField' ||
            activeElementState.type === 'sanitaryRegister' ||
            activeElementState.type === 'richParagraph' ||
            activeElementState.type === 'barcode') && (
            <div>
              <h4 className="mb-2 text-sm font-medium">Texto</h4>
              <div className="flex w-full flex-col items-center gap-3">
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">Tamaño</span>
                  <Input
                    id="fontSize"
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="w-24"
                    value={activeElementState.fontSize ?? 2.5}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      updateActiveElement({ fontSize: Number.isNaN(value) ? 2.5 : value });
                    }}
                  />
                </div>
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">Color</span>
                  <Input
                    id="color"
                    type="color"
                    value={activeElementState.color}
                    onChange={(e) => updateActiveElement({ color: e.target.value })}
                    className="h-9 w-9 cursor-pointer p-1"
                  />
                </div>
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">Estilos</span>
                  <div className="flex w-fit items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={activeElementState.fontWeight === 'bold' ? 'default' : 'outline'}
                          size="sm"
                          className="w-8"
                          onClick={() => {
                            updateActiveElement({
                              fontWeight:
                                activeElementState.fontWeight === 'bold' ? 'normal' : 'bold',
                            });
                          }}
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Negrita</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={
                            activeElementState.fontWeight === 'black' ? 'default' : 'outline'
                          }
                          size="sm"
                          className="w-8"
                          onClick={() => {
                            updateActiveElement({
                              fontWeight:
                                activeElementState.fontWeight === 'black' ? 'normal' : 'black',
                            });
                          }}
                        >
                          <Bold className="h-4 w-4" strokeWidth={3} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Black</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={
                            activeElementState.fontStyle === 'italic' ? 'default' : 'outline'
                          }
                          size="sm"
                          className="w-8"
                          onClick={() => {
                            updateActiveElement({
                              fontStyle:
                                activeElementState.fontStyle === 'italic' ? 'normal' : 'italic',
                            });
                          }}
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cursiva</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={
                            activeElementState.textDecoration === 'underline'
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          className="w-8"
                          onClick={() => {
                            updateActiveElement({
                              textDecoration:
                                activeElementState.textDecoration === 'underline'
                                  ? 'none'
                                  : 'underline',
                            });
                          }}
                        >
                          <Underline className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Subrayado</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={
                            activeElementState.textDecoration === 'line-through'
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          className="w-8"
                          onClick={() => {
                            updateActiveElement({
                              textDecoration:
                                activeElementState.textDecoration === 'line-through'
                                  ? 'none'
                                  : 'line-through',
                            });
                          }}
                        >
                          <Strikethrough className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tachado</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">Caracter</span>
                  <div className="flex w-fit items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={
                            activeElementState.textTransform === 'uppercase' ? 'default' : 'outline'
                          }
                          size="sm"
                          className="w-8 p-0"
                          onClick={() =>
                            updateActiveElement({
                              textTransform:
                                activeElementState.textTransform === 'uppercase'
                                  ? 'none'
                                  : 'uppercase',
                            })
                          }
                        >
                          <CaseUpper className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mayúsculas</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={
                            activeElementState.textTransform === 'lowercase' ? 'default' : 'outline'
                          }
                          size="sm"
                          className="w-8"
                          onClick={() =>
                            updateActiveElement({
                              textTransform:
                                activeElementState.textTransform === 'lowercase'
                                  ? 'none'
                                  : 'lowercase',
                            })
                          }
                        >
                          <CaseLower className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Minúsculas</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={
                            activeElementState.textTransform === 'capitalize'
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          className="w-8"
                          onClick={() =>
                            updateActiveElement({
                              textTransform:
                                activeElementState.textTransform === 'capitalize'
                                  ? 'none'
                                  : 'capitalize',
                            })
                          }
                        >
                          <CaseSensitive className="h-5 w-5" />
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

          {(activeElementState.type === 'manualField' ||
            activeElementState.type === 'selectField' ||
            activeElementState.type === 'checkboxField' ||
            activeElementState.type === 'dateField') && (
            <>
              <Separator />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visible-on-label"
                  checked={activeElementState.visibleOnLabel !== false}
                  onCheckedChange={(checked) => updateActiveElement({ visibleOnLabel: !!checked })}
                />
                <Label htmlFor="visible-on-label" className="cursor-pointer text-sm font-normal">
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
