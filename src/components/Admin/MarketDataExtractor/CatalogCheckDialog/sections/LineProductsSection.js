'use client';

import { useState } from 'react';
import { Check, X, Copy, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  findProductoInConfig,
  buildProductoEntry,
  getDocTypeLabel,
  buildClipboardTextWithDocType,
} from '../catalogCheckUtils';
import CreateProductDialog from '../CreateProductDialog';
import { notify } from '@/lib/notifications';

function StatusBadge({ found }) {
  return found ? (
    <Badge variant="outline" className="shrink-0 gap-1 border-green-500/60 text-green-700">
      <Check className="h-3 w-3" /> Con códigos
    </Badge>
  ) : (
    <Badge variant="outline" className="shrink-0 gap-1 border-red-400/60 text-red-600">
      <X className="h-3 w-3" /> Sin códigos
    </Badge>
  );
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    notify.success({ title: 'Copiado', description: 'Entrada copiada al portapapeles.' });
  });
}

export default function LineProductsSection({ lineProducts }) {
  const [createDialog, setCreateDialog] = useState({ open: false, item: null });

  if (lineProducts.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-sm">
        No hay artículos de línea en los documentos procesados.
      </p>
    );
  }

  const enriched = lineProducts.map((item) => ({
    ...item,
    config: findProductoInConfig(item.nombre, item.docType),
  }));

  const missing = enriched.filter((e) => !e.config);
  const found = enriched.filter((e) => e.config);

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex gap-4 pb-1 text-xs">
        <span className="font-medium text-green-700">{found.length} con códigos</span>
        {missing.length > 0 && (
          <span className="font-medium text-red-600">{missing.length} sin códigos</span>
        )}
      </div>

      <div className="divide-y rounded-md border text-sm">
        {enriched.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 px-3 py-2.5">
            <span className="min-w-0 flex-1 truncate">{item.nombre}</span>
            <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px] font-normal">
              {getDocTypeLabel(item.docType)}
            </Badge>
            {item.config && (
              <div className="text-muted-foreground flex shrink-0 gap-2 text-xs">
                <span>
                  A3:{' '}
                  <span className="text-foreground font-mono">{item.config.codA3erp || '—'}</span>
                </span>
                <span>
                  App:{' '}
                  <span className="text-foreground font-mono">
                    {item.config.codBrisappProducto || '—'}
                  </span>
                </span>
              </div>
            )}
            <StatusBadge found={!!item.config} />
            {!item.config && (
              <div className="flex shrink-0 gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setCreateDialog({ open: true, item })}
                >
                  <PlusCircle className="h-3 w-3" />
                  Crear en app
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground h-7 gap-1 text-xs"
                  onClick={() =>
                    copyToClipboard(
                      buildClipboardTextWithDocType(buildProductoEntry(item), item.docType)
                    )
                  }
                >
                  <Copy className="h-3 w-3" />
                  Copiar
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {missing.length > 0 && (
        <p className="text-muted-foreground pt-1 text-xs">
          Crea el producto en la app con &quot;Crear en app&quot; y después añade los códigos a{' '}
          <span className="font-mono">exportData.js</span> con &quot;Copiar&quot;.
        </p>
      )}

      <CreateProductDialog
        open={createDialog.open}
        onOpenChange={(v) => setCreateDialog((s) => ({ ...s, open: v }))}
        prefill={createDialog.item}
        onCreated={() => setCreateDialog({ open: false, item: null })}
      />
    </div>
  );
}
