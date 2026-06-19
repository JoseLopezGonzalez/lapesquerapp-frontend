'use client';

import { Banknote, Download, Landmark, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type PaymentMethod = 'cash' | 'transfer';

type SupplierLiquidationPdfDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  idPrefix?: string;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  hasManagementFee: boolean;
  onHasManagementFeeChange: (value: boolean) => void;
  showTransferPayment: boolean;
  onShowTransferPaymentChange: (value: boolean) => void;
  downloadingPdf: boolean;
  onDownload: () => void;
};

export function SupplierLiquidationPdfDialog({
  open,
  onClose,
  title = 'Vista previa PDF',
  description = 'Configura las opciones de formato del PDF antes de descargarlo.',
  idPrefix = 'pdf',
  paymentMethod,
  onPaymentMethodChange,
  hasManagementFee,
  onHasManagementFeeChange,
  showTransferPayment,
  onShowTransferPaymentChange,
  downloadingPdf,
  onDownload,
}: SupplierLiquidationPdfDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Método de pago cebo:</label>
            <Tabs
              className=""
              value={paymentMethod}
              onValueChange={(value: string) => onPaymentMethodChange(value as PaymentMethod)}
            >
              <TabsList>
                <TabsTrigger value="cash">
                  <Banknote />
                  Efectivo
                </TabsTrigger>
                <TabsTrigger value="transfer">
                  <Landmark />
                  Transferencia
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="border-border/50 border-t" />

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${idPrefix}-hasManagementFee`}
                checked={hasManagementFee}
                onCheckedChange={(checked) => onHasManagementFeeChange(!!checked)}
              />
              <label htmlFor={`${idPrefix}-hasManagementFee`} className="cursor-pointer text-sm">
                Lleva gasto de gestión
                <span className="text-muted-foreground block text-xs">
                  (2.5% sobre declarado sin IVA)
                </span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${idPrefix}-showTransferPayment`}
                checked={showTransferPayment}
                onCheckedChange={(checked) => onShowTransferPaymentChange(!!checked)}
              />
              <label htmlFor={`${idPrefix}-showTransferPayment`} className="cursor-pointer text-sm">
                Mostrar pago por transferencia
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={downloadingPdf}>
            Cancelar
          </Button>
          <Button onClick={onDownload} disabled={downloadingPdf}>
            {downloadingPdf ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Download data-icon="inline-start" />
            )}
            Descargar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
