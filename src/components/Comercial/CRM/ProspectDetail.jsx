'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { useProspect, useProspectContacts, useProspectMutations } from '@/hooks/useProspects';
import { useCommercialInteractions } from '@/hooks/useCommercialInteractions';
import { useOffersList } from '@/hooks/useOffers';
import ProspectFormSheet from './ProspectFormSheet';
import QuickInteractionModal from './QuickInteractionModal';
import StatusPill from './StatusPill';
import { formatDateTimeValue, formatDateValue, interactionResultLabels, interactionTypeLabels, offerStatusLabels, prospectStatusLabels } from './utils';
import { notify } from '@/lib/notifications';

function SectionEmpty({ title, description }) {
  return (
    <Empty className="border bg-muted/20 min-h-[180px]">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default function ProspectDetail({ prospectId, embedded = false }) {
  const { data: prospect, isLoading } = useProspect(prospectId);
  const { data: contacts } = useProspectContacts(prospectId);
  const { data: interactions } = useCommercialInteractions({ prospectId, perPage: 50 });
  const { data: offers } = useOffersList({ prospectId, perPage: 50 });
  const { convertProspect, updateProspect, createContact, updateContact, deleteContact } = useProspectMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [interactionOpen, setInteractionOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [contactDraft, setContactDraft] = useState({ name: '', role: '', phone: '', email: '', isPrimary: false });
  const [editingContactId, setEditingContactId] = useState(null);

  const content = useMemo(() => {
    if (isLoading) {
      return <div className="p-4 text-sm text-muted-foreground">Cargando prospecto...</div>;
    }

    if (!prospect) {
      return <div className="p-4 text-sm text-muted-foreground">No se ha encontrado el prospecto.</div>;
    }

    return (
      <>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{prospect.companyName}</CardTitle>
                <StatusPill label={prospectStatusLabels[prospect.status] ?? prospect.status} status={prospect.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {prospect.country?.name ?? 'Sin país'} · {prospect.primaryContact?.name ?? 'Sin contacto principal'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Editar
              </Button>
              <Button variant="outline" onClick={() => setInteractionOpen(true)}>
                Nueva interacción
              </Button>
              {prospect.status === 'offer_sent' && (
                <Button
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
                  Convertir a cliente
                </Button>
              )}
              {prospect.status !== 'discarded' && (
                <Button variant="destructive" onClick={() => setDiscardOpen(true)}>
                  Descartar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-4">
          <Tabs defaultValue="data" className="w-full">
            <TabsList className="mb-4 flex w-full flex-wrap justify-start">
              <TabsTrigger value="data">Datos</TabsTrigger>
              <TabsTrigger value="contacts">Contactos</TabsTrigger>
              <TabsTrigger value="interactions">Interacciones</TabsTrigger>
              <TabsTrigger value="offers">Ofertas</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Origen</p>
                  <p className="font-medium">{prospect.origin}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Próxima acción</p>
                  <p className="font-medium">{prospect.nextActionAt ? formatDateValue(prospect.nextActionAt) : 'Sin agenda'}</p>
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

            <TabsContent value="contacts">
              <div className="mb-4 rounded-xl border p-4">
                <div className="mb-3">
                  <h3 className="font-medium">{editingContactId ? 'Editar contacto' : 'Añadir contacto'}</h3>
                  <p className="text-sm text-muted-foreground">Puedes registrar varios contactos. Solo uno quedará como principal.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="contact-name">Nombre</Label>
                    <Input id="contact-name" value={contactDraft.name} onChange={(event) => setContactDraft((current) => ({ ...current, name: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact-role">Cargo</Label>
                    <Input id="contact-role" value={contactDraft.role} onChange={(event) => setContactDraft((current) => ({ ...current, role: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact-phone">Teléfono</Label>
                    <Input id="contact-phone" value={contactDraft.phone} onChange={(event) => setContactDraft((current) => ({ ...current, phone: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input id="contact-email" value={contactDraft.email} onChange={(event) => setContactDraft((current) => ({ ...current, email: event.target.value }))} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={contactDraft.isPrimary}
                      onChange={(event) => setContactDraft((current) => ({ ...current, isPrimary: event.target.checked }))}
                    />
                    Marcar como principal
                  </label>
                  <Button
                    variant="outline"
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
                      } catch {}
                    }}
                  >
                    {editingContactId ? 'Actualizar contacto' : 'Guardar contacto'}
                  </Button>
                  {editingContactId && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingContactId(null);
                        setContactDraft({ name: '', role: '', phone: '', email: '', isPrimary: false });
                      }}
                    >
                      Cancelar edición
                    </Button>
                  )}
                </div>
              </div>
              {contacts.length === 0 ? (
                <SectionEmpty title="Sin contactos" description="Añade al menos un contacto para convertir o ofertar con contexto." />
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="rounded-xl border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{contact.name}</p>
                          {contact.isPrimary && (
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              Principal
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingContactId(contact.id);
                              setContactDraft({
                                name: contact.name ?? '',
                                role: contact.role ?? '',
                                phone: contact.phone ?? '',
                                email: contact.email ?? '',
                                isPrimary: Boolean(contact.isPrimary),
                              });
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
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
                            Eliminar
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{contact.role || 'Sin cargo'}</p>
                      <p className="text-sm">{contact.phone || 'Sin teléfono'} · {contact.email || 'Sin email'}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="interactions">
              <div className="mb-4 flex justify-end">
                <Button onClick={() => setInteractionOpen(true)}>Registrar interacción</Button>
              </div>
              {interactions.length === 0 ? (
                <SectionEmpty title="Sin interacciones" description="Registra seguimiento para alimentar la agenda del dashboard." />
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
                      {interaction.nextActionAt && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Próxima acción: {formatDateValue(interaction.nextActionAt)} {interaction.nextActionNote ? `· ${interaction.nextActionNote}` : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="offers">
              <div className="mb-4 flex justify-end">
                <Button asChild>
                  <Link href={`/comercial/ofertas/create?prospectId=${prospect.id}`}>Nueva oferta</Link>
                </Button>
              </div>
              {offers.length === 0 ? (
                <SectionEmpty title="Sin ofertas" description="Crea la primera oferta desde esta ficha para pasar el prospecto a oferta enviada." />
              ) : (
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
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </>
    );
  }, [contacts, convertProspect, createContact, deleteContact, editingContactId, interactions, isLoading, offers, prospect, updateContact, updateProspect, contactDraft]);

  return (
    <>
      <Card className="h-full overflow-hidden">
        {embedded ? <ScrollArea className="h-full">{content}</ScrollArea> : content}
      </Card>

      <ProspectFormSheet open={editOpen} onOpenChange={setEditOpen} initialData={prospect} />
      <QuickInteractionModal
        open={interactionOpen}
        onOpenChange={setInteractionOpen}
        prospectId={prospect?.id ?? prospectId}
        defaultNextActionDate={prospect?.nextActionAt ?? null}
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
