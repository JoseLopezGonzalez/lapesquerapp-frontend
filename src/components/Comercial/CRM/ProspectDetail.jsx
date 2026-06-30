'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  CircleDot,
  MoreVertical,
  Pencil,
  UserPlus,
  Trash2,
  Plus,
  UserRound,
  FilePlus,
  CalendarClock,
  Globe,
  ExternalLink,
  Loader2,
  Tag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ProspectContactFormDialog from './ProspectContactFormDialog';
import ConvertProspectDialog from './ConvertProspectDialog';
import { useProspectCategoryOptions } from '@/hooks/useProspectCategories';

const CATEGORY_NONE_VALUE = '__none__';

const interactionTypeIcons = {
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  visit: MapPin,
  other: CircleDot,
};

function SectionEmpty({ title, description }) {
  return (
    <EmptyState
      title={title}
      description={description}
      className="bg-muted/20 h-full !min-h-0 w-full border"
    />
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
  const {
    data: interactions,
    isLoading: interactionsLoading,
    meta: interactionsMeta,
  } = useCommercialInteractions({
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
  const { data: categoryOptions = [], isLoading: categoriesLoading } =
    useProspectCategoryOptions(true);
  const [isCategoryUpdating, setIsCategoryUpdating] = useState(false);
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
    setEditingContactId(null);
    setContactFormOpen(false);
    setInteractionsPage(1);
    setLoadedInteractions([]);
  }, [prospectId]);

  useEffect(() => {
    if (!shouldLoadInteractions) return;
    setLoadedInteractions((prev) => {
      if (interactionsPage === 1) {
        const sameLength = prev.length === interactions.length;
        const sameOrder = sameLength
          ? prev.every((item, index) => String(item?.id) === String(interactions[index]?.id))
          : false;
        return sameOrder ? prev : interactions;
      }
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

  const editingContact = useMemo(() => {
    if (editingContactId == null) return null;
    return contacts.find((contact) => String(contact.id) === String(editingContactId)) ?? null;
  }, [contacts, editingContactId]);

  const categorySelectOptions = useMemo(() => {
    const currentCategory = prospect?.category;
    if (!currentCategory?.id || !currentCategory?.name) return categoryOptions;
    const exists = categoryOptions.some(
      (option) => String(option.value) === String(currentCategory.id)
    );
    if (exists) return categoryOptions;
    return [{ value: currentCategory.id, label: currentCategory.name }, ...categoryOptions];
  }, [categoryOptions, prospect?.category]);

  const handleQuickCategoryChange = useCallback(
    async (value) => {
      if (!prospect || isCategoryUpdating) return;
      const currentCategoryId = prospect.category?.id ?? prospect.categoryId ?? null;
      const nextCategoryId = value === CATEGORY_NONE_VALUE ? null : Number(value);
      if (String(currentCategoryId ?? '') === String(nextCategoryId ?? '')) return;

      try {
        setIsCategoryUpdating(true);
        await notify.promise(
          updateProspect.mutateAsync({
            id: prospect.id,
            payload: {
              companyName: prospect.companyName,
              address: prospect.address ?? null,
              website: prospect.website ?? null,
              countryId: prospect.country?.id ?? prospect.countryId ?? null,
              categoryId: nextCategoryId,
              speciesInterest: prospect.speciesInterest ?? [],
              origin: prospect.origin ?? 'manual',
              status: prospect.status,
              notes: prospect.notes ?? null,
              commercialInterestNotes: prospect.commercialInterestNotes ?? null,
              nextActionAt: prospect.nextActionAt ?? null,
              nextActionNote: prospect.nextActionNote ?? null,
              lostReason: prospect.lostReason ?? null,
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
            loading: 'Actualizando categoría...',
            success: 'Categoría actualizada',
            error: (error) => error?.message || 'No se pudo actualizar la categoría',
          }
        );
      } catch {
        // notify.promise handles feedback
      } finally {
        setIsCategoryUpdating(false);
      }
    },
    [prospect, isCategoryUpdating, updateProspect]
  );

  const body = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      );
    }

    if (!prospect) {
      return (
        <div className="text-muted-foreground flex min-h-0 flex-1 items-center justify-center p-4 text-sm">
          No se ha encontrado el prospecto.
        </div>
      );
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
              <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
                <span>{prospect.country?.name ?? 'Sin país'}</span>
                <span aria-hidden>·</span>
                <span>{prospect.primaryContact?.name ?? 'Sin contacto principal'}</span>
              </div>
              <div className="pt-1">
                <Select
                  value={String(
                    prospect.category?.id ?? prospect.categoryId ?? CATEGORY_NONE_VALUE
                  )}
                  onValueChange={handleQuickCategoryChange}
                  disabled={categoriesLoading || isCategoryUpdating}
                >
                  <SelectTrigger className="h-7 w-[170px] text-xs">
                    <SelectValue placeholder={categoriesLoading ? 'Cargando…' : 'Sin categoría'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CATEGORY_NONE_VALUE}>Sin categoría</SelectItem>
                    {categorySelectOptions.map((option) => (
                      <SelectItem key={String(option.value)} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                    <DropdownMenuItem variant="destructive" onClick={() => setDiscardOpen(true)}>
                      <Trash2 />
                      Descartar prospecto
                    </DropdownMenuItem>
                  )}
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
              <TabsTrigger value="contacts">Contactos</TabsTrigger>
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
                              <StatusPill
                                label={prospectStatusLabels[prospect.status] ?? prospect.status}
                                status={prospect.status}
                              />
                              <span className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
                                Ficha comercial
                              </span>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-sm">
                                Lectura rápida del prospecto para decidir el siguiente movimiento
                                comercial.
                              </p>
                            </div>
                          </div>

                          <div className="overflow-hidden rounded-xl border">
                            <div className="grid divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                              <div className="flex items-start gap-3 px-4 py-3">
                                <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                                  <UserRound className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-muted-foreground text-xs">Origen</p>
                                  <p className="text-foreground mt-1 text-sm font-medium">
                                    {originLabel}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 px-4 py-3">
                                <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                                  <MapPin className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-muted-foreground text-xs">País</p>
                                  <p className="text-foreground mt-1 text-sm font-medium">
                                    {prospect.country?.name ?? 'Sin país'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 px-4 py-3">
                                <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                                  <Tag className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-muted-foreground text-xs">Categoría</p>
                                  <p className="text-foreground mt-1 text-sm font-medium">
                                    {prospect.category?.name ?? '-'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 px-4 py-3">
                                <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                                  <UserPlus className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-muted-foreground text-xs">
                                    {prospect.primaryContact?.role?.trim()
                                      ? prospect.primaryContact.role
                                      : 'Contacto principal'}
                                  </p>
                                  <p className="text-foreground mt-1 text-sm font-medium">
                                    {prospect.primaryContact?.name ?? '-'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="divide-y border-t">
                              <div className="flex items-start gap-3 px-4 py-3">
                                <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                                  <Globe className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-muted-foreground text-xs">Sitio web</p>
                                  <div className="mt-1 text-sm">
                                    {websiteTrim ? (
                                      websiteHref ? (
                                        <a
                                          href={websiteHref}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary font-medium break-all underline-offset-4 hover:underline"
                                        >
                                          {websiteTrim}
                                        </a>
                                      ) : (
                                        <span className="text-foreground break-all whitespace-pre-wrap">
                                          {websiteTrim}
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-muted-foreground">Sin sitio web</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 px-4 py-3">
                                <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                                  <MapPin className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-muted-foreground text-xs">Dirección</p>
                                  <p className="text-foreground mt-1 text-sm leading-6 whitespace-pre-wrap">
                                    {prospect.address?.trim() ? (
                                      prospect.address
                                    ) : (
                                      <span className="text-muted-foreground">Sin dirección</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <section className="bg-muted/15 overflow-hidden border-t lg:border-t-0 lg:border-l">
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
                                  <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                                    Próxima acción
                                  </p>
                                  <h3 className="text-foreground text-lg font-semibold tracking-tight">
                                    {hasPendingAction
                                      ? formatDateValue(pendingAction.scheduledAt)
                                      : 'Sin agenda activa'}
                                  </h3>
                                </div>
                              </div>
                              <p className="text-foreground text-sm leading-7 break-words whitespace-pre-wrap">
                                {pendingAction?.description?.trim()
                                  ? pendingAction.description
                                  : 'Todavía no hay una próxima acción registrada para este prospecto. Cuando definas el siguiente paso comercial, aparecerá aquí como referencia clara para el seguimiento.'}
                              </p>
                            </div>
                          </section>
                        );
                      })()}

                      <div className="space-y-4">
                        <section className="bg-card rounded-2xl border p-5">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <p className="text-muted-foreground text-[11px] font-medium tracking-[0.18em] uppercase">
                                Resumen comercial
                              </p>
                              <h3 className="text-foreground text-lg font-semibold tracking-tight">
                                Interés y encaje del prospecto
                              </h3>
                            </div>
                            <p className="text-foreground text-sm leading-7 whitespace-pre-wrap">
                              {prospect.commercialInterestNotes || (
                                <span className="text-muted-foreground">
                                  Todavía no hay contexto comercial registrado para este prospecto.
                                </span>
                              )}
                            </p>
                          </div>
                        </section>

                        <section className="bg-card rounded-2xl border p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                                Especies de interés
                              </p>
                            </div>
                            {prospect.speciesInterest?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {prospect.speciesInterest.map((species) => (
                                  <span
                                    key={species}
                                    className="border-primary/15 bg-primary/8 text-primary inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
                                  >
                                    {species}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-sm">
                                Sin especies definidas
                              </p>
                            )}
                          </div>
                        </section>

                        <section className="bg-muted/25 rounded-2xl border p-4">
                          <div className="space-y-2">
                            <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                              Notas internas
                            </p>
                            <p className="text-muted-foreground text-sm leading-6 whitespace-pre-wrap">
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

            <TabsContent
              value="contacts"
              className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col pt-1"
            >
              <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border">
                {contactsLoading ? (
                  <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {contacts.length === 0 ? (
                      contactFormOpen ? null : (
                        <SectionEmpty
                          title="Sin contactos"
                          description="Añade al menos un contacto para convertir o ofertar con contexto."
                        />
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
                                <TableCell className="text-muted-foreground">
                                  {contact.role || '—'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {contact.phone || '—'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {contact.email || '—'}
                                </TableCell>
                                <TableCell>
                                  {contact.isPrimary ? (
                                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
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
                                              error: (error) =>
                                                error?.message || 'No se pudo eliminar el contacto',
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

            <TabsContent
              value="interactions"
              className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col pt-1"
            >
              <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border">
                {interactionsLoading && interactionsPage === 1 ? (
                  <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : loadedInteractions.length === 0 ? (
                  <div className="min-h-0 flex-1 p-4">
                    <SectionEmpty
                      title="Sin interacciones"
                      description="Registra seguimiento para alimentar la agenda comercial."
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

                          return (
                            <div key={interaction.id} className="flex items-stretch gap-2">
                              <div className="flex w-6 shrink-0 flex-col items-center self-stretch">
                                <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full border-0 shadow-sm">
                                  <TypeIcon className="size-3 stroke-[2]" />
                                </div>
                                {!isLast && (
                                  <div
                                    className="bg-muted-foreground/50 mt-1 min-h-0 w-0.5 flex-1"
                                    aria-hidden
                                  />
                                )}
                              </div>

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
                                  </div>
                                </div>

                                <div className="bg-card mt-2 space-y-3 rounded-xl border p-3">
                                  <p className="text-foreground text-sm leading-snug break-words whitespace-pre-wrap">
                                    {interaction.summary}
                                  </p>
                                  {interaction.nextActionAt && (
                                    <div className="border-border/60 space-y-1 border-t pt-2">
                                      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                        <CalendarClock className="size-3 shrink-0" />
                                        <span>
                                          Próxima acción:{' '}
                                          {formatDateValue(interaction.nextActionAt)}
                                        </span>
                                      </p>
                                      {interaction.nextActionNote && (
                                        <p className="text-muted-foreground pl-4 text-xs break-words whitespace-pre-wrap">
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
                {offersLoading ? (
                  <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                ) : offers.length === 0 ? (
                  <div className="min-h-0 flex-1 p-4">
                    <SectionEmpty
                      title="Sin ofertas"
                      description="Crea la primera oferta desde esta ficha para pasar el prospecto a oferta enviada."
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
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">Oferta #{offer.id}</p>
                              <p className="text-muted-foreground text-sm">
                                {offer.validUntil
                                  ? `Validez: ${formatDateValue(offer.validUntil)}`
                                  : 'Sin fecha de validez'}
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
    isCategoryUpdating,
    interactionsPage,
    handleInteractionsScroll,
    handleQuickCategoryChange,
    isLoading,
    offers,
    offersLoading,
    prospect,
    categorySelectOptions,
    categoriesLoading,
  ]);

  return (
    <>
      <Card className="flex h-full min-h-0 w-full max-w-none min-w-0 flex-1 basis-0 flex-col self-stretch overflow-hidden">
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
