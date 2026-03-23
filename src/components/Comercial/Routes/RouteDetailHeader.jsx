'use client';

import { ArrowLeft, Pencil, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function RouteDetailHeader({
  detailMode,
  returnToListing,
  headerTitle,
  headerDescription,
  tab,
  routeDraft,
  loadingSelectedItem,
  detailNotFound,
  selectedFieldOperatorLabel,
  setMetadataDialogOpen,
  saveCurrent,
  isSavingRoute,
  isSavingTemplate,
  currentDraftName,
}) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          {detailMode && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={returnToListing}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{headerTitle}</h1>
              {detailMode && (
                <Badge variant="outline">{tab === 'routes' ? 'Ruta programada' : 'Plantilla'}</Badge>
              )}
              {detailMode && tab === 'routes' && routeDraft.sourceMode === 'template' && routeDraft.routeTemplateId && (
                <Badge variant="secondary">Basada en plantilla</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{headerDescription}</p>
            {detailMode && !loadingSelectedItem && !detailNotFound && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{selectedFieldOperatorLabel}</Badge>
                {tab === 'routes' && routeDraft.routeDate ? (
                  <Badge variant="secondary">{routeDraft.routeDate}</Badge>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {detailMode && !loadingSelectedItem && !detailNotFound && (
        <div className="flex shrink-0 items-center gap-2 self-start">
          <Button type="button" variant="outline" onClick={() => setMetadataDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button onClick={saveCurrent} disabled={isSavingRoute || isSavingTemplate || !currentDraftName.trim()}>
            <Save className="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </div>
      )}
    </div>
  );
}
