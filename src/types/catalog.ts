/**
 * Types for auxiliary catalogs — Bloque 10 Catálogos auxiliares (transportes, incoterms, comerciales)
 */

/** Meta for paginated list responses (Laravel-style) */
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

/** Transport record from API */
export interface Transport {
  id: number | string;
  name: string;
  address?: string;
  [key: string]: unknown;
}

/** Incoterm record from API */
export interface Incoterm {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

/** Salesperson (comercial) record from API */
export interface Salesperson {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

/** Paginated list response */
export interface CatalogListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Generic list filters for catalog entities */
export interface CatalogListFilters {
  _requiredRelations?: string[];
  [key: string]: unknown;
}

/** Autocomplete option (value/label) */
export interface CatalogOption {
  value: number | string;
  label: string;
}

/** Customer (cliente) — Bloque 5 */
export interface Customer {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

/** Payment term (forma de pago) — Bloque 5 */
export interface PaymentTerm {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

/** Country (país) — Bloque 5 */
export interface Country {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

/** Supplier (proveedor) — Bloque 6 */
export interface Supplier {
  id: number | string;
  name: string;
  [key: string]: unknown;
}
