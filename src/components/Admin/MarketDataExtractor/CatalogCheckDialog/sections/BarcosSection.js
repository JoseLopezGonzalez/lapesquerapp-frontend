'use client';

import { Check, X, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { findBarcoInConfig, buildBarcoEntry, getDocTypeLabel } from '../catalogCheckUtils';
import { notify } from '@/lib/notifications';

function StatusBadge({ found }) {
    return found ? (
        <Badge variant="outline" className="text-green-700 border-green-500/60 gap-1 shrink-0">
            <Check className="h-3 w-3" /> Registrado
        </Badge>
    ) : (
        <Badge variant="outline" className="text-red-600 border-red-400/60 gap-1 shrink-0">
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
            <div className="flex gap-2 text-xs text-muted-foreground shrink-0">
                {config.cod && <span>Cód: <span className="font-mono text-foreground">{config.cod}</span></span>}
                {config.codVendiduria && <span>Vend: <span className="font-mono text-foreground">{config.codVendiduria}</span></span>}
            </div>
        );
    }
    if (docType === DOC_COFRA && config) {
        return (
            <div className="flex gap-2 text-xs text-muted-foreground shrink-0">
                {config.armador && <span className="truncate max-w-[140px]">{config.armador}</span>}
                {config.codA3erp && <span>A3: <span className="font-mono text-foreground">{config.codA3erp}</span></span>}
            </div>
        );
    }
    if (docType === DOC_ASOC && config) {
        return (
            <div className="flex gap-2 text-xs text-muted-foreground shrink-0">
                {config.matricula && <span className="font-mono">{config.matricula}</span>}
                {config.codBrisapp && <span>App: <span className="font-mono text-foreground">{config.codBrisapp}</span></span>}
            </div>
        );
    }
    return null;
}

export default function BarcosSection({ barcos }) {
    if (barcos.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-2">
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
            <div className="flex gap-4 text-xs text-muted-foreground pb-1">
                <span className="text-green-700 font-medium">{found.length} registrados</span>
                {missing.length > 0 && (
                    <span className="text-red-600 font-medium">{missing.length} no registrados</span>
                )}
            </div>

            <div className="divide-y rounded-md border text-sm">
                {enriched.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-3 py-2.5">
                        <span className="flex-1 min-w-0 truncate font-medium">{item.nombre}</span>
                        {item.matricula && (
                            <span className="text-xs text-muted-foreground font-mono shrink-0">{item.matricula}</span>
                        )}
                        <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 shrink-0 font-normal"
                        >
                            {getDocTypeLabel(item.docType)}
                        </Badge>
                        <ConfigDetails config={item.config} docType={item.docType} />
                        <StatusBadge found={!!item.config} />
                        {!item.config && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0 h-7 text-xs gap-1"
                                onClick={() => copyToClipboard(buildBarcoEntry(item))}
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
                    Los barcos no registrados deben añadirse a{' '}
                    <span className="font-mono">exportData.js</span> del tipo de documento correspondiente.
                    Usa el botón &quot;Copiar entrada&quot; para obtener la estructura base.
                </p>
            )}
        </div>
    );
}
