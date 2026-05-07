'use client';

import { Check, X, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { findVendiduriaInConfig, buildVendiduriaEntry } from '../catalogCheckUtils';
import { notify } from '@/lib/notifications';

function StatusBadge({ found }) {
    return found ? (
        <Badge variant="outline" className="text-green-700 border-green-500/60 gap-1 shrink-0">
            <Check className="h-3 w-3" /> Registrada
        </Badge>
    ) : (
        <Badge variant="outline" className="text-red-600 border-red-400/60 gap-1 shrink-0">
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
            <p className="text-sm text-muted-foreground py-2">
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
            <div className="flex gap-4 text-xs text-muted-foreground pb-1">
                <span className="text-green-700 font-medium">{found.length} registradas</span>
                {missing.length > 0 && (
                    <span className="text-red-600 font-medium">{missing.length} sin registrar</span>
                )}
            </div>

            <div className="divide-y rounded-md border text-sm">
                {enriched.map((item) => (
                    <div key={item.cod} className="flex items-center gap-3 px-3 py-2.5">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded shrink-0 w-10 text-center">
                            {item.cod}
                        </span>
                        <span className="flex-1 min-w-0 truncate">{item.vendiduria}</span>
                        {item.config && (
                            <span className="text-xs text-muted-foreground shrink-0">
                                A3: <span className="font-mono">{item.config.codA3erp || '—'}</span>
                            </span>
                        )}
                        <StatusBadge found={!!item.config} />
                        {!item.config && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0 h-7 text-xs gap-1"
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
                <p className="text-xs text-muted-foreground pt-1">
                    Las vendidurías sin registrar deben añadirse a{' '}
                    <span className="font-mono">exportData.js</span> de Lonja de Isla.
                    Usa el botón &quot;Copiar entrada&quot; para obtener la estructura base.
                </p>
            )}
        </div>
    );
}
