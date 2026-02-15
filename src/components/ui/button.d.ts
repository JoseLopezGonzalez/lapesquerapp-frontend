import type { ButtonHTMLAttributes } from "react";

declare const Button: React.ForwardRefExoticComponent<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    asChild?: boolean;
    className?: string;
  } & React.RefAttributes<HTMLButtonElement>
>;
export { Button };
