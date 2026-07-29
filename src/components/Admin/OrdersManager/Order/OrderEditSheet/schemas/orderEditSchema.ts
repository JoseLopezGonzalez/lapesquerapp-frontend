import { z } from 'zod';

export const orderEditSchema = z
  .object({
    orderType: z.enum(['standard', 'autoventa', 'maritime_export']).default('standard'),
    entryDate: z
      .date({ required_error: 'La fecha de entrada es obligatoria' })
      .nullable()
      .refine((val) => val != null, 'La fecha de entrada es obligatoria'),
    loadDate: z
      .date({ required_error: 'La fecha de carga es obligatoria' })
      .nullable()
      .refine((val) => val != null, 'La fecha de carga es obligatoria'),
    salesperson: z.string().min(1, 'Selecciona un comercial'),
    fieldOperator: z.string().optional(),
    externalProcessor: z.string().optional(),
    maquiladorDestination: z.string().max(500, 'Máximo 500 caracteres').optional(),
    loadingAddress: z.string().max(500, 'Máximo 500 caracteres').optional(),
    payment: z.string().optional(),
    incoterm: z.string().optional(),
    buyerReference: z.string().optional(),
    transport: z.string().optional(),
    truckPlate: z.string().optional(),
    trailerPlate: z.string().optional(),
    transportationNotes: z.string().max(300, 'Máximo 300 caracteres').optional(),
    billingAddress: z.string().optional(),
    shippingAddress: z.string().optional(),
    productionNotes: z.string().max(500, 'Máximo 500 caracteres').optional(),
    accountingNotes: z.string().max(500, 'Máximo 500 caracteres').optional(),
    transportNotes: z.string().optional(),
    emails: z.array(z.string().email('Correo inválido')).optional().default([]),
    ccEmails: z.array(z.string().email('Correo inválido')).optional().default([]),
    invoiced: z.enum(['true', 'false']).default('false'),
  })
  .superRefine((data, ctx) => {
    if (data.orderType === 'autoventa') return;

    const requiredStringFields: Array<[keyof typeof data, string]> = [
      ['payment', 'Selecciona la forma de pago'],
      ['incoterm', 'Selecciona un incoterm'],
      ['buyerReference', 'La referencia del comprador es obligatoria'],
      ['transport', 'Selecciona una empresa de transporte'],
      ['billingAddress', 'La dirección de facturación es obligatoria'],
      ['shippingAddress', 'La dirección de entrega es obligatoria'],
    ];

    requiredStringFields.forEach(([field, message]) => {
      const value = data[field];
      if (typeof value !== 'string' || value.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message,
        });
      }
    });

    if (!Array.isArray(data.emails) || data.emails.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['emails'],
        message: 'Debe ingresar al menos un correo',
      });
    }
  });

export type OrderEditFormData = z.infer<typeof orderEditSchema>;
