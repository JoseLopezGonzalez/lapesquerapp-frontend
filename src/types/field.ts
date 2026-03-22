export interface FieldCustomerOption {
  id: number | string;
  name: string;
  operationalStatus?: 'normal' | 'alta_operativa' | string | null;
}

export interface FieldProductOption {
  id: number | string;
  name: string;
  boxGtin?: string | null;
  species?: {
    id: number | string;
    name: string;
  } | null;
}

export interface FieldOrderLine {
  id?: number | string;
  product?: {
    id: number | string;
    name: string;
  } | null;
  tax?: {
    id: number | string;
    name?: string;
    percentage?: number;
  } | null;
  quantity?: number;
  boxes?: number;
  unitPrice?: number;
}

export interface FieldOrder {
  id: number | string;
  orderType?: 'standard' | 'autoventa' | string;
  status?: 'pending' | 'finished' | 'incident' | string;
  entryDate?: string | null;
  loadDate?: string | null;
  buyerReference?: string | null;
  customer?: {
    id: number | string;
    name: string;
  } | null;
  routeId?: number | string | null;
  routeStopId?: number | string | null;
  plannedProductDetails?: FieldOrderLine[];
  totalBoxes?: number;
  totalNetWeight?: number;
}

export interface RouteStop {
  id: number | string;
  position: number;
  stopType?: 'obligatoria' | 'sugerida' | 'oportunidad' | string;
  targetType?: 'customer' | 'prospect' | 'location' | string;
  customerId?: number | string | null;
  prospectId?: number | string | null;
  label?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: 'pending' | 'completed' | 'skipped' | string;
  resultType?: 'delivery' | 'autoventa' | 'no_contact' | 'incident' | 'visit' | string | null;
  resultNotes?: string | null;
  completedAt?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface DeliveryRoute {
  id: number | string;
  routeTemplateId?: number | string | null;
  name: string;
  description?: string | null;
  routeDate?: string | null;
  status?: string | null;
  fieldOperator?: {
    id: number | string;
    name: string;
  } | null;
  salesperson?: {
    id: number | string;
    name: string;
  } | null;
  stops?: RouteStop[];
}
