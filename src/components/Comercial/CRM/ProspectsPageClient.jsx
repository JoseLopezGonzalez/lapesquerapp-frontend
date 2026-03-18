'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProspectsList } from '@/hooks/useProspects';
import ProspectFormSheet from './ProspectFormSheet';
import ProspectDetail from './ProspectDetail';
import StatusPill from './StatusPill';
import { isOverdueDate, prospectStatusLabels } from './utils';

const FILTER_TABS = [
  { label: 'Todos', value: 'all' },
  { label: 'Nuevo', value: 'new' },
  { label: 'Seguimiento', value: 'following' },
  { label: 'Oferta enviada', value: 'offer_sent' },
  { label: 'Descartados', value: 'discarded' },
];

function ProspectCard({ prospect, selected, onClick }) {
  const overdue = isOverdueDate(prospect.nextActionAt);

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
      aria-label={`${prospect.companyName}${prospect.country?.name ? ` - ${prospect.country.name}` : ''}`}
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

          <div className="flex items-center gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-muted-foreground mb-1 text-xs">Contacto principal</p>
              <p className="text-sm font-medium truncate">{prospect.primaryContact?.name ?? 'Sin contacto principal'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProspectsPageClient({ initialProspectId = null, forceCreate = false }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(forceCreate);
  const { data: prospects, isLoading } = useProspectsList({
    search: search || undefined,
    status: status !== 'all' ? [status] : undefined,
    perPage: 100,
  });
  const [selectedId, setSelectedId] = useState(initialProspectId);

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

  const handleSelect = (prospectId) => {
    setSelectedId(prospectId);
    if (isMobile) {
      router.push(`/comercial/prospectos/${prospectId}`);
    }
  };

  return (
    <>
      <div className="flex h-full flex-col gap-4 px-4 py-3 md:px-6">
        <div className="w-full md:max-w-md">
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
        </div>

        <div className="flex flex-col gap-4">
          <InputGroup className="w-full md:max-w-md">
            <InputGroupInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por empresa"
            />
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
          </InputGroup>

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
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <ScrollArea className="h-full min-h-0">
            <div className="space-y-3 p-4">
              {isLoading ? (
                <div className="flex min-h-[260px] w-full items-center justify-center">
                  <Loader />
                </div>
              ) : orderedProspects.length === 0 ? (
                <EmptyState
                  title="Aún no tienes prospectos registrados"
                  description="Crea el primero para empezar a alimentar la agenda comercial."
                  className="border bg-muted/20 min-h-[260px]"
                  button={{ name: 'Nuevo prospecto', onClick: () => setFormOpen(true) }}
                />
              ) : (
                orderedProspects.map((prospect) => (
                  <ProspectCard
                    key={prospect.id}
                    prospect={prospect}
                    selected={!isMobile && String(selectedId) === String(prospect.id)}
                    onClick={() => handleSelect(prospect.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {!isMobile && (
            selectedId ? (
              <ProspectDetail prospectId={selectedId} embedded />
            ) : (
              <EmptyState
                title="Selecciona un prospecto"
                description="En desktop el detalle se abre en este panel sin salir de la lista."
                className="border bg-muted/20 min-h-[360px]"
              />
            )
          )}
        </div>
      </div>

      <ProspectFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
