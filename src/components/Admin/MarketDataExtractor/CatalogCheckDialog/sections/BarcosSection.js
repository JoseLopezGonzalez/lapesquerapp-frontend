'use client';

import { Check, X, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  findBarcoInConfig,
  buildBarcoEntry,
  getDocTypeLabel,
  buildClipboardTextWithDocType,
} from '../catalogCheckUtils';
import { notify } from '@/lib/notifications';

function StatusBadge({ found }) {
  return found ? (
    <Badge variant="outline" className="shrink-0 gap-1 border-green-500/60 text-green-700">
      <Check className="h-3 w-3" /> Registrado
    </Badge>
  ) : (
    <Badge variant="outline" className="shrink-0 gap-1 border-red-400/60 text-red-600">
      <X className="h-3 w-3" /> No registrado
    </Badge>
  );
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    notify.success({ title: 'Copiado', description: 'Entrada copiada al portapapeles.' });
  });
}

function ConfigDetails({ config, docType }) {
  const DOC_LONJA = 'listadoComprasLonjaDeIsla';
  const DOC_COFRA = 'albaranCofradiaPescadoresSantoCristoDelMar';
  const DOC_ASOC = 'listadoComprasAsocArmadoresPuntaDelMoral';

  if (docType === DOC_LONJA && config) {
    return (
      <div className="text-muted-foreground flex shrink-0 gap-2 text-xs">
        {config.cod && (
          <span>
            Cód: <span className="text-foreground font-mono">{config.cod}</span>
          </span>
        )}
        {config.codVendiduria && (
          <span>
            Vend: <span className="text-foreground font-mono">{config.codVendiduria}</span>
          </span>
        )}
      </div>
    );
  }
  if (docType === DOC_COFRA && config) {
    return (
      <div className="text-muted-foreground flex shrink-0 gap-2 text-xs">
        {config.armador && <span className="max-w-[140px] truncate">{config.armador}</span>}
        {config.codA3erp && (
          <span>
            A3: <span className="text-foreground font-mono">{config.codA3erp}</span>
          </span>
        )}
      </div>
    );
  }
  if (docType === DOC_ASOC && config) {
    return (
      <div className="text-muted-foreground flex shrink-0 gap-2 text-xs">
        {config.matricula && <span className="font-mono">{config.matricula}</span>}
        {config.codBrisapp && (
          <span>
            App: <span className="text-foreground font-mono">{config.codBrisapp}</span>
          </span>
        )}
      </div>
    );
  }
  return null;
}

export default function BarcosSection({ barcos }) {
  if (barcos.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-sm">
        No hay barcos en los documentos procesados.
      </p>
    );
  }

  const enriched = barcos.map((item) => ({
    ...item,
    config: findBarcoInConfig(item.nombre, item.docType, item.matricula),
  }));

  const missing = enriched.filter((e) => !e.config);
  const found = enriched.filter((e) => e.config);

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex gap-4 pb-1 text-xs">
        <span className="font-medium text-green-700">{found.length} registrados</span>
        {missing.length > 0 && (
          <span className="font-medium text-red-600">{missing.length} no registrados</span>
        )}
      </div>

      <div className="divide-y rounded-md border text-sm">
        {enriched.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1 truncate">
              <span className="font-medium">{item.nombre}</span>
              {item.rawNombre && item.rawNombre !== item.nombre && (
                <span className="text-muted-foreground ml-1.5 font-mono text-xs">
                  ({item.rawNombre})
                </span>
              )}
            </div>
            {item.matricula && (
              <span className="text-muted-foreground shrink-0 font-mono text-xs">
                {item.matricula}
              </span>
            )}
            <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px] font-normal">
              {getDocTypeLabel(item.docType)}
            </Badge>
            <ConfigDetails config={item.config} docType={item.docType} />
            <StatusBadge found={!!item.config} />
            {!item.config && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 gap-1 text-xs"
                onClick={() =>
                  copyToClipboard(
                    buildClipboardTextWithDocType(buildBarcoEntry(item), item.docType)
                  )
                }
              >
                <Copy className="h-3 w-3" />
                Copiar entrada
              </Button>
            )}
          </div>
        ))}
      </div>

      {missing.length > 0 && (
        <p className="text-muted-foreground pt-1 text-xs">
          Los barcos no registrados deben añadirse a{' '}
          <span className="font-mono">exportData.js</span> del tipo de documento correspondiente.
          Usa el botón &quot;Copiar entrada&quot; para obtener la estructura base.
        </p>
      )}
    </div>
  );
}
