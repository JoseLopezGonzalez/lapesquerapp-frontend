'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, CircleDot, MapPin, Mail, MessageCircle, Phone, Search, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCustomersList } from '@/hooks/useCustomersList';
import { useCommercialInteractions } from '@/hooks/useCommercialInteractions';
import { useOffersList } from '@/hooks/useOffers';
import { getCustomer, getCustomerOrderHistory } from '@/services/customerService';
import { useSession } from 'next-auth/react';
import QuickInteractionModal from './QuickInteractionModal';
import { formatCurrency, formatDateValue, formatDateTimeValue, interactionResultLabels, interactionTypeLabels, offerStatusLabels } from './utils';
import StatusPill from './StatusPill';
import Loader from '@/components/Utilities/Loader';
import CustomerAssignmentPanel from '@/components/Admin/Customers/CustomerAssignmentPanel';

const interactionTypeIcons = {
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  visit: MapPin,
  other: CircleDot,
};

function useCustomerDetail(customerId) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  return useQuery({
    queryKey: ['crm', 'customers', 'detail', customerId, token],
    queryFn: () => getCustomer(customerId, token),
    enabled: !!customerId && !!token,
  });
}

function useCustomerOrderHistory(customerId) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  return useQuery({
    queryKey: ['crm', 'customers', 'history', customerId, token],
    queryFn: () => getCustomerOrderHistory(customerId, token, {}),
    enabled: !!customerId && !!token,
  });
}

