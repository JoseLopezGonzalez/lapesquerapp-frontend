/**
 * Types for punch (fichaje) domain — Bloque 9 Fichajes
 */

export type PunchEventType = 'IN' | 'OUT';

export interface Punch {
  id: number;
  employee_id: number;
  employee_name?: string;
  event_type: PunchEventType;
  timestamp: string;
  device_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PunchesListParams {
  page?: number;
  perPage?: number;
  id?: number;
  ids?: number[];
  employee_id?: number;
  employee_ids?: number[];
  event_type?: PunchEventType;
  device_id?: string;
  date?: string;
  date_start?: string;
  date_end?: string;
  timestamp_start?: string;
  timestamp_end?: string;
}

export interface PunchesListResponse {
  data: Punch[];
  links: Record<string, string> | null;
  meta: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number;
    to?: number;
  } | null;
}

export interface PunchDayData {
  punches: Punch[];
  incidents?: unknown[];
  anomalies?: unknown[];
}

export interface PunchesByMonthResponse {
  year: number;
  month: number;
  punches_by_day: Record<number, PunchDayData | Punch[]>;
  total_punches: number;
  total_employees: number;
}
