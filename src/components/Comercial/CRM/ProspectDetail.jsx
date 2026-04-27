'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Phone, Mail, MessageCircle, MapPin, CircleDot, MoreVertical, Pencil, UserPlus, Trash2, Plus, UserRound, FilePlus, CalendarClock, Globe, ExternalLink, Loader2, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useProspect, useProspectContacts, useProspectMutations } from '@/hooks/useProspects';
import { usePendingAgendaAction } from '@/hooks/useAgenda';
import { useCommercialInteractions } from '@/hooks/useCommercialInteractions';
import { useOffersList } from '@/hooks/useOffers';
import ProspectFormSheet from './ProspectFormSheet';
import QuickInteractionModal from './QuickInteractionModal';
import ResolveNextActionDialog from './ResolveNextActionDialog';
import StatusPill from './StatusPill';
import ProspectLocationMap from './ProspectLocationMap';
import {
  formatDateTimeValue,
  formatDateValue,
  interactionResultLabels,
  interactionTypeLabels,
  offerStatusLabels,
  prospectOriginOptions,
  prospectStatusLabels,
  prospectWebsiteToHref,
} from './utils';
import { notify } from '@/lib/notifications';
import Loader from '@/components/Utilities/Loader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ProspectContactFormDialog from './ProspectContactFormDialog';
import ConvertProspectDialog from './ConvertProspectDialog';

const interactionTypeIcons = {
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  visit: MapPin,
  other: CircleDot,
};

function SectionEmpty({ title, description }) {
  return (
    <EmptyState title={title} description={description} className="h-full w-full border bg-muted/20 !min-h-0" />
  );
}

