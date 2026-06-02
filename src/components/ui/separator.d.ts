import type { HTMLAttributes } from 'react';

declare const Separator: React.ForwardRefExoticComponent<
  HTMLAttributes<HTMLElement> & {
    orientation?: 'horizontal' | 'vertical';
    decorative?: boolean;
    className?: string;
  } & React.RefAttributes<HTMLElement>
>;
export { Separator };
