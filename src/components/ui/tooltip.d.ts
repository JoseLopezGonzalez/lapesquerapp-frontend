import * as React from 'react';

export declare function TooltipProvider(props: {
  delayDuration?: number;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function Tooltip(props: {
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  [key: string]: unknown;
}): JSX.Element;

export declare function TooltipTrigger(props: {
  asChild?: boolean;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function TooltipContent(props: {
  className?: string;
  sideOffset?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  hidden?: boolean;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;
