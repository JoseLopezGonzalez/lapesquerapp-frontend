'use client';

import { Check, X, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { findVendiduriaInConfig, buildVendiduriaEntry } from '../catalogCheckUtils';
import { notify } from '@/lib/notifications';

function StatusBadge({ found }) {
  return found ? (
    <Badge variant="outline" className="shrink-0 gap-1 border-green-500/60 text-green-700">
      <Check className="h-3 w-3" /> Registrada
    </Badge>
  ) : (
    <Badge variant="outline" className="shrink-0 gap-1 border-red-400/60 text-red-600">
      <X className="h-3 w-3" /> Sin registrar
    </Badge>
  );
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    notify.success({ title: 'Copiado', description: 'Entrada copiada al portapapeles.' });
  });
}

export default function VendiduriaSection({ vendidurias }) {
  if (vendidurias.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-sm">
        No hay tablas de vendidurías en los documentos procesados.
      </p>
    );
  }

  const enriched = vendidurias.map((item) => ({
    ...item,
    config: findVendiduriaInConfig(item.cod),
  }));

  const missing = enriched.filter((e) => !e.config);
  const found = enriched.filter((e) => e.config);

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex gap-4 pb-1 text-xs">
        <span className="font-medium text-green-700">{found.length} registradas</span>
        {missing.length > 0 && (
          <span className="font-medium text-red-600">{missing.length} sin registrar</span>
        )}
      </div>

      <div className="divide-y rounded-md border text-sm">
        {enriched.map((item) => (
          <div key={item.cod} className="flex items-center gap-3 px-3 py-2.5">
            <span className="bg-muted w-10 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-xs">
              {item.cod}
            </span>
            <span className="min-w-0 flex-1 truncate">{item.vendiduria}</span>
            {item.config && (
              <span className="text-muted-foreground shrink-0 text-xs">
                A3: <span className="font-mono">{item.config.codA3erp || '—'}</span>
              </span>
            )}
            <StatusBadge found={!!item.config} />
            {!item.config && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 gap-1 text-xs"
                onClick={() => copyToClipboard(buildVendiduriaEntry(item))}
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
          Las vendidurías sin registrar deben añadirse a{' '}
          <span className="font-mono">exportData.js</span> de Lonja de Isla. Usa el botón
          &quot;Copiar entrada&quot; para obtener la estructura base.
        </p>
      )}
    </div>
  );
}
