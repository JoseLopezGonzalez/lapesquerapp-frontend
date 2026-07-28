import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetPlaceholderProps {
  type: 1 | 2 | 3;
  label: string;
  className?: string;
}

const TYPE_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Tipo 1 · captura real',
  2: 'Tipo 2 · mockup manual',
  3: 'Tipo 3 · bento illustration (IA)',
};

// Placeholder de asset temporal — clasificación según landing-context.md §7b.
// Un GAP de seguimiento sustituye cada uno por el asset final del tipo indicado.
export default function AssetPlaceholder({ type, label, className }: AssetPlaceholderProps) {
  return (
    <div
      className={cn(
        'border-border bg-muted/50 text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center',
        className
      )}
    >
      <ImageOff className="h-6 w-6" aria-hidden="true" />
      <p className="text-xs font-medium">{TYPE_LABEL[type]}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}
