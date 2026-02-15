/**
 * Types for product block (Bloque 4) — products, categories, families, species, etc.
 */

export interface ProductOption {
  id: number;
  name: string;
}

export interface ProductCategoryOption {
  value: number | string;
  label: string;
}

export interface ProductFamilyOption {
  value: number | string;
  label: string;
}

export interface SpeciesOption {
  value: number | string;
  label: string;
}

export interface CaptureZoneOption {
  value: number | string;
  label: string;
}

export interface FishingGearOption {
  value: number | string;
  label: string;
}
