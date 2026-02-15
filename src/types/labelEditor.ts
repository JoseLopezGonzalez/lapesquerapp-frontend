/**
 * Types for label editor and label API.
 */

export interface LabelCanvas {
  width: number;
  height: number;
  rotation?: number;
}

/** Element types in the editor (subset used in format) */
export type LabelElementType =
  | 'text'
  | 'field'
  | 'manualField'
  | 'selectField'
  | 'checkboxField'
  | 'dateField'
  | 'qr'
  | 'barcode'
  | 'image'
  | 'line'
  | 'sanitaryRegister'
  | 'richParagraph';

/** Minimal element shape for API format (allows extra props per type) */
export interface LabelElement {
  id: string;
  type: LabelElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  [key: string]: unknown;
}

export interface LabelFormat {
  elements: LabelElement[];
  canvas: LabelCanvas;
}

export interface Label {
  id: string;
  name: string;
  format: LabelFormat;
}

/** Draft for new label (no id, no format yet; canvas at top level) */
export interface LabelDraft {
  id: null;
  name: string;
  canvas: LabelCanvas;
}

/** API response wrapper for create/update (e.g. { data: Label }) */
export interface LabelApiResponse {
  data?: Label;
}

/** Definition of a label field (path → label + default value) */
export interface LabelFieldDef {
  label: string;
  defaultValue: string;
}

/** Map of field path to field definition */
export type LabelFieldsMap = Record<string, LabelFieldDef>;

/** Option for dropdowns (value + label) */
export interface LabelFieldOption {
  value: string;
  label: string;
}

/** Nested data context for preview (e.g. product.name, product.species.name) */
export type DataContext = Record<string, unknown>;
