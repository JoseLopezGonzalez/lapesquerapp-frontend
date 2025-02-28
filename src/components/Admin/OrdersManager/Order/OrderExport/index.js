import React, { use, useEffect, useState } from 'react'
import { Download } from 'lucide-react';
import { BsFileEarmarkPdf } from "react-icons/bs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiFileExcel2Line } from 'react-icons/ri';
import { useOrderContext } from '@/context/OrderContext';
import { getSession } from 'next-auth/react';
import { API_URL_V2 } from '@/configs/config';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PDFSHEET from './pdf';


const documents = [
    {
        name: 'loading-note',
        label: 'Nota de Carga',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes'],
    },
    {
        name: 'restricted-loading-note',
        label: 'Nota de Carga (Restringida)',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos - sin nombre de cliente', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes'],
    },
    {
        name: 'traceability-document',
        label: 'Documento de trazabilidad',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Historial'],
    },
    {
        name: 'transport-document-cmr',
        label: 'Documento de transporte (CMR)',
        types: ['PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Transportes'],
    },
    {
        name: 'order-confirmation-document',
        label: 'Documento confirmación de pedido',
        types: ['PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Precios'],
    },
    {
        name: 'transport-signs',
        label: 'Letreros de transporte',
        types: ['PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Transportes'],
    },
    {
        name: 'packing-list',
        label: 'Packing List',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Palets', 'Lotes', 'Productos'],
    },
    {
        name: 'order-sheet',
        label: 'Hoja de pedido',
        types: ['PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Productos'],
    },
    {
        name: 'article-report',
        label: 'Reporte de Artículos',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Productos'],
    },
    {
        name: 'pallet-report',
        label: 'Reporte de Palets',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Palets', 'Lotes', 'Productos'],
    },
    {
        name: 'batch-report',
        label: 'Reporte de Lotes',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Lotes', 'Productos'],
    },
    {
        name: 'logs-differences-report',
        label: 'Reporte Logs de diferencias',
        types: ['Excel', 'PDF'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Historial', 'Productos'],
    }
];


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

    const handleExport = async () => {
        try {
            const session = await getSession();

            const response = await fetch(`${API_URL_V2}orders/${order.id}/order_sheet`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/pdf', // Solicita un PDF
                    'Authorization': `Bearer ${session.user.accessToken}`,
                    'User-Agent': navigator.userAgent,
                }
            });

            if (!response.ok) {
                throw new Error('Error al exportar la hoja de pedido');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `HojaPedido_${order.id}.pdf`; // Nombre del archivo de descarga
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url); // Liberar memoria

            console.log('Exportación exitosa');

        } catch (error) {
            console.error('Error al exportar la hoja de pedido:', error);
        }
    };


    return (
        <div className='h-full'>
            <Card className='h-full flex flex-col'>
                <Button onClick={handleExport}>Exportar</Button>
                <Dialog>
                    <DialogTrigger>Open</DialogTrigger>
                    <DialogContent className=' h-[70vh]'>
                        <DialogHeader>
                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                            <div className='w-[800px] h-[70vh] overflow-y-scroll'>

                                <PDFSHEET />
                            </div>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
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