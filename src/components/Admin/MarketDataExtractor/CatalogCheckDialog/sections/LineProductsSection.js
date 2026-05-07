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
        <Badge variant="outline" className="text-green-700 border-green-500/60 gap-1 shrink-0">
            <Check className="h-3 w-3" /> Con códigos
        </Badge>
    ) : (
        <Badge variant="outline" className="text-red-600 border-red-400/60 gap-1 shrink-0">
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
            <p className="text-sm text-muted-foreground py-2">
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
            <div className="flex gap-4 text-xs text-muted-foreground pb-1">
                <span className="text-green-700 font-medium">{found.length} con códigos</span>
                {missing.length > 0 && (
                    <span className="text-red-600 font-medium">{missing.length} sin códigos</span>
                )}
            </div>

            <div className="divide-y rounded-md border text-sm">
                {enriched.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-3 py-2.5">
                        <span className="flex-1 min-w-0 truncate">{item.nombre}</span>
                        <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 shrink-0 font-normal"
                        >
                            {getDocTypeLabel(item.docType)}
                        </Badge>
                        {item.config && (
                            <div className="flex gap-2 text-xs text-muted-foreground shrink-0">
                                <span>
                                    A3: <span className="font-mono text-foreground">{item.config.codA3erp || '—'}</span>
                                </span>
                                <span>
                                    App: <span className="font-mono text-foreground">{item.config.codBrisappProducto || '—'}</span>
                                </span>
                            </div>
                        )}
                        <StatusBadge found={!!item.config} />
                        {!item.config && (
                            <div className="flex gap-1.5 shrink-0">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs gap-1"
                                    onClick={() => setCreateDialog({ open: true, item })}
                                >
                                    <PlusCircle className="h-3 w-3" />
                                    Crear en app
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs gap-1 text-muted-foreground"
                                    onClick={() => copyToClipboard(
                                        buildClipboardTextWithDocType(buildProductoEntry(item), item.docType)
                                    )}
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
                <p className="text-xs text-muted-foreground pt-1">
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
