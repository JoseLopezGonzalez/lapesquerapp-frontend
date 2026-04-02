import type { Country, Customer, PaginationMeta, Salesperson } from '@/types/catalog';

export type ProspectStatus = 'new' | 'following' | 'offer_sent' | 'customer' | 'discarded';
export type ProspectOrigin = 'conxemar' | 'direct' | 'referral' | 'web' | 'other';
export type CommercialInteractionType = 'call' | 'email' | 'whatsapp' | 'visit' | 'other';
export type CommercialInteractionResult = 'interested' | 'no_response' | 'not_interested' | 'pending';
export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type OfferSendChannel = 'email' | 'pdf' | 'whatsapp_text';
export type AgendaStatus = 'pending' | 'reprogrammed' | 'done' | 'cancelled';

export interface CrmWarning {
  type: string;
  message: string;
  matches?: Record<string, unknown>;
}

export interface CrmWriteResponse<T> {
  message?: string;
  data: T;
  warnings?: CrmWarning[];
}

export interface CrmPaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: Record<string, unknown>;
}

export interface ProspectContact {
  id: number | string;
  prospectId?: number | string;
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  isPrimary?: boolean;
}

export interface CommercialInteraction {
  id: number | string;
  prospectId?: number | string | null;
  customerId?: number | string | null;
  isFromProspect?: boolean;
  salesperson?: Salesperson | null;
  salespersonId?: number | string | null;
  type: CommercialInteractionType;
  occurredAt: string;
  summary: string;
  result: CommercialInteractionResult;
  nextActionNote?: string | null;
  nextActionAt?: string | null;
}

export interface AgendaTarget {
  type: 'prospect' | 'customer';
  id: number | string;
}

export interface AgendaAction {
  agendaActionId: number | string;
  previousActionId?: number | string | null;
  scheduledAt: string;
  description?: string | null;
  reason?: string | null;
  status: AgendaStatus;
  target: AgendaTarget;
  label: string;
}

export type ResolveNextActionStrategy =
  | 'keep'
  | 'reschedule'
  | 'reschedule_with_description'
  | 'override'
  | 'create_if_none';

export interface PendingAgendaResponse {
  hasPending?: boolean;
  pendingAction?: AgendaAction | null;
}

export interface ResolveNextActionPayload {
  targetType: 'prospect' | 'customer';
  targetId: number | string;
  strategy: ResolveNextActionStrategy;
  currentPendingId?: number | string;
  expectedPendingId?: number | string;
  nextActionAt?: string | null;
  description?: string | null;
  reason?: string | null;
  sourceInteractionId?: number | string | null;
}

export interface ResolveNextActionResponse {
  data: {
    strategy: ResolveNextActionStrategy;
    changed?: boolean;
    previousPending?: AgendaAction | null;
    currentPending?: AgendaAction | null;
  };
  message?: string;
}

export type CommercialInteractionAgendaMode = 'created' | 'completed' | 'completed_and_created';

export interface CommercialInteractionAgendaResult {
  mode: CommercialInteractionAgendaMode;
  completedAction?: AgendaAction | null;
  createdAction?: AgendaAction | null;
}

export interface CommercialInteractionCreateResponse extends CrmWriteResponse<CommercialInteraction> {
  agenda?: CommercialInteractionAgendaResult | null;
}

export interface AgendaSummaryData {
  overdue: AgendaAction[];
  today: AgendaAction[];
  next: AgendaAction[];
}

export interface OfferLine {
  id?: number | string;
  productId?: number | string | null;
  product?: { id: number | string; name?: string } | null;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxId?: number | string | null;
  tax?: { id: number | string; name?: string; rate?: number } | null;
  boxes?: number | null;
  currency?: string | null;
}

export interface Offer {
  id: number | string;
  prospectId?: number | string | null;
  customerId?: number | string | null;
  orderId?: number | string | null;
  salesperson?: Salesperson | null;
  status: OfferStatus;
  sendChannel?: OfferSendChannel | null;
  sentAt?: string | null;
  validUntil?: string | null;
  incoterm?: { id: number | string; name?: string } | null;
  incotermId?: number | string | null;
  paymentTerm?: { id: number | string; name?: string } | null;
  paymentTermId?: number | string | null;
  currency?: string | null;
  notes?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  customer?: Customer | null;
  prospect?: Prospect | null;
  lines?: OfferLine[];
  totalAmount?: number | null;
}

