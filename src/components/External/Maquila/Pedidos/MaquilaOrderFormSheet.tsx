'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/datePicker';
import EmailListInput from '@/components/ui/emailListInput';
import { Loader2 } from 'lucide-react';
import { ApiError } from '@/lib/api/apiHelpers';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';
import {
  createMaquilaOrderFormSchema,
  toMaquilaOrderPayload,
  type MaquilaOrderFormValues,
} from '@/schemas/maquilaOrderFormSchema';
import { useMaquilaOrderTransportOptions } from '@/hooks/orders/useMaquilaOrderTransportOptions';
import {
  useMaquilaOrderCreate,
  useMaquilaOrderUpdate,
} from '@/hooks/orders/useMaquilaOrderMutations';
import type { MaquilaOrderDetail } from '@/types/maquilaOrder';

interface MaquilaOrderFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = edición de este pedido; ausente = creación */
  order?: MaquilaOrderDetail | null;
  onSaved?: (order: MaquilaOrderDetail) => void;
}

const EMPTY_VALUES: MaquilaOrderFormValues = {
  entryDate: undefined,
  loadDate: undefined,
  adhocCustomerName: '',
  adhocCustomerAddress: '',
  buyerReference: '',
  transportId: undefined,
  transportationNotes: '',
  truckPlate: '',
  trailerPlate: '',
  temperature: null,
  emails: [],
  ccEmails: [],
};

function orderToFormValues(order: MaquilaOrderDetail): MaquilaOrderFormValues {
  return {
    entryDate: order.entryDate ? new Date(order.entryDate) : undefined,
    loadDate: order.loadDate ? new Date(order.loadDate) : undefined,
    adhocCustomerName: order.adhocCustomerName ?? '',
    adhocCustomerAddress: order.adhocCustomerAddress ?? '',
    buyerReference: order.buyerReference ?? '',
    transportId: order.transport?.id != null ? String(order.transport.id) : undefined,
    transportationNotes: order.transportationNotes ?? '',
    truckPlate: order.truckPlate ?? '',
    trailerPlate: order.trailerPlate ?? '',
    temperature: order.temperature ?? null,
    emails: order.emails ?? [],
    ccEmails: order.ccEmails ?? [],
  };
}

/** Crear/editar cabecera de pedido ("cliente al vuelo") — nunca captura precio/producto/palet:
 * el whitelist del backend los ignora silenciosamente aunque se envíen (ver §3 de la spec). */
export function MaquilaOrderFormSheet({
  open,
  onOpenChange,
  order,
  onSaved,
}: MaquilaOrderFormSheetProps) {
  const isEdit = !!order;
  const { options: transportOptions } = useMaquilaOrderTransportOptions();
  const createMutation = useMaquilaOrderCreate();
  // Los hooks se llaman siempre, incondicionalmente (Rules of Hooks) — el id placeholder
  // nunca se usa de verdad porque updateMutation solo se invoca cuando isEdit es true.
  const updateMutation = useMaquilaOrderUpdate(order?.id ?? 0);
  const mutation = isEdit ? updateMutation : createMutation;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<MaquilaOrderFormValues>({
    resolver: zodResolver(createMaquilaOrderFormSchema(isEdit ? 'edit' : 'create')),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    reset(order ? orderToFormValues(order) : EMPTY_VALUES);
  }, [open, order, reset]);

  const onSubmit = async (values: MaquilaOrderFormValues) => {
    const payload = toMaquilaOrderPayload(values);
    try {
      const saved = await mutation.mutateAsync(payload);
      onSaved?.(saved);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const data = error.data as { errors?: Record<string, string[]> };
        if (data?.errors) setErrorsFrom422(setError, data.errors);
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar pedido' : 'Nuevo pedido'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Actualiza los datos de este pedido.'
              : 'Crea un pedido para uno de tus clientes finales.'}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="entryDate">Fecha de entrada{!isEdit && ' *'}</Label>
              <Controller
                control={control}
                name="entryDate"
                render={({ field }) => (
                  <DatePicker id="entryDate" date={field.value} onChange={field.onChange} />
                )}
              />
              {errors.entryDate && (
                <p className="text-destructive text-xs">{errors.entryDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loadDate">Fecha de carga{!isEdit && ' *'}</Label>
              <Controller
                control={control}
                name="loadDate"
                render={({ field }) => (
                  <DatePicker id="loadDate" date={field.value} onChange={field.onChange} />
                )}
              />
              {errors.loadDate && (
                <p className="text-destructive text-xs">{errors.loadDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adhocCustomerName">Cliente{!isEdit && ' *'}</Label>
            <Input id="adhocCustomerName" {...register('adhocCustomerName')} />
            {errors.adhocCustomerName && (
              <p className="text-destructive text-xs">{errors.adhocCustomerName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adhocCustomerAddress">Dirección del cliente</Label>
            <Textarea id="adhocCustomerAddress" rows={2} {...register('adhocCustomerAddress')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="buyerReference">Referencia del pedido</Label>
            <Input id="buyerReference" {...register('buyerReference')} />
          </div>

          <div className="space-y-1.5">
            <Label>Transporte</Label>
            <Controller
              control={control}
              name="transportId"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un transporte" />
                  </SelectTrigger>
                  <SelectContent>
                    {transportOptions.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="truckPlate">Matrícula tractora</Label>
              <Input id="truckPlate" {...register('truckPlate')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trailerPlate">Matrícula remolque</Label>
              <Input id="trailerPlate" {...register('trailerPlate')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="temperature">Temperatura (°C)</Label>
            <Input id="temperature" type="number" step="0.1" {...register('temperature')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transportationNotes">Notas de transporte</Label>
            <Textarea id="transportationNotes" rows={2} {...register('transportationNotes')} />
            {errors.transportationNotes && (
              <p className="text-destructive text-xs">{errors.transportationNotes.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Correos de aviso</Label>
            <Controller
              control={control}
              name="emails"
              render={({ field }) => (
                <EmailListInput value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Correos en copia</Label>
            <Controller
              control={control}
              name="ccEmails"
              render={({ field }) => (
                <EmailListInput value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </form>

        <SheetFooter className="flex-shrink-0 border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
