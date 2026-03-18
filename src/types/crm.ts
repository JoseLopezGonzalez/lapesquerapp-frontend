import type { Country, Customer, PaginationMeta, Salesperson } from '@/types/catalog';

export type ProspectStatus = 'new' | 'following' | 'offer_sent' | 'customer' | 'discarded';
export type ProspectOrigin = 'conxemar' | 'direct' | 'referral' | 'web' | 'other';
export type CommercialInteractionType = 'call' | 'email' | 'whatsapp' | 'visit' | 'other';
export type CommercialInteractionResult = 'interested' | 'no_response' | 'not_interested' | 'pending';
export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type OfferSendChannel = 'email' | 'pdf' | 'whatsapp_text';
export type AgendaStatus = 'pending' | 'done' | 'cancelled';

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
  scheduledAt: string;
  description?: string | null;
  status: AgendaStatus;
  target: AgendaTarget;
  label: string;
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

export interface CrmDashboardData {
  reminders_today: CrmReminderItem[];
  overdue_actions: CrmReminderItem[];
  inactive_customers: InactiveCustomerItem[];
  prospects_without_activity: ProspectWithoutActivityItem[];
  counters: {
    remindersToday: number;
    overdueActions: number;
    inactiveCustomers: number;
    prospectsWithoutActivity: number;
  };
}

export interface ProspectPayload {
  companyName: string;
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
