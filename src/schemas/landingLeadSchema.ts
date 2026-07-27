import { z } from 'zod';

/**
 * Schema del formulario de captura de leads del CTA final de la landing.
 * El campo honeypot (`company`) se valida aparte en el Route Handler, no aquí:
 * debe fallar en silencio (falso éxito) en vez de como error de validación,
 * para no delatar al bot que hay un check anti-spam.
 */
export const landingLeadSchema = z.object({
  email: z.string().min(1, 'Email requerido').email('Introduce un email válido'),
});

export type LandingLeadForm = z.infer<typeof landingLeadSchema>;
