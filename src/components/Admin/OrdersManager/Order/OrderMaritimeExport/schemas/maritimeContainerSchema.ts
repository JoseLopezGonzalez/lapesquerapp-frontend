import { z } from 'zod';

export const maritimeContainerSchema = z.object({
  containerNumber: z
    .string()
    .min(1, 'El número de contenedor es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  sealNumber: z.string().max(50, 'Máximo 50 caracteres').nullable().optional(),
});

export type MaritimeContainerFormData = z.infer<typeof maritimeContainerSchema>;
