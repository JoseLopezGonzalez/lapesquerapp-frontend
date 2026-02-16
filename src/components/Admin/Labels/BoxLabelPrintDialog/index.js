'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLabel } from '@/hooks/useLabel';
import { usePrintElement } from '@/hooks/usePrintElement';
import LabelRender from '../../LabelEditor/LabelRender';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, SquareMousePointer } from 'lucide-react';import { notify } from '@/lib/notifications';
import { motion } from 'framer-motion';


const BoxLabelPrintDialog = ({ open, onClose, boxes = [] }) => {
    const [printInPairs, setPrintInPairs] = useState(false);
    const { label, selectedLabelId, labelsOptions, selectLabel, manualFields, fieldMetadata, changeManualField, values, disabledPrintButton, isLoading, isLoadingLabel } = useLabel({ boxes, open });

    const handleOnChangeLabel = (value) => {
        selectLabel(value);
    };

    // Calcular dimensiones de impresión: si es por pares, duplicar la altura
    const printWidth = useMemo(() => {
        return label?.format?.canvas?.width || 110;
    }, [label?.format?.canvas?.width]);

    const printHeight = useMemo(() => {
        const baseHeight = label?.format?.canvas?.height || 90;
        return printInPairs ? baseHeight * 2 : baseHeight;
    }, [label?.format?.canvas?.height, printInPairs]);

    const { onPrint } = usePrintElement({ id: 'print-area-id', width: printWidth, height: printHeight });

    const handleOnClickPrintLabel = () => {
        if (disabledPrintButton) {
            notify.error({ title: 'Por favor, completa todos los campos manuales antes de imprimir.' });
            return;
        }
        // console.log('Imprimiendo etiquetas con los siguientes valores:', values);
        notify.success({ title: `Imprimiendo ${values.length} etiquetas...` });
        onPrint();
    }

    const handleOnChangeManualField = (key, value) => {
        changeManualField(key, value);
    };

    // Calcular ancho máximo del diálogo basado en el tamaño de la etiqueta
    // 1mm ≈ 3.779px a 96dpi, añadimos padding y margen extra
    const labelWidth = label?.format?.canvas?.width || 110; // default 110mm
    const maxDialogWidth = Math.max(512, (labelWidth * 3.779) + 200); // mínimo 512px (max-w-lg), más espacio para padding

    return (
        <Dialog open={open} onOpenChange={onClose} >
            <DialogContent className="overflow-hidden" style={{ maxWidth: `${maxDialogWidth}px` }}>
                <DialogHeader>
                    <DialogTitle>Completa campos manuales</DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh] w-full overflow-x-auto">
                    <div className="space-y-6 px-2 pr-3">

                        {isLoadingLabel && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center justify-center w-full py-8"
                            >
                                <div className="flex flex-col items-center justify-center gap-3">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        className="rounded-full bg-primary/10 p-4"
                                    >
                                        <SquareMousePointer className="h-6 w-6 text-primary" />
                                    </motion.div>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="text-sm font-medium text-muted-foreground"
                                    >
                                        Cargando formato...
                                    </motion.p>
                                </div>
                            </motion.div>
                        )}

                        {label && !isLoadingLabel && (
                            <div className="flex items-center justify-center w-full overflow-x-auto">
                                <div className="flex flex-col items-center gap-4 mt-4">
                                    <div className='bg-orange-200 px-4'>
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-full h-20 bg-white rounded-b-xl border-t-0 border shadow">
                                            </div>
                                            <div className={`flex-shrink-0 ${printInPairs ? 'flex flex-col gap-0' : ''}`} style={printInPairs ? { width: `${label?.format?.canvas?.width || 110}mm` } : {}}>
                                                {printInPairs ? (
                                                    <>
                                                        <div>
                                                            <LabelRender
                                                                label={label?.format}
                                                                values={values[0]}
                                                                showPreviewBorder={true}
                                                            />
                                                        </div>
                                                        <div>
                                                            <LabelRender
                                                                label={label?.format}
                                                                values={values[1] || values[0]}
                                                                showPreviewBorder={true}
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <LabelRender
                                                        label={label?.format}
                                                        values={values[0]}
                                                        showPreviewBorder={true}
                                                    />
                                                )}
                                            </div>
                                            <div className="w-full h-20 bg-white rounded-t-xl border border-b-0">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Selector de formato */}
                        {!isLoadingLabel && (
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm">Formato de etiqueta</Label>
                                <Select value={selectedLabelId || undefined} onValueChange={handleOnChangeLabel}>
                                    <SelectTrigger className="w-full" loading={isLoading}>
                                        <SelectValue 
                                            placeholder="Selecciona un formato" 
                                            loading={isLoading}
                                            value={selectedLabelId || undefined}
                                            options={labelsOptions.map(opt => ({ value: opt.id, label: opt.name }))}
                                        />
                                    </SelectTrigger>
                                    <SelectContent loading={isLoading}>
                                        {labelsOptions.map((option) => (
                                            <SelectItem key={option.id} value={option.id}>
                                                {option.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Campos manuales y select */}
                        {!isLoadingLabel && (
                            <div className="space-y-4">
                                {Object.entries(manualFields).map(([key, value]) => {
                                    const meta = fieldMetadata[key];
                                    const isSelect = meta?.type === 'select' && Array.isArray(meta?.options) && meta.options.length > 0;
                                    const isCheckbox = meta?.type === 'checkbox';
                                    const isDate = meta?.type === 'date';
                                    const isDateManual = isDate && meta?.dateMode === 'manual';
                                    const isDateComputed = isDate && !isDateManual;
                                    const dateValue = value || (values[0]?.[key] ?? '');
                                    return (
                                        <div key={key} className="flex flex-col gap-1">
                                            <Label className="text-sm">{key}</Label>
                                            {isCheckbox ? (
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`field-${key}`}
                                                        checked={value === (meta?.content ?? '')}
                                                        onCheckedChange={(checked) => handleOnChangeManualField(key, checked ? (meta?.content ?? '') : '')}
                                                    />
                                                    <Label
                                                        htmlFor={`field-${key}`}
                                                        className="text-sm font-normal cursor-pointer text-muted-foreground"
                                                    >
                                                        {meta?.content ? `Mostrar: "${meta.content}"` : 'Mostrar en etiqueta'}
                                                    </Label>
                                                </div>
                                            ) : (isDateManual || isDateComputed) ? (
                                                <Input
                                                    type="date"
                                                    value={dateValue}
                                                    onChange={(e) => handleOnChangeManualField(key, e.target.value)}
                                                />
                                            ) : isSelect ? (
                                                <Select
                                                    value={value || ''}
                                                    onValueChange={(val) => handleOnChangeManualField(key, val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={`Selecciona ${key.toLowerCase()}`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {meta.options.map((opt) => (
                                                            <SelectItem key={opt} value={opt}>
                                                                {opt}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input
                                                    placeholder={`Introduce ${key.toLowerCase()}`}
                                                    value={value}
                                                    onChange={(e) => handleOnChangeManualField(key, e.target.value)}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Opción de impresión por pares */}
                        {!isLoadingLabel && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="print-in-pairs"
                                    checked={printInPairs}
                                    onCheckedChange={(checked) => setPrintInPairs(checked)}
                                />
                                <Label
                                    htmlFor="print-in-pairs"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Imprimir por pares (para rollos de etiquetas dobles)
                                </Label>
                            </div>
                        )}

                        {/* Imprimir */}
                        <div id="print-area-id" className="hidden print:block">
                            {printInPairs ? (
                                // Modo pares: agrupar etiquetas de dos en dos, una encima de la otra
                                (() => {
                                    const pairs = [];
                                    for (let i = 0; i < values.length; i += 2) {
                                        pairs.push([values[i], values[i + 1]]);
                                    }
                                    return pairs.map((pair, pairIndex) => (
                                        <div key={pairIndex} className="page" style={{ display: 'flex', flexDirection: 'column', gap: '0mm' }}>
                                            {pair.filter(Boolean).map((valuesElements, labelIndex) => (
                                                <div key={labelIndex} style={{ width: '100%' }}>
                                                    <LabelRender
                                                        label={label?.format}
                                                        values={valuesElements}
                                                    />
                                                </div>
                                            ))}
                                            {/* Si hay un número impar, añadir espacio vacío para la segunda etiqueta */}
                                            {pair.filter(Boolean).length === 1 && (
                                                <div style={{ width: '100%', height: `${label?.format?.canvas?.height || 90}mm` }}></div>
                                            )}
                                        </div>
                                    ));
                                })()
                            ) : (
                                // Modo normal: una etiqueta por página
                                values.map((valuesElements, i) => (
                                    <div key={i} className="page">
                                        <LabelRender
                                            label={label?.format}
                                            values={valuesElements}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </ScrollArea>

                {!isLoadingLabel && (
                    <DialogFooter className="pt-4">
                        <Button
                            onClick={handleOnClickPrintLabel}
                            className="w-full"
                        >
                            <Printer className="h-4 w-4" />
                            Imprimir {`(${boxes.length})`}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default BoxLabelPrintDialog;
