'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const { data: interactions } = useCommercialInteractions({ customerId, perPage: 50 });
  const { data: offers } = useOffersList({ customerId, perPage: 50 });
  const [interactionOpen, setInteractionOpen] = useState(false);

  const content = isLoading ? (
    <div className="flex min-h-[360px] w-full items-center justify-center">
      <Loader />
    </div>
  ) : !customer ? (
    <div className="p-4 text-sm text-muted-foreground">No se ha encontrado el cliente.</div>
  ) : (
    <>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl">{customer.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{customer.country?.name ?? 'Sin país'} · Comercial #{customer.salesperson?.id ?? '-'}</p>
          </div>
          <Button onClick={() => setInteractionOpen(true)}>Nueva interacción</Button>
        </div>
      </CardHeader>
      <CardContent className="py-4">
        <Tabs defaultValue="data">
          <TabsList className="mb-4 flex w-full flex-wrap justify-start">
            <TabsTrigger value="data">Datos</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="interactions">Interacciones</TabsTrigger>
            <TabsTrigger value="offers">Ofertas</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-4">
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

          <TabsContent value="orders">
            {!history?.data?.length ? (
              <EmptyState
                title="Sin pedidos"
                description="Este cliente no tiene historial visible en el periodo actual."
                className="border bg-muted/20 min-h-[220px]"
              />
            ) : (
              <div className="space-y-3">
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
            )}
          </TabsContent>

          <TabsContent value="interactions">
            {interactions.length === 0 ? (
              <EmptyState
                title="Sin interacciones"
                description="Registra seguimientos desde esta ficha para dejar contexto al comercial."
                className="border bg-muted/20 min-h-[220px]"
              />
            ) : (
              <div className="space-y-3">
                {interactions.map((interaction) => (
                  <div key={interaction.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{interactionTypeLabels[interaction.type] ?? interaction.type}</p>
                      <StatusPill label={interactionResultLabels[interaction.result] ?? interaction.result} status={interaction.result} />
                    </div>
                    <p className="mt-2 text-sm">{interaction.summary}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{formatDateTimeValue(interaction.occurredAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="offers">
            {offers.length === 0 ? (
              <EmptyState
                title="Sin ofertas"
                description="No hay ofertas vinculadas a este cliente."
                className="border bg-muted/20 min-h-[220px]"
              />
            ) : (
              <div className="space-y-3">
                {offers.map((offer) => (
                  <Link key={offer.id} href={`/comercial/ofertas/${offer.id}`} className="block rounded-xl border p-4 hover:bg-accent/40">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">Oferta #{offer.id}</p>
                        <p className="text-sm text-muted-foreground">{offer.validUntil ? `Validez: ${formatDateValue(offer.validUntil)}` : 'Sin validez definida'}</p>
                      </div>
                      <StatusPill label={offerStatusLabels[offer.status] ?? offer.status} status={offer.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <QuickInteractionModal open={interactionOpen} onOpenChange={setInteractionOpen} customerId={customerId} />
    </>
  );

  return embedded ? <Card className="h-full overflow-hidden"><ScrollArea className="h-full">{content}</ScrollArea></Card> : <Card>{content}</Card>;
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
  const { data: customers, isLoading } = useCustomersList({ filters: { search }, perPage: 100 });
  const [selectedId, setSelectedId] = useState(initialCustomerId);

  const filteredCustomers = useMemo(
    () => customers.filter((customer) => !search || customer.name?.toLowerCase().includes(search.toLowerCase())),
    [customers, search]
  );

  const handleSelect = (customerId) => {
    setSelectedId(customerId);
    if (isMobile) {
      router.push(`/comercial/clientes/${customerId}`);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 px-4 py-3 md:px-6">
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

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-4">
              {!isLoading && filteredCustomers.length === 0 ? (
                <EmptyState
                  title="Aún no tienes clientes asignados"
                  description="Cuando existan clientes vinculados a tu comercial aparecerán aquí."
                  className="border bg-muted/20 min-h-[260px]"
                />
              ) : (
                filteredCustomers.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    selected={!isMobile && String(selectedId) === String(customer.id)}
                    onClick={() => handleSelect(customer.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {!isMobile && (
          selectedId ? (
            <CustomerDetail customerId={selectedId} embedded />
          ) : (
            <EmptyState
              title="Selecciona un cliente"
              description="El panel derecho mostrará sus pedidos, ofertas e interacciones."
              className="border bg-muted/20 min-h-[360px]"
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
