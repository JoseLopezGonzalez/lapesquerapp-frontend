'use client';

import Link from 'next/link';
import { Printer, MoreVertical, Bookmark, Copy, Ban, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StatusBadge from '../../StatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import OrderEditSheet from '../OrderEditSheet';
import OrderStatusDropdown from './OrderStatusDropdown';
import OrderTemperatureDropdown from './OrderTemperatureDropdown';

const STATUS_COLORS = { pending: 'orange', finished: 'green', incident: 'red' };
const STATUS_LABELS = {
  pending: 'En producción',
  finished: 'Terminado',
  incident: 'Incidencia',
};

/**
 * Header desktop: estado, id, cliente, fecha, temperatura; botones Editar/Imprimir/⋮; imagen transporte
 */
export default function OrderHeaderDesktop({
  order,
  transportImage,
  onStatusChange,
  onTemperatureChange,
  onPrint,
  readOnly = false,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {readOnly ? (
            <StatusBadge
              color={STATUS_COLORS[order.status] ?? 'green'}
              label={STATUS_LABELS[order.status] ?? order.status}
            />
          ) : (
            <OrderStatusDropdown status={order.status} onStatusChange={onStatusChange} />
          )}
          {(order?.orderType ?? order?.order_type) === 'autoventa' && (
            <Badge variant="outline" aria-label="Tipo de pedido: Autoventa">
              Autoventa
              <Bookmark data-icon="inline-end" />
            </Badge>
          )}
        </div>
        <h3 className="text-base font-medium">#{order.id}</h3>
        <div>
          <p>
            <span className="text-base font-medium">{order.customer?.name ?? '—'}</span>
            <br />
            <span className="text-sm text-muted-foreground">Cliente Nº {order.customer?.id ?? '—'}</span>
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Fecha de Carga</p>
          <p className="text-sm font-medium">{formatDate(order.loadDate)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Temperatura</p>
          {readOnly ? <p className="text-sm font-medium">{order.temperature ?? '-'}</p> : (
            <OrderTemperatureDropdown
              temperature={order.temperature}
              onTemperatureChange={onTemperatureChange}
            />
          )}
        </div>
        {order?.offerId && (
          <div>
            <p className="text-sm text-muted-foreground">Oferta vinculada</p>
            <Link href={`/comercial/ofertas/${order.offerId}`} className="text-sm font-medium text-primary hover:underline">
              Ver oferta #{order.offerId}
            </Link>
          </div>
        )}
      </div>
      <div className="hidden lg:flex flex-row gap-2 h-fit pt-2">
        <div className="flex flex-col max-w-sm justify-end items-end gap-3">
          <div className="flex gap-2">
            {!readOnly && <OrderEditSheet />}
            <Button variant="outline" onClick={onPrint}>
              <Printer />
              Imprimir
            </Button>
            {!readOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Abrir menú de acciones">
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <Copy />
                      Duplicar pedido
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Ban />
                      Cancelar pedido
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem variant="destructive">
                      <Trash2 />
                      Eliminar pedido
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="flex flex-col items-end justify-center">
            <img
              className="max-w-[240px]"
              src={transportImage}
              alt={`Transporte ${order.transport?.name || ''}`}
            />
            <p className="text-base font-medium">{order.transport?.name || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
