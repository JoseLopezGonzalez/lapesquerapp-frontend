import { z } from 'zod';
import { interactionResultOptions, interactionTypeOptions } from '../utils';
import { CRM_AGENDA_DESCRIPTION_MAX_LENGTH, CRM_INTERACTION_SUMMARY_MAX_LENGTH } from './crmTextLimits';

function asEnumTuple(values: string[]) {
  return values as [string, ...string[]];
}

const interactionTypeValues = asEnumTuple(interactionTypeOptions.map((o) => o.value));
const interactionResultValues = asEnumTuple(interactionResultOptions.map((o) => o.value));

export function getQuickInteractionFormSchema(isCompleteMode: boolean) {
  return z
    .object({
      type: z.enum(interactionTypeValues, { required_error: 'Selecciona un tipo' }),
      result: z.enum(interactionResultValues, { required_error: 'Selecciona un resultado' }),
      occurredAt: z.date(),
      summary: z
        .string()
        .trim()
        .min(1, 'El resumen es obligatorio')
        .max(CRM_INTERACTION_SUMMARY_MAX_LENGTH, `Máximo ${CRM_INTERACTION_SUMMARY_MAX_LENGTH} caracteres`),

      // create mode
      noNextAction: z.boolean().default(false),

      // complete mode
      scheduleNextAction: z.boolean().default(false),

      nextActionAt: z.date().nullable().optional(),
      nextActionNote: z
        .string()
        .max(CRM_AGENDA_DESCRIPTION_MAX_LENGTH, `Máximo ${CRM_AGENDA_DESCRIPTION_MAX_LENGTH} caracteres`)
        .default(''),
    })
    .superRefine((data, ctx) => {
      if (isCompleteMode && data.result === 'not_interested') return;

      const shouldSendNextAction = isCompleteMode ? data.scheduleNextAction : !data.noNextAction;

      if (shouldSendNextAction && !data.nextActionAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecciona una fecha para la próxima acción',
          path: ['nextActionAt'],
        });
      }
    });
}

export type QuickInteractionFormValues = z.infer<ReturnType<typeof getQuickInteractionFormSchema>>;

export function getQuickInteractionDefaultValues({
  isCompleteMode,
  defaultNextActionDate,
  defaultNextActionNote,
}: {
  isCompleteMode: boolean;
  defaultNextActionDate: string | null;
  defaultNextActionNote: string;
}): QuickInteractionFormValues {
  return {
    type: 'call',
    result: 'pending',
    occurredAt: new Date(),
    summary: '',
    noNextAction: isCompleteMode,
    scheduleNextAction: false,
    nextActionAt: isCompleteMode ? null : (defaultNextActionDate ? new Date(defaultNextActionDate) : null),
    nextActionNote: isCompleteMode
      ? ''
      : (defaultNextActionNote ?? '').slice(0, CRM_AGENDA_DESCRIPTION_MAX_LENGTH),
  };
}

