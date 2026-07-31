import { z } from 'zod';

export const sendMaritimeExportDocumentsSchema = z.object({
  subject: z.string().max(255, 'Máximo 255 caracteres'),
  body: z.string().max(5000, 'Máximo 5000 caracteres'),
});

export type SendMaritimeExportDocumentsFormData = z.infer<typeof sendMaritimeExportDocumentsSchema>;
