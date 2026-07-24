import { format } from 'date-fns';

const DATE_FIELDS = new Set<string>(['entryDate', 'loadDate']);
const NULLABLE_INTEGER_FIELDS = new Set<string>(['fieldOperator', 'externalProcessor']);
const NULLABLE_STRING_FIELDS = new Set<string>(['maquiladorDestination', 'loadingAddress']);
const BOOLEAN_FIELDS = new Set<string>(['invoiced']);
// These fields must always travel together — sending one without the other clears the other on the API
const EMAIL_COUPLED_FIELDS = new Set<string>(['emails', 'ccEmails']);

export function buildOrderEditPayload(
  data: Record<string, unknown> = {},
  dirtyFields: Record<string, unknown> = {}
): Record<string, unknown> {
  const payload = Object.keys(dirtyFields).reduce<Record<string, unknown>>((acc, fieldName) => {
    const fieldValue = data[fieldName];

    if (EMAIL_COUPLED_FIELDS.has(fieldName)) {
      // Handled below as a coupled pair
      return acc;
    }

    if (DATE_FIELDS.has(fieldName)) {
      acc[fieldName] =
        fieldValue instanceof Date ? format(fieldValue, 'yyyy-MM-dd') : fieldValue;
      return acc;
    }

    if (NULLABLE_INTEGER_FIELDS.has(fieldName)) {
      acc[fieldName] = fieldValue ? parseInt(String(fieldValue), 10) : null;
      return acc;
    }

    if (NULLABLE_STRING_FIELDS.has(fieldName)) {
      acc[fieldName] = fieldValue ? String(fieldValue) : null;
      return acc;
    }

    if (BOOLEAN_FIELDS.has(fieldName)) {
      acc[fieldName] = fieldValue === 'true';
      return acc;
    }

    acc[fieldName] = fieldValue;
    return acc;
  }, {});

  // If any email field changed, always include both so the API doesn't clear the untouched one
  const hasAnyEmailDirty = [...EMAIL_COUPLED_FIELDS].some((f) => f in dirtyFields);
  if (hasAnyEmailDirty) {
    EMAIL_COUPLED_FIELDS.forEach((f) => {
      payload[f] = Array.isArray(data[f]) ? data[f] : [];
    });
  }

  return payload;
}
