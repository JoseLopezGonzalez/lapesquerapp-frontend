import { z } from 'zod';
import { prospectOriginOptions } from '../utils';
import type { Prospect } from '@/types/crm';

const originValues = prospectOriginOptions.map((o) => o.value);

function normalizeOrigin(value: unknown): string {
  return typeof value === 'string' && originValues.includes(value) ? value : '';
}

const prospectStatusTuple = ['new', 'following', 'offer_sent', 'customer', 'discarded'] as const;

const emailOptional = z
  .string()
  .max(200, 'Máximo 200 caracteres')
  .refine((s) => {
    const t = s.trim();
    return !t || z.string().email().safeParse(t).success;
  }, 'Email no válido');

/**
 * @param isEditing - En edición el bloque de contacto no está en el formulario.
 */
export function getProspectFormSchema(isEditing: boolean) {
  return z
    .object({
      companyName: z
        .string()
        .trim()
        .min(1, 'El nombre de empresa es obligatorio')
        .max(255, 'Máximo 255 caracteres'),
      address: z.string().max(10000, 'Máximo 10.000 caracteres'),
      website: z.string().max(512, 'Máximo 512 caracteres'),
      countryId: z.string().min(1, 'Selecciona un país'),
      categoryId: z.string().trim().optional().catch(''),
      origin: z
        .string()
        .min(1, 'Selecciona un origen')
        .refine((v) => originValues.includes(v), { message: 'Selecciona un origen válido' }),
      status: z.enum(prospectStatusTuple),
      notes: z.string().max(5000, 'Máximo 5.000 caracteres'),
      commercialInterestNotes: z
        .string()
        .max(5000, 'Máximo 5.000 caracteres')
        .refine((s) => s.trim().length > 0, 'El interés comercial es obligatorio'),
      speciesInterest: z.string().max(5000, 'Máximo 5.000 caracteres'),
      includePrimaryContact: z.boolean(),
      primaryContactName: z.string().max(255, 'Máximo 255 caracteres'),
      primaryContactRole: z.string().max(120, 'Máximo 120 caracteres'),
      primaryContactPhone: z.string().max(40, 'Máximo 40 caracteres'),
      primaryContactEmail: emailOptional,
    })
    .superRefine((data, ctx) => {
      const parts = data.speciesInterest
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (parts.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Indica al menos una especie de interés (separadas por coma)',
          path: ['speciesInterest'],
        });
      }
      if (parts.length > 30) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Máximo 30 especies (separadas por coma)',
          path: ['speciesInterest'],
        });
      }
      if (parts.some((p) => p.length > 80)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cada especie admite como máximo 80 caracteres',
          path: ['speciesInterest'],
        });
      }

      if (!isEditing && data.includePrimaryContact) {
        const name = data.primaryContactName.trim();
        const phone = data.primaryContactPhone.trim();
        const email = data.primaryContactEmail.trim();
        if ((phone || email) && !name) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Indica el nombre del contacto si añades teléfono o email',
            path: ['primaryContactName'],
          });
        }
      }
    });
}

export type ProspectFormValues = z.infer<ReturnType<typeof getProspectFormSchema>>;

export function getDefaultProspectFormValues(): ProspectFormValues {
  return {
    companyName: '',
    address: '',
    website: '',
    countryId: '',
    categoryId: '',
    origin: '',
    status: 'new',
    notes: '',
    commercialInterestNotes: '',
    speciesInterest: '',
    includePrimaryContact: false,
    primaryContactName: '',
    primaryContactRole: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
  };
}

export function prospectFormValuesFromInitial(
  initialData: Prospect | null | undefined
): ProspectFormValues {
  if (!initialData) {
    return getDefaultProspectFormValues();
  }
  const countryId =
    initialData.country?.id != null
      ? String(initialData.country.id)
      : initialData.countryId != null
        ? String(initialData.countryId)
        : '';
  const categoryId =
    initialData.category?.id != null
      ? String(initialData.category.id)
      : initialData.categoryId != null
        ? String(initialData.categoryId)
        : '';
  const speciesStr = initialData.speciesInterest?.join(', ') ?? '';
  return {
    companyName: String(initialData.companyName ?? ''),
    address: initialData.address ?? '',
    website: initialData.website ?? '',
    countryId,
    categoryId,
    origin: normalizeOrigin(initialData.origin),
    status: prospectStatusTuple.includes(initialData.status as (typeof prospectStatusTuple)[number])
      ? (initialData.status as ProspectFormValues['status'])
      : 'new',
    notes: initialData.notes ?? '',
    commercialInterestNotes: initialData.commercialInterestNotes ?? '',
    speciesInterest: speciesStr,
    includePrimaryContact: false,
    primaryContactName: '',
    primaryContactRole: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
  };
}
