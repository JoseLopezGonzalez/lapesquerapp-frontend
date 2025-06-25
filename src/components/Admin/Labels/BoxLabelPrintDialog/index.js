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
import { Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';

// Simulamos campos manuales y número de etiquetas
const mockManualFields = ['Cliente', 'Destino', 'Fecha de salida'];
const mockSelectedCount = 12;

const initialBoxes = [
    {
        id: 124391,
        palletId: 3528,
        product: {
            id: 224,
            name: "Pulpo eviscerado congelado IQF T4 (15% - Agua) - Terranosa",
            category: {
                id: 1,
                name: "product",
            },
            species: {
                id: 1,
                name: "Pulpo común",
                scientificName: "Octopus Vulgaris",
                fao: "OCC",
                image: "pulpo-comun.png",
            },
            captureZone: {
                id: 1,
                name: "FAO 27.IX.a - Atlantic, Northeast (Portuguese Waters / East)",
            },
            articleGtin: "8436613931752",
            boxGtin: "98436613931755",
            palletGtin: "",
            fixedWeight: "0.00",
            a3erpCode: "10044",
            facilcomCode: null,
        },
        lot: "190625OCC01001",
        gs1128: "(01)98436613931755(3100)001850(10)190625OCC01001",
        grossWeight: "18.50",
        netWeight: "18.50",
        createdAt: "2025-06-20T06:18:13.000000Z",
    },
    {
        id: 124391,
        palletId: 3528,
        product: {
            id: 224,
            name: "Pulpo eviscerado congelado IQF T4 (15% - Agua) - Terranosa",
            category: {
                id: 1,
                name: "product",
            },
            species: {
                id: 1,
                name: "Pulpo común",
                scientificName: "Octopus Vulgaris",
                fao: "OCC",
                image: "pulpo-comun.png",
            },
            captureZone: {
                id: 1,
                name: "FAO 27.IX.a - Atlantic, Northeast (Portuguese Waters / East)",
            },
            articleGtin: "8436613931752",
            boxGtin: "98436613931755",
            palletGtin: "",
            fixedWeight: "0.00",
            a3erpCode: "10044",
            facilcomCode: null,
        },
        lot: "190625OCC01001",
        gs1128: "(01)98436613931755(3100)001850(10)190625OCC01001",
        grossWeight: "18.50",
        netWeight: "18.50",
        createdAt: "2025-06-20T06:18:13.000000Z",
    },
];


const BoxLabelPrintDialog = ({ open, onClose, boxes = [] }) => {
    const { label, labelsOptions, selectLabel, manualFields, fields, changeManualField, values, disabledPrintButton } = useLabel({ boxes , open });

    const handleOnChangeLabel = (value) => {
        selectLabel(value);
    };

    const { onPrint } = usePrintElement({ id: 'print-area-id', width: label?.format?.canvas?.width, height: label?.format?.canvas?.height });

    const handleOnClickPrintLabel = () => {
        if (disabledPrintButton) {
            toast.error('Por favor, completa todos los campos manuales antes de imprimir.', getToastTheme());
            return;
        }
        console.log('Imprimiendo etiquetas con los siguientes valores:', values);
        toast.success(`Imprimiendo ${values.length} etiquetas...`, getToastTheme());
        onPrint();
    }

    const handleOnChangeManualField = (key, value) => {
        changeManualField(key, value);
    };

    return (
        <Dialog open={open} onOpenChange={onClose} >
            <DialogContent className="max-w-lg overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Completa campos manuales</DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh] w-full ">
                    <div className="space-y-6 px-2 pr-3">

                        {label && (
                            <div className="flex items-center justify-center w-full">
                                <div className='bg-orange-200 px-4'>
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
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm">Formato de etiqueta</Label>
                            <Select onValueChange={handleOnChangeLabel}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecciona un formato" />
                                </SelectTrigger>
                                <SelectContent>
                                    {labelsOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id}>
                                            {option.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Campos manuales */}
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

                        {/* Imprimir */}
                        <div id="print-area-id" className="hidden print:block">
                            {console.log('Valores a imprimir:', values)}
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

                <DialogFooter className="pt-4">
                    <Button

                        onClick={handleOnClickPrintLabel}
                        className="w-full"
                    >
                        <Printer className="h-4 w-4" />
                        Imprimir {`(${boxes.length})`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BoxLabelPrintDialog;
