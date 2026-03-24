'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';
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

const FILTER_TABS = [
  { label: 'Todos', value: 'all' },
  { label: 'Nuevo', value: 'new' },
  { label: 'Seguimiento', value: 'following' },
  { label: 'Oferta enviada', value: 'offer_sent' },
  { label: 'Descartados', value: 'discarded' },
];

/** @returns {(number | 'ellipsis')[]} */
function buildPaginationRange(currentPage, lastPage) {
  const last = Math.max(1, lastPage);
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const set = new Set([1, last, currentPage, currentPage - 1, currentPage + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('ellipsis');
    out.push(p);
    prev = p;
  }
  return out;
}

function ProspectCard({ prospect, selected, onClick }) {
  const overdue = isOverdueDate(prospect.nextActionAt);
  const ariaExtras = [prospect.country?.name].filter(Boolean).join(' · ');

  return (
    <Card
      className={cn(
        'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring transition-colors hover:bg-accent/50',
        selected && 'ring-2 ring-offset-2 ring-primary',
        overdue && !selected && 'border-destructive/50'
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
    setPage(1);
  }, [searchParam, status]);

  const orderedProspects = useMemo(
    () =>
      [...prospects].sort((a, b) => {
        if (a.nextActionAt && !b.nextActionAt) return -1;
        if (!a.nextActionAt && b.nextActionAt) return 1;
        if (a.nextActionAt && b.nextActionAt) return a.nextActionAt.localeCompare(b.nextActionAt);
        return a.companyName.localeCompare(b.companyName);
      }),
    [prospects]
  );

  const prospectsLastPage = Math.max(1, meta.last_page ?? 1);
  const paginationItems = useMemo(
    () => buildPaginationRange(page, prospectsLastPage),
    [page, prospectsLastPage]
  );

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
            {isLoading ? (
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
                  className="h-full w-full border bg-muted/20 !min-h-0"
                  button={{ name: 'Nuevo prospecto', onClick: () => setFormOpen(true) }}
                />
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                  {orderedProspects.map((prospect) => (
                    <ProspectCard
                      key={prospect.id}
                      prospect={prospect}
                      selected={!isMobile && String(selectedId) === String(prospect.id)}
                      onClick={() => handleSelect(prospect.id)}
                    />
                  ))}
                </div>
                <div className="flex shrink-0 flex-col items-center gap-2 border-t px-4 py-3">
                  <Pagination className="mx-0 w-full justify-center">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          aria-label="Ir a la página anterior"
                          size="icon"
                          className={cn((page <= 1 || isLoading) && 'pointer-events-none opacity-50')}
                          aria-disabled={page <= 1 || isLoading}
                          onClick={(e) => {
                            e.preventDefault();
                            if (page <= 1 || isLoading) return;
                            setPage((p) => Math.max(1, p - 1));
                          }}
                        >
                          <IconChevronLeft className="size-4" />
                        </PaginationLink>
                      </PaginationItem>
                      {paginationItems.map((item, idx) =>
                        item === 'ellipsis' ? (
                          <PaginationItem key={`ellipsis-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={item}>
                            <PaginationLink
                              href="#"
                              isActive={item === page}
                              size="default"
                              className="min-w-8"
                              aria-label={`Ir a la página ${item}`}
                              onClick={(e) => {
                                e.preventDefault();
                                if (isLoading || item === page) return;
                                setPage(item);
                              }}
                            >
                              {item}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          aria-label="Ir a la página siguiente"
                          size="icon"
                          className={cn((page >= prospectsLastPage || isLoading) && 'pointer-events-none opacity-50')}
                          aria-disabled={page >= prospectsLastPage || isLoading}
                          onClick={(e) => {
                            e.preventDefault();
                            if (page >= prospectsLastPage || isLoading) return;
                            setPage((p) => p + 1);
                          }}
                        >
                          <IconChevronRight className="size-4" />
                        </PaginationLink>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  {meta.total != null ? (
                    <p className="text-center text-xs text-muted-foreground">{meta.total} en total</p>
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
