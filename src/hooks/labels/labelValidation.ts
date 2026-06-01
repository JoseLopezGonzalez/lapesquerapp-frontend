import type { LabelElement } from '@/types/labelEditor';

export const KEY_FIELD_TYPES = ['manualField', 'selectField', 'checkboxField', 'dateField'];

export function validateLabelName(name: string | null | undefined): string | null {
  if (!name || name.trim().length === 0) return 'El nombre no puede estar vacío';
  if (name.length > 100) return 'El nombre no puede exceder 100 caracteres';
  if (!/^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ()]+$/.test(name))
    return 'El nombre contiene caracteres no permitidos';
  return null;
}

export function hasDuplicateFieldKeys(elementsList: LabelElement[]): boolean {
  const keys = new Set<string>();
  for (const el of elementsList || []) {
    if (!KEY_FIELD_TYPES.includes(el.type as string)) continue;
    const key = String(el.key || '').trim();
    if (!key) continue;
    if (keys.has(key)) return true;
    keys.add(key);
  }
  return false;
}

export function hasElementValidationError(el: LabelElement | null | undefined): boolean {
  if (!el) return false;
  if (KEY_FIELD_TYPES.includes(el.type as string) && String(el.key || '').trim() === '')
    return true;
  if (el.type === 'selectField') {
    const opts = Array.isArray(el.options) ? el.options : [];
    if (!opts.some((o) => String(o || '').trim() !== '')) return true;
  }
  return false;
}

export function getElementValidationErrorReason(
  el: LabelElement | null | undefined
): string | null {
  if (!el) return null;
  if (KEY_FIELD_TYPES.includes(el.type as string) && String(el.key || '').trim() === '')
    return 'key';
  if (el.type === 'selectField') {
    const opts = Array.isArray(el.options) ? el.options : [];
    if (!opts.some((o) => String(o || '').trim() !== '')) return 'options';
  }
  return null;
}

export function hasAnyElementValidationErrors(elementsList: LabelElement[]): boolean {
  return (elementsList || []).some((el) => hasElementValidationError(el));
}
