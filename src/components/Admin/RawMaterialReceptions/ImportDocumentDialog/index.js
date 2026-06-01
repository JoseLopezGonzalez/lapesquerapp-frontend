'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import { PdfUpload } from '@/components/Utilities/PdfUpload';
import { processDocument } from '@/components/Admin/MarketDataExtractor/shared/DocumentProcessor';
import { notify } from '@/lib/notifications';

const DOCUMENT_TYPES = [
  {
    value: 'listadoComprasAsocArmadoresPuntaDelMoral',
    label: 'Listado de compras - Asoc. Armadores Punta del Moral',
  },
  {
    value: 'listadoComprasLonjaDeIsla',
    label: 'Listado de compras - Lonja de Isla',
  },
];

export default function ImportDocumentDialog({ open, onOpenChange, onDocumentProcessed }) {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [provider, setProvider] = useState('chatgpt');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (newFile) => {
    setFile(newFile);
    setDocumentType('');
  };

  const handleProcess = async () => {
    if (!file) {
      notify.error({
        title: 'Archivo requerido',
        description: 'Seleccione un archivo PDF para procesar.',
      });
      return;
    }
    if (!documentType) {
      notify.error({
        title: 'Tipo de documento requerido',
        description: 'Seleccione el tipo de documento.',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await processDocument(file, documentType, provider);

      if (!result.success) {
        const descriptions = {
          validation: `${result.error} Verifique que el documento sea del tipo correcto.`,
          parsing: `${result.error} Contacte al administrador si persiste.`,
          azure: result.error,
          chatgpt: result.error,
        };
        notify.error({
          title: 'Error al procesar documento',
          description: descriptions[result.errorType] || result.error || 'Error inesperado.',
        });
        return;
      }

      if (!result.data || result.data.length === 0) {
        notify.error({
          title: 'Sin datos',
          description: 'El documento no contiene datos para importar.',
        });
        return;
      }

      onDocumentProcessed(result.data[0], documentType);
      notify.success({
        title: 'Documento procesado',
        description: 'Los datos se han importado al formulario.',
      });

      setFile(null);
      setDocumentType('');
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error.userMessage || error.message || 'Error inesperado al procesar el documento.';
      notify.error({
        title: 'Error al procesar documento',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Importar desde documento de lonja</DialogTitle>
          <DialogDescription>
            Suba un PDF de lonja y seleccione el tipo. Los datos extraídos se cargarán
            automáticamente en el formulario de recepción.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <PdfUpload onChange={handleFileChange} />

          <div className="space-y-2">
            <label htmlFor="import-doc-type" className="text-sm font-medium">
              Tipo de documento
            </label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="import-doc-type">
                <SelectValue placeholder="Seleccionar tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((dt) => (
                  <SelectItem key={dt.value} value={dt.value}>
                    {dt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="import-provider" className="text-sm font-medium">
              Proveedor de extracción
            </label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger id="import-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chatgpt">ChatGPT (gpt-4o)</SelectItem>
                <SelectItem value="azure">Azure Document AI (legacy)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleProcess} disabled={loading || !file || !documentType}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Extraer e importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
