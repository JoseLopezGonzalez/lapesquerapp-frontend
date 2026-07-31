'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { AlertTriangle, Send } from 'lucide-react';
import { useOrderContext } from '@/context/OrderContext';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { useOrderMaritimeContainers } from '@/hooks/orders/useOrderMaritimeContainers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MaritimeShippingDetailForm from './MaritimeShippingDetailForm';
import MaritimeContainersList from './MaritimeContainersList';
import SendMaritimeExportDocumentsDialog from './SendMaritimeExportDocumentsDialog';

interface OrderMaritimeExportProps {
  readOnly?: boolean;
  canViewCostData?: boolean;
}

const OrderMaritimeExport = ({ readOnly = false }: OrderMaritimeExportProps) => {
  const { order } = useOrderContext();
  const { isMobile, mounted } = useIsMobileSafe();
  const { data: session } = useSession();
  const rawRole = session?.user?.role;
  const roles = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];
  const canSendDocuments = !roles.includes('comercial');
  const { containers } = useOrderMaritimeContainers(order?.id, { enabled: canSendDocuments });
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const customerEmails = (order as { emails?: string[] } | null)?.emails ?? [];
  const hasCustomerEmail = customerEmails.length > 0;

  if (!mounted) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div
          className={isMobile ? 'flex flex-col gap-4 pb-4' : 'grid gap-4 pb-4 lg:grid-cols-2'}
        >
          {!readOnly && canSendDocuments && (
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-lg font-medium">
                    Documentación para el cliente
                  </CardTitle>
                  <CardDescription>
                    Envía un email con mensaje libre, el Export Packing List de todos los
                    contenedores y los adjuntos que elijas.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  className="shrink-0"
                  disabled={!hasCustomerEmail}
                  title={
                    !hasCustomerEmail
                      ? 'El cliente de este pedido no tiene ningún email configurado'
                      : undefined
                  }
                  onClick={() => setSendDialogOpen(true)}
                >
                  <Send />
                  Enviar documentación al cliente
                </Button>
              </CardHeader>
              {(!hasCustomerEmail || containers.length === 0) && (
                <CardContent className="flex flex-col gap-2">
                  {!hasCustomerEmail && (
                    <div className="border-destructive/30 bg-destructive/10 text-destructive-foreground flex items-start gap-2 rounded-md border p-2 text-xs">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                      <span>
                        El cliente no tiene ningún email configurado. Añade uno antes de enviar.
                      </span>
                    </div>
                  )}
                  {hasCustomerEmail && containers.length === 0 && (
                    <div className="border-warning/30 bg-warning/10 text-warning-foreground flex items-start gap-2 rounded-md border p-2 text-xs">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                      <span>
                        Este pedido no tiene contenedores registrados: el email se enviará sin
                        Export Packing List.
                      </span>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}
          <MaritimeShippingDetailForm orderId={order?.id} readOnly={readOnly} />
          <MaritimeContainersList orderId={order?.id} readOnly={readOnly} />
        </div>
      </ScrollArea>

      {order?.id && (
        <SendMaritimeExportDocumentsDialog
          orderId={order.id}
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
        />
      )}
    </div>
  );
};

export default OrderMaritimeExport;
