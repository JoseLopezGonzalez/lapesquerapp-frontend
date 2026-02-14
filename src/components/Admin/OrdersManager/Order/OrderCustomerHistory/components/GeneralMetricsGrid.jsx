'use client';

import { Card } from '@/components/ui/card';
import { Package, Coins, Clock, Calendar } from 'lucide-react';
import { formatDecimalCurrency } from '@/helpers/formats/numbers/formatNumbers';

export default function GeneralMetricsGrid({ metrics, variant = 'desktop' }) {
  if (!metrics) return null;

  const isMobile = variant === 'mobile';
  const gridClass = isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 md:grid-cols-4 gap-2';
  const cardClass = isMobile ? 'p-3 border-2' : 'p-3';
  const iconClass = isMobile ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5';
  const labelClass = isMobile ? 'text-xs font-medium text-muted-foreground' : 'text-xs text-muted-foreground';
  const valueClass = isMobile ? 'text-base font-bold' : 'text-xl font-semibold';
  const lastValueClass = isMobile ? 'text-base font-bold' : 'text-base font-semibold';

  const gapClass = isMobile ? 'gap-1' : 'gap-1.5';

  return (
    <div className={gridClass}>
      <Card className={cardClass}>
        <div className={`flex items-center ${gapClass} mb-1`}>
          <Package className={`${iconClass} text-muted-foreground`} />
          <span className={labelClass}>Total Pedidos</span>
        </div>
        <p className={valueClass}>{metrics.totalOrders}</p>
      </Card>
      <Card className={cardClass}>
        <div className={`flex items-center ${gapClass} mb-1`}>
          <Coins className={`${iconClass} text-muted-foreground`} />
          <span className={labelClass}>Valor Total</span>
        </div>
        <p className={valueClass}>{formatDecimalCurrency(metrics.totalAmount)}</p>
      </Card>
      <Card className={cardClass}>
        <div className={`flex items-center ${gapClass} mb-1`}>
          <Clock className={`${iconClass} text-muted-foreground`} />
          <span className={labelClass}>Frecuencia</span>
        </div>
        <p className={valueClass}>{metrics.avgDaysBetween} días</p>
      </Card>
      <Card className={cardClass}>
        <div className={`flex items-center ${gapClass} mb-1`}>
          <Calendar className={`${iconClass} text-muted-foreground`} />
          <span className={labelClass}>Último Pedido</span>
        </div>
        <p className={lastValueClass}>
          {metrics.daysSinceLastOrder !== null ? `Hace ${metrics.daysSinceLastOrder} días` : 'N/A'}
        </p>
      </Card>
    </div>
  );
}
