'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  CircleDot,
  MapPin,
  Mail,
  MessageCircle,
  Phone,
  Loader2,
  Plus,
  MoreVertical,
  Pencil,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  formatDateValue,
  formatDateTimeValue,
  interactionResultLabels,
  interactionTypeLabels,
  offerStatusLabels,
} from './utils';
import StatusPill from './StatusPill';
import ProspectLocationMap from './ProspectLocationMap';
import CustomerEditDialog from './CustomerEditDialog';
import Loader from '@/components/Utilities/Loader';
import CustomerOrderHistoryView from '@/components/Shared/CustomerOrderHistoryView';
import StatusBadge from '@/components/Admin/OrdersManager/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatDecimalCurrency,
  formatDecimalWeight,
  formatInteger,
} from '@/helpers/formats/numbers/formatNumbers';
import { customerListKeys } from '@/lib/routes/queryKeys';

const CUSTOMERS_PER_PAGE = 12;
const INFINITE_SCROLL_THRESHOLD_PX = 180;

const interactionTypeIcons = {
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  visit: MapPin,
  other: CircleDot,
};

function getInteractionOriginMeta(interaction) {
  if (interaction?.isFromProspect === true) {
    return {
      label: 'Histórico de prospecto',
      className:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    };
  }

  return null;
}

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

