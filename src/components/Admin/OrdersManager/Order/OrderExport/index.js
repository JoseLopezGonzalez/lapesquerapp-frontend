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
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';




const OrderExport = () => {

    const { exportDocument ,  exportDocuments, fastExportDocuments } = useOrderContext();
    const [selectedDocument, setSelectedDocument] = useState(exportDocuments[0]?.name || '');
    const [selectedType, setSelectedType] = useState(exportDocuments[0]?.types[0] || '');
    const isMobile = useIsMobile();


    useEffect(() => {
        setSelectedType(exportDocuments.find((doc) => doc.name === selectedDocument)?.types[0])
    }, [selectedDocument])

    const handleOnClickExportAll = async () => {
        for (const doc of fastExportDocuments) {
            await exportDocument(doc.name, doc.type, doc.label);
        }
    };

    const handleOnClickFastExport = (documentName, type, documentLabel) => {
        exportDocument(documentName, type, documentLabel);
    }

    const handleOnClickSelectExport = () => {
        const documentLabel = exportDocuments.find((doc) => doc.name === selectedDocument)?.label;
        exportDocument(selectedDocument, selectedType, documentLabel);
    }

    const content = (
        <div className={isMobile ? "space-y-6" : "grid md:grid-cols-2 gap-6"}>
            {/* Descarga rápida */}
            <Card>
                <CardHeader>
                    <CardTitle>Descarga rápida</CardTitle>
                    <CardDescription>Descarga documentos comunes con un solo clic</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid gap-2">
                        {
                            fastExportDocuments.map((doc) => (
                                <Button
                                    key={doc.name}
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => handleOnClickFastExport(doc.name, doc.type, doc.label)}
                                >
                                    {doc.type === 'pdf' && <BsFileEarmarkPdf />}
                                    {doc.type === 'excel' && <RiFileExcel2Line />}
                                    {doc.label}
                                </Button>
                            ))
                        }
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleOnClickExportAll}>
                            <Layers />
                            Descargar todos
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Descarga por selección */}
            <Card>
                <CardHeader>
                    <CardTitle>Descarga por selección</CardTitle>
                    <CardDescription>Selecciona un documento específico para descargar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 w-full">
                        <div className="flex-1 min-w-0">
                            <Select onValueChange={(value) => setSelectedDocument(value)} value={selectedDocument}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {exportDocuments.map((doc) => (
                                        <SelectItem key={doc.name} value={doc.name}>
                                            {doc.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[150px] shrink-0">
                            <Select value={selectedType} onValueChange={(value) => setSelectedType(value)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    {exportDocuments.find((doc) => doc.name === selectedDocument)?.types.map((type) => (
                                        <SelectItem key={type} value={type} >
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {!isMobile && (
                        <div className="flex flex-wrap gap-2">
                            {exportDocuments.find((doc) => doc.name === selectedDocument)?.fields.map((field) => (
                                <Badge key={field} variant="outline">{field}</Badge>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end">
                        <Button onClick={handleOnClickSelectExport}>
                            <Download />
                            Descargar selección
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className='flex-1 flex flex-col min-h-0'>
            {isMobile ? (
                <div className='flex-1 flex flex-col min-h-0'>
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="py-2">
                            {content}
                        </div>
                    </ScrollArea>
                </div>
            ) : (
                <Card className="flex-1 flex flex-col min-h-0">
                    <CardHeader>
                        <CardTitle>Exportar</CardTitle>
                        <CardDescription>Descarga documentos del pedido con un solo clic o por selección</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        {content}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default OrderExport