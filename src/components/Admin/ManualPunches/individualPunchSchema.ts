import { z } from 'zod';

const baseShape = {
  employee_id: z.string().min(1, 'El empleado es obligatorio'),
  event_type: z.enum(['IN', 'OUT']).optional(),
  timestamp: z
    .string()
    .min(1, 'La fecha y hora son obligatorias')
    .refine((val) => !Number.isNaN(new Date(val).getTime()), 'La fecha y hora no son válidas'),
  exitTimestamp: z.string().optional(),
};

/**
 * Schema para formulario de fichaje individual. Recibe isFullSession para validación condicional.
 */
export function getIndividualPunchSchema(isFullSession: boolean) {
  return z.object(baseShape).superRefine((data, ctx) => {
    if (isFullSession) {
      if (!data.exitTimestamp?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha y hora de salida son obligatorias',
          path: ['exitTimestamp'],
        });
        return;
      }
      const exitDate = new Date(data.exitTimestamp);
      const entryDate = new Date(data.timestamp);
      if (Number.isNaN(exitDate.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha y hora de salida no son válidas',
          path: ['exitTimestamp'],
        });
      } else if (exitDate <= entryDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La hora de salida debe ser posterior a la de entrada',
          path: ['exitTimestamp'],
        });
      }
    } else {
      if (!data.event_type || !['IN', 'OUT'].includes(data.event_type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El tipo de evento debe ser Entrada o Salida',
          path: ['event_type'],
        });
      }
    }
  });
}

export type IndividualPunchFormValues = {
  employee_id: string;
  event_type?: 'IN' | 'OUT';
  timestamp: string;
  exitTimestamp?: string;
};

/** Valores por defecto para timestamp y exitTimestamp (ahora + ahora+8h o 17:00 mismo día) */
export function getDefaultTimestampValues() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const datetimeLocal = `${y}-${m}-${d}T${h}:${min}`;

  const exitDate = new Date(now);
  exitDate.setHours(exitDate.getHours() + 8);
  const isNextDay = exitDate.getDate() !== now.getDate();
  const exitHour = exitDate.getHours();
  if (isNextDay && exitHour < 6) {
    exitDate.setDate(now.getDate());
    exitDate.setMonth(now.getMonth());
    exitDate.setFullYear(now.getFullYear());
    exitDate.setHours(17, 0, 0, 0);
  }
  const ey = exitDate.getFullYear();
  const em = String(exitDate.getMonth() + 1).padStart(2, '0');
  const ed = String(exitDate.getDate()).padStart(2, '0');
  const eh = String(exitDate.getHours()).padStart(2, '0');
  const emin = String(exitDate.getMinutes()).padStart(2, '0');
  const exitDatetimeLocal = `${ey}-${em}-${ed}T${eh}:${emin}`;

  return {
    employee_id: '',
    event_type: undefined as 'IN' | 'OUT' | undefined,
    timestamp: datetimeLocal,
    exitTimestamp: exitDatetimeLocal,
  };
}
