'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { MapPinPlus } from 'lucide-react';
import { geocodeAddress, hasMapboxToken } from '@/lib/maps/geocoding';
import { cn } from '@/lib/utils';

export function SearchLocationsDialog({ open, onOpenChange, onSelectLocation }) {
  const [search, setSearch] = useState('');
  const [geocodeResults, setGeocodeResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchState, setSearchState] = useState({ type: 'idle', message: '' });

  const handleClose = (isOpen) => {
    if (!isOpen) {
      setGeocodeResults([]);
      setSearchState({ type: 'idle', message: '' });
    }
    onOpenChange(isOpen);
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    if (!hasMapboxToken()) {
      setGeocodeResults([]);
      setSearchState({
        type: 'error',
        message: 'Falta configurar el token de Mapbox para buscar ubicaciones.',
      });
      return;
    }

    setLoadingSearch(true);
    setSearchState({ type: 'idle', message: '' });
    try {
      const results = await geocodeAddress(search.trim());
      setGeocodeResults(results);
      setSearchState(
        results.length === 0
          ? { type: 'empty', message: 'No encontramos resultados para esa búsqueda.' }
          : { type: 'success', message: `Se han encontrado ${results.length} resultados.` }
      );
    } catch (error) {
      setGeocodeResults([]);
      setSearchState({
        type: 'error',
        message: error?.message ?? 'No se pudo completar la búsqueda geográfica.',
      });
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Buscar punto o dirección</DialogTitle>
          <DialogDescription>
            Busca una ubicación y, al seleccionarla, se abrirá el diálogo para completar la nueva parada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar dirección, calle o ubicación" />
            <Button type="button" variant="secondary" onClick={handleSearch} disabled={loadingSearch}>
              <MapPinPlus className="mr-2 h-4 w-4" />
              {loadingSearch ? 'Buscando...' : 'Buscar punto'}
            </Button>
          </div>

          {searchState.type === 'error' && (
            <div className={cn('rounded-xl border px-3 py-2 text-sm', 'border-destructive/40 bg-destructive/5 text-destructive')}>
              {searchState.message}
            </div>
          )}

          {loadingSearch && (
            <div className="flex min-h-[180px] items-center justify-center">
              <Loader />
            </div>
          )}

          {!loadingSearch && searchState.type === 'empty' && geocodeResults.length === 0 && (
            <div className="flex min-h-[180px] items-center justify-center">
              <EmptyState
                icon={<MapPinPlus className="h-10 w-10 text-primary" />}
                title="Sin resultados"
                description={searchState.message}
                className="min-h-[180px] bg-transparent"
              />
            </div>
          )}

          {!loadingSearch && geocodeResults.length > 0 && (
            <ScrollArea className="max-h-[320px] pr-3">
              <div className="grid gap-2">
                {geocodeResults.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => {
                      handleClose(false);
                      onSelectLocation({
                        label: feature.text || feature.place_name,
                        address: feature.place_name,
                        lat: feature.center?.[1] ?? null,
                        lng: feature.center?.[0] ?? null,
                        stopType: 'oportunidad',
                        targetType: 'location',
                      });
                    }}
                    className="rounded-lg border bg-background px-3 py-2 text-left text-sm hover:border-primary/40"
                  >
                    {feature.place_name}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
