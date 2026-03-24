'use client';

import { useMemo } from 'react';
import {
    parseISO,
    isWithinInterval,
    differenceInDays,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
} from 'date-fns';
import { useCustomerOrderHistoryRanges } from './useCustomerOrderHistoryRanges';

/**
 * Hook para cargar y gestionar el historial de pedidos del cliente
 * @param {Object} order - Pedido actual (de OrderContext)
 * @returns {Object} Estado y funciones para el historial de cliente
 */
export function useCustomerHistory(order) {
    const customerId = order?.customer?.id;
    const {
        customerHistory,
        filteredHistory,
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
    } = useCustomerOrderHistoryRanges({
        customerId,
        enabled: true,
        notifyOnError: true,
    });

    const generalMetrics = useMemo(() => {
        if (!filteredHistory || filteredHistory.length === 0) return null;

        const allLines = filteredHistory.flatMap((p) => p.lines);
        const totalOrders = new Set(allLines.map((l) => l.order_id)).size;
        const totalAmount = filteredHistory.reduce((sum, p) => sum + (p.total_amount || 0), 0);

        const sortedDates = allLines
            .map((l) => parseISO(l.load_date))
            .sort((a, b) => a - b);

        let totalDays = 0;
        for (let i = 1; i < sortedDates.length; i++) {
            totalDays += differenceInDays(sortedDates[i], sortedDates[i - 1]);
        }
        const avgDaysBetween = sortedDates.length > 1 ? totalDays / (sortedDates.length - 1) : 0;
        const lastOrderDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;
        const daysSinceLastOrder = lastOrderDate ? differenceInDays(new Date(), lastOrderDate) : null;

        return {
            totalOrders,
            totalAmount,
            avgDaysBetween: Math.round(avgDaysBetween),
            daysSinceLastOrder,
            lastOrderDate,
        };
    }, [filteredHistory]);

    const calculateTrend = useMemo(() => {
        return (product) => {
            if (!product.lines || product.lines.length < 2 || !getDateRange) return { direction: 'stable', percentage: 0 };

            const currentPeriod = getDateRange;
            if (!currentPeriod.from || !currentPeriod.to) return { direction: 'stable', percentage: 0 };

            let previousPeriod = null;
            const now = new Date();
            const currentYearVal = now.getFullYear();

            switch (dateFilter) {
                case 'month': {
                    const currentMonth = subMonths(now, 1);
                    const previousMonth = subMonths(currentMonth, 1);
                    previousPeriod = {
                        from: startOfMonth(previousMonth),
                        to: endOfMonth(previousMonth),
                    };
                    break;
                }
                case 'quarter': {
                    const currentQuarterMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
                    const prevQuarterMonth = currentQuarterMonth - 3;
                    const prevQuarterYear = prevQuarterMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
                    const adjustedPrevQuarterMonth = prevQuarterMonth < 0 ? prevQuarterMonth + 12 : prevQuarterMonth;
                    previousPeriod = {
                        from: new Date(prevQuarterYear, adjustedPrevQuarterMonth, 1),
                        to: new Date(prevQuarterYear, adjustedPrevQuarterMonth + 3, 0),
                    };
                    break;
                }
                case 'year':
                    previousPeriod = {
                        from: startOfYear(new Date(currentYearVal - 1, 0, 1)),
                        to: endOfYear(new Date(currentYearVal - 1, 11, 31)),
                    };
                    break;
                case 'year-1':
                    previousPeriod = {
                        from: startOfYear(new Date(currentYearVal - 2, 0, 1)),
                        to: endOfYear(new Date(currentYearVal - 2, 11, 31)),
                    };
                    break;
                case 'year-select':
                    if (selectedYear) {
                        const year = parseInt(selectedYear, 10);
                        previousPeriod = {
                            from: startOfYear(new Date(year - 1, 0, 1)),
                            to: endOfYear(new Date(year - 1, 11, 31)),
                        };
                    }
                    break;
                default:
                    break;
            }

            if (!previousPeriod) return { direction: 'stable', percentage: 0 };

            const allLines = customerHistory.find((p) => p.product.id === product.product.id)?.lines || [];
            const currentPeriodLines = allLines.filter((l) => {
                const date = parseISO(l.load_date);
                return isWithinInterval(date, { start: currentPeriod.from, end: currentPeriod.to });
            });
            const previousPeriodLines = allLines.filter((l) => {
                const date = parseISO(l.load_date);
                return isWithinInterval(date, { start: previousPeriod.from, end: previousPeriod.to });
            });

            if (previousPeriodLines.length === 0) return { direction: 'stable', percentage: 0 };

            const currentPeriodTotal = currentPeriodLines.reduce((sum, l) => sum + (Number(l.net_weight) || 0), 0);
            const previousPeriodTotal = previousPeriodLines.reduce((sum, l) => sum + (Number(l.net_weight) || 0), 0);

            if (previousPeriodTotal === 0) return { direction: 'stable', percentage: 0 };

            const percentage = ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100;

            if (Math.abs(percentage) < 5) return { direction: 'stable', percentage: 0 };
            return {
                direction: percentage > 0 ? 'up' : 'down',
                percentage: Math.abs(percentage).toFixed(1),
            };
        };
    }, [getDateRange, dateFilter, selectedYear, customerHistory]);

    const getTrendTooltipText = () => {
        switch (dateFilter) {
            case 'month':
                return 'Variación de peso neto comparado con el mes anterior';
            case 'quarter':
                return 'Variación de peso neto comparado con el trimestre anterior';
            case 'year':
            case 'year-1':
            case 'year-select':
                return 'Variación de peso neto comparado con el año anterior';
            default:
                return 'Variación de peso neto comparado con el período anterior';
        }
    };

    return {
        customerHistory,
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
        filteredHistory,
        generalMetrics,
        calculateTrend,
        getTrendTooltipText,
    };
}