export default function ProspectDetail({ prospectId, embedded = false }) {
  const [activeTab, setActiveTab] = useState('data');
  const shouldLoadContacts = activeTab === 'contacts';
  const shouldLoadInteractions = activeTab === 'interactions';
  const shouldLoadOffers = activeTab === 'offers';
  const { data: prospect, isLoading } = useProspect(prospectId);
  const { data: contacts, isLoading: contactsLoading } = useProspectContacts(prospectId, {
    enabled: shouldLoadContacts,
  });
  const [interactionsPage, setInteractionsPage] = useState(1);
  const [loadedInteractions, setLoadedInteractions] = useState([]);
  const { data: interactions, isLoading: interactionsLoading, meta: interactionsMeta } = useCommercialInteractions({
    prospectId,
    perPage: 20,
    page: interactionsPage,
    enabled: shouldLoadInteractions,
  });
  const { data: offers, isLoading: offersLoading } = useOffersList({
    prospectId,
    perPage: 50,
    enabled: shouldLoadOffers,
  });
  const { updateProspect, deleteContact } = useProspectMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [interactionOpen, setInteractionOpen] = useState(false);
  const [interactionMode, setInteractionMode] = useState('create');
  const [interactionAgendaActionId, setInteractionAgendaActionId] = useState(null);
  const [interactionNextActionDate, setInteractionNextActionDate] = useState(null);
  const [interactionNextActionNote, setInteractionNextActionNote] = useState('');
  const [resolveNextActionOpen, setResolveNextActionOpen] = useState(false);
  const [postInteractionPromptOpen, setPostInteractionPromptOpen] = useState(false);
  const [preflightDialogOpen, setPreflightDialogOpen] = useState(false);
  const [lastInteractionId, setLastInteractionId] = useState(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [editingContactId, setEditingContactId] = useState(null);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const { data: pendingPreflightData, refetch: refetchPendingPreflight } = usePendingAgendaAction(
    'prospect',
    prospect?.id ?? prospectId,
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
    setEditingContactId(null);
    setContactFormOpen(false);
    setInteractionsPage(1);
    setLoadedInteractions([]);
  }, [prospectId]);

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

  const handleInteractionsScroll = useCallback((event) => {
    if (!canLoadMoreInteractions) return;
    const el = event.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 180) {
      setInteractionsPage((prev) => prev + 1);
    }
  }, [canLoadMoreInteractions]);

  const editingContact = useMemo(() => {
    if (editingContactId == null) return null;
    return contacts.find((contact) => String(contact.id) === String(editingContactId)) ?? null;
  }, [contacts, editingContactId]);

  const body = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Loader />
        </div>
      );
    }

    if (!prospect) {
      return <div className="flex min-h-0 flex-1 items-center justify-center p-4 text-sm text-muted-foreground">No se ha encontrado el prospecto.</div>;
    }

    const originLabel =
      prospectOriginOptions.find((option) => option.value === prospect.origin)?.label ??
      (prospect.origin ? String(prospect.origin) : 'Sin origen');

    const websiteTrim = prospect.website?.trim() ?? '';
    const websiteHref = websiteTrim ? prospectWebsiteToHref(websiteTrim) : null;

    const orderedContacts = [...contacts].sort((a, b) => {
      const primaryDiff = Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary));
      if (primaryDiff !== 0) return primaryDiff;
      return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'es');
    });

    return (
      <>
        <CardHeader className="w-full min-w-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{prospect.companyName}</CardTitle>
                  {!embedded && (
                    <StatusPill
                      label={prospectStatusLabels[prospect.status] ?? prospect.status}
                      status={prospect.status}
                    />
                  )}
              </div>
              <p className="text-sm text-muted-foreground">
                {prospect.country?.name ?? 'Sin país'} · {prospect.category?.name ?? 'Sin categoría'} · {prospect.primaryContact?.name ?? 'Sin contacto principal'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {prospect.status === 'customer' && prospect.customerId && (
                <Button variant="outline" asChild>
                  <Link href={`/comercial/clientes/${prospect.customerId}`}>
                    <ExternalLink data-icon="inline-start" />
                    Ver ficha de cliente
                  </Link>
                </Button>
              )}
              <Button onClick={handleStartInteraction}>
                <Plus data-icon="inline-start" />
                Nueva interacción
              </Button>
              <Button variant="outline" onClick={() => setResolveNextActionOpen(true)}>
                Añadir próxima acción
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Acciones sobre el prospecto"
                    data-slot="button"
                  >
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil />
                    Editar prospecto
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab('contacts');
                      setEditingContactId(null);
                      setContactFormOpen(true);
                    }}
                  >
                    <UserRound />
                    Añadir contacto
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/comercial/ofertas/create?prospectId=${prospect.id}`}>
                      <FilePlus />
                      Nueva oferta
                    </Link>
                  </DropdownMenuItem>
                  {prospect.status !== 'customer' && (
                    <DropdownMenuItem onClick={() => setConvertDialogOpen(true)}>
                      <UserPlus />
                      Convertir a cliente
                    </DropdownMenuItem>
                  )}
                  {prospect.status !== 'discarded' && (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDiscardOpen(true)}
                    >
                      <Trash2 />
                      Descartar prospecto
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex w-full min-w-0 flex-1 min-h-0 flex-col py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full w-full min-w-0 flex-1 min-h-0 flex-col overflow-hidden">
            <TabsList>
              <TabsTrigger value="data">Datos</TabsTrigger>
              <TabsTrigger value="contacts">Contactos</TabsTrigger>
              <TabsTrigger value="interactions">Interacciones</TabsTrigger>
              <TabsTrigger value="offers">Ofertas</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="flex h-full w-full min-w-0 min-h-0 flex-1 flex-col pt-1">
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card">
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <div className="flex flex-col gap-4">
                    <div className="overflow-hidden rounded-2xl border bg-card">
                      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
                        <div className="space-y-5 p-5">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill label={prospectStatusLabels[prospect.status] ?? prospect.status} status={prospect.status} />
                              <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Ficha comercial</span>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Lectura rápida del prospecto para decidir el siguiente movimiento comercial.</p>
                            </div>
                          </div>

                          <div className="overflow-hidden rounded-xl border">
                            <div className="grid divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                              <div className="flex items-start gap-3 px-4 py-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <UserRound className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground">Origen</p>
                                  <p className="mt-1 text-sm font-medium text-foreground">{originLabel}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 px-4 py-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <MapPin className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground">País</p>
                                  <p className="mt-1 text-sm font-medium text-foreground">{prospect.country?.name ?? 'Sin país'}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 px-4 py-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <Tag className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground">Categoría</p>
                                  <p className="mt-1 text-sm font-medium text-foreground">{prospect.category?.name ?? '-'}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 px-4 py-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <UserPlus className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground">
                                    {prospect.primaryContact?.role?.trim() ? prospect.primaryContact.role : 'Contacto principal'}
                                  </p>
                                  <p className="mt-1 text-sm font-medium text-foreground">{prospect.primaryContact?.name ?? '-'}</p>
                                </div>
                              </div>
                            </div>

                            <div className="divide-y border-t">
                              <div className="flex items-start gap-3 px-4 py-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <Globe className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground">Sitio web</p>
                                  <div className="mt-1 text-sm">
                                    {websiteTrim ? (
                                      websiteHref ? (
                                        <a
                                          href={websiteHref}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-medium text-primary underline-offset-4 hover:underline break-all"
                                        >
                                          {websiteTrim}
                                        </a>
                                      ) : (
                                        <span className="break-all whitespace-pre-wrap text-foreground">{websiteTrim}</span>
                                      )
                                    ) : (
                                      <span className="text-muted-foreground">Sin sitio web</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 px-4 py-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <MapPin className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground">Dirección</p>
                                  <p className="mt-1 text-sm leading-6 whitespace-pre-wrap text-foreground">
                                    {prospect.address?.trim() ? prospect.address : <span className="text-muted-foreground">Sin dirección</span>}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <section className="overflow-hidden border-t bg-muted/15 lg:border-t-0 lg:border-l">
                          <ProspectLocationMap
                            address={prospect.address}
                            companyName={prospect.companyName}
                          />
                        </section>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
                      {(() => {
                        const pendingAction = pendingPreflightData?.pendingAction ?? null;
                        const hasPendingAction = Boolean(pendingAction);
                        return (
                          <section
                            className={`rounded-2xl border p-5 ${
                              hasPendingAction
                                ? 'border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/10'
                                : 'bg-card'
                            }`}
                          >
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                                    hasPendingAction
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  <CalendarClock className="size-5" />
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Próxima acción</p>
                                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                                    {hasPendingAction ? formatDateValue(pendingAction.scheduledAt) : 'Sin agenda activa'}
                                  </h3>
                                </div>
                              </div>
                              <p className="text-sm leading-7 whitespace-pre-wrap break-words text-foreground">
                                {pendingAction?.description?.trim()
                                  ? pendingAction.description
                                  : 'Todavía no hay una próxima acción registrada para este prospecto. Cuando definas el siguiente paso comercial, aparecerá aquí como referencia clara para el seguimiento.'}
                              </p>
                            </div>
                          </section>
                        );
                      })()}

                      <div className="space-y-4">
                        <section className="rounded-2xl border bg-card p-5">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Resumen comercial</p>
                              <h3 className="text-lg font-semibold tracking-tight text-foreground">Interés y encaje del prospecto</h3>
                            </div>
                            <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">
                              {prospect.commercialInterestNotes || (
                                <span className="text-muted-foreground">Todavía no hay contexto comercial registrado para este prospecto.</span>
                              )}
                            </p>
                          </div>
                        </section>

                        <section className="rounded-2xl border bg-card p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Especies de interés</p>
                            </div>
                            {prospect.speciesInterest?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {prospect.speciesInterest.map((species) => (
                                  <span
                                    key={species}
                                    className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary"
                                  >
                                    {species}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Sin especies definidas</p>
                            )}
                          </div>
                        </section>

                        <section className="rounded-2xl border bg-muted/25 p-4">
                          <div className="space-y-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Notas internas</p>
                            <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                              {prospect.notes || 'Sin notas internas'}
                            </p>
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="contacts" className="flex h-full w-full min-w-0 min-h-0 flex-1 flex-col pt-1">
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card">
                {contactsLoading ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center">
                    <Loader />
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {contacts.length === 0 ? (
                      contactFormOpen ? null : (
                        <SectionEmpty title="Sin contactos" description="Añade al menos un contacto para convertir o ofertar con contexto." />
                      )
                    ) : (
                      <div className="overflow-hidden rounded-xl border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Cargo</TableHead>
                              <TableHead>Teléfono</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead className="w-24">Principal</TableHead>
                              <TableHead className="w-[1%] text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orderedContacts.map((contact) => (
                              <TableRow key={contact.id}>
                                <TableCell className="font-medium">{contact.name}</TableCell>
                                <TableCell className="text-muted-foreground">{contact.role || '—'}</TableCell>
                                <TableCell className="text-muted-foreground">{contact.phone || '—'}</TableCell>
                                <TableCell className="text-muted-foreground">{contact.email || '—'}</TableCell>
                                <TableCell>
                                  {contact.isPrimary ? (
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                      Principal
                                    </span>
                                  ) : (
                                    '—'
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="outline"
                                      size="icon-sm"
                                      aria-label="Editar contacto"
                                      onClick={() => {
                                        setEditingContactId(contact.id);
                                        setContactFormOpen(true);
                                      }}
                                    >
                                      <Pencil />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="icon-sm"
                                      aria-label="Eliminar contacto"
                                      onClick={async () => {
                                        try {
                                          await notify.promise(
                                            deleteContact.mutateAsync({
                                              prospectId: prospect.id,
                                              contactId: contact.id,
                                            }),
                                            {
                                              loading: 'Eliminando contacto...',
                                              success: 'Contacto eliminado',
                                              error: (error) => error?.message || 'No se pudo eliminar el contacto',
                                            }
                                          );
                                          if (String(editingContactId) === String(contact.id)) {
                                            setEditingContactId(null);
                                          }
                                        } catch {}
                                      }}
                                    >
                                      <Trash2 />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </TabsContent>

            <TabsContent value="interactions" className="flex h-full w-full min-w-0 min-h-0 flex-1 flex-col pt-1">
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card">
                {interactionsLoading && interactionsPage === 1 ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center">
                    <Loader />
                  </div>
                ) : loadedInteractions.length === 0 ? (
                  <div className="min-h-0 flex-1 p-4">
                    <SectionEmpty
                      title="Sin interacciones"
                      description="Registra seguimiento para alimentar la agenda comercial."
                    />
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto p-4" onScroll={handleInteractionsScroll}>
                    <div className="space-y-4">
                      <div className="relative w-full space-y-4 py-2 pl-1">
                        {loadedInteractions.map((interaction, index, array) => {
                            const isLast = index === array.length - 1;
                            const typeLabel = interactionTypeLabels[interaction.type] ?? interaction.type;
                            const resultLabel = interactionResultLabels[interaction.result] ?? interaction.result;
                            const TypeIcon = interactionTypeIcons[interaction.type] ?? CircleDot;

                            return (
                              <div key={interaction.id} className="flex items-stretch gap-2">
                                <div className="flex w-6 shrink-0 flex-col items-center self-stretch">
                                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full border-0 bg-primary text-primary-foreground shadow-sm">
                                    <TypeIcon className="size-3 stroke-[2]" />
                                  </div>
                                  {!isLast && <div className="mt-1 min-h-0 flex-1 w-0.5 bg-muted-foreground/50" aria-hidden />}
                                </div>

                                <div className={`min-w-0 flex-1 ${!isLast ? 'pb-4' : ''}`}>
                                  <div className="flex flex-col gap-0.5">
                                    <p className="text-xs font-normal text-muted-foreground">
                                      {formatDateTimeValue(interaction.occurredAt)}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="truncate text-sm font-semibold leading-tight text-foreground">
                                        {typeLabel}
                                      </span>
                                      <StatusPill label={resultLabel} status={interaction.result} />
                                    </div>
                                  </div>

                                  <div className="mt-2 space-y-3 rounded-xl border bg-card p-3">
                                    <p className="text-sm leading-snug whitespace-pre-wrap break-words text-foreground">
                                      {interaction.summary}
                                    </p>
                                    {interaction.nextActionAt && (
                                      <div className="space-y-1 border-t border-border/60 pt-2">
                                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                          <CalendarClock className="size-3 shrink-0" />
                                          <span>Próxima acción: {formatDateValue(interaction.nextActionAt)}</span>
                                        </p>
                                        {interaction.nextActionNote && (
                                          <p className="whitespace-pre-wrap break-words pl-4 text-xs text-muted-foreground">
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
                      <div className="flex items-center justify-center py-4 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                      </div>
                    )}
                  </div>
                )}
              </section>
            </TabsContent>

            <TabsContent value="offers" className="flex h-full w-full min-w-0 min-h-0 flex-1 flex-col pt-1">
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card">
                {offersLoading ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center">
                    <Loader />
                  </div>
                ) : offers.length === 0 ? (
                  <div className="min-h-0 flex-1 p-4">
                    <SectionEmpty title="Sin ofertas" description="Crea la primera oferta desde esta ficha para pasar el prospecto a oferta enviada." />
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <div className="space-y-3">
                      {offers.map((offer) => (
                        <Link key={offer.id} href={`/comercial/ofertas/${offer.id}`} className="block rounded-xl border p-4 hover:bg-accent/40">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">Oferta #{offer.id}</p>
                              <p className="text-sm text-muted-foreground">
                                {offer.validUntil ? `Validez: ${formatDateValue(offer.validUntil)}` : 'Sin fecha de validez'}
                              </p>
                            </div>
                            <StatusPill label={offerStatusLabels[offer.status] ?? offer.status} status={offer.status} />
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
  }, [
    activeTab,
    contacts,
    contactsLoading,
    contactFormOpen,
    deleteContact,
    editingContactId,
    embedded,
    loadedInteractions,
    interactionsLoading,
    interactionsPage,
    handleInteractionsScroll,
    isLoading,
    offers,
    offersLoading,
    prospect,
  ]);

  return (
    <>
      <Card className="flex h-full w-full max-w-none min-h-0 min-w-0 flex-1 basis-0 self-stretch flex-col overflow-hidden">
        {body}
      </Card>

      <ProspectFormSheet open={editOpen} onOpenChange={setEditOpen} initialData={prospect} />
      <QuickInteractionModal
        open={interactionOpen}
        onOpenChange={setInteractionOpen}
        prospectId={prospect?.id ?? prospectId}
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
        targetType="prospect"
        targetId={prospect?.id ?? prospectId}
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
            <AlertDialogAction
              onClick={() => {
                setResolveNextActionOpen(true);
              }}
            >
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
                    <span className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground mb-1">Acción pendiente activa</span>
                    <span className="block font-semibold text-foreground">{formatDateValue(pendingPreflightData.pendingAction.scheduledAt)}</span>
                    {pendingPreflightData.pendingAction.description && (
                      <span className="block mt-0.5 text-sm text-muted-foreground">{pendingPreflightData.pendingAction.description}</span>
                    )}
                  </>
                ) : (
                  'Este prospecto ya tiene una acción pendiente activa.'
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
      <ProspectContactFormDialog
        open={contactFormOpen}
        onOpenChange={(open) => {
          setContactFormOpen(open);
          if (!open) setEditingContactId(null);
        }}
        prospectId={prospect?.id ?? prospectId}
        contact={editingContact}
      />

      <ConvertProspectDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        prospect={prospect}
      />

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar prospecto</AlertDialogTitle>
            <AlertDialogDescription>
              Este cambio requiere motivo de descarte. Podrás reactivarlo después como seguimiento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="lost-reason">Motivo</Label>
            <Input
              id="lost-reason"
              value={lostReason}
              onChange={(event) => setLostReason(event.target.value)}
              placeholder="Cliente pospone compra, fuera de mercado, sin interés..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                if (!lostReason.trim()) {
                  notify.error({ title: 'Indica el motivo de descarte' });
                  return;
                }
                try {
                  await notify.promise(
                    updateProspect.mutateAsync({
                      id: prospect.id,
                      payload: {
                        companyName: prospect.companyName,
                        countryId: prospect.country?.id ?? prospect.countryId ?? null,
                        speciesInterest: prospect.speciesInterest ?? [],
                        origin: prospect.origin,
                        status: 'discarded',
                        notes: prospect.notes ?? null,
                        commercialInterestNotes: prospect.commercialInterestNotes ?? null,
                        nextActionAt: prospect.nextActionAt ?? null,
                        nextActionNote: prospect.nextActionNote ?? null,
                        lostReason: lostReason.trim(),
                        primaryContact: prospect.primaryContact
                          ? {
                              name: prospect.primaryContact.name,
                              role: prospect.primaryContact.role ?? null,
                              phone: prospect.primaryContact.phone ?? null,
                              email: prospect.primaryContact.email ?? null,
                            }
                          : null,
                      },
                    }),
                    {
                      loading: 'Actualizando prospecto...',
                      success: 'Prospecto descartado',
                      error: (error) => error?.message || 'No se pudo descartar el prospecto',
                    }
                  );
                  setDiscardOpen(false);
                  setLostReason('');
                } catch {}
              }}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
