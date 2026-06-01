'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrdersTotalAmountStats } from '@/hooks/useOrdersStats';
import { formatCurrency } from './utils';

export default function CommercialSalesSummaryCard() {
  const { data, isLoading } = useOrdersTotalAmountStats();

  if (isLoading) {
    return (
      <Card className="h-full rounded-2xl border bg-gradient-to-t from-neutral-100 to-white p-4 shadow-sm dark:from-neutral-800 dark:to-neutral-900">
        <CardHeader className="p-0">
          <Skeleton className="mb-3 h-4 w-28" />
          <Skeleton className="h-8 w-40" />
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-2xl border bg-gradient-to-t from-neutral-100 to-white p-4 shadow-sm dark:from-neutral-800 dark:to-neutral-900">
      <CardHeader className="p-0 pb-2">
        <CardDescription>Tus ventas este año</CardDescription>
        <CardTitle className="text-3xl font-medium tracking-tight">
          {formatCurrency(data?.subtotal ?? data?.value ?? 0)}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <p className="text-muted-foreground text-sm">
          {data?.value != null
            ? `${formatCurrency(data.value)} con IVA`
            : 'Sin datos suficientes para el periodo actual.'}
        </p>
      </CardContent>
    </Card>
  );
}
