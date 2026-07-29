import { z } from 'zod';

export const maritimeShippingDetailSchema = z.object({
  vesselName: z.string().max(255, 'Máximo 255 caracteres').nullable().optional(),
  voyageNumber: z.string().max(100, 'Máximo 100 caracteres').nullable().optional(),
  exportInvoiceNumber: z.string().max(100, 'Máximo 100 caracteres').nullable().optional(),
  swbNumber: z.string().max(100, 'Máximo 100 caracteres').nullable().optional(),
  loadingPort: z.string().max(255, 'Máximo 255 caracteres').nullable().optional(),
  dischargePort: z.string().max(255, 'Máximo 255 caracteres').nullable().optional(),
});

export type MaritimeShippingDetailFormData = z.infer<typeof maritimeShippingDetailSchema>;
