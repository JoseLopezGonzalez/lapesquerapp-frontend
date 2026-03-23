'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { PanelLeftOpen, Plus, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRouteStatusLabel } from '@/lib/routes/routesPlannerUtils';

export function RoutesListingView({
  tab,
  onTabChange,
  openNewDraft,
  currentDraftHasContent,
  onContinueEditing,
  isLoading,
  items,
  selectedId,
  onSelectItem,
}) {
  return (
    <Card className="min-h-0 border-border/70">
      <CardHeader className="space-y-4">
        <Tabs value={tab} onValueChange={onTabChange}>
          <TabsList>
            <TabsTrigger value="routes">Rutas</TabsTrigger>
            <TabsTrigger value="templates">Plantillas</TabsTrigger>
          </TabsList>
          <TabsContent value="routes" className="mt-4 space-y-4">
            <CardTitle>Rutas programadas</CardTitle>
            <CardDescription>Selecciona una ruta existente o crea una nueva para entrar en el editor visual.</CardDescription>
          </TabsContent>
          <TabsContent value="templates" className="mt-4 space-y-4">
            <CardTitle>Plantillas de ruta</CardTitle>
            <CardDescription>Selecciona una plantilla o crea una nueva para editarla con el mapa como protagonista.</CardDescription>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={openNewDraft}>
            <Plus className="mr-2 h-4 w-4" />
            {tab === 'routes' ? 'Nueva ruta' : 'Nueva plantilla'}
          </Button>
          {currentDraftHasContent && (
            <Button type="button" variant="outline" onClick={onContinueEditing}>
              <PanelLeftOpen className="mr-2 h-4 w-4" />
              Continuar edición
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="min-h-0">
        {isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center"><Loader /></div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <EmptyState
              icon={<Route className="h-10 w-10 text-primary" />}
              title={`Sin ${tab === 'routes' ? 'rutas' : 'plantillas'}`}
              description="Empieza creando la primera."
              className="min-h-[220px] bg-transparent"
            />
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-20rem)] pr-3">
            <div className="grid gap-3 xl:grid-cols-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectItem(item)}
                  className={cn(
                    'w-full rounded-2xl border p-4 text-left transition hover:border-primary/40 hover:bg-muted/40',
                    selectedId && String(selectedId) === String(item.id) && 'border-primary/40 bg-primary/5'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.name}</p>
                    <Badge variant="secondary">
                      {tab === 'routes' ? getRouteStatusLabel(item.status) : 'Plantilla'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tab === 'routes' ? item.routeDate || 'Sin fecha' : item.description || 'Sin descripción'}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
