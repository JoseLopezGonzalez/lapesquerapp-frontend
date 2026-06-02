import * as React from 'react';

export declare function Sheet(props: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function SheetTrigger(props: {
  asChild?: boolean;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function SheetClose(props: {
  asChild?: boolean;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function SheetContent(props: {
  className?: string;
  children?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
  style?: React.CSSProperties;
  [key: string]: unknown;
}): JSX.Element;

export declare function SheetHeader(props: {
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function SheetFooter(props: {
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function SheetTitle(props: {
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function SheetDescription(props: {
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;
