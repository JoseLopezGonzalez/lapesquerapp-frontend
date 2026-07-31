import { z } from 'zod';

export const sendMaritimeExportDocumentsSchema = z.object({
  subject: z
    .string()
    .min(1, 'El asunto es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  body: z
    .string()
    .min(1, 'El mensaje es obligatorio')
    .max(5000, 'Máximo 5000 caracteres'),
});

export type SendMaritimeExportDocumentsFormData = z.infer<typeof sendMaritimeExportDocumentsSchema>;
