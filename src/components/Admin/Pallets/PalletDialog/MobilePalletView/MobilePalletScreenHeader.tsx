'use client';

import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const mobilePalletHeaderButtonClassName =
  'h-12 min-h-12 w-12 min-w-12 shrink-0 rounded-full hover:bg-muted';

export const mobilePalletHeaderTitleClassName =
  'w-full truncate text-center text-xl font-normal dark:text-white';

interface MobilePalletScreenHeaderProps {
  title: ReactNode;
  onBack?: () => void;
  rightSlot?: ReactNode;
  className?: string;
}

export function MobilePalletScreenHeader({
  title,
  onBack,
  rightSlot,
  className,
}: MobilePalletScreenHeaderProps) {
  return (
    <div className={cn('flex shrink-0 items-center gap-2 px-2 pt-4 pb-3', className)}>
      {onBack ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className={mobilePalletHeaderButtonClassName}
          aria-label="Volver"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      ) : (
        <div className="h-12 w-12 shrink-0" aria-hidden="true" />
      )}

      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5">
        {typeof title === 'string' ? (
          <h2 className={mobilePalletHeaderTitleClassName}>{title}</h2>
        ) : (
          title
        )}
      </div>

      {rightSlot ?? <div className="h-12 w-12 shrink-0" aria-hidden="true" />}
    </div>
  );
}
