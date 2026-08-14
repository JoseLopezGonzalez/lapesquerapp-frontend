import { z } from 'zod';

/**
 * Formulario de cabecera de pedido del portal de maquila ("cliente al vuelo").
 * `entryDate`/`loadDate`/`adhocCustomerName` son obligatorios solo en creación
 * (StoreOrderAsProcessorRequest); en edición son `sometimes` (UpdateOrderAsProcessorRequest) —
 * ver docs/maquila/frontend/04-pedidos.md §3-4.
 */
export function createMaquilaOrderFormSchema(mode: 'create' | 'edit') {
  const isCreate = mode === 'create';

  return z
    .object({
      entryDate: isCreate
        ? z.date({ required_error: 'La fecha de entrada es obligatoria' })
        : z.date().optional(),
      loadDate: isCreate
        ? z.date({ required_error: 'La fecha de carga es obligatoria' })
        : z.date().optional(),
      adhocCustomerName: isCreate
        ? z.string().trim().min(1, 'El nombre del cliente es obligatorio')
        : z.string().trim().optional(),
      adhocCustomerAddress: z.string().trim().optional(),
      buyerReference: z.string().trim().optional(),
      transportId: z.string().optional(),
      transportationNotes: z.string().trim().max(300, 'Máximo 300 caracteres').optional(),
      truckPlate: z.string().trim().optional(),
      trailerPlate: z.string().trim().optional(),
      // Sin .transform(): mantener el tipo de entrada (lo que devuelve el <input type="number">,
      // string) igual al de salida evita el desajuste input/output de Zod con zodResolver.
      // La conversión a number real se hace en toMaquilaOrderPayload().
      temperature: z.union([z.number(), z.string(), z.null()]).optional(),
      emails: z.array(z.string().email('Correo inválido')),
      ccEmails: z.array(z.string().email('Correo inválido')),
    })
    .refine(
      (values) => !values.entryDate || !values.loadDate || values.loadDate >= values.entryDate,
      {
        message: 'La fecha de carga debe ser igual o posterior a la de entrada',
        path: ['loadDate'],
      }
    );
}

export type MaquilaOrderFormValues = z.infer<ReturnType<typeof createMaquilaOrderFormSchema>>;

/** FormValues (Zod) → payload de API — ver .claude/rules/api-contract.md "Frontera con formularios" */
export function toMaquilaOrderPayload(values: MaquilaOrderFormValues) {
  return {
    ...(values.entryDate && { entryDate: values.entryDate.toISOString().slice(0, 10) }),
    ...(values.loadDate && { loadDate: values.loadDate.toISOString().slice(0, 10) }),
    ...(values.adhocCustomerName !== undefined && {
      adhocCustomerName: values.adhocCustomerName || undefined,
    }),
    adhocCustomerAddress: values.adhocCustomerAddress || null,
    buyerReference: values.buyerReference || null,
    transport: values.transportId ? { id: Number(values.transportId) } : null,
    transportationNotes: values.transportationNotes || null,
    truckPlate: values.truckPlate || null,
    trailerPlate: values.trailerPlate || null,
    temperature:
      values.temperature === '' || values.temperature == null ? null : Number(values.temperature),
    emails: values.emails,
    ccEmails: values.ccEmails,
  };
}
