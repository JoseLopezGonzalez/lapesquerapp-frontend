'use client';

import { useState } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrintElement } from '@/hooks/usePrintElement';
import { defaultCmrData } from './cmr.types';
import CmrForm from './CmrForm';
import CmrPreview from './CmrPreview';
import './cmr-print.css';

/**
 * Layout editor CMR Manual: formulario (izq), preview 4 copias (derecha), botón Imprimir.
 * Imprime solo #cmr-print-area (contenido del preview).
 */
export default function CmrManualEditor() {
  const [data, setData] = useState(defaultCmrData);
  const { onPrint } = usePrintElement({ id: 'cmr-print-area', freeSize: true });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-4 border-b">
        <h1 className="text-xl font-semibold">CMR Manual</h1>
        <Button onClick={onPrint} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>
      <div className="flex flex-1 min-h-0 p-4 gap-6">
        <div className="w-[380px] shrink-0 overflow-y-auto border rounded-lg p-4 bg-muted/30">
          <CmrForm value={data} onChange={setData} />
        </div>
        <div className="flex-1 min-w-0 overflow-auto bg-muted/20 rounded-lg p-4">
          <CmrPreview data={data} />
        </div>
      </div>
    </div>
  );
}
