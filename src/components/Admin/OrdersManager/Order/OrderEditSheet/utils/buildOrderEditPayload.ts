import { format } from 'date-fns';

const DATE_FIELDS = new Set<string>(['entryDate', 'loadDate']);
const NULLABLE_INTEGER_FIELDS = new Set<string>(['fieldOperator', 'externalProcessor']);

export function buildOrderEditPayload(
  data: Record<string, unknown> = {},
  dirtyFields: Record<string, unknown> = {}
): Record<string, unknown> {
  return Object.keys(dirtyFields).reduce<Record<string, unknown>>((payload, fieldName) => {
    const fieldValue = data[fieldName];

    if (DATE_FIELDS.has(fieldName)) {
      payload[fieldName] =
        fieldValue instanceof Date ? format(fieldValue, 'yyyy-MM-dd') : fieldValue;
      return payload;
    }

    if (NULLABLE_INTEGER_FIELDS.has(fieldName)) {
      payload[fieldName] = fieldValue ? parseInt(String(fieldValue), 10) : null;
      return payload;
    }

    payload[fieldName] = fieldValue;
    return payload;
  }, {});
}
