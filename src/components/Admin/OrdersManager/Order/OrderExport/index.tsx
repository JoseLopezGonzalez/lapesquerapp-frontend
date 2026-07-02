'use client';

import { useState } from 'react';
import { Download, Layers } from 'lucide-react';
import { BsFileEarmarkPdf } from 'react-icons/bs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiFileExcel2Line } from 'react-icons/ri';
import { useOrderContext } from '@/context/OrderContext';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/Utilities/EmptyState';

const OrderExport = () => {
  const { exportDocument, exportDocuments, fastExportDocuments } = useOrderContext();
  const [selectedDocument, setSelectedDocument] = useState(exportDocuments[0]?.name || '');
  const [selectedType, setSelectedType] = useState(exportDocuments[0]?.types[0] || '');
  const { isMobile, mounted } = useIsMobileSafe();
  // exportDocuments is synchronous role-filtered config from useOrderDocuments; it has no loading state.
  const hasExportDocuments = exportDocuments.length > 0;
  const selectedExportDocument = exportDocuments.find((doc) => doc.name === selectedDocument);
  const selectedExportType = selectedExportDocument?.types.includes(selectedType)
    ? selectedType
    : selectedExportDocument?.types[0] || '';

  const handleDocumentChange = (value: string) => {
    setSelectedDocument(value);
    setSelectedType(exportDocuments.find((doc) => doc.name === value)?.types[0] ?? '');
  };

  const handleOnClickExportAll = async () => {
    for (const doc of fastExportDocuments) {
      await exportDocument(doc.name, doc.type, doc.label);
    }
  };

  const handleOnClickFastExport = (documentName: string, type: string, documentLabel: string) => {
    exportDocument(documentName, type, documentLabel);
  };

  const handleOnClickSelectExport = () => {
    const documentLabel = selectedExportDocument?.label ?? '';
    exportDocument(selectedDocument, selectedExportType, documentLabel);
  };

  if (!mounted) return null;

  const content = !hasExportDocuments ? (
    <EmptyState
      className="py-8"
      title="No hay documentos para exportar"
      description="No hay documentos disponibles para descargar en este pedido."
    />
  ) : (
    <div className={isMobile ? 'space-y-6' : 'grid gap-6 md:grid-cols-2'}>
      {/* Descarga rápida */}
      <Card>
        <CardHeader>
          <CardTitle>Descarga rápida</CardTitle>
          <CardDescription>Descarga documentos comunes con un solo clic</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            {fastExportDocuments.length === 0 ? (
              <EmptyState
                className="py-6"
                title="No hay descargas rápidas"
                description="No hay documentos rápidos disponibles para este pedido."
              />
            ) : (
              fastExportDocuments.map((doc) => (
                <Button
                  key={doc.name}
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleOnClickFastExport(doc.name, doc.type, doc.label)}
                >
                  {doc.type === 'pdf' && <BsFileEarmarkPdf className="size-4" />}
                  {doc.type === 'excel' && <RiFileExcel2Line className="size-4" />}
                  {doc.label}
                </Button>
              ))
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleOnClickExportAll} disabled={fastExportDocuments.length === 0}>
              <Layers className="size-4" />
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
          <div className="flex w-full items-center gap-2">
            <div className="min-w-0 flex-1">
              <Select onValueChange={handleDocumentChange} value={selectedDocument}>
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
              <Select value={selectedExportType} onValueChange={(value) => setSelectedType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {selectedExportDocument?.types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!isMobile && (
            <div className="flex flex-wrap gap-2">
              {selectedExportDocument?.fields.map((field) => (
                <Badge key={field} variant="outline">
                  {field}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={handleOnClickSelectExport}>
              <Download className="size-4" />
              Descargar selección
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isMobile ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1">
            <div className="py-2">{content}</div>
          </ScrollArea>
        </div>
      ) : (
        <Card className="flex min-h-0 flex-1 flex-col">
          <CardHeader>
            <CardTitle>Exportar</CardTitle>
            <CardDescription>
              Descarga documentos del pedido con un solo clic o por selección
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">{content}</CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderExport;
