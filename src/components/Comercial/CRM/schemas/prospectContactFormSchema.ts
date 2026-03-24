import { z } from 'zod';
import type { ProspectContact } from '@/types/crm';

const emailOptional = z
  .string()
  .max(200, 'Máximo 200 caracteres')
  .refine(
    (s) => {
      const t = s.trim();
      if (!t) return true;
      return z.string().email().safeParse(t).success;
    },
    'Email no válido'
  );

/**
 * Valores del formulario (strings para inputs).
 * La transformación a `null` se hace al construir el payload al enviar.
 */
export const prospectContactFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(255, 'Máximo 255 caracteres'),
  role: z.string().max(120, 'Máximo 120 caracteres').default(''),
  phone: z.string().max(40, 'Máximo 40 caracteres').default(''),
  email: emailOptional.default(''),
  isPrimary: z.boolean().default(false),
});

export type ProspectContactFormValues = z.infer<typeof prospectContactFormSchema>;

export function getDefaultProspectContactFormValues(): ProspectContactFormValues {
  return {
    name: '',
    role: '',
    phone: '',
    email: '',
    isPrimary: false,
  };
}

export function prospectContactFormValuesFromContact(contact: ProspectContact | null | undefined): ProspectContactFormValues {
  return {
    name: contact?.name ?? '',
    role: contact?.role ?? '',
    phone: contact?.phone ?? '',
    email: contact?.email ?? '',
    isPrimary: Boolean(contact?.isPrimary),
  };
}

export function prospectContactPayloadFromFormValues(
  values: ProspectContactFormValues
): {
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
} {
  return {
    name: values.name.trim(),
    role: values.role.trim() || null,
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    isPrimary: values.isPrimary,
  };
}

