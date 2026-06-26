import type { HTMLAttributes } from 'react';

declare const Select: React.FC<{
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  [key: string]: unknown;
}>;

declare const SelectGroup: React.FC<
  HTMLAttributes<HTMLDivElement> & { className?: string }
>;

declare const SelectValue: React.FC<{
  placeholder?: string;
  loading?: boolean;
  [key: string]: unknown;
}>;

declare const SelectTrigger: React.FC<{
  className?: string;
  size?: 'default' | 'sm';
  children?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  [key: string]: unknown;
}>;

declare const SelectContent: React.FC<{
  className?: string;
  children?: React.ReactNode;
  position?: 'item-aligned' | 'popper';
  align?: string;
  loading?: boolean;
  [key: string]: unknown;
}>;

declare const SelectLabel: React.FC<
  HTMLAttributes<HTMLDivElement> & { className?: string }
>;

declare const SelectItem: React.FC<{
  className?: string;
  children?: React.ReactNode;
  value: string;
  disabled?: boolean;
  [key: string]: unknown;
}>;

declare const SelectSeparator: React.FC<
  HTMLAttributes<HTMLDivElement> & { className?: string }
>;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
