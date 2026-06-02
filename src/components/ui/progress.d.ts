import type { HTMLAttributes } from 'react';

declare const Progress: React.ForwardRefExoticComponent<
  HTMLAttributes<HTMLElement> & {
    value?: number | null;
    max?: number;
    className?: string;
  } & React.RefAttributes<HTMLElement>
>;
export { Progress };
