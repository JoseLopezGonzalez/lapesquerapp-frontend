'use client';

import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { notify } from '@/lib/notifications';
import { ApiError } from '@/lib/api/apiHelpers';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';
import { useProspectMutations } from '@/hooks/useProspects';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { useQuery } from '@tanstack/react-query';
import { paymentTermService } from '@/services/domain/payment-terms/paymentTermService';
import { transportService } from '@/services/domain/transports/transportService';
import {
  getConvertProspectFormSchema,
  getDefaultConvertProspectFormValues,
  convertProspectPayloadFromFormValues,
} from './schemas/convertProspectFormSchema';

const NONE_VALUE = '__none__';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-sm text-red-500">{message}</p>;
}

function useOptionsQuery({ key, enabled, queryFn }) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return useQuery({
    queryKey: [key, 'options', tenantId ?? 'unknown'],
    queryFn,
    enabled: !!tenantId && enabled,
  });
}

export default function ConvertProspectDialog({ open, onOpenChange, prospect }) {
  const router = useRouter();
  const { convertProspect } = useProspectMutations();
  const schema = useMemo(() => getConvertProspectFormSchema(), []);

  const { data: paymentTermOptions = [] } = useOptionsQuery({
    key: 'payment-terms',
    enabled: open,
    queryFn: () => paymentTermService.getOptions(),
  });
  const { data: transportOptions = [] } = useOptionsQuery({
    key: 'transports',
    enabled: open,
    queryFn: () => transportService.getOptions(),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: getDefaultConvertProspectFormValues(prospect?.address),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (!open) return;
    reset(getDefaultConvertProspectFormValues(prospect?.address));
  }, [open, prospect?.address, reset]);

  const onValidSubmit = async (values) => {
    const payload = convertProspectPayloadFromFormValues(values);
    try {
      const response = await notify.promise(
        convertProspect.mutateAsync({ id: prospect.id, payload }),
        {
          loading: 'Convirtiendo prospecto...',
          success: 'Prospecto convertido en cliente',
          error: (error) => error?.message || 'No se pudo convertir el prospecto',
        }
      );
      onOpenChange(false);
      const customerId = response?.data?.id;
      if (customerId) {
        router.push(`/comercial/clientes/${customerId}`);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.data?.errors) {
        if (err.data.errors.status) {
          const existingCustomerId = prospect?.customerId;
          if (existingCustomerId) {
            onOpenChange(false);
            router.push(`/comercial/clientes/${existingCustomerId}`);
          } else {
            notify.error({
              title: err.data.errors.status[0] ?? 'Este prospecto ya ha sido convertido a cliente.',
            });
          }
        } else {
          setErrorsFrom422(setError, err.data.errors);
        }
      }
    }
  };

  const onInvalidSubmit = (formErrors) => {
    const n = Object.keys(formErrors).length;
    notify.error({
      title: 'Revisa el formulario',
      description:
        n > 1 ? `Hay ${n} campos con errores.` : 'Corrige el error indicado antes de continuar.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="flex flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Convertir a cliente</DialogTitle>
          <DialogDescription>
            Revisa y completa los datos del nuevo cliente. Los campos de dirección se pre-rellenan
            con la dirección del prospecto.
          </DialogDescription>
        </DialogHeader>

        <form
          id="convert-prospect-form"
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
          noValidate
        >
          <ScrollArea className="max-h-[calc(100vh-16rem)] min-h-0 flex-1">
            <div className="grid gap-4 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="convert-billing">Dirección de facturación</Label>
                  <Textarea
                    id="convert-billing"
                    rows={3}
                    placeholder="Dirección de facturación"
                    aria-invalid={errors.billingAddress ? 'true' : undefined}
                    {...register('billingAddress')}
                  />
                  <FieldError message={errors.billingAddress?.message} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="convert-shipping">Dirección de envío</Label>
                  <Textarea
                    id="convert-shipping"
                    rows={3}
                    placeholder="Dirección de envío"
                    aria-invalid={errors.shippingAddress ? 'true' : undefined}
                    {...register('shippingAddress')}
                  />
                  <FieldError message={errors.shippingAddress?.message} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="convert-vat">NIF/CIF (opcional)</Label>
                <Input
                  id="convert-vat"
                  placeholder="Ej: ES12345678A"
                  aria-invalid={errors.vatNumber ? 'true' : undefined}
                  {...register('vatNumber')}
                />
                <FieldError message={errors.vatNumber?.message} />
              </div>

              <div className="border-t pt-4">
                <p className="text-muted-foreground mb-3 text-sm font-medium">Datos adicionales</p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Forma de pago</Label>
                    <Controller
                      name="paymentTermId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value && field.value !== '' ? field.value : NONE_VALUE}
                          onValueChange={(v) => field.onChange(v === NONE_VALUE ? '' : v)}
                        >
                          <SelectTrigger
                            className="w-full"
                            aria-invalid={errors.paymentTermId ? 'true' : undefined}
                          >
                            <SelectValue placeholder="Sin especificar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE_VALUE}>Sin especificar</SelectItem>
                            {paymentTermOptions.map((opt) => (
                              <SelectItem key={opt.value} value={String(opt.value)}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError message={errors.paymentTermId?.message} />
                  </div>

                  <div className="grid gap-2">
                    <Label>Transporte</Label>
                    <Controller
                      name="transportId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value && field.value !== '' ? field.value : NONE_VALUE}
                          onValueChange={(v) => field.onChange(v === NONE_VALUE ? '' : v)}
                        >
                          <SelectTrigger
                            className="w-full"
                            aria-invalid={errors.transportId ? 'true' : undefined}
                          >
                            <SelectValue placeholder="Sin especificar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE_VALUE}>Sin especificar</SelectItem>
                            {transportOptions.map((opt) => (
                              <SelectItem key={opt.value} value={String(opt.value)}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError message={errors.transportId?.message} />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="convert-a3erp">Código A3ERP</Label>
                    <Input
                      id="convert-a3erp"
                      placeholder="Código en A3ERP"
                      aria-invalid={errors.a3erpCode ? 'true' : undefined}
                      {...register('a3erpCode')}
                    />
                    <FieldError message={errors.a3erpCode?.message} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="convert-facilcom">Código Facilcom</Label>
                    <Input
                      id="convert-facilcom"
                      placeholder="Código en Facilcom"
                      aria-invalid={errors.facilcomCode ? 'true' : undefined}
                      {...register('facilcomCode')}
                    />
                    <FieldError message={errors.facilcomCode?.message} />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="convert-transport-notes">Notas de transporte</Label>
                    <Textarea
                      id="convert-transport-notes"
                      rows={3}
                      aria-invalid={errors.transportationNotes ? 'true' : undefined}
                      {...register('transportationNotes')}
                    />
                    <FieldError message={errors.transportationNotes?.message} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="convert-production-notes">Notas de producción</Label>
                    <Textarea
                      id="convert-production-notes"
                      rows={3}
                      aria-invalid={errors.productionNotes ? 'true' : undefined}
                      {...register('productionNotes')}
                    />
                    <FieldError message={errors.productionNotes?.message} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="convert-accounting-notes">Notas contables</Label>
                    <Textarea
                      id="convert-accounting-notes"
                      rows={3}
                      aria-invalid={errors.accountingNotes ? 'true' : undefined}
                      {...register('accountingNotes')}
                    />
                    <FieldError message={errors.accountingNotes?.message} />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" form="convert-prospect-form" disabled={isSubmitting}>
              Convertir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
