import { z } from 'zod';
import { interactionResultOptions, interactionTypeOptions } from '../utils';
import { CRM_INTERACTION_SUMMARY_MAX_LENGTH } from './crmTextLimits';

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
        .max(
          CRM_INTERACTION_SUMMARY_MAX_LENGTH,
          `Máximo ${CRM_INTERACTION_SUMMARY_MAX_LENGTH} caracteres`
        ),
    })
    .superRefine(() => {
      // Sin reglas de próxima acción: ahora siempre se gestiona fuera del formulario.
      if (isCompleteMode) return;
    });
}

export type QuickInteractionFormValues = z.infer<ReturnType<typeof getQuickInteractionFormSchema>>;

export function getQuickInteractionDefaultValues({
  isCompleteMode,
  defaultNextActionDate: _defaultNextActionDate,
  defaultNextActionNote: _defaultNextActionNote,
}: {
  isCompleteMode: boolean;
  defaultNextActionDate: string | null;
  defaultNextActionNote: string;
}) {
  return {
    type: undefined as unknown as QuickInteractionFormValues['type'],
    result: undefined as unknown as QuickInteractionFormValues['result'],
    occurredAt: new Date(),
    summary: '',
  };
}
