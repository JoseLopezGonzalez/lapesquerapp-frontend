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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCustomersList } from '@/hooks/useCustomersList';
import { useCommercialInteractions } from '@/hooks/useCommercialInteractions';
import { useOffersList } from '@/hooks/useOffers';
import { useCustomerOrderHistoryRanges } from '@/hooks/useCustomerOrderHistoryRanges';
import { useComercialOrders } from '@/hooks/useComercialOrders';
import { usePendingAgendaAction } from '@/hooks/useAgenda';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { getCustomer } from '@/services/customerService';
import { useSession } from 'next-auth/react';
import QuickInteractionModal from './QuickInteractionModal';
import ResolveNextActionDialog from './ResolveNextActionDialog';
import { formatDateValue, formatDateTimeValue, interactionResultLabels, interactionTypeLabels, offerStatusLabels } from './utils';
import StatusPill from './StatusPill';
import Loader from '@/components/Utilities/Loader';
import CustomerAssignmentPanel from '@/components/Admin/Customers/CustomerAssignmentPanel';
import CustomerOrderHistoryView from '@/components/Shared/CustomerOrderHistoryView';
import StatusBadge from '@/components/Admin/OrdersManager/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDecimalCurrency, formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';

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
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  return useQuery({
    queryKey: ['crm', 'customers', 'detail', tenantId ?? 'unknown', customerId],
    queryFn: () => getCustomer(customerId, token),
    enabled: !!tenantId && !!customerId && !!token,
  });
}

