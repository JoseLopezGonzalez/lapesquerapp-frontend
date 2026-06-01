import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Package } from 'lucide-react';

/**
 * Empty state genérico basado en shadcn Empty.
 * Misma estructura en toda la app sin repetir JSX.
 *
 * @param {string} title - Título del estado vacío
 * @param {string} description - Descripción
 * @param {React.ReactNode} [icon] - Icono (por defecto Package)
 * @param {{ name: string, onClick: () => void }} [button] - Botón opcional (label + handler)
 * @param {string} [className] - Clases para el contenedor Empty (ej. "h-full bg-muted/30")
 */
export function EmptyState({ title, description, icon, button, className }) {
  return (
    <Empty className={cn(className ?? 'bg-muted/30 h-full', '!min-h-0')}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon ?? <Package />}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription className="max-w-xs text-pretty">{description}</EmptyDescription>
      </EmptyHeader>
      {button && (
        <EmptyContent>
          <Button variant="outline" onClick={button.onClick}>
            {button.name}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
