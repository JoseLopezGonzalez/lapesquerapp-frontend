import { z } from 'zod';

export type CustomerFormValues = {
  name: string;
  alias: string;
  vatNumber: string;
  billingAddress: string;
  shippingAddress: string;
  transportationNotes: string;
  productionNotes: string;
  accountingNotes: string;
  emails: string[];
  ccEmails: string[];
  contactInfo: string;
  operationalStatus: 'normal' | 'alta_operativa' | string;
  countryId: string;
  paymentTermId: string;
  transportId: string;
  fieldOperatorId: string;
};

export function getCustomerFormSchema() {
  return z.object({
    name: z.string().trim().min(1, 'El nombre es obligatorio'),
    alias: z.string().trim().optional().catch(''),
    vatNumber: z.string().trim().optional().catch(''),
    billingAddress: z.string().trim().optional().catch(''),
    shippingAddress: z.string().trim().optional().catch(''),
    transportationNotes: z.string().trim().optional().catch(''),
    productionNotes: z.string().trim().optional().catch(''),
    accountingNotes: z.string().trim().optional().catch(''),
    emails: z.array(z.string().trim().email('Email inválido')).optional().catch([]),
    ccEmails: z.array(z.string().trim().email('Email inválido')).optional().catch([]),
    contactInfo: z.string().trim().optional().catch(''),
    operationalStatus: z.string().trim().min(1, 'El estado operativo es obligatorio'),
    countryId: z.string().trim().min(1, 'El país es obligatorio'),
    paymentTermId: z.string().trim().min(1, 'La forma de pago es obligatoria'),
    transportId: z.string().trim().min(1, 'El transporte es obligatorio'),
    fieldOperatorId: z.string().optional().catch(''),
  });
}

export function getDefaultCustomerFormValues(): CustomerFormValues {
  return {
    name: '',
    alias: '',
    vatNumber: '',
    billingAddress: '',
    shippingAddress: '',
    transportationNotes: '',
    productionNotes: '',
    accountingNotes: '',
    emails: [],
    ccEmails: [],
    contactInfo: '',
    operationalStatus: 'normal',
    countryId: '',
    paymentTermId: '',
    transportId: '',
    fieldOperatorId: '',
  };
}

export function customerFormValuesFromInitial(initialCustomer: Record<string, unknown> | null | undefined): CustomerFormValues {
  const safe = (value: unknown) => (typeof value === 'string' ? value : value == null ? '' : String(value));
  const list = (value: unknown) => (Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean) : []);

  const countryId =
    initialCustomer && typeof initialCustomer === 'object'
      ? safe((initialCustomer as any)?.country?.id ?? (initialCustomer as any)?.country_id)
      : '';
  const paymentTermId =
    initialCustomer && typeof initialCustomer === 'object'
      ? safe((initialCustomer as any)?.paymentTerm?.id ?? (initialCustomer as any)?.payment_term_id)
      : '';
  const transportId =
    initialCustomer && typeof initialCustomer === 'object'
      ? safe((initialCustomer as any)?.transport?.id ?? (initialCustomer as any)?.transport_id)
      : '';
  const fieldOperatorId =
    initialCustomer && typeof initialCustomer === 'object'
      ? safe((initialCustomer as any)?.fieldOperator?.id ?? (initialCustomer as any)?.field_operator_id)
      : '';

  return {
    ...getDefaultCustomerFormValues(),
    name: safe((initialCustomer as any)?.name),
    alias: safe((initialCustomer as any)?.alias),
    vatNumber: safe((initialCustomer as any)?.vatNumber ?? (initialCustomer as any)?.vat_number),
    billingAddress: safe((initialCustomer as any)?.billingAddress ?? (initialCustomer as any)?.billing_address),
    shippingAddress: safe((initialCustomer as any)?.shippingAddress ?? (initialCustomer as any)?.shipping_address),
    transportationNotes: safe((initialCustomer as any)?.transportationNotes ?? (initialCustomer as any)?.transportation_notes),
    productionNotes: safe((initialCustomer as any)?.productionNotes ?? (initialCustomer as any)?.production_notes),
    accountingNotes: safe((initialCustomer as any)?.accountingNotes ?? (initialCustomer as any)?.accounting_notes),
    emails: list((initialCustomer as any)?.emails),
    ccEmails: list((initialCustomer as any)?.ccEmails ?? (initialCustomer as any)?.cc_emails),
    contactInfo: safe((initialCustomer as any)?.contactInfo ?? (initialCustomer as any)?.contact_info),
    operationalStatus: safe((initialCustomer as any)?.operationalStatus ?? (initialCustomer as any)?.operational_status) || 'normal',
    countryId,
    paymentTermId,
    transportId,
    fieldOperatorId,
  };
}

