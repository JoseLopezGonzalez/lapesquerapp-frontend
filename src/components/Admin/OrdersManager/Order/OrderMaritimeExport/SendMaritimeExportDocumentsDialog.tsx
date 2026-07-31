'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Info, Loader2, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { useOrderAttachments } from '@/hooks/orders/useOrderAttachments';
import { useSendMaritimeExportDocuments } from '@/hooks/orders/useSendMaritimeExportDocuments';
import { formatBytes, type OrderAttachment } from '@/services/domain/orders/orderAttachmentService';
import { notify } from '@/lib/notifications';
import { ApiError, getErrorMessage } from '@/lib/api/apiHelpers';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';
import {
  sendMaritimeExportDocumentsSchema,
  type SendMaritimeExportDocumentsFormData,
} from './schemas/sendMaritimeExportDocumentsSchema';

interface SendMaritimeExportDocumentsDialogProps {
  orderId: number | string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SendMaritimeExportDocumentsDialog({
  orderId,
  open,
  onOpenChange,
}: SendMaritimeExportDocumentsDialogProps) {
  const { isMobile } = useIsMobileSafe();
  const { attachments, isLoading: attachmentsLoading } = useOrderAttachments(orderId, {
    enabled: open,
  });
  const mutation = useSendMaritimeExportDocuments(orderId);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<SendMaritimeExportDocumentsFormData>({
    resolver: zodResolver(sendMaritimeExportDocumentsSchema),
    defaultValues: { subject: '', body: '' },
  });

  const toggleAttachment = (attachment: OrderAttachment) => {
    setSelectedIds((prev) =>
      prev.includes(attachment.id)
        ? prev.filter((id) => id !== attachment.id)
        : [...prev, attachment.id]
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    reset({ subject: '', body: '' });
    setSelectedIds([]);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      await notify.promise(
        mutation.mutateAsync({
          subject: data.subject,
          body: data.body,
          attachmentIds: selectedIds,
        }),
        {
          loading: 'Enviando documentación al cliente...',
          success: 'Documentación de exportación enviada correctamente',
          error: (err: unknown) => ({
            title: 'Error al enviar la documentación',
            description:
              err instanceof ApiError
                ? getErrorMessage(err.data ?? { message: err.message })
                : 'No se pudo enviar la documentación. Intente de nuevo.',
          }),
        }
      );
      handleClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const errorData = err.data as { errors?: Record<string, string[]> };
        if (errorData?.errors) setErrorsFrom422(setError, errorData.errors);
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <DialogContent
        size="lg"
        className={isMobile ? 'm-0 flex h-full max-h-full w-full max-w-full flex-col rounded-none' : 'flex max-h-[85vh] flex-col'}
      >
        <DialogHeader className={isMobile ? 'text-center' : ''}>
          <DialogTitle className={isMobile ? 'justify-center' : ''}>
            Enviar documentación al cliente
          </DialogTitle>
          <DialogDescription>
            Redacta un mensaje libre para el cliente de este pedido. Se enviará en un único email.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto"
          noValidate
        >
          <div className="grid gap-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input
              id="subject"
              placeholder="ej. Documentación de embarque - Pedido #BR26/377"
              disabled={mutation.isPending}
              aria-invalid={!!errors.subject}
              {...register('subject')}
            />
            {errors.subject && (
              <p className="pt-1 text-xs text-red-400">* {errors.subject.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="body">Mensaje</Label>
            <Textarea
              id="body"
              rows={6}
              placeholder="Escribe aquí el cuerpo del email..."
              disabled={mutation.isPending}
              aria-invalid={!!errors.body}
              {...register('body')}
            />
            {errors.body && <p className="pt-1 text-xs text-red-400">* {errors.body.message}</p>}
          </div>

          <div className="border-primary/30 bg-primary/5 flex items-start gap-2 rounded-md border p-2.5 text-xs">
            <Info className="text-primary mt-0.5 size-3.5 shrink-0" />
            <span>
              El Export Packing List de todos los contenedores de este pedido se adjuntará
              automáticamente. No es necesario seleccionarlo.
            </span>
          </div>

          <div className="grid gap-2">
            <Label>Adjuntos del pedido a incluir</Label>
            {attachmentsLoading ? (
              <div className="grid gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-md" />
                ))}
              </div>
            ) : attachments.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Este pedido no tiene adjuntos subidos todavía.
              </p>
            ) : (
              <ScrollArea className="max-h-48 rounded-md border">
                <div className="grid gap-1 p-1.5">
                  {attachments.map((attachment) => (
                    <label
                      key={attachment.id}
                      className="hover:bg-muted/50 flex cursor-pointer items-center gap-2.5 rounded-md p-1.5"
                    >
                      <Checkbox
                        checked={selectedIds.includes(attachment.id)}
                        onCheckedChange={() => toggleAttachment(attachment)}
                        disabled={mutation.isPending}
                      />
                      <FileText className="text-muted-foreground size-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p
                          className="min-w-0 truncate text-xs font-medium"
                          title={attachment.originalName}
                        >
                          {attachment.originalName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatBytes(attachment.size)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter className="mt-2 shrink-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : <Send />}
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
