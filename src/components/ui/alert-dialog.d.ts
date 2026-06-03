import type { HTMLAttributes, ButtonHTMLAttributes } from 'react';

declare const AlertDialog: React.FC<{
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  [key: string]: unknown;
}>;

declare const AlertDialogTrigger: React.FC<{
  asChild?: boolean;
  children?: React.ReactNode;
  [key: string]: unknown;
}>;

declare const AlertDialogPortal: React.FC<{
  children?: React.ReactNode;
  [key: string]: unknown;
}>;

declare const AlertDialogOverlay: React.FC<
  HTMLAttributes<HTMLDivElement> & { className?: string }
>;

declare const AlertDialogContent: React.FC<{
  className?: string;
  size?: 'default' | 'sm';
  children?: React.ReactNode;
  [key: string]: unknown;
}>;

declare const AlertDialogHeader: React.FC<
  HTMLAttributes<HTMLDivElement> & { className?: string }
>;

declare const AlertDialogFooter: React.FC<
  HTMLAttributes<HTMLDivElement> & { className?: string }
>;

declare const AlertDialogTitle: React.FC<
  HTMLAttributes<HTMLHeadingElement> & { className?: string }
>;

declare const AlertDialogDescription: React.FC<
  HTMLAttributes<HTMLParagraphElement> & { className?: string }
>;

declare const AlertDialogAction: React.FC<
  ButtonHTMLAttributes<HTMLButtonElement> & { className?: string; asChild?: boolean }
>;

declare const AlertDialogCancel: React.FC<
  ButtonHTMLAttributes<HTMLButtonElement> & { className?: string; asChild?: boolean }
>;

declare const AlertDialogMedia: React.FC<
  HTMLAttributes<HTMLDivElement> & { className?: string }
>;

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogMedia,
};
