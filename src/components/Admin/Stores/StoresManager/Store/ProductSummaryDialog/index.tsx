'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ProductSummary from './ProductSummary';

interface ProductSummaryDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductSummaryDialog({ open, onOpenChange }: ProductSummaryDialogProps = {}) {
  const isControlled = open !== undefined;

  return (
    <Dialog
      open={isControlled ? open : undefined}
      onOpenChange={isControlled ? onOpenChange : undefined}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline">Productos</Button>
        </DialogTrigger>
      )}
      <DialogContent
        size="4xl"
        className="max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overflow-y-auto max-sm:rounded-none"
      >
        <DialogHeader>
          <DialogTitle>Productos</DialogTitle>
        </DialogHeader>
        <ProductSummary />
      </DialogContent>
    </Dialog>
  );
}
