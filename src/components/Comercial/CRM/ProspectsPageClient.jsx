'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProspectsList } from '@/hooks/useProspects';
import ProspectFormSheet from './ProspectFormSheet';
import ProspectDetail from './ProspectDetail';
import StatusPill from './StatusPill';
import { formatDateValue, isOverdueDate, prospectStatusLabels } from './utils';

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
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition ${selected ? 'border-primary bg-primary/5' : ''} ${overdue ? 'border-red-300 bg-red-50/40 dark:border-red-900 dark:bg-red-950/10' : 'hover:bg-accent/40'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{prospect.companyName}</p>
          <p className="text-sm text-muted-foreground">{prospect.country?.name ?? 'Sin país'}</p>
        </div>
        <StatusPill label={prospectStatusLabels[prospect.status] ?? prospect.status} status={prospect.status} />
      </div>
      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        <p>{prospect.primaryContact?.name ?? 'Sin contacto principal'}</p>
        <p>{prospect.nextActionAt ? `Próxima acción: ${formatDateValue(prospect.nextActionAt)}` : 'Sin acción programada'}</p>
      </div>
    </button>
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-light">Prospectos</h1>
            <p className="text-sm text-muted-foreground">Seguimiento comercial ligero para cartera propia.</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>Nuevo prospecto</Button>
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

          <Tabs value={status} onValueChange={setStatus}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {FILTER_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3 p-4">
                {!isLoading && orderedProspects.length === 0 ? (
                  <Empty className="border bg-muted/20 min-h-[260px]">
                    <EmptyHeader>
                      <EmptyTitle>Aún no tienes prospectos registrados</EmptyTitle>
                      <EmptyDescription>Crea el primero para empezar a alimentar la agenda comercial.</EmptyDescription>
                    </EmptyHeader>
                    <Button onClick={() => setFormOpen(true)}>Nuevo prospecto</Button>
                  </Empty>
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
          </Card>

          {!isMobile && (
            selectedId ? (
              <ProspectDetail prospectId={selectedId} embedded />
            ) : (
              <Empty className="border bg-muted/20 min-h-[360px]">
                <EmptyHeader>
                  <EmptyTitle>Selecciona un prospecto</EmptyTitle>
                  <EmptyDescription>En desktop el detalle se abre en este panel sin salir de la lista.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )
          )}
        </div>
      </div>

      <ProspectFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
