'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import StatusBadge from '../../StatusBadge';

const STATUS_COLORS = { pending: 'orange', finished: 'green', incident: 'red' };
const STATUS_LABELS = {
  pending: 'En producción',
  finished: 'Terminado',
  incident: 'Incidencia',
};

/**
 * Dropdown para cambiar el estado del pedido (En producción, Terminado, Incidencia)
 */
export default function OrderStatusDropdown({ status, onStatusChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <StatusBadge color={STATUS_COLORS[status]} label={STATUS_LABELS[status]} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="flex flex-col items-end">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => onStatusChange('pending')}
        >
          <StatusBadge color="orange" label="En producción" />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => onStatusChange('finished')}
        >
          <StatusBadge color="green" label="Terminado" />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => onStatusChange('incident')}
        >
          <StatusBadge color="red" label="Incidencia" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
