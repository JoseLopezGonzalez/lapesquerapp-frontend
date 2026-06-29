'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import {
  agendaKeys,
  crmDashboardKeys,
  prospectKeys,
} from '@/lib/routes/queryKeys';
import { crmService } from '@/services/crmService';
import type {
  ConvertToCustomerPayload,
  Prospect,
  ProspectContact,
  ProspectContactPayload,
  ProspectPayload,
} from '@/types/crm';

type UseProspectsListParams = Record<string, unknown> & {
  enabled?: boolean;
};

type ProspectListCache = { data?: Prospect[] } | undefined;
type ProspectDetailCache = { data?: Prospect } | undefined;
type ProspectContactsCache = { data?: ProspectContact[] } | undefined;
const EMPTY_PROSPECTS: Prospect[] = [];
const EMPTY_CONTACTS: ProspectContact[] = [];

function getPrimaryContact(contacts: ProspectContact[]) {
  return contacts.find((contact) => Boolean(contact.isPrimary)) ?? null;
}

function patchProspectPrimaryContact(
  currentProspect: Prospect | null | undefined,
  contacts: ProspectContact[]
): Prospect | null | undefined {
  if (!currentProspect) return currentProspect;
  return {
    ...currentProspect,
    primaryContact: getPrimaryContact(contacts),
  };
}

function patchProspectFromPayload(
  currentProspect: Prospect | null | undefined,
  payload: ProspectPayload
): Prospect | null | undefined {
  if (!currentProspect) return currentProspect;
  const currentPrimaryContact = currentProspect.primaryContact;
  return {
    ...currentProspect,
    companyName: payload.companyName ?? currentProspect.companyName,
    address: 'address' in payload ? (payload.address ?? null) : currentProspect.address,
    website: 'website' in payload ? (payload.website ?? null) : currentProspect.website,
    countryId: payload.countryId ?? currentProspect.countryId,
    categoryId: 'categoryId' in payload ? (payload.categoryId ?? null) : currentProspect.categoryId,
    category:
      'categoryId' in payload &&
      String(payload.categoryId ?? '') !== String(currentProspect.categoryId ?? '')
        ? null
        : currentProspect.category,
    speciesInterest: payload.speciesInterest ?? currentProspect.speciesInterest,
    origin: payload.origin ?? currentProspect.origin,
    status: payload.status ?? currentProspect.status,
    notes: payload.notes ?? currentProspect.notes,
    commercialInterestNotes:
      payload.commercialInterestNotes ?? currentProspect.commercialInterestNotes,
    nextActionAt: payload.nextActionAt ?? currentProspect.nextActionAt,
    nextActionNote: payload.nextActionNote ?? currentProspect.nextActionNote,
    lostReason: payload.lostReason ?? currentProspect.lostReason,
    primaryContact:
      payload.primaryContact && currentPrimaryContact
        ? {
            ...currentPrimaryContact,
            name: payload.primaryContact.name ?? currentPrimaryContact.name ?? '',
            role: payload.primaryContact.role ?? currentPrimaryContact.role ?? null,
            phone: payload.primaryContact.phone ?? currentPrimaryContact.phone ?? null,
            email: payload.primaryContact.email ?? currentPrimaryContact.email ?? null,
          }
        : currentProspect.primaryContact,
  };
}

function getTenantId() {
  return typeof window !== 'undefined' ? getCurrentTenant() : null;
}

