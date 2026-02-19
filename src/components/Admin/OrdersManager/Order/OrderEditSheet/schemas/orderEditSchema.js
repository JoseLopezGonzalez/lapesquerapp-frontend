import { z } from 'zod'

export const orderEditSchema = z.object({
    orderType: z.enum(['standard', 'autoventa']).default('standard'),
    entryDate: z.date({ required_error: 'La fecha de entrada es obligatoria' }).nullable().refine((val) => val != null, 'La fecha de entrada es obligatoria'),
    loadDate: z.date({ required_error: 'La fecha de carga es obligatoria' }).nullable().refine((val) => val != null, 'La fecha de carga es obligatoria'),
    salesperson: z.string().min(1, 'Seleccione un comercial'),
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
})
