import { format, formatDistanceToNowStrict, isBefore, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export const prospectStatusLabels = {
  new: 'Nuevo',
  following: 'Seguimiento',
  offer_sent: 'Oferta enviada',
  customer: 'Cliente',
  discarded: 'Descartado',
};

export const offerStatusLabels = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Expirada',
};

export const interactionTypeLabels = {
  call: 'Llamada',
  email: 'Email',
  whatsapp: 'WhatsApp',
  visit: 'Visita',
  other: 'Otro',
};

export const interactionResultLabels = {
  interested: 'Interesado',
  no_response: 'Sin respuesta',
  not_interested: 'No interesa',
  pending: 'Pendiente',
};

export const agendaStatusLabels = {
  pending: 'Pendiente',
  reprogrammed: 'Reprogramada',
  done: 'Hecha',
  cancelled: 'Cancelada',
};

export const prospectOriginOptions = [
  { value: 'inbound_call', label: 'Llamada entrante' },
  { value: 'email', label: 'Email' },
  { value: 'web_form', label: 'Formulario web' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'event', label: 'Feria / evento' },
  { value: 'referral', label: 'Referido' },
  { value: 'agent', label: 'Distribuidor / agente' },
  { value: 'marketing_campaign', label: 'Campaña marketing (ads/newsletter)' },
  { value: 'reactivation', label: 'Reactivación (ex-cliente / lead antiguo)' },
  { value: 'online_search', label: 'Búsqueda online (Internet)' },
  { value: 'google_maps', label: 'Google Maps' },
  { value: 'ai_sourced', label: 'IA (p.ej. ChatGPT / herramientas IA)' },
  { value: 'other', label: 'Otro' },
];

export const prospectStatusOptions = Object.entries(prospectStatusLabels).map(([value, label]) => ({
  value,
  label,
}));

export const offerStatusOptions = Object.entries(offerStatusLabels).map(([value, label]) => ({
  value,
  label,
}));

export const interactionTypeOptions = Object.entries(interactionTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

export const interactionResultOptions = Object.entries(interactionResultLabels).map(([value, label]) => ({
  value,
  label,
}));

export function formatDateValue(value, pattern = 'dd/MM/yyyy') {
  if (!value) return 'Sin fecha';
  try {
    return format(typeof value === 'string' ? parseISO(value) : value, pattern, { locale: es });
  } catch {
    return String(value);
  }
}

export function formatDateTimeValue(value) {
  if (!value) return 'Sin fecha';
  try {
    return format(typeof value === 'string' ? parseISO(value) : value, 'dd/MM/yyyy HH:mm', { locale: es });
  } catch {
    return String(value);
  }
}

export function formatRelativeDays(value) {
  if (!value) return null;
  try {
    return formatDistanceToNowStrict(parseISO(value), { addSuffix: true, locale: es });
  } catch {
    return null;
  }
}

export function isOverdueDate(value) {
  if (!value) return false;
  try {
    return isBefore(startOfDay(parseISO(value)), startOfDay(new Date()));
  } catch {
    return false;
  }
}

export function formatCurrency(value, currency = 'EUR') {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function getStatusTone(status) {
  const map = {
    new: 'blue',
    following: 'amber',
    offer_sent: 'violet',
    customer: 'green',
    discarded: 'red',
    draft: 'slate',
    sent: 'blue',
    accepted: 'green',
    rejected: 'red',
    expired: 'amber',
    interested: 'green',
    no_response: 'amber',
    not_interested: 'red',
    pending: 'blue',
    reprogrammed: 'amber',
    done: 'green',
    cancelled: 'red',
  };
  return map[status] ?? 'slate';
}

export function toneClasses(tone) {
  const map = {
    blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    violet: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    green: 'bg-green-500/15 text-green-700 dark:text-green-300',
    red: 'bg-red-500/15 text-red-700 dark:text-red-300',
    slate: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  };
  return map[tone] ?? map.slate;
}
