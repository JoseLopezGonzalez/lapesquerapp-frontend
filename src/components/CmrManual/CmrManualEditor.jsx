'use client';

import { useState, useEffect } from 'react';
import { Printer, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrintElement } from '@/hooks/usePrintElement';
import { defaultCmrData } from './cmr.types';
import CmrForm from './CmrForm';
import CmrPreview from './CmrPreview';
import './cmr-print.css';

const CMR_CACHE_KEY = 'brisapp-cmr-manual-cache';

/** Carga estado inicial: defaults + caché en localStorage (si existe y es válido). */
function getInitialCmrData() {
  if (typeof window === 'undefined') return defaultCmrData;
  try {
    const raw = localStorage.getItem(CMR_CACHE_KEY);
    if (!raw) return defaultCmrData;
    const parsed = JSON.parse(raw);
    return { ...defaultCmrData, ...parsed };
  } catch {
    return defaultCmrData;
  }
}

/**
 * Layout editor CMR Manual: formulario (izq, ocultable), preview 4 copias (derecha), botón Imprimir.
 * Persiste los datos en localStorage para recuperar la última edición.
 */
export default function CmrManualEditor() {
  const [data, setData] = useState(getInitialCmrData);
  const [panelOpen, setPanelOpen] = useState(true);
  const { onPrint } = usePrintElement({ id: 'cmr-print-area', freeSize: true });

  useEffect(() => {
    try {
      localStorage.setItem(CMR_CACHE_KEY, JSON.stringify(data));
    } catch {
      /* ignorar si localStorage no disponible o lleno */
    }
  }, [data]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-4 border-b">
        <h1 className="text-xl font-semibold">CMR Manual</h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPanelOpen((o) => !o)}
            title={panelOpen ? 'Ocultar formulario' : 'Abrir formulario'}
          >
            <Pencil />
            {panelOpen ? 'Ocultar' : 'Editar'}
          </Button>
          <Button onClick={onPrint} variant="outline" size="sm">
            <Printer />
            Imprimir
          </Button>
        </div>
      </div>
      <div className="flex flex-1 min-h-0 p-4 gap-6">
        {panelOpen && (
          <div className="min-w-[420px] w-[680px] max-w-[min(90vw,680px)] shrink-0 overflow-y-auto border rounded-lg p-4 bg-muted/30">
            <CmrForm value={data} onChange={setData} />
          </div>
        )}
        <div className="flex-1 min-w-0 overflow-auto bg-muted/20 rounded-lg p-4">
          <CmrPreview data={data} />
        </div>
      </div>
    </div>
  );
}
