'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { employeeService } from '@/services/domain/employees/employeeService';
import { getEmployees } from '@/services/employeeService';

export interface EmployeeOption {
  value: number | string;
  label: string;
  nfcUid?: string;
}

/**
 * Hook para opciones de empleados (Combobox/Select). React Query, tenant-aware.
 * Usado en IndividualPunchForm y otros formularios de fichajes.
 */
export function useEmployeeOptions(params: { name?: string } = {}) {
  const { data: session } = useSession();
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employees', 'options', tenantId ?? 'unknown', params],
    queryFn: () => employeeService.getOptions(params),
    enabled: !!session?.user?.accessToken && !!tenantId,
  });

  return {
    options: (data ?? []) as EmployeeOption[],
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

export interface EmployeesListParams {
  perPage?: number;
  page?: number;
  with_last_punch?: boolean;
  name?: string;
}

/**
 * Hook para lista de empleados (con último fichaje opcional). React Query, tenant-aware.
 * Usado en TimePunchManager y NFCPunchManager.
 */
export function useEmployeesWithLastPunch(params: EmployeesListParams = {}) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  const defaultParams = { perPage: 100, with_last_punch: true, ...params };

  interface EmployeesListResponse {
    data?: unknown[];
    links?: unknown;
    meta?: unknown;
  }

  const { data, isLoading, error, refetch } = useQuery<EmployeesListResponse>({
    queryKey: ['employees', 'list', tenantId ?? 'unknown', defaultParams],
    queryFn: () => {
      if (!token) throw new Error('No token');
      return getEmployees(token, defaultParams);
    },
    enabled: !!token && !!tenantId,
  });

  return {
    employees: (data?.data ?? []) as unknown[],
    links: data?.links ?? null,
    meta: data?.meta ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