export interface Prospect {
  id: number | string;
  companyName: string;
  /** Dirección fiscal / operativa en texto libre (opcional). */
  address?: string | null;
  /** Sitio web (texto libre, opcional; máx. 512 en API). */
  website?: string | null;
  country?: Country | null;
  countryId?: number | string | null;
  speciesInterest?: string[];
  origin: ProspectOrigin;
  status: ProspectStatus;
  salesperson?: Salesperson | null;
  customer?: Customer | null;
  customerId?: number | string | null;
  nextActionAt?: string | null;
  nextActionNote?: string | null;
  notes?: string | null;
  commercialInterestNotes?: string | null;
  lastContactAt?: string | null;
  lastOfferAt?: string | null;
  lostReason?: string | null;
  primaryContact?: ProspectContact | null;
  latestInteraction?: CommercialInteraction | null;
  contacts?: ProspectContact[];
  interactions?: CommercialInteraction[];
  offers?: Offer[];
  offersSummary?: {
    count: number;
    latestStatus?: OfferStatus | null;
  } | null;
}

export interface ConvertToCustomerPayload {
  vatNumber?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  transportId?: number | string | null;
  paymentTermId?: number | string | null;
  a3erpCode?: string | null;
  facilcomCode?: string | null;
  transportationNotes?: string | null;
  productionNotes?: string | null;
  accountingNotes?: string | null;
}

export interface CrmReminderItem {
  type: 'prospect' | 'customer';
  id: number | string;
  agendaActionId: number | string;
  label: string;
  nextActionAt: string;
  daysOverdue: number;
  prospectId?: number | string | null;
  customerId?: number | string | null;
  nextActionNote?: string | null;
}

export interface InactiveCustomerItem {
  id: number | string;
  name: string;
  country?: Country | null;
  daysSinceLastOrder: number;
  lastOrderAt?: string | null;
}

export interface ProspectWithoutActivityItem {
  id: number | string;
  companyName: string;
  country?: Country | null;
  daysWithoutActivity: number;
  lastContactAt?: string | null;
}

export interface CrmDashboardPendingActionsData {
  reminders_today: CrmReminderItem[];
  overdue_actions: CrmReminderItem[];
  counters: {
    remindersToday: number;
    overdueActions: number;
  };
}

export interface CrmDashboardCustomersData {
  inactive_customers: InactiveCustomerItem[];
  counters: {
    inactiveCustomers: number;
  };
}

export interface CrmDashboardProspectsData {
  prospects_without_activity: ProspectWithoutActivityItem[];
  counters: {
    prospectsWithoutActivity: number;
  };
}

export interface CrmDashboardData {
  reminders_today: CrmDashboardPendingActionsData['reminders_today'];
  overdue_actions: CrmDashboardPendingActionsData['overdue_actions'];
  inactive_customers: CrmDashboardCustomersData['inactive_customers'];
  prospects_without_activity: CrmDashboardProspectsData['prospects_without_activity'];
  counters: {
    remindersToday: number;
    overdueActions: number;
    inactiveCustomers: number;
    prospectsWithoutActivity: number;
  };
}

export interface ProspectPayload {
  companyName: string;
  address?: string | null;
  website?: string | null;
  countryId?: number | string | null;
  speciesInterest?: string[];
  origin: ProspectOrigin;
  status?: ProspectStatus;
  notes?: string | null;
  commercialInterestNotes?: string | null;
  nextActionAt?: string | null;
  nextActionNote?: string | null;
  lostReason?: string | null;
  salespersonId?: number | string | null;
  primaryContact?: {
    name?: string;
    role?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
}

export interface ProspectContactPayload {
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  isPrimary?: boolean;
}

export interface CommercialInteractionPayload {
  prospectId?: number | string;
  customerId?: number | string;
  agendaActionId?: number | string;
  type: CommercialInteractionType;
  occurredAt: string;
  summary: string;
  result: CommercialInteractionResult;
  nextActionNote?: string | null;
  nextActionAt?: string | null;
}

export interface OfferPayload {
  prospectId?: number | string;
  customerId?: number | string;
  validUntil?: string | null;
  incotermId?: number | string | null;
  paymentTermId?: number | string | null;
  currency?: string | null;
  notes?: string | null;
  lines: OfferLine[];
}
