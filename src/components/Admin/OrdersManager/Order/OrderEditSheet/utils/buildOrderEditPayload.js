import { format } from 'date-fns';

const DATE_FIELDS = new Set(['entryDate', 'loadDate']);
const NULLABLE_INTEGER_FIELDS = new Set(['fieldOperator']);

export function buildOrderEditPayload(data = {}, dirtyFields = {}) {
  return Object.keys(dirtyFields).reduce((payload, fieldName) => {
    const fieldValue = data[fieldName];

    if (DATE_FIELDS.has(fieldName)) {
      payload[fieldName] =
        fieldValue instanceof Date ? format(fieldValue, 'yyyy-MM-dd') : fieldValue;
      return payload;
    }

    if (NULLABLE_INTEGER_FIELDS.has(fieldName)) {
      payload[fieldName] = fieldValue ? parseInt(fieldValue, 10) : null;
      return payload;
    }

    payload[fieldName] = fieldValue;
    return payload;
  }, {});
}
