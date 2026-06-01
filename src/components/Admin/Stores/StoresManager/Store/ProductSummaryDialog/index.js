import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ProductSummary from './ProductSummary';

export function ProductSummaryDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Productos</Button>
      </DialogTrigger>
      <DialogContent size="4xl">
        <DialogHeader>
          <DialogTitle>Productos</DialogTitle>
        </DialogHeader>
        <ProductSummary />
      </DialogContent>
    </Dialog>
  );
}
