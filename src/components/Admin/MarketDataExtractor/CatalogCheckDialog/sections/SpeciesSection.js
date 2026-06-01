'use client';

import { useState } from 'react';
import { Check, X, Plus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CreateSpeciesDialog from '../CreateSpeciesDialog';

function StatusBadge({ found }) {
  return found ? (
    <Badge variant="outline" className="shrink-0 gap-1 border-green-500/60 text-green-700">
      <Check className="h-3 w-3" /> En catálogo
    </Badge>
  ) : (
    <Badge variant="outline" className="shrink-0 gap-1 border-red-400/60 text-red-600">
      <X className="h-3 w-3" /> No encontrada
    </Badge>
  );
}

export default function SpeciesSection({ speciesFao, dbSpeciesMap, onSpeciesCreated }) {
  const [createTarget, setCreateTarget] = useState(null);

  if (speciesFao.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-sm">
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
      <div className="text-muted-foreground flex gap-4 pb-1 text-xs">
        <span className="font-medium text-green-700">{found.length} en catálogo</span>
        {missing.length > 0 && (
          <span className="font-medium text-red-600">{missing.length} sin registrar</span>
        )}
        {noFaoCount > 0 && (
          <span className="font-medium text-amber-600">{noFaoCount} sin código FAO</span>
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
                <span className="bg-muted w-14 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-xs">
                  {item.fao}
                </span>
              ) : (
                <Badge
                  variant="outline"
                  className="w-14 shrink-0 justify-center border-amber-400/60 px-1.5 text-[10px] text-amber-600"
                >
                  Sin FAO
                </Badge>
              )}
              <span className="min-w-0 flex-1 leading-snug break-words whitespace-normal">
                {item.descripcion}
              </span>
              {dbEntry && (
                <span className="text-muted-foreground max-w-[160px] truncate text-xs">
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
                      className="h-7 shrink-0 gap-1 text-xs"
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
                  className="text-muted-foreground border-muted-foreground/40 shrink-0 px-1.5 text-[10px]"
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
          onOpenChange={(open) => {
            if (!open) setCreateTarget(null);
          }}
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
