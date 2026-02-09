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
import { Separator } from '@/components/ui/separator';
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
            <div className="space-y-4">
                <div className={isMobile ? "text-center" : ""}>
                    <h3 className="text-base font-semibold mb-1">Descarga rápida</h3>
                    <p className="text-sm text-muted-foreground">Descarga documentos comunes con un solo clic</p>
                </div>
                        <div className="border rounded-lg p-4 space-y-3">
                            <div className="grid gap-2">
                                {
                                    fastExportDocuments.map((doc) => (
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
                        <Layers className="h-4 w-4 mr-2" />
                                Descargar todos
                            </Button>
                        </div>
            </div>

            {/* Separador en mobile */}
            {isMobile && <Separator />}

            {/* Descarga por selección */}
                        <div className="space-y-4">
                <div className={isMobile ? "text-center" : ""}>
                    <h3 className="text-base font-semibold mb-1">Descarga por selección</h3>
                    <p className="text-sm text-muted-foreground">Selecciona un documento específico para descargar</p>
                </div>
                <div className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Select onValueChange={(value) => setSelectedDocument(value)} value={selectedDocument}>
                                        <SelectTrigger>
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
                                <div className="w-[150px]">
                                    <Select value={selectedType} onValueChange={(value) => setSelectedType(value)}>
                                        <SelectTrigger>
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
                            <Button className="w-full" onClick={handleOnClickSelectExport}>
                        <Download className="h-4 w-4 mr-2" />
                                Descargar selección
                            </Button>
                        </div>
                    </div>
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
                <Card className='h-full flex flex-col bg-transparent'>
                    <CardContent className="flex-1 overflow-y-auto py-2">
                        {content}
                </CardContent>
            </Card>
            )}
        </div>
    )
}

export default OrderExport