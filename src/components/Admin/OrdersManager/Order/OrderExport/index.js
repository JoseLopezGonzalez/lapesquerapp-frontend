import React, { use, useEffect, useState } from 'react'
import { Download } from 'lucide-react';
import { BsFileEarmarkPdf } from "react-icons/bs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiFileExcel2Line } from 'react-icons/ri';
import { useOrderContext } from '@/context/OrderContext';


const documents = [
    {
        name: 'Nota de Carga',
        label: 'Nota de Carga',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes'],
    },
    {
        name: 'Nota de Carga (Restringida)',
        label: 'Nota de Carga (Restringida)',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos - sin nombre de cliente', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes'],
    },
    {
        name: 'Documento de trazabilidad',
        label: 'Documento de trazabilidad',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Historial'],
    },
    {
        name: 'Documento de transporte (CMR)',
        label: 'Documento de transporte (CMR)',
        types: ['PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'transportes'],
    },
    {
        name: 'Documento confirmación de pedido',
        label: 'Documento confirmación de pedido',
        types: ['PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Precios'],
    },
    {
        name: 'Letreros de transporte',
        label: 'Letreros de transporte',
        types: ['PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'transportes'],

    },
    {
        name: 'Packing List',
        label: 'Packing List',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Palets', 'Lotes', 'Productos'],
    },
    {
        name: 'Hoja de pedido',
        label: 'Hoja de pedido',
        types: ['PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Productos'],

    },
    {
        name: 'Reporte de Articulos',
        label: 'Reporte de Articulos',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Productos'],
    },
    {
        name: 'Reporte de palets',
        label: 'Reporte de palets',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Palets', 'Lotes', 'Productos'],
    },
    {
        name: 'Reporte de lotes',
        label: 'Reporte de lotes',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Lotes', 'Productos'],
    },
    {
        name: 'Reporte Logs de diferencias',
        label: 'Reporte Logs de diferencias',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Historial', 'Productos'],
    }
]

const fastExport = [
    /* Nota de carga */
    {
        name: 'Nota de carga',
        label: 'Nota de carga',
        type: 'PDF',
    },
    /* Nota de carga restringida */
    {
        name: 'Nota de carga restringida',
        label: 'Nota de carga restringida',
        type: 'PDF',
    },
    /* Documento de transporte (CMR) */
    {
        name: 'Documento de transporte (CMR)',
        label: 'Documento de transporte (CMR)',
        type: 'PDF',
    },
    /* Letreros de transporte */
    {
        name: 'Letreros de transporte',
        label: 'Letreros de transporte',
        type: 'PDF',
    },
    /* Reporte de lotes */
    {
        name: 'Reporte de lotes',
        label: 'Reporte de lotes',
        type: 'Excel',
    }
]

const OrderExport = () => {

    const { order } = useOrderContext();
    const [selectedDocument, setSelectedDocument] = useState(documents[0]?.name || '');
    const [selectedType, setSelectedType] = useState(documents[0]?.types[0] || '');


    useEffect(() => {
        setSelectedType(documents.find((doc) => doc.name === selectedDocument)?.types[0])
    }, [selectedDocument])

    return (
        <div className='h-full'>
            <Card className='h-full flex flex-col'>
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Exportar Datos</CardTitle>
                    <CardDescription>Exporta los datos del pedido en diferentes formatos</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-scroll">
                    <div className="grid md:grid-cols-2 gap-4">
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
                            <Button className="w-full">
                                <Download className="h-4 w-4" />
                                Exportar selección
                            </Button>
                        </div>
                        <div className="border rounded-lg p-4 space-y-3">
                            <div className="text-sm font-medium">Exportación rápida</div>
                            <div className="grid gap-2">
                                {
                                    fastExport.map((doc) => (
                                        <Button
                                            key={doc.name}
                                            variant="outline"
                                            className="justify-start"
                                            onClick={() => console.log(`Exportando ${doc.name}...`)}
                                        >
                                            {doc.type === 'PDF' && <BsFileEarmarkPdf className="h-4 w-4 mr-2" />}
                                            {doc.type === 'Excel' && <RiFileExcel2Line className="h-4 w-4 mr-2" />}
                                            {doc.label}
                                        </Button>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default OrderExport