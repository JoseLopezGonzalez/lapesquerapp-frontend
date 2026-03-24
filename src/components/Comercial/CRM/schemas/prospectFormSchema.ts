import { z } from 'zod';
import { prospectOriginOptions } from '../utils';

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
      address: z.string().max(10000, 'Máximo 10.000 caracteres').default(''),
      website: z.string().max(512, 'Máximo 512 caracteres').default(''),
      countryId: z.string().min(1, 'Selecciona un país'),
      origin: z
        .string()
        .min(1, 'Selecciona un origen')
        .refine((v) => originValues.includes(v), { message: 'Selecciona un origen válido' }),
      status: z.enum(prospectStatusTuple),
      notes: z.string().max(5000, 'Máximo 5.000 caracteres').default(''),
      commercialInterestNotes: z
        .string()
        .max(5000, 'Máximo 5.000 caracteres')
        .refine((s) => s.trim().length > 0, 'El interés comercial es obligatorio'),
      nextActionAt: z.date().nullable().optional(),
      nextActionNote: z.string().max(255, 'Máximo 255 caracteres').default(''),
      /** Si es true, debe indicarse fecha de próxima acción. */
      scheduleNextAction: z.boolean().default(false),
      speciesInterest: z.string().max(5000, 'Máximo 5.000 caracteres').default(''),
      includePrimaryContact: z.boolean().default(false),
      primaryContactName: z.string().max(255, 'Máximo 255 caracteres').default(''),
      primaryContactRole: z.string().max(120, 'Máximo 120 caracteres').default(''),
      primaryContactPhone: z.string().max(40, 'Máximo 40 caracteres').default(''),
      primaryContactEmail: emailOptional.default(''),
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

      if (data.scheduleNextAction && !data.nextActionAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecciona una fecha para la próxima acción',
          path: ['nextActionAt'],
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
    origin: '',
    status: 'new',
    notes: '',
    commercialInterestNotes: '',
    nextActionAt: null,
    nextActionNote: '',
    scheduleNextAction: false,
    speciesInterest: '',
    includePrimaryContact: false,
    primaryContactName: '',
    primaryContactRole: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
  };
}

export function prospectFormValuesFromInitial(initialData: Record<string, unknown> | null | undefined): ProspectFormValues {
  if (!initialData) {
    return getDefaultProspectFormValues();
  }
  const country = initialData.country as { id?: unknown } | null | undefined;
  const countryId =
    country?.id != null
      ? String(country.id)
      : initialData.countryId != null
        ? String(initialData.countryId)
        : '';
  const species = initialData.speciesInterest;
  const speciesStr = Array.isArray(species) ? species.join(', ') : '';
  const nextActionAt = initialData.nextActionAt ? new Date(String(initialData.nextActionAt)) : null;
  const nextActionNote = typeof initialData.nextActionNote === 'string' ? initialData.nextActionNote : '';
  const scheduleNextAction = Boolean(nextActionAt || nextActionNote.trim());

  return {
    companyName: String(initialData.companyName ?? ''),
    address: typeof initialData.address === 'string' ? initialData.address : '',
    website: typeof initialData.website === 'string' ? initialData.website : '',
    countryId,
    origin: normalizeOrigin(initialData.origin),
    status:
      typeof initialData.status === 'string' && prospectStatusTuple.includes(initialData.status as (typeof prospectStatusTuple)[number])
        ? (initialData.status as ProspectFormValues['status'])
        : 'new',
    notes: typeof initialData.notes === 'string' ? initialData.notes : '',
    commercialInterestNotes:
      typeof initialData.commercialInterestNotes === 'string' ? initialData.commercialInterestNotes : '',
    nextActionAt,
    nextActionNote,
    scheduleNextAction,
    speciesInterest: speciesStr,
    includePrimaryContact: false,
    primaryContactName: '',
    primaryContactRole: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
  };
}
