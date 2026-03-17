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
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCustomersList } from '@/hooks/useCustomersList';
import { useCommercialInteractions } from '@/hooks/useCommercialInteractions';
import { useOffersList } from '@/hooks/useOffers';
import { getCustomer, getCustomerOrderHistory } from '@/services/customerService';
import { useSession } from 'next-auth/react';
import QuickInteractionModal from './QuickInteractionModal';
import { formatCurrency, formatDateValue, formatDateTimeValue, interactionResultLabels, interactionTypeLabels, offerStatusLabels } from './utils';
import StatusPill from './StatusPill';

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
    <div className="p-4 text-sm text-muted-foreground">Cargando cliente...</div>
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
              <Empty className="border bg-muted/20 min-h-[220px]">
                <EmptyHeader>
                  <EmptyTitle>Sin pedidos</EmptyTitle>
                  <EmptyDescription>Este cliente no tiene historial visible en el periodo actual.</EmptyDescription>
                </EmptyHeader>
              </Empty>
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
              <Empty className="border bg-muted/20 min-h-[220px]">
                <EmptyHeader>
                  <EmptyTitle>Sin interacciones</EmptyTitle>
                  <EmptyDescription>Registra seguimientos desde esta ficha para dejar contexto al comercial.</EmptyDescription>
                </EmptyHeader>
              </Empty>
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
              <Empty className="border bg-muted/20 min-h-[220px]">
                <EmptyHeader>
                  <EmptyTitle>Sin ofertas</EmptyTitle>
                  <EmptyDescription>No hay ofertas vinculadas a este cliente.</EmptyDescription>
                </EmptyHeader>
              </Empty>
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition ${selected ? 'border-primary bg-primary/5' : 'hover:bg-accent/40'}`}
    >
      <p className="font-medium">{customer.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">{customer.country?.name ?? 'Sin país'}</p>
      <p className="mt-2 text-sm text-muted-foreground">{customer.emails || customer.contact_info || 'Sin contacto'}</p>
    </button>
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
                <Empty className="border bg-muted/20 min-h-[260px]">
                  <EmptyHeader>
                    <EmptyTitle>Aún no tienes clientes asignados</EmptyTitle>
                    <EmptyDescription>Cuando existan clientes vinculados a tu comercial aparecerán aquí.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
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
            <Empty className="border bg-muted/20 min-h-[360px]">
              <EmptyHeader>
                <EmptyTitle>Selecciona un cliente</EmptyTitle>
                <EmptyDescription>El panel derecho mostrará sus pedidos, ofertas e interacciones.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        )}
      </div>
    </div>
  );
}

export function StandaloneCustomerDetail({ customerId }) {
  return <CustomerDetail customerId={customerId} />;
}
