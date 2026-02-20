/**
 * Opciones válidas para exportType en salidas de cebo.
 * Backend acepta: nullable | string | in:a3erp,facilcom
 */
export const CEBO_EXPORT_TYPE_OPTIONS = [
  { value: '', label: 'Por defecto del proveedor' },
  { value: 'a3erp', label: 'A3ERP' },
  { value: 'facilcom', label: 'Facilcom' },
];

export const CEBO_EXPORT_TYPE_VALUES = ['a3erp', 'facilcom'];
