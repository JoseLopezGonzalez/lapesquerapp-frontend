export interface ComboboxOption {
  value: string | number;
  label: string;
}

export declare function Combobox(props: {
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  notFoundMessage?: string;
  className?: string;
  value?: string | number;
  onChange: (value: string | number) => void;
  loading?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}): JSX.Element;
