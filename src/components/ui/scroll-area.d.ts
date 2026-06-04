import type { HTMLAttributes } from 'react';

declare const ScrollArea: React.ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;

interface ScrollBarProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal';
}

declare const ScrollBar: React.ForwardRefExoticComponent<
  ScrollBarProps & React.RefAttributes<HTMLDivElement>
>;

export { ScrollArea, ScrollBar };
