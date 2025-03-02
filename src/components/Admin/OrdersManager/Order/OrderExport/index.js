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
import toast from 'react-hot-toast';
import { darkToastTheme } from '@/customs/reactHotToast';


const documents = [
    {
        name: 'loading-note',
        label: 'Nota de Carga',
        types: ['excel', 'pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes'],
    },
    {
        name: 'restricted-loading-note',
        label: 'Nota de Carga (Restringida)',
        types: ['excel', 'pdf'],
        fields: ['Datos básicos - sin nombre de cliente', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes'],
    },
    {
        name: 'traceability-document',
        label: 'Documento de trazabilidad',
        types: ['excel', 'pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Historial'],
    },
    {
        name: 'transport-document-cmr',
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
        types: ['excel', 'pdf'],
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
        types: ['excel', 'pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Productos'],
    },
    {
        name: 'pallet-report',
        label: 'Reporte de Palets',
        types: ['excel', 'pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Palets', 'Lotes', 'Productos'],
    },
    {
        name: 'batch-report',
        label: 'Reporte de Lotes',
        types: ['excel', 'pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Lotes', 'Productos'],
    },
    {
        name: 'logs-differences-report',
        label: 'Reporte Logs de diferencias',
        types: ['excel', 'pdf'],
        fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Historial', 'Productos'],
    }
];


const fastExport = [
    /* Hoja de pedido */
    {
        name: 'order-sheet',
        label: 'Hoja de pedido',
        type: 'pdf',
    },
    /* Nota de carga */
    {
        name: 'loading-note',
        label: 'Nota de carga',
        type: 'pdf',
    },
    /* Nota de carga restringida */
    {
        name: 'Nota de carga restringida',
        label: 'Nota de carga restringida',
        type: 'pdf',
    },
    /* Documento de transporte (CMR) */
    {
        name: 'Documento de transporte (CMR)',
        label: 'Documento de transporte (CMR)',
        type: 'pdf',
    },
    /* Letreros de transporte */
    {
        name: 'order-signs',
        label: 'Letreros de transporte',
        type: 'pdf',
    },
    /* PAcking list */
    {
        name: 'order-packing-list',
        label: 'Packing List',
        type: 'pdf',
    },
    /* Reporte de lotes */
    {
        name: 'Reporte de lotes',
        label: 'Reporte de lotes',
        type: 'excel',
    }
]

const OrderExport = () => {

    const { order } = useOrderContext();
    const [selectedDocument, setSelectedDocument] = useState(documents[0]?.name || '');
    const [selectedType, setSelectedType] = useState(documents[0]?.types[0] || '');


    useEffect(() => {
        setSelectedType(documents.find((doc) => doc.name === selectedDocument)?.types[0])
    }, [selectedDocument])

    const handleExportDocument = async (documentName, type) => {

        const label = documents.find((doc) => doc.name === documentName)?.label;
        const toastId = toast.loading(`Exportando ${type} ...`, darkToastTheme);
        try {
            const session = await getSession();
            const response = await fetch(`${API_URL_V2}orders/${order.id}/${type}/${documentName}`, {
                method: 'GET',
                headers: {
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
            a.download = `${label}_${order.id}.pdf`; // Nombre del archivo de descarga
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url); // Liberar memoria

            toast.success('Exportación exitosa', { id: toastId });

        } catch (error) {
            toast.error('Error al exportar', { id: toastId });
        }
    };

    const handleOnClickFastExport = (documentName, type) => {
        handleExportDocument(documentName, type);
    }

    const handleOnClickSelectExport = () => {
        handleExportDocument(selectedDocument, selectedType);
    }


    return (
        <div className='h-full'>
            <Card className='h-full flex flex-col'>
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Exportar Datos</CardTitle>
                    <CardDescription>Exporta los datos del pedido en diferentes formatos</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-scroll py-2">
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
                            <Button className="w-full" onClick={handleOnClickSelectExport}>
                                <Download className="h-4 w-4" />
                                Exportar selección
                            </Button>
                            <Dialog>
                                <DialogTrigger>
                                        Pruebas
                                </DialogTrigger>
                                <DialogContent className=' h-[70vh]'>
                                    <DialogHeader>
                                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                                        <div className='w-[800px] h-[70vh] overflow-y-scroll'>

                                            <PDFSHEET />
                                        </div>
                                    </DialogHeader>
                                </DialogContent>
                            </Dialog>
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
                                            onClick={() => handleOnClickFastExport(doc.name, doc.type)}
                                        >
                                            {doc.type === 'pdf' && <BsFileEarmarkPdf className="h-4 w-4 mr-2" />}
                                            {doc.type === 'excel' && <RiFileExcel2Line className="h-4 w-4 mr-2" />}
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