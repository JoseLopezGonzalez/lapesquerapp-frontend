'use client';

import { ThermometerSnowflake } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const TEMPERATURE_OPTIONS = [0, 4, -18, -23];

/**
 * Dropdown para cambiar la temperatura del pedido (0, 4, -18, -23 ºC)
 */
export default function OrderTemperatureDropdown({ temperature, onTemperatureChange, className }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={className ? `focus:outline-none ${className}` : 'focus:outline-none'}
      >
        <span className="hover:text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
          <ThermometerSnowflake className="size-4" />
          {temperature ?? '0'} ºC
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {TEMPERATURE_OPTIONS.map((temp) => (
          <DropdownMenuItem
            key={temp}
            className="cursor-pointer"
            onClick={() => onTemperatureChange(temp)}
          >
            {temp} ºC
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
