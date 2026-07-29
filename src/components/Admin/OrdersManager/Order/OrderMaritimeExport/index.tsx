'use client';

import { useOrderContext } from '@/context/OrderContext';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import MaritimeShippingDetailForm from './MaritimeShippingDetailForm';
import MaritimeContainersList from './MaritimeContainersList';

interface OrderMaritimeExportProps {
  readOnly?: boolean;
  canViewCostData?: boolean;
}

const OrderMaritimeExport = ({ readOnly = false }: OrderMaritimeExportProps) => {
  const { order } = useOrderContext();
  const { isMobile, mounted } = useIsMobileSafe();

  if (!mounted) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div
          className={isMobile ? 'flex flex-col gap-4 pb-4' : 'grid gap-4 pb-4 lg:grid-cols-2'}
        >
          <MaritimeShippingDetailForm orderId={order?.id} readOnly={readOnly} />
          <MaritimeContainersList orderId={order?.id} readOnly={readOnly} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default OrderMaritimeExport;
