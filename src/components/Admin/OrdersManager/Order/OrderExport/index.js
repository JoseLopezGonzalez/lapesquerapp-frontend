'use client'

import React, { use, useEffect, useState } from 'react'
import { Download, Layers } from 'lucide-react';
import { BsFileEarmarkPdf } from "react-icons/bs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiFileExcel2Line } from 'react-icons/ri';
import { useOrderContext } from '@/context/OrderContext';



const documents = [
    {
        name: 'loading-note',
        label: 'Nota de Carga',
        types: ['pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes'],
    },
    {
        name: 'restricted-loading-note',
        label: 'Nota de Carga (Restringida)',
        types: ['pdf'],
        fields: ['Datos básicos - sin nombre de cliente', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes'],
    },
    {
        name: 'traceability-document',
        label: 'Documento de trazabilidad',
        types: ['pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Historial'],
    },
    {
        name: 'order-cmr',
        label: 'Documento de transporte (CMR)',
        types: ['pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Transportes'],
    },
    {
        name: 'order-confirmation-document',
        label: 'Documento confirmación de pedido',
        types: ['pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Precios'],
    },
    {
        name: 'order-signs',
        label: 'Letreros de transporte',
        types: ['pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Transportes'],
    },
    {
        name: 'order-packing-list',
        label: 'Packing List',
        types: ['pdf', 'xls'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Palets', 'Lotes', 'Productos'],
    },
    {
        name: 'order-sheet',
        label: 'Hoja de pedido',
        types: ['pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Productos'],
    },
    {
        name: 'article-report',
        label: 'Reporte de Artículos',
        types: ['xlsx'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Productos'],
    },
    {
        name: 'pallet-report',
        label: 'Reporte de Palets',
        types: ['xlsx'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Palets', 'Lotes', 'Productos'],
    },
    {
        name: 'lots-report',
        label: 'Reporte de Lotes',
        types: ['xlsx'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Lotes', 'Productos'],
    },
    {
        name: 'boxes-report',
        label: 'Reporte de Cajas',
        types: ['xlsx'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Cajas', 'Productos'],
    },
    {
        name: 'logs-differences-report',
        label: 'Reporte Logs de diferencias',
        types: ['xlsx'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Historial', 'Productos'],
    },
    {
        name: 'A3ERP-sales-delivery-note',
        label: 'Albarán de venta A3ERP',
        types: ['xlsx'],
        fields: ['Datos básicos', 'Direcciones', 'A3ERP', 'Productos'],
    },
    {
        name: 'valued-loading-note',
        label: 'Nota de carga valorada',
        types: ['pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Productos'],
    },
    {
        name: 'order-confirmation',
        label: 'Confirmación de pedido',
        types: ['pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Productos'],
    },
    {
        name: 'transport-pickup-request',
        label: 'Solicitud de recogida de transporte',
        types: ['pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Productos'],
    },

];


const fastExport = [
    {
        name: 'order-sheet',
        label: 'Hoja de pedido',
        type: 'pdf',
    },
    {
        name: 'loading-note',
        label: 'Nota de carga',
        type: 'pdf',
    },
    {
        name: 'restricted-loading-note',
        label: 'Nota de carga (Restringida)',
        type: 'pdf',
    },
    {
        name: 'order-cmr',
        label: 'Documento de transporte (CMR)',
        type: 'pdf',
    },
    {
        name: 'order-signs',
        label: 'Letreros de transporte',
        type: 'pdf',
    },
    {
        name: 'order-packing-list',
        label: 'Packing List',
        type: 'pdf',
    },
]

const OrderExport = () => {

    const { exportDocument } = useOrderContext();
    const [selectedDocument, setSelectedDocument] = useState(documents[0]?.name || '');
    const [selectedType, setSelectedType] = useState(documents[0]?.types[0] || '');


    useEffect(() => {
        setSelectedType(documents.find((doc) => doc.name === selectedDocument)?.types[0])
    }, [selectedDocument])

    const handleOnClickExportAll = async () => {
        for (const doc of fastExport) {
            await exportDocument(doc.name, doc.type, doc.label);
        }
    };

    const handleOnClickFastExport = (documentName, type, documentLabel) => {
        exportDocument(documentName, type, documentLabel);
    }

    const handleOnClickSelectExport = () => {
        const documentLabel = documents.find((doc) => doc.name === selectedDocument)?.label;
        exportDocument(selectedDocument, selectedType, documentLabel);
    }


    return (
        <div className='h-full pb-2'>
            <Card className='h-full flex flex-col'>
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Exportar Datos</CardTitle>
                    <CardDescription>Exporta los datos del pedido en diferentes formatos</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto py-2">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4 space-y-3">
                            <div className="text-sm font-medium">Exportación rápida</div>
                            <div className="grid gap-2">
                                {
                                    fastExport.map((doc) => (
                                        <Button
                                            key={doc.name}
                                            variant="outline"
                                            className="justify-start"
                                            onClick={() => handleOnClickFastExport(doc.name, doc.type, doc.label)}
                                        >
                                            {doc.type === 'pdf' && <BsFileEarmarkPdf className="h-4 w-4 mr-2" />}
                                            {doc.type === 'excel' && <RiFileExcel2Line className="h-4 w-4 mr-2" />}
                                            {doc.label}
                                        </Button>
                                    ))
                                }
                            </div>
                            <Button className="w-full" onClick={handleOnClickExportAll}>
                                <Layers className="h-4 w-4" />
                                Exportar todos
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Select onValueChange={(value) => setSelectedDocument(value)} value={selectedDocument}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {documents.map((doc) => (
                                                <SelectItem key={doc.name} value={doc.name}>
                                                    {doc.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-[150px]">
                                    <Select value={selectedType} onValueChange={(value) => setSelectedType(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent align="end">
                                            {documents.find((doc) => doc.name === selectedDocument)?.types.map((type) => (
                                                <SelectItem key={type} value={type} >
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {documents.find((doc) => doc.name === selectedDocument)?.fields.map((field) => (
                                    <Badge key={field} variant="outline">{field}</Badge>
                                ))}
                            </div>
                            <Button className="w-full" onClick={handleOnClickSelectExport}>
                                <Download className="h-4 w-4" />
                                Exportar selección
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default OrderExport