export function useProspectsList(params: UseProspectsListParams = {}) {
  const { enabled = true, ...queryParams } = params;
  const tenantId = getTenantId();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: prospectKeys.list(tenantId, queryParams as Record<string, unknown>),
    queryFn: () => crmService.listProspects(queryParams),
    enabled: !!tenantId && enabled,
  });

  return {
    data: data?.data ?? EMPTY_PROSPECTS,
    meta: data?.meta ?? { current_page: 1, last_page: 1, per_page: 12, total: 0 },
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

export function useProspect(id: number | string | null | undefined) {
  const tenantId = getTenantId();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: prospectKeys.detail(tenantId, id),
    queryFn: () => {
      if (id == null) throw new Error('Missing prospect id');
      return crmService.getProspect(id);
    },
    enabled: !!tenantId && id != null,
  });

  return {
    data: data?.data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

export function useProspectContacts(
  id: number | string | null | undefined,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const tenantId = getTenantId();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: prospectKeys.contacts(tenantId, id),
    queryFn: () => {
      if (id == null) throw new Error('Missing prospect id');
      return crmService.listProspectContacts(id);
    },
    enabled: !!tenantId && id != null && enabled,
  });

  return {
    data: data?.data ?? EMPTY_CONTACTS,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

export function useProspectMutations() {
  const queryClient = useQueryClient();
  const tenantId = typeof window !== 'undefined' ? (getCurrentTenant() ?? 'unknown') : 'unknown';

  const invalidate = async ({
    id,
    includeProspectsList = true,
    includeDashboard = false,
    includeAgenda = false,
    includeAgendaSummary = false,
  }: {
    id?: number | string;
    includeProspectsList?: boolean;
    includeDashboard?: boolean;
    includeAgenda?: boolean;
    includeAgendaSummary?: boolean;
  } = {}) => {
    await Promise.all([
      includeProspectsList
        ? queryClient.invalidateQueries({ queryKey: prospectKeys.listPrefix(tenantId) })
        : Promise.resolve(),
      includeDashboard
        ? queryClient.invalidateQueries({ queryKey: crmDashboardKeys.all(tenantId) })
        : Promise.resolve(),
      includeAgenda
        ? queryClient.invalidateQueries({ queryKey: agendaKeys.all(tenantId) })
        : Promise.resolve(),
      includeAgendaSummary
        ? queryClient.invalidateQueries({ queryKey: agendaKeys.summaryPrefix(tenantId) })
        : Promise.resolve(),
      id
        ? queryClient.invalidateQueries({ queryKey: prospectKeys.detail(tenantId, id) })
        : Promise.resolve(),
      id
        ? queryClient.invalidateQueries({ queryKey: prospectKeys.contacts(tenantId, id) })
        : Promise.resolve(),
    ]);
  };

  const patchProspectsListsPrimaryContact = (
    prospectId: number | string,
    contacts: ProspectContact[]
  ) => {
    const nextPrimary = getPrimaryContact(contacts);
    const listEntries = queryClient.getQueriesData<ProspectListCache>({
      queryKey: prospectKeys.listPrefix(tenantId),
    });

    listEntries.forEach(([queryKey, cache]) => {
      if (!cache?.data) return;
      queryClient.setQueryData<ProspectListCache>(queryKey, {
        ...cache,
        data: cache.data.map((prospect) =>
          String(prospect.id) === String(prospectId)
            ? { ...prospect, primaryContact: nextPrimary }
            : prospect
        ),
      });
    });
  };

  const patchProspectsListsById = (
    prospectId: number | string,
    updater: (prospect: Prospect) => Prospect
  ) => {
    const listEntries = queryClient.getQueriesData<ProspectListCache>({
      queryKey: prospectKeys.listPrefix(tenantId),
    });

    listEntries.forEach(([queryKey, cache]) => {
      if (!cache?.data) return;
      queryClient.setQueryData<ProspectListCache>(queryKey, {
        ...cache,
        data: cache.data.map((prospect) =>
          String(prospect.id) === String(prospectId) ? updater(prospect) : prospect
        ),
      });
    });
  };

  return {
    createProspect: useMutation({
      mutationFn: (payload: ProspectPayload) => crmService.createProspect(payload),
      onSuccess: () =>
        invalidate({
          includeDashboard: true,
          includeAgenda: true,
          includeAgendaSummary: true,
        }),
    }),
    updateProspect: useMutation({
      mutationFn: ({ id, payload }: { id: number | string; payload: ProspectPayload }) =>
        crmService.updateProspect(id, payload),
      onMutate: async (variables) => {
        const { id, payload } = variables;
        const detailKey = prospectKeys.detail(tenantId, id);

        await Promise.all([
          queryClient.cancelQueries({ queryKey: detailKey }),
          queryClient.cancelQueries({ queryKey: prospectKeys.listPrefix(tenantId) }),
        ]);

        const previousDetail = queryClient.getQueryData<ProspectDetailCache>(detailKey);
        const previousLists = queryClient.getQueriesData<ProspectListCache>({
          queryKey: prospectKeys.listPrefix(tenantId),
        });

        queryClient.setQueryData<ProspectDetailCache>(detailKey, {
          data: patchProspectFromPayload(previousDetail?.data, payload) ?? undefined,
        });
        patchProspectsListsById(
          id,
          (prospect) => patchProspectFromPayload(prospect, payload) as Prospect
        );

        return { detailKey, previousDetail, previousLists };
      },
      onError: (_error, _variables, context) => {
        if (!context) return;
        queryClient.setQueryData(context.detailKey, context.previousDetail);
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      },
      onSuccess: (response, variables) => {
        const { id } = variables;
        const detailKey = prospectKeys.detail(tenantId, id);
        const updatedProspect = response?.data;
        if (!updatedProspect) return;

        queryClient.setQueryData<ProspectDetailCache>(detailKey, { data: updatedProspect });
        patchProspectsListsById(id, () => updatedProspect);
      },
    }),
    deleteProspect: useMutation({
      mutationFn: (id: number | string) => crmService.deleteProspect(id),
      onSuccess: () =>
        invalidate({
          includeDashboard: true,
          includeAgenda: true,
          includeAgendaSummary: true,
        }),
    }),
    convertProspect: useMutation({
      mutationFn: ({ id, payload }: { id: number | string; payload?: ConvertToCustomerPayload }) =>
        crmService.convertProspectToCustomer(id, payload),
      onSuccess: (_, variables) =>
        invalidate({
          id: variables.id,
          includeDashboard: true,
          includeAgenda: true,
          includeAgendaSummary: true,
        }),
    }),
    scheduleAction: useMutation({
      mutationFn: ({
        id,
        nextActionAt,
        nextActionNote,
      }: {
        id: number | string;
        nextActionAt: string;
        nextActionNote?: string | null;
      }) => crmService.scheduleProspectAction(id, nextActionAt, nextActionNote),
      onSuccess: (_, variables) =>
        invalidate({
          id: variables.id,
          includeDashboard: true,
          includeAgenda: true,
          includeAgendaSummary: true,
        }),
    }),
    clearAction: useMutation({
      mutationFn: (id: number | string) => crmService.clearProspectAction(id),
      onSuccess: (_, id) =>
        invalidate({
          id,
          includeDashboard: true,
          includeAgenda: true,
          includeAgendaSummary: true,
        }),
    }),
    createContact: useMutation({
      mutationFn: ({
        prospectId,
        payload,
      }: {
        prospectId: number | string;
        payload: ProspectContactPayload;
      }) => crmService.createProspectContact(prospectId, payload),
      onMutate: async (variables) => {
        const { prospectId, payload } = variables;
        const detailKey = prospectKeys.detail(tenantId, prospectId);
        const contactsKey = prospectKeys.contacts(tenantId, prospectId);

        await Promise.all([
          queryClient.cancelQueries({ queryKey: detailKey }),
          queryClient.cancelQueries({ queryKey: contactsKey }),
        ]);

        const previousDetail = queryClient.getQueryData<ProspectDetailCache>(detailKey);
        const previousContacts = queryClient.getQueryData<ProspectContactsCache>(contactsKey);
        const previousLists = queryClient.getQueriesData<ProspectListCache>({
          queryKey: prospectKeys.listPrefix(tenantId),
        });

        const tempContact: ProspectContact = {
          id: `tmp-${Date.now()}`,
          prospectId,
          name: payload.name,
          role: payload.role ?? null,
          phone: payload.phone ?? null,
          email: payload.email ?? null,
          isPrimary: Boolean(payload.isPrimary),
        };

        const currentContacts: ProspectContact[] = previousContacts?.data ?? [];
        const nextContacts: ProspectContact[] = tempContact.isPrimary
          ? [...currentContacts.map((contact) => ({ ...contact, isPrimary: false })), tempContact]
          : [...currentContacts, tempContact];

        queryClient.setQueryData<ProspectContactsCache>(contactsKey, { data: nextContacts });
        queryClient.setQueryData<ProspectDetailCache>(detailKey, {
          data: patchProspectPrimaryContact(previousDetail?.data, nextContacts) ?? undefined,
        });
        patchProspectsListsPrimaryContact(prospectId, nextContacts);

        return { detailKey, contactsKey, previousDetail, previousContacts, previousLists };
      },
      onError: (_error, _variables, context) => {
        if (!context) return;
        queryClient.setQueryData(context.detailKey, context.previousDetail);
        queryClient.setQueryData(context.contactsKey, context.previousContacts);
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      },
      onSuccess: (response, variables) => {
        const { prospectId } = variables;
        const detailKey = prospectKeys.detail(tenantId, prospectId);
        const contactsKey = prospectKeys.contacts(tenantId, prospectId);

        const createdContact = response?.data;
        if (!createdContact) return;

        const currentContacts: ProspectContact[] =
          queryClient.getQueryData<ProspectContactsCache>(contactsKey)?.data ?? [];
        const contactsWithoutTemp: ProspectContact[] = currentContacts.filter(
          (contact) => !String(contact.id).startsWith('tmp-')
        );
        const nextContacts: ProspectContact[] = createdContact.isPrimary
          ? [
              ...contactsWithoutTemp.map((contact) => ({ ...contact, isPrimary: false })),
              createdContact,
            ]
          : [...contactsWithoutTemp, createdContact];

        const currentDetail = queryClient.getQueryData<ProspectDetailCache>(detailKey);
        queryClient.setQueryData<ProspectContactsCache>(contactsKey, { data: nextContacts });
        queryClient.setQueryData<ProspectDetailCache>(detailKey, {
          data: patchProspectPrimaryContact(currentDetail?.data, nextContacts) ?? undefined,
        });
        patchProspectsListsPrimaryContact(prospectId, nextContacts);
      },
    }),
    updateContact: useMutation({
      mutationFn: ({
        prospectId,
        contactId,
        payload,
      }: {
        prospectId: number | string;
        contactId: number | string;
        payload: ProspectContactPayload;
      }) => crmService.updateProspectContact(prospectId, contactId, payload),
      onMutate: async (variables) => {
        const { prospectId, contactId, payload } = variables;
        const detailKey = prospectKeys.detail(tenantId, prospectId);
        const contactsKey = prospectKeys.contacts(tenantId, prospectId);

        await Promise.all([
          queryClient.cancelQueries({ queryKey: detailKey }),
          queryClient.cancelQueries({ queryKey: contactsKey }),
        ]);

        const previousDetail = queryClient.getQueryData<ProspectDetailCache>(detailKey);
        const previousContacts = queryClient.getQueryData<ProspectContactsCache>(contactsKey);
        const previousLists = queryClient.getQueriesData<ProspectListCache>({
          queryKey: prospectKeys.listPrefix(tenantId),
        });

        const currentContacts = previousContacts?.data ?? [];
        let nextContacts = currentContacts.map((contact) =>
          String(contact.id) === String(contactId)
            ? {
                ...contact,
                name: payload.name,
                role: payload.role ?? null,
                phone: payload.phone ?? null,
                email: payload.email ?? null,
                isPrimary: payload.isPrimary ?? contact.isPrimary,
              }
            : contact
        );
        if (payload.isPrimary) {
          nextContacts = nextContacts.map((contact) => ({
            ...contact,
            isPrimary: String(contact.id) === String(contactId),
          }));
        }

        queryClient.setQueryData<ProspectContactsCache>(contactsKey, { data: nextContacts });
        queryClient.setQueryData<ProspectDetailCache>(detailKey, {
          data: patchProspectPrimaryContact(previousDetail?.data, nextContacts) ?? undefined,
        });
        patchProspectsListsPrimaryContact(prospectId, nextContacts);

        return { detailKey, contactsKey, previousDetail, previousContacts, previousLists };
      },
      onError: (_error, _variables, context) => {
        if (!context) return;
        queryClient.setQueryData(context.detailKey, context.previousDetail);
        queryClient.setQueryData(context.contactsKey, context.previousContacts);
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      },
      onSuccess: (response, variables) => {
        const { prospectId, contactId } = variables;
        const detailKey = prospectKeys.detail(tenantId, prospectId);
        const contactsKey = prospectKeys.contacts(tenantId, prospectId);

        const updatedContact = response?.data;
        if (!updatedContact) return;

        const currentContacts =
          queryClient.getQueryData<ProspectContactsCache>(contactsKey)?.data ?? [];
        let nextContacts = currentContacts.map((contact) =>
          String(contact.id) === String(contactId) ? { ...contact, ...updatedContact } : contact
        );
        if (updatedContact.isPrimary) {
          nextContacts = nextContacts.map((contact) => ({
            ...contact,
            isPrimary: String(contact.id) === String(updatedContact.id),
          }));
        }

        const currentDetail = queryClient.getQueryData<ProspectDetailCache>(detailKey);
        queryClient.setQueryData<ProspectContactsCache>(contactsKey, { data: nextContacts });
        queryClient.setQueryData<ProspectDetailCache>(detailKey, {
          data: patchProspectPrimaryContact(currentDetail?.data, nextContacts) ?? undefined,
        });
        patchProspectsListsPrimaryContact(prospectId, nextContacts);
      },
    }),
    deleteContact: useMutation({
      mutationFn: ({
        prospectId,
        contactId,
      }: {
        prospectId: number | string;
        contactId: number | string;
      }) => crmService.deleteProspectContact(prospectId, contactId),
      onMutate: async (variables) => {
        const { prospectId, contactId } = variables;
        const detailKey = prospectKeys.detail(tenantId, prospectId);
        const contactsKey = prospectKeys.contacts(tenantId, prospectId);

        await Promise.all([
          queryClient.cancelQueries({ queryKey: detailKey }),
          queryClient.cancelQueries({ queryKey: contactsKey }),
        ]);

        const previousDetail = queryClient.getQueryData<ProspectDetailCache>(detailKey);
        const previousContacts = queryClient.getQueryData<ProspectContactsCache>(contactsKey);
        const previousLists = queryClient.getQueriesData<ProspectListCache>({
          queryKey: prospectKeys.listPrefix(tenantId),
        });

        const currentContacts = previousContacts?.data ?? [];
        const nextContacts = currentContacts.filter(
          (contact) => String(contact.id) !== String(contactId)
        );

        queryClient.setQueryData<ProspectContactsCache>(contactsKey, { data: nextContacts });
        queryClient.setQueryData<ProspectDetailCache>(detailKey, {
          data: patchProspectPrimaryContact(previousDetail?.data, nextContacts) ?? undefined,
        });
        patchProspectsListsPrimaryContact(prospectId, nextContacts);

        return { detailKey, contactsKey, previousDetail, previousContacts, previousLists };
      },
      onError: (_error, _variables, context) => {
        if (!context) return;
        queryClient.setQueryData(context.detailKey, context.previousDetail);
        queryClient.setQueryData(context.contactsKey, context.previousContacts);
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      },
    }),
  };
}
