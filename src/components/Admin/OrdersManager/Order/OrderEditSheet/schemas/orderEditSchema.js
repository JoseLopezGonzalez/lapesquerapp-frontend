import { z } from 'zod'

export const orderEditSchema = z.object({
    entryDate: z.date({ required_error: 'La fecha de entrada es obligatoria' }).nullable().refine((val) => val != null, 'La fecha de entrada es obligatoria'),
    loadDate: z.date({ required_error: 'La fecha de carga es obligatoria' }).nullable().refine((val) => val != null, 'La fecha de carga es obligatoria'),
    salesperson: z.string().min(1, 'Seleccione un comercial'),
    payment: z.string().min(1, 'Seleccione la forma de pago'),
    incoterm: z.string().min(1, 'Seleccione un incoterm'),
    buyerReference: z.string().min(1, 'La referencia del comprador es obligatoria'),
    transport: z.string().min(1, 'Seleccione una empresa de transporte'),
    truckPlate: z.string().optional(),
    trailerPlate: z.string().optional(),
    transportationNotes: z.string().max(300, 'Máximo 300 caracteres').optional(),
    billingAddress: z.string().min(1, 'La dirección de facturación es obligatoria'),
    shippingAddress: z.string().min(1, 'La dirección de entrega es obligatoria'),
    productionNotes: z.string().max(500, 'Máximo 500 caracteres').optional(),
    accountingNotes: z.string().max(500, 'Máximo 500 caracteres').optional(),
    transportNotes: z.string().optional(),
    emails: z.array(z.string().email('Correo inválido')).min(1, 'Debe ingresar al menos un correo'),
    ccEmails: z.array(z.string().email('Correo inválido')).optional().default([]),
})
