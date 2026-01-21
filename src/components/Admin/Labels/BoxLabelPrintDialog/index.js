'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useLabel } from '@/hooks/useLabel';
import { usePrintElement } from '@/hooks/usePrintElement';
import LabelRender from '../../LabelEditor/LabelRender';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, SquareMousePointer } from 'lucide-react';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { motion } from 'framer-motion';


const BoxLabelPrintDialog = ({ open, onClose, boxes = [] }) => {
    const { label, labelsOptions, selectLabel, manualFields, fields, changeManualField, values, disabledPrintButton, isLoading, isLoadingLabel } = useLabel({ boxes, open });

    const handleOnChangeLabel = (value) => {
        selectLabel(value);
    };

    const { onPrint } = usePrintElement({ id: 'print-area-id', width: label?.format?.canvas?.width, height: label?.format?.canvas?.height });

    const handleOnClickPrintLabel = () => {
        if (disabledPrintButton) {
            toast.error('Por favor, completa todos los campos manuales antes de imprimir.', getToastTheme());
            return;
        }
        // console.log('Imprimiendo etiquetas con los siguientes valores:', values);
        toast.success(`Imprimiendo ${values.length} etiquetas...`, getToastTheme());
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
                                <div className='bg-orange-200 px-4 flex-shrink-0'>
                                    <div className="flex flex-col items-center  gap-4">
                                        <div className="w-full h-10 bg-white rounded-b-xl border-t-0 border bg-card text-card-foreground  shadow">
                                        </div>
                                        <LabelRender
                                            label={label?.format}
                                            values={values[0]}
                                        />
                                        <div className="w-full h-10 bg-white rounded-t-xl  border border-b-0 bg-card text-card-foreground  ">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Selector de formato */}
                        {!isLoadingLabel && (
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm">Formato de etiqueta</Label>
                                <Select onValueChange={handleOnChangeLabel}>
                                    <SelectTrigger className="w-full" loading={isLoading}>
                                        <SelectValue placeholder="Selecciona un formato" loading={isLoading} />
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

                        {/* Campos manuales */}
                        {!isLoadingLabel && (
                            <div className="space-y-4">
                                {Object.entries(manualFields).map(([key, value]) => (
                                    <div key={key} className="flex flex-col gap-1">
                                        <Label className="text-sm">{key}</Label>
                                        <Input
                                            placeholder={`Introduce ${key.toLowerCase()}`}
                                            value={value}
                                            onChange={(e) => handleOnChangeManualField(key, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Imprimir */}
                        <div id="print-area-id" className="hidden print:block">
                            {/* {console.log('Valores a imprimir:', values)} */}
                            {values.map((valuesElements, i) => (
                                <div key={i} className="page ">
                                    <LabelRender
                                        label={label?.format}
                                        values={valuesElements}
                                    />
                                </div>
                            ))}
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
