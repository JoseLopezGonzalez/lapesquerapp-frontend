import type { HTMLAttributes } from 'react';

declare const Badge: React.FC<
  HTMLAttributes<HTMLSpanElement> & {
    variant?:
      | 'default'
      | 'secondary'
      | 'destructive'
      | 'outline'
      | 'success'
      | 'warning'
      | 'info'
      | 'ghost';
    asChild?: boolean;
    className?: string;
  }
>;
export { Badge };
