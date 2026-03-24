'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { format as formatDate, parseISO, isWithinInterval, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { getCustomerOrderHistory, getCustomerOrderHistoryRanges } from '@/services/customerService';
import { notify } from '@/lib/notifications';

function getInitialFilterFromRanges(lastOrderDate, availableYears) {
  if (lastOrderDate) {
    const now = new Date();
    const parsedLastOrderDate = parseISO(lastOrderDate);
    const previousMonth = subMonths(now, 1);
    const previousQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
    const previousQuarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 0);

    if (
      parsedLastOrderDate.getFullYear() === previousMonth.getFullYear()
      && parsedLastOrderDate.getMonth() === previousMonth.getMonth()
    ) {
      return { dateFilter: 'month', selectedYear: null };
    }

    if (isWithinInterval(parsedLastOrderDate, { start: previousQuarterStart, end: previousQuarterEnd })) {
      return { dateFilter: 'quarter', selectedYear: null };
    }
  }

  const currentYear = new Date().getFullYear();
  if (availableYears.includes(currentYear)) {
    return { dateFilter: 'year', selectedYear: null };
  }

  if (availableYears.includes(currentYear - 1)) {
    return { dateFilter: 'year-1', selectedYear: null };
  }

  if (availableYears.length > 0) {
    return { dateFilter: 'year-select', selectedYear: availableYears[0] };
  }

  return { dateFilter: 'month', selectedYear: null };
}

export function useCustomerOrderHistoryRanges({ customerId, enabled = true, notifyOnError = true }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [customerHistory, setCustomerHistory] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonthsByYear, setAvailableMonthsByYear] = useState({});
  const [firstOrderDate, setFirstOrderDate] = useState(null);
  const [lastOrderDate, setLastOrderDate] = useState(null);
  const [initialLoading, setInitialLoading] = useState(Boolean(enabled));
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('month');
  const [selectedYear, setSelectedYear] = useState(null);
  const [isRangeReady, setIsRangeReady] = useState(false);
  const [hasHistoryRanges, setHasHistoryRanges] = useState(null);

  const getDateRange = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    switch (dateFilter) {
      case 'month':
        return { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
      case 'quarter': {
        const quarterStart = new Date(currentYear, Math.floor(now.getMonth() / 3) * 3 - 3, 1);
        const quarterEnd = new Date(currentYear, Math.floor(now.getMonth() / 3) * 3, 0);
        return { from: quarterStart, to: quarterEnd };
      }
      case 'year':
        return { from: new Date(currentYear, 0, 1), to: new Date(currentYear, 11, 31) };
      case 'year-1':
        return { from: new Date(currentYear - 1, 0, 1), to: new Date(currentYear - 1, 11, 31) };
      case 'year-select':
        if (selectedYear) {
          return { from: new Date(selectedYear, 0, 1), to: new Date(selectedYear, 11, 31) };
        }
        return null;
      default:
        return null;
    }
  }, [dateFilter, selectedYear]);

  useEffect(() => {
    if (!enabled) {
      setInitialLoading(false);
      return;
    }

    const initializeRanges = async () => {
      setIsRangeReady(false);
      setHasHistoryRanges(null);

      if (!customerId || !token) {
        return;
      }

      try {
        const result = await getCustomerOrderHistoryRanges(customerId, token);
        const rangesData = result?.data || {};
        const rangesAvailableYears = rangesData.available_years || [];

        setAvailableYears(rangesAvailableYears);
        setAvailableMonthsByYear(rangesData.available_months_by_year || {});
        setFirstOrderDate(rangesData.first_order_date || null);
        setLastOrderDate(rangesData.last_order_date || null);

        if (rangesAvailableYears.length === 0) {
          setHasHistoryRanges(false);
          setCustomerHistory([]);
          setInitialLoading(false);
          return;
        }

        const initialFilter = getInitialFilterFromRanges(
          rangesData.last_order_date,
          rangesAvailableYears
        );
        setDateFilter(initialFilter.dateFilter);
        setSelectedYear(initialFilter.selectedYear);
        setHasHistoryRanges(true);
      } catch (err) {
        console.error('Error al cargar rangos de historial, se aplicará fallback:', err);
        setHasHistoryRanges(true);
        setAvailableYears([]);
        setAvailableMonthsByYear({});
        setFirstOrderDate(null);
        setLastOrderDate(null);
      } finally {
        setIsRangeReady(true);
      }
    };

    initializeRanges();
  }, [customerId, token, enabled]);

  useEffect(() => {
    if (!enabled || !isRangeReady) {
      return;
    }

    const loadCustomerHistory = async () => {
      if (hasHistoryRanges === false) {
        setInitialLoading(false);
        setLoadingData(false);
        return;
      }

      if (!customerId) {
        setError('No se pudo obtener el ID del cliente');
        setInitialLoading(false);
        return;
      }

      if (!token) {
        setError('No se pudo obtener el token de autenticación');
        setInitialLoading(false);
        return;
      }

      try {
        setError(null);
        if (customerHistory.length > 0) {
          setLoadingData(true);
        } else {
          setInitialLoading(true);
        }

        const dateRange = getDateRange;
        const options = {};
        if (dateRange && dateRange.from && dateRange.to) {
          options.dateFrom = formatDate(dateRange.from, 'yyyy-MM-dd');
          options.dateTo = formatDate(dateRange.to, 'yyyy-MM-dd');
        } else {
          setCustomerHistory([]);
          setLoadingData(false);
          setInitialLoading(false);
          return;
        }

        const result = await getCustomerOrderHistory(customerId, token, options);
        setCustomerHistory(result.data || []);
        if (result.available_years?.length > 0) {
          setAvailableYears(result.available_years);
        }
      } catch (err) {
        const errorMessage = err.message || 'Error al cargar el historial del cliente';
        setError(errorMessage);
        if (notifyOnError) {
          notify.error({ title: errorMessage });
        }
        setCustomerHistory((prev) => (prev.length === 0 ? [] : prev));
      } finally {
        setInitialLoading(false);
        setLoadingData(false);
      }
    };

    loadCustomerHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- customerHistory used only to decide loading state, not as trigger
  }, [customerId, token, getDateRange, isRangeReady, hasHistoryRanges, enabled]);

  const currentYear = new Date().getFullYear();
  const hasCurrentYear = availableYears.includes(currentYear);
  const hasYear1 = availableYears.includes(currentYear - 1);
  const yearsForSelector = availableYears.filter((year) => year < currentYear - 1);

  return {
    customerHistory,
    filteredHistory: customerHistory,
    availableYears,
    availableMonthsByYear,
    firstOrderDate,
    lastOrderDate,
    initialLoading,
    loadingData,
    error,
    dateFilter,
    setDateFilter,
    selectedYear,
    setSelectedYear,
    getDateRange,
    currentYear,
    hasCurrentYear,
    hasYear1,
    yearsForSelector,
    hasHistoryRanges,
  };
}
