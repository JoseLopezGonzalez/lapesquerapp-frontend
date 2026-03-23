const CUSTOMER_ASSIGNMENT_FIELDS = ['salesperson_id', 'field_operator_id', 'operational_status'];

export function splitCustomerPayload(data = {}) {
  const entityPayload = { ...data };

  delete entityPayload.field_operator_id;
  delete entityPayload.operational_status;

  const assignmentPayload = {
    salesperson_id: data.salesperson_id ? Number(data.salesperson_id) : null,
    field_operator_id: data.field_operator_id ? Number(data.field_operator_id) : null,
    operational_status: data.operational_status || 'normal',
  };

  return { entityPayload, assignmentPayload };
}

export function isCustomerAssignmentField(fieldName) {
  return CUSTOMER_ASSIGNMENT_FIELDS.includes(fieldName);
}
