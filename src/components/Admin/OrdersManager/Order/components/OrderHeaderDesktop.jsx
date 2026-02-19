'use client';

import { Printer, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import OrderEditSheet from '../OrderEditSheet';
import OrderStatusDropdown from './OrderStatusDropdown';
import OrderTemperatureDropdown from './OrderTemperatureDropdown';

/**
 * Header desktop: estado, id, cliente, fecha, temperatura; botones Editar/Imprimir/⋮; imagen transporte
 */
export default function OrderHeaderDesktop({
  order,
  transportImage,
  onStatusChange,
  onTemperatureChange,
  onPrint,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-0 sm:-mt-6 lg:-mt-2">
      <div className="space-y-1 flex-1">
        <OrderStatusDropdown status={order.status} onStatusChange={onStatusChange} />
        <h3 className="text-lg sm:text-xl font-medium">
          #{order.id}
          {order?.orderType === 'autoventa' ? ' · Autoventa' : ''}
        </h3>
        <div>
          <p>
            <span className="font-light text-2xl sm:text-3xl">{order.customer?.name ?? '—'}</span>
            <br />
            <span className="text-base sm:text-lg font-medium">Cliente Nº {order.customer?.id ?? '—'}</span>
          </p>
        </div>
        <div>
          <p className="font-medium text-xs text-muted-foreground">Fecha de Carga:</p>
          <p className="font-medium text-lg">{formatDate(order.loadDate)}</p>
        </div>
        <div>
          <p className="font-medium text-xs text-muted-foreground">Temperatura:</p>
          <OrderTemperatureDropdown
            temperature={order.temperature}
            onTemperatureChange={onTemperatureChange}
          />
        </div>
      </div>
      <div className="hidden lg:flex flex-row gap-2 h-fit pt-2">
        <div className="flex flex-col max-w-sm justify-end items-end gap-3">
          <div className="flex gap-2">
            <OrderEditSheet />
            <Button variant="outline" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Duplicar pedido</DropdownMenuItem>
                <DropdownMenuItem>Cancelar pedido</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Eliminar pedido</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-col items-end justify-center">
            <img
              className="max-w-[240px]"
              src={transportImage}
              alt={`Transporte ${order.transport?.name || ''}`}
            />
            <h3 className="text-3xl font-light">{order.transport?.name || '-'}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
