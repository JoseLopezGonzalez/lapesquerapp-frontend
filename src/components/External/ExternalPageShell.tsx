import { cn } from '@/lib/utils';

interface ExternalPageShellProps {
  children: React.ReactNode;
  contentClassName?: string;
}

export function ExternalPageShell({ children, contentClassName }: ExternalPageShellProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden px-3 pt-3 pb-3 md:px-4 md:pb-4',
        contentClassName
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
