import type { HTMLAttributes } from 'react';

declare const Switch: React.ForwardRefExoticComponent<
  Omit<HTMLAttributes<HTMLButtonElement>, 'onChange'> & {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
    size?: 'default' | 'sm';
  } & React.RefAttributes<HTMLButtonElement>
>;
export { Switch };
