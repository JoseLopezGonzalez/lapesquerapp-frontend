import { z } from 'zod'

const plannedProductSchema = z.object({
    product: z.string().min(1, 'Producto es requerido'),
    quantity: z.union([z.number().min(0.01, 'Cantidad debe ser mayor que 0'), z.string()]).pipe(z.coerce.number().min(0.01, 'Cantidad debe ser mayor que 0')),
    boxes: z.union([z.number().int().min(1, 'Cajas debe ser al menos 1'), z.string()]).pipe(z.coerce.number().int().min(1, 'Cajas debe ser al menos 1')),
    unitPrice: z.union([z.number().min(0.01, 'Precio debe ser mayor que 0'), z.string()]).pipe(z.coerce.number().min(0.01, 'Precio debe ser mayor que 0')),
    tax: z.union([z.string(), z.number()]).refine((val) => val != null && val !== '', 'IVA es requerido'),
})

export const orderCreateSchema = z.object({
    customer: z.string().min(1, 'El cliente es obligatorio'),
    entryDate: z.date({ required_error: 'La fecha de entrada es obligatoria' }),
    loadDate: z.date({ required_error: 'La fecha de carga es obligatoria' }),
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
    emails: z.array(z.string().email('Correo inválido')).min(1, 'Debe ingresar al menos un correo'),
    ccEmails: z.array(z.string().email('Correo inválido')).optional().default([]),
    plannedProducts: z.array(plannedProductSchema).min(1, 'Al menos un producto'),
})
