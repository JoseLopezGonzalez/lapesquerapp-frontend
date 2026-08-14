import type { LucideIcon } from 'lucide-react';
import { Construction, ServerOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MaquilaPlaceholderScreenProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** true cuando el bloqueo es de backend (endpoint ❌ en docs/maquila/frontend/) — no de UI pendiente. */
  blockedByBackend?: boolean;
}

/**
 * Placeholder para pantallas del portal de maquila cuyo contenido real todavía no se ha
 * construido (Fase 2/3 de la implementación) o cuyo backend no existe todavía (Fase 4,
 * ver docs/maquila/frontend/99-pendientes-y-gaps.md). Nunca oculta la ruta ni rompe la
 * navegación — solo dice explícitamente qué falta.
 */
export function MaquilaPlaceholderScreen({
  icon: Icon,
  title,
  description,
  blockedByBackend = false,
}: MaquilaPlaceholderScreenProps) {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground h-8 w-8" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      </div>
      <Badge variant="secondary" className="gap-1.5">
        {blockedByBackend ? (
          <>
            <ServerOff className="h-3.5 w-3.5" />
            Pendiente de backend
          </>
        ) : (
          <>
            <Construction className="h-3.5 w-3.5" />
            Próximamente
          </>
        )}
      </Badge>
    </div>
  );
}
