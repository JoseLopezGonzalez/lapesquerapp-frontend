/**
 * Opciones válidas para exportType en salidas de cebo.
 * Backend acepta: nullable | string | in:a3erp,facilcom
 * No usar value "" en SelectItem (Radix no lo permite); usamos sentinel para "por defecto".
 */
export const CEBO_EXPORT_TYPE_SENTINEL = '__default__';

export const CEBO_EXPORT_TYPE_OPTIONS = [
  { value: CEBO_EXPORT_TYPE_SENTINEL, label: 'Por defecto del proveedor' },
  { value: 'a3erp', label: 'A3ERP' },
  { value: 'facilcom', label: 'Facilcom' },
];

export const CEBO_EXPORT_TYPE_VALUES = ['a3erp', 'facilcom'];
