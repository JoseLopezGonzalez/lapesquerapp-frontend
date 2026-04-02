'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProspectsList } from '@/hooks/useProspects';
import StatusPill from './StatusPill';
import { isOverdueDate, prospectStatusLabels } from './utils';

const ProspectFormSheet = dynamic(() => import('./ProspectFormSheet'), {
  loading: () => null,
  ssr: false,
});

const ProspectDetail = dynamic(() => import('./ProspectDetail'), {
  loading: () => (
    <div className="flex min-h-[360px] w-full items-center justify-center rounded-xl border bg-muted/20">
      <Loader />
    </div>
  ),
  ssr: false,
});

const PROSPECTS_PER_PAGE = 12;
const INFINITE_SCROLL_THRESHOLD_PX = 180;

const FILTER_TABS = [
  { label: 'Todos', value: 'all' },
  { label: 'Nuevo', value: 'new' },
  { label: 'Seguimiento', value: 'following' },
  { label: 'Oferta enviada', value: 'offer_sent' },
  { label: 'Descartados', value: 'discarded' },
];

function ProspectCard({ prospect, selected, onClick }) {
  const overdue = isOverdueDate(prospect.nextActionAt);
  const ariaExtras = [prospect.country?.name].filter(Boolean).join(' · ');

  return (
    <Card
      className={cn(
        'cursor-pointer focus-visible:outline-none transition-colors hover:bg-accent/50',
        selected && 'bg-accent/40'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={ariaExtras ? `${prospect.companyName} - ${ariaExtras}` : prospect.companyName}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="py-0">
        <div className="grow w-full space-y-2 sm:space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill label={prospectStatusLabels[prospect.status] ?? prospect.status} status={prospect.status} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-medium truncate">{prospect.companyName}</h3>
          </div>

          <div>
            <p className="text-sm text-muted-foreground truncate">{prospect.country?.name ?? 'Sin país'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProspectsPageClient({ initialProspectId = null, forceCreate = false }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [nameFilterDraft, setNameFilterDraft] = useState('');
  const [appliedNameFilter, setAppliedNameFilter] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [loadedProspects, setLoadedProspects] = useState([]);
  const [formOpen, setFormOpen] = useState(forceCreate);
  const searchParam = appliedNameFilter.trim() || undefined;
  const { data: prospects, isLoading, meta } = useProspectsList({
    status: status !== 'all' ? [status] : undefined,
    perPage: PROSPECTS_PER_PAGE,
    page,
    search: searchParam,
  });
  const [selectedId, setSelectedId] = useState(initialProspectId);
  const hasActiveSearch = Boolean(searchParam);

  useEffect(() => {
    if (nameFilterDraft.trim() !== '') return;
    if (appliedNameFilter === '') return;
    setAppliedNameFilter('');
  }, [nameFilterDraft, appliedNameFilter]);

  useEffect(() => {
    setLoadedProspects([]);
    setPage(1);
  }, [searchParam, status]);

  useEffect(() => {
    setLoadedProspects((prev) => {
      if (page === 1) return prospects;
      const seen = new Set(prev.map((item) => String(item.id)));
      const next = [...prev];
      for (const item of prospects) {
        if (seen.has(String(item.id))) continue;
        next.push(item);
      }
      return next;
    });
  }, [prospects, page]);

  const orderedProspects = useMemo(
    () =>
      [...loadedProspects].sort((a, b) => {
        if (a.nextActionAt && !b.nextActionAt) return -1;
        if (!a.nextActionAt && b.nextActionAt) return 1;
        if (a.nextActionAt && b.nextActionAt) return a.nextActionAt.localeCompare(b.nextActionAt);
        return a.companyName.localeCompare(b.companyName);
      }),
    [loadedProspects]
  );

  const prospectsLastPage = Math.max(1, meta.last_page ?? 1);
  const isInitialLoading = isLoading && page === 1;
  const isLoadingMore = isLoading && page > 1;
  const canLoadMore = page < prospectsLastPage && !isLoading;

  useEffect(() => {
    if (isMobile || !selectedId) return;

    const selectedProspectStillVisible = orderedProspects.some((prospect) => String(prospect.id) === String(selectedId));
    if (!selectedProspectStillVisible) {
      setSelectedId(null);
    }
  }, [isMobile, orderedProspects, selectedId]);

  const handleSelect = (prospectId) => {
    setSelectedId(prospectId);
    if (isMobile) {
      router.push(`/comercial/prospectos/${prospectId}`);
    }
  };

  const applyNameFilter = () => {
    setAppliedNameFilter(nameFilterDraft.trim());
  };

  const handleProspectsScroll = (event) => {
    if (!canLoadMore) return;
    const el = event.currentTarget;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining < INFINITE_SCROLL_THRESHOLD_PX) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <>
      <div className="flex h-full w-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden px-4 py-3 md:px-6">
        <div className="flex w-full flex-col gap-4 md:max-w-md">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col">
              <h1 className="text-3xl font-light">Prospectos</h1>

              <div className="mt-2 md:hidden">
                <Button onClick={() => setFormOpen(true)}>
                  <Plus data-icon="inline-start" />
                  Nuevo prospecto
                </Button>
              </div>

              <p className="mt-2 md:mt-0 text-sm text-muted-foreground">
                Seguimiento comercial ligero para cartera propia.
              </p>
            </div>

            <div className="hidden md:flex">
              <Button
                size="icon"
                variant="default"
                onClick={() => setFormOpen(true)}
                aria-label="Nuevo prospecto"
              >
                <Plus />
              </Button>
            </div>
          </div>

          <InputGroup className="w-full min-w-0">
            <InputGroupInput
              value={nameFilterDraft}
              onChange={(event) => setNameFilterDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyNameFilter();
                }
              }}
              placeholder="Buscar por nombre de empresa…"
              aria-label="Buscar prospectos por nombre de empresa"
              autoComplete="off"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                variant="secondary"
                disabled={isLoading}
                aria-label="Buscar"
                onClick={applyNameFilter}
              >
                Buscar
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <Tabs
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setSelectedId(null);
          }}
        >
          <TabsList>
            {FILTER_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden md:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            {isInitialLoading ? (
              <div className="flex h-full min-h-0 w-full items-center justify-center p-4">
                <Loader />
              </div>
            ) : orderedProspects.length === 0 ? (
              <div className="flex h-full min-h-0 w-full overflow-y-auto p-4">
                <EmptyState
                  title={hasActiveSearch ? 'No hay resultados' : 'Aún no tienes prospectos registrados'}
                  description={
                    hasActiveSearch
                      ? 'Prueba con otro nombre, limpia el filtro o cambia el estado del prospecto.'
                      : 'Crea el primero para empezar a alimentar la agenda comercial.'
                  }
                  className="h-full w-full border bg-muted/20 min-h-0!"
                  button={{ name: 'Nuevo prospecto', onClick: () => setFormOpen(true) }}
                />
              </div>
            ) : (
              <>
                <div
                  className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
                  onScroll={handleProspectsScroll}
                >
                  {orderedProspects.map((prospect) => (
                    <ProspectCard
                      key={prospect.id}
                      prospect={prospect}
                      selected={!isMobile && String(selectedId) === String(prospect.id)}
                      onClick={() => handleSelect(prospect.id)}
                    />
                  ))}
                  {isLoadingMore ? (
                    <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando más prospectos...
                    </div>
                  ) : null}
                  {!canLoadMore && orderedProspects.length > 0 ? (
                    <p className="py-2 text-center text-xs text-muted-foreground">No hay más prospectos para mostrar.</p>
                  ) : null}
                </div>
              </>
            )}
          </div>

          {!isMobile && (
            selectedId ? (
              <ProspectDetail prospectId={selectedId} embedded />
            ) : (
              <EmptyState
                title="Selecciona un prospecto"
                description="En desktop el detalle se abre en este panel sin salir de la lista."
                className="w-full min-w-0 border bg-muted/20 min-h-[360px]"
              />
            )
          )}
        </div>
      </div>

      <ProspectFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
