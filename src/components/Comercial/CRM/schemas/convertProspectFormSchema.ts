import { z } from 'zod';
import type { ConvertToCustomerPayload } from '@/types/crm';

export type ConvertProspectFormValues = {
  billingAddress: string;
  shippingAddress: string;
  vatNumber: string;
  transportId: string;
  paymentTermId: string;
  a3erpCode: string;
  facilcomCode: string;
  transportationNotes: string;
  productionNotes: string;
  accountingNotes: string;
};

export function getConvertProspectFormSchema() {
  return z.object({
    billingAddress: z.string().trim().optional().catch(''),
    shippingAddress: z.string().trim().optional().catch(''),
    vatNumber: z.string().trim().optional().catch(''),
    transportId: z.string().trim().optional().catch(''),
    paymentTermId: z.string().trim().optional().catch(''),
    a3erpCode: z.string().trim().optional().catch(''),
    facilcomCode: z.string().trim().optional().catch(''),
    transportationNotes: z.string().trim().optional().catch(''),
    productionNotes: z.string().trim().optional().catch(''),
    accountingNotes: z.string().trim().optional().catch(''),
  });
}

export function getDefaultConvertProspectFormValues(prospectAddress?: string | null): ConvertProspectFormValues {
  const address = prospectAddress?.trim() ?? '';
  return {
    billingAddress: address,
    shippingAddress: address,
    vatNumber: '',
    transportId: '',
    paymentTermId: '',
    a3erpCode: '',
    facilcomCode: '',
    transportationNotes: '',
    productionNotes: '',
    accountingNotes: '',
  };
}

export function convertProspectPayloadFromFormValues(values: ConvertProspectFormValues): ConvertToCustomerPayload {
  const nullIfEmpty = (v: string) => (v.trim() ? v.trim() : null);
  const idOrNull = (v: string) => (v.trim() ? Number(v) : null);

  return {
    billingAddress: nullIfEmpty(values.billingAddress),
    shippingAddress: nullIfEmpty(values.shippingAddress),
    vatNumber: nullIfEmpty(values.vatNumber),
    transportId: idOrNull(values.transportId),
    paymentTermId: idOrNull(values.paymentTermId),
    a3erpCode: nullIfEmpty(values.a3erpCode),
    facilcomCode: nullIfEmpty(values.facilcomCode),
    transportationNotes: nullIfEmpty(values.transportationNotes),
    productionNotes: nullIfEmpty(values.productionNotes),
    accountingNotes: nullIfEmpty(values.accountingNotes),
  };
}
