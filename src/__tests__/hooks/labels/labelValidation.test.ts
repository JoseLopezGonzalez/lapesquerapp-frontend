import { describe, it, expect } from 'vitest';
import {
  validateLabelName,
  hasDuplicateFieldKeys,
  hasElementValidationError,
  hasAnyElementValidationErrors,
} from '@/hooks/labels/labelValidation';

describe('labelValidation', () => {
  it('validateLabelName returns error for empty', () => {
    expect(validateLabelName('')).toBeTruthy();
  });
  it('validateLabelName returns null for valid name', () => {
    expect(validateLabelName('Mi Etiqueta')).toBeNull();
  });
  it('hasDuplicateFieldKeys false for empty', () => {
    expect(hasDuplicateFieldKeys([])).toBe(false);
  });
  it('hasDuplicateFieldKeys true for duplicates', () => {
    expect(
      hasDuplicateFieldKeys([
        { type: 'manualField', key: 'A' } as Parameters<typeof hasDuplicateFieldKeys>[0][0],
        { type: 'manualField', key: 'A' } as Parameters<typeof hasDuplicateFieldKeys>[0][0],
      ])
    ).toBe(true);
  });
  it('hasElementValidationError true for empty key', () => {
    expect(
      hasElementValidationError({ type: 'manualField', key: '' } as Parameters<
        typeof hasElementValidationError
      >[0])
    ).toBe(true);
  });
  it('hasAnyElementValidationErrors false for empty', () => {
    expect(hasAnyElementValidationErrors([])).toBe(false);
  });
});
