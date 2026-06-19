'use client';

interface UnsavedChangesBannerProps {
  visible: boolean;
}

export function UnsavedChangesBanner({ visible }: UnsavedChangesBannerProps) {
  if (!visible) return null;

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
      Hay cambios sin guardar — vuelve atrás para guardarlos
    </div>
  );
}
