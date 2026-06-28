'use client';

import { useQueries } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { crmDashboardKeys } from '@/lib/routes/queryKeys';
import { crmService } from '@/services/crmService';
import type { CrmDashboardData } from '@/types/crm';

export function useCrmDashboard() {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  const enabled = !!tenantId;

  const [pendingActionsQuery, customersQuery, prospectsQuery] = useQueries({
    queries: [
      {
        queryKey: crmDashboardKeys.pendingActions(tenantId),
        queryFn: () => crmService.getCrmPendingActions(),
        enabled,
      },
      {
        queryKey: crmDashboardKeys.customers(tenantId),
        queryFn: () => crmService.getCrmCustomersData(),
        enabled,
      },
      {
        queryKey: crmDashboardKeys.prospects(tenantId),
        queryFn: () => crmService.getCrmProspectsData(),
        enabled,
      },
    ],
  });

  const mergedData: CrmDashboardData | null =
    pendingActionsQuery.data?.data || customersQuery.data?.data || prospectsQuery.data?.data
      ? {
          reminders_today: pendingActionsQuery.data?.data?.reminders_today ?? [],
          overdue_actions: pendingActionsQuery.data?.data?.overdue_actions ?? [],
          inactive_customers: customersQuery.data?.data?.inactive_customers ?? [],
          prospects_without_activity: prospectsQuery.data?.data?.prospects_without_activity ?? [],
          counters: {
            remindersToday: pendingActionsQuery.data?.data?.counters?.remindersToday ?? 0,
            overdueActions: pendingActionsQuery.data?.data?.counters?.overdueActions ?? 0,
            inactiveCustomers: customersQuery.data?.data?.counters?.inactiveCustomers ?? 0,
            prospectsWithoutActivity:
              prospectsQuery.data?.data?.counters?.prospectsWithoutActivity ?? 0,
          },
        }
      : null;

  const error =
    pendingActionsQuery.error?.message ??
    customersQuery.error?.message ??
    prospectsQuery.error?.message ??
    null;

  const isLoading =
    pendingActionsQuery.isLoading || customersQuery.isLoading || prospectsQuery.isLoading;
  const refetch = async () => {
    await Promise.all([
      pendingActionsQuery.refetch(),
      customersQuery.refetch(),
      prospectsQuery.refetch(),
    ]);
  };

  return {
    data: mergedData,
    isLoading,
    error,
    refetch,
  };
}
