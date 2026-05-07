'use client';

import { useState } from 'react';
import { Check, X, Plus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CreateSpeciesDialog from '../CreateSpeciesDialog';

function StatusBadge({ found }) {
    return found ? (
        <Badge variant="outline" className="text-green-700 border-green-500/60 gap-1 shrink-0">
            <Check className="h-3 w-3" /> En catálogo
        </Badge>
    ) : (
        <Badge variant="outline" className="text-red-600 border-red-400/60 gap-1 shrink-0">
            <X className="h-3 w-3" /> No encontrada
        </Badge>
    );
}

export default function SpeciesSection({ speciesFao, dbSpeciesMap, onSpeciesCreated }) {
    const [createTarget, setCreateTarget] = useState(null);

    if (speciesFao.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-2">
                No hay tablas de especies en los documentos procesados.
            </p>
        );
    }

    const withFao = speciesFao.filter((s) => s.fao);
    const missing = withFao.filter((s) => !dbSpeciesMap[s.fao]);
    const found = withFao.filter((s) => dbSpeciesMap[s.fao]);
    const noFaoCount = speciesFao.length - withFao.length;

    return (
        <div className="space-y-2">
            <div className="flex gap-4 text-xs text-muted-foreground pb-1">
                <span className="text-green-700 font-medium">{found.length} en catálogo</span>
                {missing.length > 0 && (
                    <span className="text-red-600 font-medium">{missing.length} sin registrar</span>
                )}
                {noFaoCount > 0 && (
                    <span className="text-amber-600 font-medium">{noFaoCount} sin código FAO</span>
                )}
            </div>

            <div className="divide-y rounded-md border text-sm">
                {speciesFao.map((item, index) => {
                    const dbEntry = item.fao ? dbSpeciesMap[item.fao] : undefined;
                    return (
                        <div
                            key={`${item.fao ?? 'nofao'}-${item.descripcion}-${index}`}
                            className="flex items-center gap-3 px-3 py-1.5"
                        >
                            {item.fao ? (
                                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded shrink-0 w-14 text-center">
                                    {item.fao}
                                </span>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="text-amber-600 border-amber-400/60 text-[10px] px-1.5 shrink-0 w-14 justify-center"
                                >
                                    Sin FAO
                                </Badge>
                            )}
                            <span className="flex-1 min-w-0 whitespace-normal break-words leading-snug">
                                {item.descripcion}
                            </span>
                            {dbEntry && (
                                <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                                    {dbEntry.name}
                                </span>
                            )}
                            {item.fao ? (
                                <>
                                    <StatusBadge found={!!dbEntry} />
                                    {!dbEntry && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="shrink-0 h-7 text-xs gap-1"
                                            onClick={() => setCreateTarget(item)}
                                        >
                                            <Plus className="h-3 w-3" />
                                            Crear
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="text-muted-foreground border-muted-foreground/40 text-[10px] px-1.5 shrink-0"
                                >
                                    Revisar extracción
                                </Badge>
                            )}
                        </div>
                    );
                })}
            </div>

            {createTarget && (
                <CreateSpeciesDialog
                    open={!!createTarget}
                    onOpenChange={(open) => { if (!open) setCreateTarget(null); }}
                    prefill={{ fao: createTarget.fao, name: createTarget.descripcion }}
                    onCreated={(newSpecies) => {
                        onSpeciesCreated(newSpecies);
                        setCreateTarget(null);
                    }}
                />
            )}
        </div>
    );
}
