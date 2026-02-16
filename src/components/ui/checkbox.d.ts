import type { HTMLAttributes } from "react";

type CheckedState = boolean | "indeterminate";

declare const Checkbox: React.ForwardRefExoticComponent<
  Omit<HTMLAttributes<HTMLButtonElement>, "onChange"> & {
    checked?: CheckedState;
    defaultChecked?: CheckedState;
    onCheckedChange?: (checked: CheckedState) => void;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
  } & React.RefAttributes<HTMLButtonElement>
>;
export { Checkbox };
