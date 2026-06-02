import * as React from 'react';

export declare function DropdownMenu(props: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function DropdownMenuPortal(props: {
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function DropdownMenuTrigger(props: {
  asChild?: boolean;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function DropdownMenuContent(props: {
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function DropdownMenuGroup(props: {
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function DropdownMenuItem(props: {
  className?: string;
  inset?: boolean;
  variant?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler;
  onSelect?: (e: Event) => void;
  disabled?: boolean;
  [key: string]: unknown;
}): JSX.Element;

export declare function DropdownMenuCheckboxItem(props: {
  className?: string;
  children?: React.ReactNode;
  checked?: boolean;
  inset?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  [key: string]: unknown;
}): JSX.Element;

export declare function DropdownMenuRadioGroup(props: {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function DropdownMenuRadioItem(props: {
  className?: string;
  children?: React.ReactNode;
  inset?: boolean;
  value: string;
  [key: string]: unknown;
}): JSX.Element;

export declare function DropdownMenuLabel(props: {
  className?: string;
  inset?: boolean;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function DropdownMenuSeparator(props: {
  className?: string;
  [key: string]: unknown;
}): JSX.Element;

export declare function DropdownMenuShortcut(props: {
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function DropdownMenuSub(props: {
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function DropdownMenuSubTrigger(props: {
  className?: string;
  inset?: boolean;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;

export declare function DropdownMenuSubContent(props: {
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}): JSX.Element;
