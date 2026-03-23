'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Phone, Mail, MessageCircle, MapPin, CircleDot, MoreVertical, Pencil, UserPlus, Trash2, Plus, UserRound, FilePlus, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useProspect, useProspectContacts, useProspectMutations } from '@/hooks/useProspects';
import { useCommercialInteractions } from '@/hooks/useCommercialInteractions';
import { useOffersList } from '@/hooks/useOffers';
import ProspectFormSheet from './ProspectFormSheet';
import QuickInteractionModal from './QuickInteractionModal';
import StatusPill from './StatusPill';
import { formatDateTimeValue, formatDateValue, interactionResultLabels, interactionTypeLabels, offerStatusLabels, prospectOriginOptions, prospectStatusLabels } from './utils';
import { notify } from '@/lib/notifications';
import Loader from '@/components/Utilities/Loader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const { data: interactions, isLoading: interactionsLoading } = useCommercialInteractions({
    prospectId,
    perPage: 50,
    enabled: shouldLoadInteractions,
  });
  const { data: offers, isLoading: offersLoading } = useOffersList({
    prospectId,
    perPage: 50,
    enabled: shouldLoadOffers,
  });
  const { convertProspect, updateProspect, createContact, updateContact, deleteContact } = useProspectMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [interactionOpen, setInteractionOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [contactDraft, setContactDraft] = useState({ name: '', role: '', phone: '', email: '', isPrimary: false });
  const [editingContactId, setEditingContactId] = useState(null);
  const [contactFormOpen, setContactFormOpen] = useState(false);

  useEffect(() => {
    setActiveTab('data');
    setEditingContactId(null);
    setContactDraft({ name: '', role: '', phone: '', email: '', isPrimary: false });
    setContactFormOpen(false);
  }, [prospectId]);

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
                {prospect.country?.name ?? 'Sin país'} · {prospect.primaryContact?.name ?? 'Sin contacto principal'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setInteractionOpen(true)}>
                <Plus data-icon="inline-start" />
                Nueva interacción
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
                      setContactDraft({ name: '', role: '', phone: '', email: '', isPrimary: false });
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
                  {prospect.status === 'offer_sent' && (
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          await notify.promise(convertProspect.mutateAsync(prospect.id), {
                            loading: 'Convirtiendo prospecto...',
                            success: 'Prospecto convertido en cliente',
                            error: (error) => error?.message || 'No se pudo convertir el prospecto',
                          });
                        } catch {}
                      }}
                    >
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

            <TabsContent value="data" className="flex h-full w-full min-w-0 min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Origen</p>
                  <p className="font-medium">{originLabel}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Próxima acción</p>
                  <p className="font-medium">{prospect.nextActionAt ? formatDateValue(prospect.nextActionAt) : 'Sin agenda'}{prospect.nextActionNote ? ` · ${prospect.nextActionNote}` : ''}</p>
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground mb-1">Especies de interés</p>
                <p>{prospect.speciesInterest?.length ? prospect.speciesInterest.join(', ') : 'Sin definir'}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground mb-1">Interés comercial</p>
                <p className="whitespace-pre-wrap">{prospect.commercialInterestNotes || 'Sin notas comerciales'}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground mb-1">Notas internas</p>
                <p className="whitespace-pre-wrap">{prospect.notes || 'Sin notas'}</p>
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="flex h-full w-full min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
              {contactsLoading ? (
                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <Loader />
                </div>
              ) : (
                <div className="mb-4 flex-1 min-h-0 overflow-y-auto">
                  {contacts.length === 0 ? (
                    contactFormOpen ? null : (
                      <SectionEmpty title="Sin contactos" description="Añade al menos un contacto para convertir o ofertar con contexto." />
                    )
                  ) : (
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
                                    setContactDraft({
                                      name: contact.name ?? '',
                                      role: contact.role ?? '',
                                      phone: contact.phone ?? '',
                                      email: contact.email ?? '',
                                      isPrimary: Boolean(contact.isPrimary),
                                    });
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
                                        setContactDraft({ name: '', role: '', phone: '', email: '', isPrimary: false });
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
                  )}
                </div>
              )}

            </TabsContent>

            <TabsContent value="interactions" className="flex h-full w-full min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
              {interactionsLoading ? (
                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <Loader />
                </div>
              ) : interactions.length === 0 ? (
                <SectionEmpty
                  title="Sin interacciones"
                  description="Registra seguimiento para alimentar la agenda comercial."
                />
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <div className="space-y-4">
                  <div className="relative w-full pl-1 py-2 space-y-4">
                    {interactions
                      .slice()
                      .sort((a, b) => (a.occurredAt && b.occurredAt ? b.occurredAt.localeCompare(a.occurredAt) : 0))
                      .map((interaction, index, array) => {
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
                              <p className="text-xs text-muted-foreground font-normal">
                                {formatDateTimeValue(interaction.occurredAt)}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold leading-tight text-foreground truncate">
                                  {typeLabel}
                                </span>
                                <StatusPill label={resultLabel} status={interaction.result} />
                              </div>
                            </div>

                            <div className="mt-2 rounded-xl border bg-card p-3 space-y-3">
                              <p className="text-sm text-foreground leading-snug">
                                {interaction.summary}
                              </p>
                              {interaction.nextActionAt && (
                                <div className="pt-2 border-t border-border/60 space-y-1">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <CalendarClock className="size-3 shrink-0" />
                                    <span>Próxima acción: {formatDateValue(interaction.nextActionAt)}</span>
                                  </p>
                                  {interaction.nextActionNote && (
                                    <p className="text-xs text-muted-foreground whitespace-pre-line pl-4">
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
                </div>
              )}
            </TabsContent>

            <TabsContent value="offers" className="flex h-full w-full min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
              {offersLoading ? (
                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <Loader />
                </div>
              ) : offers.length === 0 ? (
                <SectionEmpty title="Sin ofertas" description="Crea la primera oferta desde esta ficha para pasar el prospecto a oferta enviada." />
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
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
              )}
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
    convertProspect,
    deleteContact,
    editingContactId,
    embedded,
    interactions,
    interactionsLoading,
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
        defaultNextActionDate={prospect?.nextActionAt ?? null}
        defaultNextActionNote={prospect?.nextActionNote ?? ''}
      />

      <Dialog
        open={contactFormOpen}
        onOpenChange={(open) => {
          setContactFormOpen(open);
          if (!open) {
            setEditingContactId(null);
            setContactDraft({ name: '', role: '', phone: '', email: '', isPrimary: false });
          }
        }}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{editingContactId ? 'Editar contacto' : 'Añadir contacto'}</DialogTitle>
            <DialogDescription>
              Puedes registrar varios contactos. Solo uno quedará como principal.
            </DialogDescription>
          </DialogHeader>
          {prospect && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="contact-name">Nombre</Label>
                  <Input
                    id="contact-name"
                    value={contactDraft.name}
                    onChange={(event) => setContactDraft((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-role">Cargo</Label>
                  <Input
                    id="contact-role"
                    value={contactDraft.role}
                    onChange={(event) => setContactDraft((current) => ({ ...current, role: event.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-phone">Teléfono</Label>
                  <Input
                    id="contact-phone"
                    value={contactDraft.phone}
                    onChange={(event) => setContactDraft((current) => ({ ...current, phone: event.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    value={contactDraft.email}
                    onChange={(event) => setContactDraft((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={contactDraft.isPrimary}
                    onChange={(event) => setContactDraft((current) => ({ ...current, isPrimary: event.target.checked }))}
                  />
                  Marcar como principal
                </label>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingContactId(null);
                    setContactDraft({ name: '', role: '', phone: '', email: '', isPrimary: false });
                    setContactFormOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    if (!contactDraft.name.trim()) {
                      notify.error({ title: 'El nombre del contacto es obligatorio' });
                      return;
                    }
                    try {
                      const payload = {
                        name: contactDraft.name.trim(),
                        role: contactDraft.role.trim() || null,
                        phone: contactDraft.phone.trim() || null,
                        email: contactDraft.email.trim() || null,
                        isPrimary: contactDraft.isPrimary,
                      };
                      await notify.promise(
                        editingContactId
                          ? updateContact.mutateAsync({
                              prospectId: prospect.id,
                              contactId: editingContactId,
                              payload,
                            })
                          : createContact.mutateAsync({
                              prospectId: prospect.id,
                              payload,
                            }),
                        {
                          loading: editingContactId ? 'Actualizando contacto...' : 'Guardando contacto...',
                          success: editingContactId ? 'Contacto actualizado' : 'Contacto guardado',
                          error: (error) => error?.message || 'No se pudo guardar el contacto',
                        }
                      );
                      setContactDraft({ name: '', role: '', phone: '', email: '', isPrimary: false });
                      setEditingContactId(null);
                      setContactFormOpen(false);
                    } catch {}
                  }}
                >
                  {editingContactId ? 'Actualizar contacto' : 'Guardar contacto'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

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