function CustomerDetail({ customerId, embedded = false }) {
  const [activeTab, setActiveTab] = useState('data');
  const [ordersPage, setOrdersPage] = useState(1);
  const ORDERS_PER_PAGE = 12;
  const shouldLoadOrders = activeTab === 'orders';
  const shouldLoadHistory = activeTab === 'history';
  const shouldLoadInteractions = activeTab === 'interactions';
  const shouldLoadOffers = activeTab === 'offers';
  const { data: customer, isLoading } = useCustomerDetail(customerId);
  const {
    customerHistory,
    availableYears,
    initialLoading,
    loadingData,
    error,
    dateFilter,
    setDateFilter,
    selectedYear,
    setSelectedYear,
    currentYear,
    hasCurrentYear,
    hasYear1,
    yearsForSelector,
    filteredHistory,
    generalMetrics,
    calculateTrend,
    getTrendTooltipText,
  } = useCustomerOrderHistoryRanges({
    customerId,
    enabled: shouldLoadHistory,
    notifyOnError: false,
  });
  const {
    data: customerOrders = [],
    meta: customerOrdersMeta,
    isLoading: ordersTableLoading,
    errorMessage: ordersTableError,
  } = useComercialOrders({
    customerId,
    page: ordersPage,
    perPage: ORDERS_PER_PAGE,
    enabled: shouldLoadOrders,
  });
  const { data: interactions, isLoading: interactionsLoading } = useCommercialInteractions({
    customerId,
    perPage: 50,
    enabled: shouldLoadInteractions,
  });
  const { data: offers } = useOffersList({
    customerId,
    perPage: 50,
    enabled: shouldLoadOffers,
  });
  const [interactionOpen, setInteractionOpen] = useState(false);
  const [interactionMode, setInteractionMode] = useState('create');
  const [interactionAgendaActionId, setInteractionAgendaActionId] = useState(null);
  const [interactionNextActionDate, setInteractionNextActionDate] = useState(null);
  const [interactionNextActionNote, setInteractionNextActionNote] = useState('');
  const [resolveNextActionOpen, setResolveNextActionOpen] = useState(false);
  const [postInteractionPromptOpen, setPostInteractionPromptOpen] = useState(false);
  const [preflightDialogOpen, setPreflightDialogOpen] = useState(false);
  const [lastInteractionId, setLastInteractionId] = useState(null);
  const { data: pendingPreflightData, refetch: refetchPendingPreflight } = usePendingAgendaAction(
    'customer',
    customerId,
    true
  );
  const handleStartInteraction = async () => {
    const response = await refetchPendingPreflight();
    const rawPending = response?.data?.data ?? null;
    const pendingAction = rawPending?.pendingAction ?? (rawPending?.agendaActionId ? rawPending : null);
    const hasPending = typeof rawPending?.hasPending === 'boolean' ? rawPending.hasPending : Boolean(pendingAction);
    if (hasPending) {
      setPreflightDialogOpen(true);
      return;
    }
    setInteractionMode('create');
    setInteractionAgendaActionId(null);
    setInteractionNextActionDate(null);
    setInteractionNextActionNote('');
    setInteractionOpen(true);
  };


  useEffect(() => {
    setActiveTab('data');
    setOrdersPage(1);
    setInteractionOpen(false);
  }, [customerId]);

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
          <Button onClick={handleStartInteraction}>
            <Plus data-icon="inline-start" />
            Nueva interacción
          </Button>
          <Button variant="outline" onClick={() => setResolveNextActionOpen(true)}>
            Gestionar próxima acción
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex w-full min-w-0 flex-1 min-h-0 flex-col py-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex h-full w-full min-w-0 flex-1 min-h-0 flex-col overflow-hidden"
        >
          <TabsList>
            <TabsTrigger value="data">Datos</TabsTrigger>
            <TabsTrigger value="assignment">Asignación</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
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
            {ordersTableLoading ? (
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <Loader />
              </div>
            ) : ordersTableError ? (
              <div className="flex-1 min-h-0 flex">
                <EmptyState
                  title="Error cargando pedidos"
                  description={ordersTableError}
                  className="h-full w-full border bg-muted/20 !min-h-0"
                />
              </div>
            ) : customerOrders.length === 0 ? (
              <div className="flex-1 min-h-0 flex">
                <EmptyState
                  title="Sin pedidos"
                  description="Este cliente no tiene pedidos."
                  className="h-full w-full border bg-muted/20 !min-h-0"
                />
              </div>
            ) : (
              <div className="flex h-full min-h-0 flex-col gap-3">
                <div className="flex-1 min-h-0 overflow-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Fecha Salida</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Peso total</TableHead>
                        <TableHead className="text-right">Cajas</TableHead>
                        <TableHead className="text-right">Palets</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Incoterm</TableHead>
                        <TableHead>Transporte</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerOrders.map((order) => {
                        const status = order.status;
                        const statusColor = status === 'finished' ? 'green' : status === 'incident' ? 'red' : 'orange';
                        const statusLabel = status === 'finished' ? 'Finalizado' : status === 'incident' ? 'Incidencia' : 'Pendiente';
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell>{formatDateValue(order.loadDate)}</TableCell>
                            <TableCell>{order.customer?.name ?? customer?.name ?? '-'}</TableCell>
                            <TableCell>{order.buyerReference || '-'}</TableCell>
                            <TableCell>
                              <StatusBadge color={statusColor} label={statusLabel} />
                            </TableCell>
                            <TableCell>{order.orderType === 'autoventa' ? 'Autoventa' : 'Estándar'}</TableCell>
                            <TableCell className="text-right">{formatDecimalWeight(order.totalNetWeight ?? 0)}</TableCell>
                            <TableCell className="text-right">{formatInteger(order.totalBoxes ?? 0)}</TableCell>
                            <TableCell className="text-right">{formatInteger(order.pallets ?? 0)}</TableCell>
                            <TableCell className="text-right">{formatDecimalCurrency(order.subtotalAmount ?? 0)}</TableCell>
                            <TableCell className="text-right">{formatDecimalCurrency(order.totalAmount ?? 0)}</TableCell>
                            <TableCell>{order.salesperson?.name ?? '-'}</TableCell>
                            <TableCell>{order.incoterm?.code ?? '-'}</TableCell>
                            <TableCell>{order.transport?.name ?? '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Página {customerOrdersMeta.current_page} de {customerOrdersMeta.last_page} · {customerOrdersMeta.total} pedidos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrdersPage((prev) => Math.max(1, prev - 1))}
                      disabled={customerOrdersMeta.current_page <= 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrdersPage((prev) => prev + 1)}
                      disabled={customerOrdersMeta.current_page >= customerOrdersMeta.last_page}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="flex h-full w-full min-w-0 flex-1 min-h-0 flex-col overflow-hidden">
            <CustomerOrderHistoryView
              customerHistory={customerHistory}
              availableYears={availableYears}
              initialLoading={initialLoading}
              loadingData={loadingData}
              error={error}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              currentYear={currentYear}
              hasCurrentYear={hasCurrentYear}
              hasYear1={hasYear1}
              yearsForSelector={yearsForSelector}
              filteredHistory={filteredHistory}
              generalMetrics={generalMetrics}
              calculateTrend={calculateTrend}
              getTrendTooltipText={getTrendTooltipText}
            />
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
                                <p className="text-sm text-foreground leading-snug whitespace-pre-wrap break-words">{interaction.summary}</p>

                                {interaction.nextActionAt && (
                                  <div className="pt-2 border-t border-border/60 space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                      <CalendarClock className="size-3 shrink-0" />
                                      <span>Próxima acción: {formatDateValue(interaction.nextActionAt)}</span>
                                    </p>

                                    {interaction.nextActionNote && (
                                      <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words pl-4">{interaction.nextActionNote}</p>
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
      <QuickInteractionModal
        open={interactionOpen}
        onOpenChange={setInteractionOpen}
        customerId={customerId}
        agendaActionId={interactionAgendaActionId}
        defaultNextActionDate={interactionNextActionDate}
        defaultNextActionNote={interactionNextActionNote}
        mode={interactionMode}
        title={interactionMode === 'complete' ? 'Cerrar tarea' : 'Registrar interacción'}
        onInteractionCreated={(interaction) => {
          setLastInteractionId(interaction?.id ?? null);
          if (interactionMode === 'create') setPostInteractionPromptOpen(true);
        }}
      />
      <ResolveNextActionDialog
        open={resolveNextActionOpen}
        onOpenChange={setResolveNextActionOpen}
        targetType="customer"
        targetId={customerId}
        sourceInteractionId={lastInteractionId}
      />
      <AlertDialog open={postInteractionPromptOpen} onOpenChange={setPostInteractionPromptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Interacción guardada</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Quieres gestionar la próxima acción ahora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ahora no</AlertDialogCancel>
            <AlertDialogAction onClick={() => setResolveNextActionOpen(true)}>Sí, gestionar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={preflightDialogOpen} onOpenChange={setPreflightDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ya existe una acción pendiente</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {pendingPreflightData?.pendingAction ? (
                  <>
                    <span className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground mb-1">Acción pendiente activa</span>
                    <span className="block font-semibold text-foreground">{formatDateValue(pendingPreflightData.pendingAction.scheduledAt)}</span>
                    {pendingPreflightData.pendingAction.description && (
                      <span className="block mt-0.5 text-sm text-muted-foreground">{pendingPreflightData.pendingAction.description}</span>
                    )}
                  </>
                ) : (
                  'Este cliente ya tiene una acción pendiente activa.'
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col">
            <AlertDialogCancel className="w-full whitespace-normal">Volver</AlertDialogCancel>
            <AlertDialogAction
              className="w-full whitespace-normal"
              onClick={() => {
                setPreflightDialogOpen(false);
                const pendingAction = pendingPreflightData?.pendingAction ?? null;
                if (pendingAction?.agendaActionId) {
                  setInteractionMode('complete');
                  setInteractionAgendaActionId(pendingAction.agendaActionId);
                  setInteractionNextActionDate(pendingAction.scheduledAt ?? null);
                  setInteractionNextActionNote(pendingAction.description ?? '');
                  setInteractionOpen(true);
                  return;
                }
                setResolveNextActionOpen(true);
              }}
            >
              Ir a cerrar pendiente
            </AlertDialogAction>
            <AlertDialogAction
              className="w-full whitespace-normal"
              onClick={() => {
                setPreflightDialogOpen(false);
                setInteractionMode('create');
                setInteractionAgendaActionId(null);
                setInteractionNextActionDate(null);
                setInteractionNextActionNote('');
                setInteractionOpen(true);
              }}
            >
              Continuar con interacción
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  ) : (
    <Card className="w-full max-w-none min-w-0">
      {body}
      <QuickInteractionModal
        open={interactionOpen}
        onOpenChange={setInteractionOpen}
        customerId={customerId}
        agendaActionId={interactionAgendaActionId}
        defaultNextActionDate={interactionNextActionDate}
        defaultNextActionNote={interactionNextActionNote}
        mode={interactionMode}
        title={interactionMode === 'complete' ? 'Cerrar tarea' : 'Registrar interacción'}
        onInteractionCreated={(interaction) => {
          setLastInteractionId(interaction?.id ?? null);
          if (interactionMode === 'create') setPostInteractionPromptOpen(true);
        }}
      />
      <ResolveNextActionDialog
        open={resolveNextActionOpen}
        onOpenChange={setResolveNextActionOpen}
        targetType="customer"
        targetId={customerId}
        sourceInteractionId={lastInteractionId}
      />
      <AlertDialog open={postInteractionPromptOpen} onOpenChange={setPostInteractionPromptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Interacción guardada</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Quieres gestionar la próxima acción ahora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ahora no</AlertDialogCancel>
            <AlertDialogAction onClick={() => setResolveNextActionOpen(true)}>Sí, gestionar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={preflightDialogOpen} onOpenChange={setPreflightDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ya existe una acción pendiente</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {pendingPreflightData?.pendingAction ? (
                  <>
                    <span className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground mb-1">Acción pendiente activa</span>
                    <span className="block font-semibold text-foreground">{formatDateValue(pendingPreflightData.pendingAction.scheduledAt)}</span>
                    {pendingPreflightData.pendingAction.description && (
                      <span className="block mt-0.5 text-sm text-muted-foreground">{pendingPreflightData.pendingAction.description}</span>
                    )}
                  </>
                ) : (
                  'Este cliente ya tiene una acción pendiente activa.'
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col">
            <AlertDialogCancel className="w-full whitespace-normal">Volver</AlertDialogCancel>
            <AlertDialogAction
              className="w-full whitespace-normal"
              onClick={() => {
                setPreflightDialogOpen(false);
                const pendingAction = pendingPreflightData?.pendingAction ?? null;
                if (pendingAction?.agendaActionId) {
                  setInteractionMode('complete');
                  setInteractionAgendaActionId(pendingAction.agendaActionId);
                  setInteractionNextActionDate(pendingAction.scheduledAt ?? null);
                  setInteractionNextActionNote(pendingAction.description ?? '');
                  setInteractionOpen(true);
                  return;
                }
                setResolveNextActionOpen(true);
              }}
            >
              Ir a cerrar pendiente
            </AlertDialogAction>
            <AlertDialogAction
              className="w-full whitespace-normal"
              onClick={() => {
                setPreflightDialogOpen(false);
                setInteractionMode('create');
                setInteractionAgendaActionId(null);
                setInteractionNextActionDate(null);
                setInteractionNextActionNote('');
                setInteractionOpen(true);
              }}
            >
              Continuar con interacción
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
