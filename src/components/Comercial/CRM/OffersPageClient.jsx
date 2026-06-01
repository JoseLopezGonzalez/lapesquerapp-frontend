'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebounce } from '@/hooks/useDebounce';
import { useOffersList } from '@/hooks/useOffers';
import OfferFormSheet from './OfferFormSheet';
import OfferDetail from './OfferDetail';
import StatusPill from './StatusPill';
import { formatCurrency, formatDateValue, offerStatusLabels } from './utils';
import Loader from '@/components/Utilities/Loader';

const FILTER_TABS = [
  { label: 'Todos', value: 'all' },
  { label: 'Borrador', value: 'draft' },
  { label: 'Enviada', value: 'sent' },
  { label: 'Aceptada', value: 'accepted' },
  { label: 'Rechazada', value: 'rejected' },
  { label: 'Expirada', value: 'expired' },
];

function OfferCard({ offer, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition ${selected ? 'border-primary bg-primary/5' : 'hover:bg-accent/40'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {offer.prospect?.companyName ?? offer.customer?.name ?? `Oferta #${offer.id}`}
          </p>
          <p className="text-muted-foreground text-sm">
            {offer.sentAt ? `Enviada ${formatDateValue(offer.sentAt)}` : 'Sin envío registrado'}
          </p>
        </div>
        <StatusPill label={offerStatusLabels[offer.status] ?? offer.status} status={offer.status} />
      </div>
      <div className="text-muted-foreground mt-3 space-y-1 text-sm">
        <p>
          {offer.validUntil
            ? `Validez: ${formatDateValue(offer.validUntil)}`
            : 'Sin fecha de validez'}
        </p>
        <p>
          {offer.totalAmount != null
            ? formatCurrency(offer.totalAmount, offer.currency ?? 'EUR')
            : 'Importe pendiente de cálculo'}
        </p>
      </div>
    </button>
  );
}

export default function OffersPageClient({ initialOfferId = null, forceCreate = false }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [status, setStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(forceCreate);
  const fixedProspectId = searchParams.get('prospectId');
  const { data: offers, isLoading } = useOffersList({
    search: debouncedSearch || undefined,
    status: status !== 'all' ? [status] : undefined,
    perPage: 100,
  });
  const [selectedId, setSelectedId] = useState(initialOfferId);

  const orderedOffers = useMemo(
    () =>
      [...offers].sort((a, b) => {
        if (a.sentAt && b.sentAt) return b.sentAt.localeCompare(a.sentAt);
        return String(b.id).localeCompare(String(a.id));
      }),
    [offers]
  );

  useEffect(() => {
    if (isMobile || !selectedId) return;

    const selectedOfferStillVisible = orderedOffers.some(
      (offer) => String(offer.id) === String(selectedId)
    );
    if (!selectedOfferStillVisible) {
      setSelectedId(null);
    }
  }, [isMobile, orderedOffers, selectedId]);

  const handleSelect = (offerId) => {
    setSelectedId(offerId);
    if (isMobile) {
      router.push(`/comercial/ofertas/${offerId}`);
    }
  };

  const handleOfferSaved = (savedOffer) => {
    const savedOfferId = savedOffer?.id;
    setSearch('');
    setStatus('all');

    if (savedOfferId && !isMobile) {
      setSelectedId(savedOfferId);
    }
  };

  return (
    <>
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-4 overflow-hidden px-4 py-3 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-light">Ofertas</h1>
            <p className="text-muted-foreground text-sm">
              Histórico comercial por prospecto o cliente.
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 size-4" />
            Nueva oferta
          </Button>
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

        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden md:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {isLoading ? (
                <div className="flex h-full min-h-0 w-full items-center justify-center p-4">
                  <Loader />
                </div>
              ) : orderedOffers.length === 0 ? (
                <div className="flex h-full min-h-0 w-full p-4">
                  <EmptyState
                    title="Aún no has creado ninguna oferta"
                    description="Empieza con una oferta vinculada a prospecto o cliente."
                    className="bg-muted/20 h-full !min-h-0 w-full border"
                    button={{ name: 'Nueva oferta', onClick: () => setFormOpen(true) }}
                  />
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {orderedOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      selected={!isMobile && String(selectedId) === String(offer.id)}
                      onClick={() => handleSelect(offer.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>

          {!isMobile &&
            (selectedId ? (
              <OfferDetail offerId={selectedId} embedded />
            ) : (
              <EmptyState
                title="Selecciona una oferta"
                description="El detalle se abrirá aquí manteniendo la lista visible en desktop."
                className="bg-muted/20 min-h-[360px] w-full min-w-0 border"
              />
            ))}
        </div>
      </div>

      <OfferFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        fixedProspectId={fixedProspectId ? Number(fixedProspectId) : null}
        onSaved={handleOfferSaved}
      />
    </>
  );
}