function CustomerDetail({ customerId, embedded = false }) {
  const { data: customer, isLoading } = useCustomerDetail(customerId);
  const { data: history } = useCustomerOrderHistory(customerId);
  const { data: interactions, isLoading: interactionsLoading } = useCommercialInteractions({ customerId, perPage: 50 });
  const { data: offers } = useOffersList({ customerId, perPage: 50 });
  const [interactionOpen, setInteractionOpen] = useState(false);
  const sortedInteractions = useMemo(
    () =>
      interactions
        .slice()
        .sort((a, b) => (a.occurredAt && b.occurredAt ? b.occurredAt.localeCompare(a.occurredAt) : 0)),
    [interactions]
  );

  const body = isLoading ? (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <Loader />
    </div>
  ) : !customer ? (
    <div className="flex min-h-0 flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
      No se ha encontrado el cliente.
    </div>
  ) : (
    <>
      <CardHeader className="w-full min-w-0">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl">{customer.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{customer.country?.name ?? 'Sin país'} · Comercial #{customer.salesperson?.id ?? '-'}</p>
          </div>
          <Button onClick={() => setInteractionOpen(true)}>
            <Plus data-icon="inline-start" />
            Nueva interacción
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex w-full min-w-0 flex-1 min-h-0 flex-col py-4">
        <Tabs defaultValue="data" className="flex h-full w-full min-w-0 flex-1 min-h-0 flex-col overflow-hidden">
          <TabsList>
            <TabsTrigger value="data">Datos</TabsTrigger>
            <TabsTrigger value="assignment">Asignación</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="interactions">Interacciones</TabsTrigger>
            <TabsTrigger value="offers">Ofertas</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="flex h-full w-full min-w-0 min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{Array.isArray(customer.emails) ? customer.emails.join(', ') : customer.emails || 'Sin email'}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Contacto</p>
                <p className="font-medium">{customer.contactInfo || customer.contact_info || 'Sin contacto'}</p>
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground mb-1">Dirección de envío</p>
              <p>{customer.shippingAddress || customer.shipping_address || 'Sin dirección registrada'}</p>
            </div>
          </TabsContent>

          <TabsContent value="assignment" className="flex h-full w-full min-w-0 min-h-0 flex-1 flex-col overflow-y-auto">
            <CustomerAssignmentPanel customerId={customerId} />
          </TabsContent>

          <TabsContent value="orders" className="flex h-full w-full min-w-0 flex-1 min-h-0 flex-col overflow-hidden">
            {!history?.data?.length ? (
              <div className="flex-1 min-h-0 flex">
                <EmptyState
                  title="Sin pedidos"
                  description="Este cliente no tiene historial visible en el periodo actual."
                  className="h-full w-full border bg-muted/20 !min-h-0"
                />
              </div>
            ) : (
              <div className="h-full w-full flex flex-col min-h-0">
                <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                  {history.data.map((item, index) => (
                    <div key={`${item.product?.id ?? index}-${index}`} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.product?.name ?? 'Producto'}</p>
                          <p className="text-sm text-muted-foreground">{item.lines?.length ?? 0} líneas</p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.total_amount ?? 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="interactions" className="flex h-full w-full min-w-0 flex-1 min-h-0 flex-col overflow-hidden">
            {interactionsLoading ? (
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <Loader />
              </div>
            ) : interactions.length === 0 ? (
              <div className="flex-1 min-h-0 flex">
                <EmptyState
                  title="Sin interacciones"
                  description="Registra seguimiento para alimentar la agenda comercial."
                  className="h-full w-full border bg-muted/20 !min-h-0"
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="space-y-4">
                  <div className="relative w-full pl-1 py-2 space-y-4">
                    {sortedInteractions.map((interaction, index, array) => {
                        const isLast = index === array.length - 1;
                        const typeLabel = interactionTypeLabels[interaction.type] ?? interaction.type;
                        const resultLabel = interactionResultLabels[interaction.result] ?? interaction.result;
                        const TypeIcon = interactionTypeIcons[interaction.type] ?? CircleDot;

                        return (
                          <div key={interaction.id} className="flex gap-2 items-stretch">
                            {/* columna pista */}
                            <div className="flex flex-col items-center shrink-0 w-6 self-stretch">
                              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground border-0 shadow-sm">
                                <TypeIcon className="size-3 stroke-[2]" />
                              </div>
                              {!isLast && <div className="w-0.5 flex-1 min-h-0 mt-1 bg-muted-foreground/50" aria-hidden />}
                            </div>

                            {/* columna contenido */}
                            <div className={`flex-1 min-w-0 ${!isLast ? 'pb-4' : ''}`}>
                              <div className="flex flex-col gap-0.5">
                                <p className="text-xs text-muted-foreground font-normal">{formatDateTimeValue(interaction.occurredAt)}</p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold leading-tight text-foreground truncate">{typeLabel}</span>
                                  <StatusPill label={resultLabel} status={interaction.result} />
                                </div>
                              </div>

                              <div className="mt-2 rounded-xl border bg-card p-3 space-y-3">
                                <p className="text-sm text-foreground leading-snug">{interaction.summary}</p>

                                {interaction.nextActionAt && (
                                  <div className="pt-2 border-t border-border/60 space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                      <CalendarClock className="size-3 shrink-0" />
                                      <span>Próxima acción: {formatDateValue(interaction.nextActionAt)}</span>
                                    </p>

                                    {interaction.nextActionNote && (
                                      <p className="text-xs text-muted-foreground whitespace-pre-line pl-4">{interaction.nextActionNote}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="offers" className="flex h-full w-full min-w-0 flex-1 min-h-0 flex-col overflow-hidden">
            {offers.length === 0 ? (
              <div className="flex-1 min-h-0 flex">
                <EmptyState
                  title="Sin ofertas"
                  description="No hay ofertas vinculadas a este cliente."
                  className="h-full w-full border bg-muted/20 !min-h-0"
                />
              </div>
            ) : (
              <div className="h-full w-full flex flex-col min-h-0">
                <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                  {offers.map((offer) => (
                    <Link
                      key={offer.id}
                      href={`/comercial/ofertas/${offer.id}`}
                      className="block rounded-xl border p-4 hover:bg-accent/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">Oferta #{offer.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {offer.validUntil
                              ? `Validez: ${formatDateValue(offer.validUntil)}`
                              : 'Sin validez definida'}
                          </p>
                        </div>
                        <StatusPill label={offerStatusLabels[offer.status] ?? offer.status} status={offer.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </>
  );

  return embedded ? (
    <Card className="flex h-full w-full max-w-none min-h-0 min-w-0 flex-1 basis-0 self-stretch flex-col overflow-hidden">
      {body}
      <QuickInteractionModal open={interactionOpen} onOpenChange={setInteractionOpen} customerId={customerId} />
    </Card>
  ) : (
    <Card className="w-full max-w-none min-w-0">
      {body}
      <QuickInteractionModal open={interactionOpen} onOpenChange={setInteractionOpen} customerId={customerId} />
    </Card>
  );
}

function CustomerCard({ customer, selected, onClick }) {
  const contact =
    customer?.contactInfo ?? customer?.contact_info ?? null;

  return (
    <Card
      className={`w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring transition-colors hover:bg-accent/50 ${
        selected ? 'ring-2 ring-offset-2 ring-primary' : ''
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={customer.name}
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
            <h3 className="text-base font-medium truncate">{customer.name}</h3>
          </div>

          <div>
            <p className="text-sm text-muted-foreground truncate">{customer.country?.name ?? 'Sin país'}</p>
          </div>

          {contact && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="text-muted-foreground mb-1 text-xs">Contacto</p>
                <p className="text-sm font-medium truncate">{contact}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomersPageClient({ initialCustomerId = null }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: customers, isLoading } = useCustomersList({ perPage: 100 });
  const [selectedId, setSelectedId] = useState(initialCustomerId);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        if (!normalizedSearch) return true;

        const searchableValues = [
          customer.name,
          customer.contactInfo,
          customer.contact_info,
          customer.country?.name,
        ];

        return searchableValues.some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch));
      }),
    [customers, normalizedSearch]
  );

  useEffect(() => {
    if (isMobile || !selectedId) return;

    const selectedCustomerStillVisible = filteredCustomers.some((customer) => String(customer.id) === String(selectedId));
    if (!selectedCustomerStillVisible) {
      setSelectedId(null);
    }
  }, [filteredCustomers, isMobile, selectedId]);

  const handleSelect = (customerId) => {
    setSelectedId(customerId);
    if (isMobile) {
      router.push(`/comercial/clientes/${customerId}`);
    }
  };

  return (
    <div className="flex h-full w-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden px-4 py-3 md:px-6">
      <div>
        <h1 className="text-3xl font-light">Mis clientes</h1>
        <p className="text-sm text-muted-foreground">Solo lectura sobre clientes asignados y seguimiento CRM.</p>
      </div>

      <InputGroup className="w-full md:max-w-md">
        <InputGroupInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cliente" />
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
      </InputGroup>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden md:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {isLoading ? (
              <div className="flex h-full min-h-0 w-full items-center justify-center p-4">
                <Loader />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex h-full min-h-0 w-full p-4">
                <EmptyState
                  title="Aún no tienes clientes asignados"
                  description={normalizedSearch ? 'No hay clientes que coincidan con la búsqueda actual.' : 'Cuando existan clientes vinculados a tu comercial aparecerán aquí.'}
                  className="h-full w-full border bg-muted/20 !min-h-0"
                />
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {filteredCustomers.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    selected={!isMobile && String(selectedId) === String(customer.id)}
                    onClick={() => handleSelect(customer.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>

        {!isMobile && (
          selectedId ? (
            <CustomerDetail customerId={selectedId} embedded />
          ) : (
            <EmptyState
              title="Selecciona un cliente"
              description="El panel derecho mostrará sus pedidos, ofertas e interacciones."
              className="w-full min-w-0 border bg-muted/20 min-h-[360px]"
            />
          )
        )}
      </div>
    </div>
  );
}

export function StandaloneCustomerDetail({ customerId }) {
  return <CustomerDetail customerId={customerId} />;
}