function CustomerDetail({ customerId, embedded = false, onCustomerUpdated }) {
  const [activeTab, setActiveTab] = useState('data');
  const [ordersPage, setOrdersPage] = useState(1);
  const ORDERS_PER_PAGE = 12;
  const shouldLoadOrders = activeTab === 'orders';
  const shouldLoadHistory = activeTab === 'history';
  const shouldLoadInteractions = activeTab === 'interactions';
  const shouldLoadOffers = activeTab === 'offers';
  const { data: customer, isLoading, refetch: refetchCustomer } = useCustomerDetail(customerId);
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
    customers: customerId ? [customerId] : [],
    page: ordersPage,
    perPage: ORDERS_PER_PAGE,
    enabled: shouldLoadOrders,
  });
  const [interactionsPage, setInteractionsPage] = useState(1);
  const [loadedInteractions, setLoadedInteractions] = useState([]);
  const {
    data: interactions,
    isLoading: interactionsLoading,
    meta: interactionsMeta,
  } = useCommercialInteractions({
    customerId,
    perPage: 20,
    page: interactionsPage,
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
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
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
    const pendingAction =
      rawPending?.pendingAction ?? (rawPending?.agendaActionId ? rawPending : null);
    const hasPending =
      typeof rawPending?.hasPending === 'boolean' ? rawPending.hasPending : Boolean(pendingAction);
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
    setInteractionsPage(1);
    setLoadedInteractions([]);
  }, [customerId]);

  useEffect(() => {
    if (!shouldLoadInteractions) return;
    setLoadedInteractions((prev) => {
      if (interactionsPage === 1) return interactions;
      const seen = new Set(prev.map((item) => String(item.id)));
      const next = [...prev];
      for (const item of interactions) {
        if (!seen.has(String(item.id))) next.push(item);
      }
      return next;
    });
  }, [interactions, interactionsPage, shouldLoadInteractions]);

  const interactionsLastPage = Math.max(1, interactionsMeta?.last_page ?? 1);
  const canLoadMoreInteractions = interactionsPage < interactionsLastPage && !interactionsLoading;

  const handleInteractionsScroll = useCallback(
    (event) => {
      if (!canLoadMoreInteractions) return;
      const el = event.currentTarget;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 180) {
        setInteractionsPage((prev) => prev + 1);
      }
    },
    [canLoadMoreInteractions]
  );

  const operationalStatusLabel = useMemo(() => {
    const status = customer?.operationalStatus ?? customer?.operational_status ?? null;
    if (!status) return null;
    if (status === 'normal') return 'Normal';
    if (status === 'alta_operativa') return 'Alta operativa';
    return String(status);
  }, [customer?.operationalStatus, customer?.operational_status]);

  const renderValue = (value, fallback = '—') => {
    if (value == null) return fallback;
    if (typeof value === 'string') return value.trim() ? value : fallback;
    return String(value);
  };

  const renderMultiline = (value, fallback = 'Sin dato') => {
    const text = typeof value === 'string' ? value.trim() : value;
    return text ? (
      <p className="text-foreground leading-6 whitespace-pre-wrap">{String(text)}</p>
    ) : (
      <p className="text-muted-foreground">{fallback}</p>
    );
  };

  const renderEmailChips = (list, fallback = 'Sin emails') => {
    const emails = Array.isArray(list) ? list.filter(Boolean) : [];
    if (emails.length === 0) return <p className="text-muted-foreground text-sm">{fallback}</p>;
    return (
      <div className="flex flex-wrap gap-2">
        {emails.map((email) => (
          <span
            key={email}
            className="border-primary/15 bg-primary/8 text-primary inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
          >
            {email}
          </span>
        ))}
      </div>
    );
  };

  const mapAddress = useMemo(() => {
    const shipping = customer?.shippingAddress ?? customer?.shipping_address ?? '';
    const billing = customer?.billingAddress ?? customer?.billing_address ?? '';
    const base = String(shipping || billing || '').trim();
    const countryName = String(customer?.country?.name ?? '').trim();
    if (!base) return '';
    return countryName ? `${base}, ${countryName}` : base;
  }, [
    customer?.shippingAddress,
    customer?.shipping_address,
    customer?.billingAddress,
    customer?.billing_address,
    customer?.country?.name,
  ]);

  const body = isLoading ? (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <Loader />
    </div>
  ) : !customer ? (
    <div className="text-muted-foreground flex min-h-0 flex-1 items-center justify-center p-4 text-sm">
      No se ha encontrado el cliente.
    </div>
  ) : (
    <>
      <CardHeader className="w-full min-w-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl">{customer.name}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {customer.country?.name ?? 'Sin país'} · Comercial #{customer.salesperson?.id ?? '-'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleStartInteraction}>
              <Plus data-icon="inline-start" />
              Nueva interacción
            </Button>
            <Button variant="outline" onClick={() => setResolveNextActionOpen(true)}>
              Gestionar próxima acción
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Acciones sobre el cliente">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuItem onClick={() => setEditCustomerOpen(true)}>
                  <Pencil />
                  Editar cliente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 w-full min-w-0 flex-1 flex-col py-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
        >
          <TabsList>
            <TabsTrigger value="data">Datos</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="interactions">Interacciones</TabsTrigger>
            <TabsTrigger value="offers">Ofertas</TabsTrigger>
          </TabsList>

          <TabsContent
            value="data"
            className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col pt-1"
          >
            <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border">
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-4">
                  <div className="bg-card overflow-hidden rounded-2xl border">
                    <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
                      <div className="space-y-5 p-5">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
                              Ficha cliente
                            </span>
                            {operationalStatusLabel ? (
                              <StatusPill
                                label={operationalStatusLabel}
                                status={customer.operationalStatus ?? customer.operational_status}
                              />
                            ) : null}
                          </div>
                          <p className="text-muted-foreground text-sm">
                            Información general y operativa del cliente para el seguimiento
                            comercial.
                          </p>
                        </div>

                        <div className="overflow-hidden rounded-xl border">
                          <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                            <div className="flex items-start gap-3 px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-muted-foreground text-xs">Nombre</p>
                                <p className="text-foreground mt-1 text-sm font-medium">
                                  {renderValue(customer.name, 'Sin nombre')}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-muted-foreground text-xs">Alias</p>
                                <p className="text-foreground mt-1 text-sm font-medium">
                                  {renderValue(customer.alias, '—')}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-muted-foreground text-xs">NIF</p>
                                <p className="text-foreground mt-1 text-sm font-medium">
                                  {renderValue(customer.vatNumber ?? customer.vat_number, '—')}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="divide-y border-t">
                            <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
                              <div className="min-w-0">
                                <p className="text-muted-foreground text-xs">Comercial asignado</p>
                                <p className="text-foreground mt-1 text-sm font-medium">
                                  {renderValue(customer.salesperson?.name, '—')}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted-foreground text-xs">Repartidor</p>
                                <p className="text-foreground mt-1 text-sm font-medium">
                                  {renderValue(customer.fieldOperator?.name, '—')}
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-3 px-4 py-3 sm:grid-cols-3">
                              <div className="min-w-0">
                                <p className="text-muted-foreground text-xs">Forma de pago</p>
                                <p className="text-foreground mt-1 text-sm font-medium">
                                  {renderValue(customer.paymentTerm?.name, '—')}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted-foreground text-xs">País</p>
                                <p className="text-foreground mt-1 text-sm font-medium">
                                  {renderValue(customer.country?.name, '—')}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted-foreground text-xs">Transporte</p>
                                <p className="text-foreground mt-1 text-sm font-medium">
                                  {renderValue(customer.transport?.name, '—')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <section className="bg-muted/15 overflow-hidden border-t lg:border-t-0 lg:border-l">
                        <ProspectLocationMap address={mapAddress} companyName={customer.name} />
                      </section>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
                    <section className="bg-card rounded-2xl border p-5">
                      <div className="space-y-3">
                        <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                          Direcciones
                        </p>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="bg-card rounded-xl border p-4">
                            <p className="text-muted-foreground mb-2 text-xs">
                              Dirección de facturación
                            </p>
                            {renderMultiline(
                              customer.billingAddress ?? customer.billing_address,
                              'Sin dirección de facturación'
                            )}
                          </div>
                          <div className="bg-card rounded-xl border p-4">
                            <p className="text-muted-foreground mb-2 text-xs">Dirección de envío</p>
                            {renderMultiline(
                              customer.shippingAddress ?? customer.shipping_address,
                              'Sin dirección de envío'
                            )}
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="space-y-4">
                      <section className="bg-card rounded-2xl border p-5">
                        <div className="space-y-3">
                          <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                            Emails
                          </p>
                          <div className="space-y-3">
                            <div>
                              <p className="text-muted-foreground mb-2 text-xs">Principales</p>
                              {renderEmailChips(customer.emails, 'Sin emails principales')}
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-2 text-xs">En copia (CC)</p>
                              {renderEmailChips(
                                customer.ccEmails ?? customer.cc_emails,
                                'Sin emails en copia'
                              )}
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="bg-card rounded-2xl border p-5">
                        <div className="space-y-3">
                          <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                            Contacto
                          </p>
                          <div className="bg-muted/10 rounded-xl border p-4">
                            {renderMultiline(
                              customer.contactInfo ?? customer.contact_info,
                              'Sin información de contacto'
                            )}
                          </div>
                        </div>
                      </section>
                    </div>

                    <section className="bg-card rounded-2xl border p-5 xl:col-span-2">
                      <div className="space-y-4">
                        <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                          Notas operativas
                        </p>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="bg-card rounded-xl border p-4">
                            <p className="text-muted-foreground mb-2 text-xs">Transporte</p>
                            {renderMultiline(
                              customer.transportationNotes ?? customer.transportation_notes,
                              'Sin notas de transporte'
                            )}
                          </div>
                          <div className="bg-card rounded-xl border p-4">
                            <p className="text-muted-foreground mb-2 text-xs">Producción</p>
                            {renderMultiline(
                              customer.productionNotes ?? customer.production_notes,
                              'Sin notas de producción'
                            )}
                          </div>
                          <div className="bg-card rounded-xl border p-4">
                            <p className="text-muted-foreground mb-2 text-xs">Contables</p>
                            {renderMultiline(
                              customer.accountingNotes ?? customer.accounting_notes,
                              'Sin notas contables'
                            )}
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent
            value="orders"
            className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col pt-1"
          >
            <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border">
              {ordersTableLoading ? (
                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <Loader />
                </div>
              ) : ordersTableError ? (
                <div className="min-h-0 flex-1 p-4">
                  <EmptyState
                    title="Error cargando pedidos"
                    description={ordersTableError}
                    className="bg-muted/20 h-full min-h-0! w-full border"
                  />
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="min-h-0 flex-1 p-4">
                  <EmptyState
                    title="Sin pedidos"
                    description="Este cliente no tiene pedidos."
                    className="bg-muted/20 h-full min-h-0! w-full border"
                  />
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
                  <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
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
                          const statusColor =
                            status === 'finished'
                              ? 'green'
                              : status === 'incident'
                                ? 'red'
                                : 'orange';
                          const statusLabel =
                            status === 'finished'
                              ? 'Finalizado'
                              : status === 'incident'
                                ? 'Incidencia'
                                : 'Pendiente';
                          return (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">#{order.id}</TableCell>
                              <TableCell>{formatDateValue(order.loadDate)}</TableCell>
                              <TableCell>{order.customer?.name ?? customer?.name ?? '-'}</TableCell>
                              <TableCell>{order.buyerReference || '-'}</TableCell>
                              <TableCell>
                                <StatusBadge color={statusColor} label={statusLabel} />
                              </TableCell>
                              <TableCell>
                                {order.orderType === 'autoventa' ? 'Autoventa' : 'Estándar'}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatDecimalWeight(order.totalNetWeight ?? 0)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatInteger(order.totalBoxes ?? 0)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatInteger(order.pallets ?? 0)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatDecimalCurrency(order.subtotalAmount ?? 0)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatDecimalCurrency(order.totalAmount ?? 0)}
                              </TableCell>
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
                    <p className="text-muted-foreground text-xs">
                      Página {customerOrdersMeta.current_page} de {customerOrdersMeta.last_page} ·{' '}
                      {customerOrdersMeta.total} pedidos
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
            </section>
          </TabsContent>

          <TabsContent
            value="history"
            className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col pt-1"
          >
            <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border">
              <div className="min-h-0 flex-1 overflow-hidden">
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
              </div>
            </section>
          </TabsContent>

          <TabsContent
            value="interactions"
            className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col pt-1"
          >
            <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border">
              {interactionsLoading && interactionsPage === 1 ? (
                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <Loader />
                </div>
              ) : loadedInteractions.length === 0 ? (
                <div className="min-h-0 flex-1 p-4">
                  <EmptyState
                    title="Sin interacciones"
                    description="Registra seguimiento para alimentar la agenda comercial."
                    className="bg-muted/20 h-full min-h-0! w-full border"
                  />
                </div>
              ) : (
                <div
                  className="min-h-0 flex-1 overflow-y-auto p-4"
                  onScroll={handleInteractionsScroll}
                >
                  <div className="space-y-4">
                    <div className="relative w-full space-y-4 py-2 pl-1">
                      {loadedInteractions.map((interaction, index, array) => {
                        const isLast = index === array.length - 1;
                        const typeLabel =
                          interactionTypeLabels[interaction.type] ?? interaction.type;
                        const resultLabel =
                          interactionResultLabels[interaction.result] ?? interaction.result;
                        const TypeIcon = interactionTypeIcons[interaction.type] ?? CircleDot;
                        const originMeta = getInteractionOriginMeta(interaction);

                        return (
                          <div key={interaction.id} className="flex items-stretch gap-2">
                            {/* columna pista */}
                            <div className="flex w-6 shrink-0 flex-col items-center self-stretch">
                              <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full border-0 shadow-sm">
                                <TypeIcon className="size-3 stroke-2" />
                              </div>
                              {!isLast && (
                                <div
                                  className="bg-muted-foreground/50 mt-1 min-h-0 w-0.5 flex-1"
                                  aria-hidden
                                />
                              )}
                            </div>

                            {/* columna contenido */}
                            <div className={`min-w-0 flex-1 ${!isLast ? 'pb-4' : ''}`}>
                              <div className="flex flex-col gap-0.5">
                                <p className="text-muted-foreground text-xs font-normal">
                                  {formatDateTimeValue(interaction.occurredAt)}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-foreground truncate text-sm leading-tight font-semibold">
                                    {typeLabel}
                                  </span>
                                  <StatusPill label={resultLabel} status={interaction.result} />
                                  {originMeta ? (
                                    <span
                                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${originMeta.className}`}
                                    >
                                      {originMeta.label}
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div className="bg-card mt-2 space-y-3 rounded-xl border p-3">
                                <p className="text-foreground text-sm leading-snug wrap-break-word whitespace-pre-wrap">
                                  {interaction.summary}
                                </p>

                                {interaction.nextActionAt && (
                                  <div className="border-border/60 space-y-1 border-t pt-2">
                                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                      <CalendarClock className="size-3 shrink-0" />
                                      <span>
                                        Próxima acción: {formatDateValue(interaction.nextActionAt)}
                                      </span>
                                    </p>

                                    {interaction.nextActionNote && (
                                      <p className="text-muted-foreground pl-4 text-xs wrap-break-word whitespace-pre-wrap">
                                        {interaction.nextActionNote}
                                      </p>
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
                  {interactionsLoading && interactionsPage > 1 && (
                    <div className="text-muted-foreground flex items-center justify-center py-4">
                      <Loader2 className="size-4 animate-spin" />
                    </div>
                  )}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent
            value="offers"
            className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col pt-1"
          >
            <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border">
              {offers.length === 0 ? (
                <div className="min-h-0 flex-1 p-4">
                  <EmptyState
                    title="Sin ofertas"
                    description="No hay ofertas vinculadas a este cliente."
                    className="bg-muted/20 h-full min-h-0! w-full border"
                  />
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {offers.map((offer) => (
                      <Link
                        key={offer.id}
                        href={`/comercial/ofertas/${offer.id}`}
                        className="hover:bg-accent/40 block rounded-xl border p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">Oferta #{offer.id}</p>
                            <p className="text-muted-foreground text-sm">
                              {offer.validUntil
                                ? `Validez: ${formatDateValue(offer.validUntil)}`
                                : 'Sin validez definida'}
                            </p>
                          </div>
                          <StatusPill
                            label={offerStatusLabels[offer.status] ?? offer.status}
                            status={offer.status}
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </CardContent>
    </>
  );

  return embedded ? (
    <Card className="flex h-full min-h-0 w-full max-w-none min-w-0 flex-1 basis-0 flex-col self-stretch overflow-hidden">
      {body}
      <CustomerEditDialog
        open={editCustomerOpen}
        onOpenChange={setEditCustomerOpen}
        customerId={customerId}
        initialCustomer={customer ?? null}
        onSaved={(updatedCustomer) => {
          refetchCustomer();
          if (updatedCustomer && typeof onCustomerUpdated === 'function')
            onCustomerUpdated(updatedCustomer);
        }}
      />
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
            <AlertDialogAction onClick={() => setResolveNextActionOpen(true)}>
              Sí, gestionar
            </AlertDialogAction>
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
                    <span className="text-muted-foreground mb-1 block text-xs font-medium tracking-[0.14em] uppercase">
                      Acción pendiente activa
                    </span>
                    <span className="text-foreground block font-semibold">
                      {formatDateValue(pendingPreflightData.pendingAction.scheduledAt)}
                    </span>
                    {pendingPreflightData.pendingAction.description && (
                      <span className="text-muted-foreground mt-0.5 block text-sm">
                        {pendingPreflightData.pendingAction.description}
                      </span>
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
      <CustomerEditDialog
        open={editCustomerOpen}
        onOpenChange={setEditCustomerOpen}
        customerId={customerId}
        initialCustomer={customer ?? null}
        onSaved={(updatedCustomer) => {
          refetchCustomer();
          if (updatedCustomer && typeof onCustomerUpdated === 'function')
            onCustomerUpdated(updatedCustomer);
        }}
      />
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
            <AlertDialogAction onClick={() => setResolveNextActionOpen(true)}>
              Sí, gestionar
            </AlertDialogAction>
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
                    <span className="text-muted-foreground mb-1 block text-xs font-medium tracking-[0.14em] uppercase">
                      Acción pendiente activa
                    </span>
                    <span className="text-foreground block font-semibold">
                      {formatDateValue(pendingPreflightData.pendingAction.scheduledAt)}
                    </span>
                    {pendingPreflightData.pendingAction.description && (
                      <span className="text-muted-foreground mt-0.5 block text-sm">
                        {pendingPreflightData.pendingAction.description}
                      </span>
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
  return (
    <Card
      className={`focus-visible:ring-ring hover:bg-accent/50 w-full cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
        selected ? 'ring-primary ring-2 ring-offset-2' : ''
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
        <div className="w-full grow space-y-2 sm:space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-medium">{customer.name}</h3>
          </div>

          <div>
            <p className="text-muted-foreground truncate text-sm">
              {customer.country?.name ?? 'Sin país'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomersPageClient({ initialCustomerId = null }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [nameFilterDraft, setNameFilterDraft] = useState('');
  const [appliedNameFilter, setAppliedNameFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loadedCustomers, setLoadedCustomers] = useState([]);
  const searchParam = appliedNameFilter.trim() || undefined;
  const {
    data: customers,
    isLoading,
    meta,
  } = useCustomersList({
    page,
    perPage: CUSTOMERS_PER_PAGE,
    filters: searchParam ? { search: searchParam } : {},
  });
  const [selectedId, setSelectedId] = useState(initialCustomerId);
  const hasActiveSearch = Boolean(searchParam);

  useEffect(() => {
    if (nameFilterDraft.trim() !== '') return;
    if (appliedNameFilter === '') return;
    setAppliedNameFilter('');
  }, [nameFilterDraft, appliedNameFilter]);

  useEffect(() => {
    setLoadedCustomers([]);
    setPage(1);
  }, [searchParam]);

  useEffect(() => {
    setLoadedCustomers((prev) => {
      if (page === 1) return customers;
      const customerMap = new Map(customers.map((c) => [String(c.id), c]));
      const seen = new Set(prev.map((item) => String(item.id)));
      const next = prev.map((item) => customerMap.get(String(item.id)) ?? item);
      for (const item of customers) {
        if (!seen.has(String(item.id))) next.push(item);
      }
      return next;
    });
  }, [customers, page]);

  const orderedCustomers = useMemo(
    () =>
      [...loadedCustomers].sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''))),
    [loadedCustomers]
  );

  const customersLastPage = Math.max(1, meta?.last_page ?? 1);
  const isInitialLoading = isLoading && page === 1;
  const isLoadingMore = isLoading && page > 1;
  const canLoadMore = page < customersLastPage && !isLoading;

  useEffect(() => {
    if (isMobile || !selectedId) return;

    const selectedCustomerStillVisible = orderedCustomers.some(
      (customer) => String(customer.id) === String(selectedId)
    );
    if (!selectedCustomerStillVisible) {
      setSelectedId(null);
    }
  }, [orderedCustomers, isMobile, selectedId]);

  const handleSelect = (customerId) => {
    setSelectedId(customerId);
    if (isMobile) {
      router.push(`/comercial/clientes/${customerId}`);
    }
  };

  const applyNameFilter = () => {
    setAppliedNameFilter(nameFilterDraft.trim());
  };

  const handleCustomersScroll = (event) => {
    if (!canLoadMore) return;
    const el = event.currentTarget;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining < INFINITE_SCROLL_THRESHOLD_PX) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-4 overflow-hidden px-4 py-3 md:px-6">
      <div>
        <h1 className="text-3xl font-light">Mis clientes</h1>
        <p className="text-muted-foreground text-sm">
          Solo lectura sobre clientes asignados y seguimiento CRM.
        </p>
      </div>

      <InputGroup className="w-full md:max-w-md">
        <InputGroupInput
          value={nameFilterDraft}
          onChange={(event) => setNameFilterDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              applyNameFilter();
            }
          }}
          placeholder="Buscar por nombre de cliente…"
          aria-label="Buscar clientes por nombre"
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

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden md:grid-cols-[360px_minmax(0,1fr)]">
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          {isInitialLoading ? (
            <div className="flex h-full min-h-0 w-full items-center justify-center p-4">
              <Loader />
            </div>
          ) : orderedCustomers.length === 0 ? (
            <div className="flex h-full min-h-0 w-full overflow-y-auto p-4">
              <EmptyState
                title={hasActiveSearch ? 'No hay resultados' : 'Aún no tienes clientes asignados'}
                description={
                  hasActiveSearch
                    ? 'Prueba con otro nombre o limpia el filtro de búsqueda.'
                    : 'Cuando existan clientes vinculados a tu comercial aparecerán aquí.'
                }
                className="bg-muted/20 h-full min-h-0! w-full border"
              />
            </div>
          ) : (
            <div
              className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
              onScroll={handleCustomersScroll}
            >
              {orderedCustomers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  selected={!isMobile && String(selectedId) === String(customer.id)}
                  onClick={() => handleSelect(customer.id)}
                />
              ))}

              {isLoadingMore ? (
                <div className="text-muted-foreground flex items-center justify-center py-2 text-sm">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando más clientes...
                </div>
              ) : null}

              {!canLoadMore && orderedCustomers.length > 0 ? (
                <p className="text-muted-foreground py-2 text-center text-xs">
                  No hay más clientes para mostrar.
                </p>
              ) : null}
            </div>
          )}
        </div>

        {!isMobile &&
          (selectedId ? (
            <CustomerDetail
              customerId={selectedId}
              embedded
              onCustomerUpdated={(updatedCustomer) => {
                setLoadedCustomers((prev) =>
                  prev.map((item) =>
                    String(item.id) === String(updatedCustomer.id)
                      ? { ...item, ...updatedCustomer }
                      : item
                  )
                );
                const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
                queryClient.invalidateQueries({ queryKey: customerListKeys.listPrefix(tenantId) });
              }}
            />
          ) : (
            <EmptyState
              title="Selecciona un cliente"
              description="El panel derecho mostrará sus pedidos, ofertas e interacciones."
              className="bg-muted/20 min-h-[360px] w-full min-w-0 border"
            />
          ))}
      </div>
    </div>
  );
}

export function StandaloneCustomerDetail({ customerId }) {
  return <CustomerDetail customerId={customerId} />;
}
