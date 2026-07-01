'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Loader2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { useProspectCategoryOptions } from '@/hooks/useProspectCategories';
import { useProspectsList } from '@/hooks/useProspects';
import StatusPill from './StatusPill';
import { isOverdueDate, prospectStatusLabels } from './utils';

const ProspectFormSheet = dynamic(() => import('./ProspectFormSheet'), {
  loading: () => null,
  ssr: false,
});

const ProspectDetail = dynamic(() => import('./ProspectDetail'), {
  loading: () => (
    <div className="bg-muted/20 flex min-h-[360px] w-full flex-col gap-4 rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
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
  { label: 'Convertidos', value: 'customer' },
];

function ProspectCard({ prospect, selected, onClick }) {
  const overdue = isOverdueDate(prospect.nextActionAt);
  const ariaExtras = [prospect.country?.name].filter(Boolean).join(' · ');

  return (
    <Card
      className={cn(
        'hover:bg-accent/50 cursor-pointer transition-colors focus-visible:outline-none',
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
        <div className="w-full grow space-y-2 sm:space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              label={prospectStatusLabels[prospect.status] ?? prospect.status}
              status={prospect.status}
            />
            {prospect.category?.name ? (
              <Badge variant="secondary">{prospect.category.name}</Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-medium">{prospect.companyName}</h3>
          </div>

          <div>
            <p className="text-muted-foreground truncate text-sm">
              {prospect.country?.name ?? 'Sin país'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProspectsPageClient({ initialProspectId = null, forceCreate = false }) {
  const { isMobile, mounted } = useIsMobileSafe();
  const router = useRouter();
  const [nameFilterDraft, setNameFilterDraft] = useState('');
  const [appliedNameFilter, setAppliedNameFilter] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [page, setPage] = useState(1);
  const [loadedProspects, setLoadedProspects] = useState([]);
  const [formOpen, setFormOpen] = useState(forceCreate);
  const searchParam = appliedNameFilter.trim() || undefined;
  const { data: categoryOptions = [], isLoading: categoriesLoading } =
    useProspectCategoryOptions(true);
  const {
    data: prospects,
    isLoading,
    meta,
  } = useProspectsList({
    status: status !== 'all' ? [status] : undefined,
    categories: selectedCategoryIds.length ? selectedCategoryIds : undefined,
    perPage: PROSPECTS_PER_PAGE,
    page,
    search: searchParam,
  });
  const [selectedId, setSelectedId] = useState(initialProspectId);
  const hasActiveSearch = Boolean(searchParam) || selectedCategoryIds.length > 0;
  const selectedCategories = useMemo(
    () =>
      selectedCategoryIds
        .map((id) => categoryOptions.find((option) => String(option.value) === String(id)))
        .filter(Boolean),
    [categoryOptions, selectedCategoryIds]
  );

  useEffect(() => {
    if (nameFilterDraft.trim() !== '') return;
    if (appliedNameFilter === '') return;
    setAppliedNameFilter('');
  }, [nameFilterDraft, appliedNameFilter]);

  useEffect(() => {
    setLoadedProspects([]);
    setPage(1);
  }, [searchParam, status, selectedCategoryIds]);

  const toggleCategoryFilter = (categoryId) => {
    const value = String(categoryId);
    setSelectedId(null);
    setSelectedCategoryIds((prev) =>
      prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value]
    );
  };

  useEffect(() => {
    setLoadedProspects((prev) => {
      if (page === 1) {
        return prospects;
      }
      const prospectMap = new Map(prospects.map((p) => [String(p.id), p]));
      const seen = new Set(prev.map((item) => String(item.id)));
      const next = prev.map((item) => prospectMap.get(String(item.id)) ?? item);
      for (const item of prospects) {
        if (!seen.has(String(item.id))) next.push(item);
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

    const selectedProspectStillVisible = orderedProspects.some(
      (prospect) => String(prospect.id) === String(selectedId)
    );
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

  if (!mounted) return null;

  return (
    <>
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-4 overflow-hidden px-4 py-3 md:px-6">
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

              <p className="text-muted-foreground mt-2 text-sm md:mt-0">
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

          <div className="flex w-full flex-wrap items-center gap-2">
            <InputGroup className="min-w-0 flex-1">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label="Filtrar por categoría"
                >
                  <Filter data-icon="inline-start" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {categoriesLoading ? (
                  <div className="text-muted-foreground px-2 py-1.5 text-sm">Cargando…</div>
                ) : categoryOptions.length === 0 ? (
                  <div className="text-muted-foreground px-2 py-1.5 text-sm">
                    Sin categorías activas
                  </div>
                ) : (
                  categoryOptions.map((option) => {
                    const value = String(option.value);
                    return (
                      <DropdownMenuCheckboxItem
                        key={value}
                        checked={selectedCategoryIds.includes(value)}
                        onCheckedChange={() => toggleCategoryFilter(value)}
                        onSelect={(event) => event.preventDefault()}
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    );
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedCategories.map((option) => (
              <Badge key={option.value} variant="secondary" className="gap-1 pr-1">
                {option.label}
                <button
                  type="button"
                  className="hover:bg-background/70 rounded-sm p-0.5"
                  aria-label={`Quitar filtro ${option.label}`}
                  onClick={() => toggleCategoryFilter(option.value)}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
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
              <div className="flex h-full min-h-0 w-full flex-col gap-3 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : orderedProspects.length === 0 ? (
              <div className="flex h-full min-h-0 w-full overflow-y-auto p-4">
                <EmptyState
                  title={
                    hasActiveSearch ? 'No hay resultados' : 'Aún no tienes prospectos registrados'
                  }
                  description={
                    hasActiveSearch
                      ? 'Prueba con otro nombre, limpia el filtro o cambia el estado del prospecto.'
                      : 'Crea el primero para empezar a alimentar la agenda comercial.'
                  }
                  className="bg-muted/20 h-full min-h-0! w-full border"
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
                    <div className="text-muted-foreground flex items-center justify-center py-2 text-sm">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando más prospectos...
                    </div>
                  ) : null}
                  {!canLoadMore && orderedProspects.length > 0 ? (
                    <p className="text-muted-foreground py-2 text-center text-xs">
                      No hay más prospectos para mostrar.
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </div>

          {!isMobile &&
            (selectedId ? (
              <ProspectDetail prospectId={selectedId} embedded />
            ) : (
              <EmptyState
                title="Selecciona un prospecto"
                description="En desktop el detalle se abre en este panel sin salir de la lista."
                className="bg-muted/20 min-h-[360px] w-full min-w-0 border"
              />
            ))}
        </div>
      </div>

      <ProspectFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
