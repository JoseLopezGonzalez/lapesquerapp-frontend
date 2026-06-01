'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import EmailListInput from '@/components/ui/emailListInput';
import { notify } from '@/lib/notifications';
import { ApiError } from '@/lib/api/apiHelpers';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';
import { useCountriesList } from '@/hooks/useCountriesList';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { useQuery } from '@tanstack/react-query';
import { paymentTermService } from '@/services/domain/payment-terms/paymentTermService';
import { transportService } from '@/services/domain/transports/transportService';
import { fieldOperatorAdminService } from '@/services/domain/field-operators/fieldOperatorService';
import { customerService as customerDomainService } from '@/services/domain/customers/customerService';
import {
  customerFormValuesFromInitial,
  getCustomerFormSchema,
  getDefaultCustomerFormValues,
} from './schemas/customerFormSchema';

const FIELD_OPERATOR_NONE = '__none__';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-sm text-red-500">{message}</p>;
}

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden>
      {' '}
      *
    </span>
  );
}

function useOptionsQuery({ key, enabled, queryFn }) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
  return useQuery({
    queryKey: [key, 'options', tenantId ?? 'unknown'],
    queryFn,
    enabled: !!tenantId && enabled,
  });
}

export default function CustomerEditDialog({
  open,
  onOpenChange,
  customerId,
  initialCustomer,
  onSaved,
}) {
  const [warnings] = useState([]);
  const schema = useMemo(() => getCustomerFormSchema(), []);
  const { data: countries } = useCountriesList({ page: 1, perPage: 250, enabled: open });

  const { data: paymentTermOptions = [], isLoading: paymentTermsLoading } = useOptionsQuery({
    key: 'payment-terms',
    enabled: open,
    queryFn: () => paymentTermService.getOptions(),
  });
  const { data: transportOptions = [], isLoading: transportsLoading } = useOptionsQuery({
    key: 'transports',
    enabled: open,
    queryFn: () => transportService.getOptions(),
  });
  const { data: fieldOperatorOptions = [], isLoading: fieldOperatorsLoading } = useOptionsQuery({
    key: 'field-operators',
    enabled: open,
    queryFn: () => fieldOperatorAdminService.getOptions(),
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
    defaultValues: getDefaultCustomerFormValues(),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (!open) return;
    reset(customerFormValuesFromInitial(initialCustomer));
  }, [open, initialCustomer, reset]);

  const onValidSubmit = async (values) => {
    const fieldOperatorIdValue =
      values.fieldOperatorId && values.fieldOperatorId !== FIELD_OPERATOR_NONE
        ? values.fieldOperatorId
        : '';
    const payload = {
      name: values.name.trim(),
      alias: values.alias.trim() || null,
      vatNumber: values.vatNumber.trim() || null,
      billing_address: values.billingAddress.trim() || null,
      shipping_address: values.shippingAddress.trim() || null,
      transportation_notes: values.transportationNotes.trim() || null,
      production_notes: values.productionNotes.trim() || null,
      accounting_notes: values.accountingNotes.trim() || null,
      emails: Array.isArray(values.emails) ? values.emails : [],
      ccEmails: Array.isArray(values.ccEmails) ? values.ccEmails : [],
      contact_info: values.contactInfo.trim() || null,
      operational_status: values.operationalStatus,
      country_id: values.countryId ? Number(values.countryId) : null,
      payment_term_id: values.paymentTermId ? Number(values.paymentTermId) : null,
      transport_id: values.transportId ? Number(values.transportId) : null,
      field_operator_id: fieldOperatorIdValue ? Number(fieldOperatorIdValue) : null,
    };

    try {
      const updated = await notify.promise(customerDomainService.update(customerId, payload), {
        loading: 'Actualizando cliente...',
        success: 'Cliente actualizado',
        error: (error) => error?.message || 'No se pudo actualizar el cliente',
      });
      onOpenChange(false);
      if (typeof onSaved === 'function') onSaved(updated ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.data?.errors) {
        setErrorsFrom422(setError, err.data.errors);
      }
    }
  };

  const onInvalidSubmit = (formErrors) => {
    const n = Object.keys(formErrors).length;
    notify.error({
      title: 'Revisa el formulario',
      description:
        n > 1 ? `Hay ${n} campos con errores.` : 'Corrige el error indicado antes de guardar.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="5xl"
        className="flex h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="border-b p-4">
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>
            Edición de datos generales y operativos del cliente. El comercial asignado no es
            editable desde este rol.
          </DialogDescription>
        </DialogHeader>

        <form
          id="customer-edit-form"
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
          noValidate
        >
          <ScrollArea className="min-h-0 flex-1">
            <div className="grid gap-4 p-4">
              {warnings.length > 0 ? null : null}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="customer-name">
                    Nombre
                    <RequiredMark />
                  </Label>
                  <Input
                    id="customer-name"
                    aria-invalid={errors.name ? 'true' : undefined}
                    {...register('name')}
                  />
                  <FieldError message={errors.name?.message} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customer-vat">NIF</Label>
                  <Input
                    id="customer-vat"
                    aria-invalid={errors.vatNumber ? 'true' : undefined}
                    {...register('vatNumber')}
                  />
                  <FieldError message={errors.vatNumber?.message} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer-alias">Alias</Label>
                <Input
                  id="customer-alias"
                  aria-invalid={errors.alias ? 'true' : undefined}
                  {...register('alias')}
                />
                <FieldError message={errors.alias?.message} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="customer-billing">Dirección de facturación</Label>
                  <Textarea
                    id="customer-billing"
                    rows={4}
                    aria-invalid={errors.billingAddress ? 'true' : undefined}
                    {...register('billingAddress')}
                  />
                  <FieldError message={errors.billingAddress?.message} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customer-shipping">Dirección de envío</Label>
                  <Textarea
                    id="customer-shipping"
                    rows={4}
                    aria-invalid={errors.shippingAddress ? 'true' : undefined}
                    {...register('shippingAddress')}
                  />
                  <FieldError message={errors.shippingAddress?.message} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="customer-transport-notes">Notas para transporte</Label>
                  <Textarea
                    id="customer-transport-notes"
                    rows={3}
                    aria-invalid={errors.transportationNotes ? 'true' : undefined}
                    {...register('transportationNotes')}
                  />
                  <FieldError message={errors.transportationNotes?.message} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customer-production-notes">Notas para producción</Label>
                  <Textarea
                    id="customer-production-notes"
                    rows={3}
                    aria-invalid={errors.productionNotes ? 'true' : undefined}
                    {...register('productionNotes')}
                  />
                  <FieldError message={errors.productionNotes?.message} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customer-accounting-notes">Notas contables</Label>
                  <Textarea
                    id="customer-accounting-notes"
                    rows={3}
                    aria-invalid={errors.accountingNotes ? 'true' : undefined}
                    {...register('accountingNotes')}
                  />
                  <FieldError message={errors.accountingNotes?.message} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Emails</Label>
                  <Controller
                    name="emails"
                    control={control}
                    render={({ field }) => (
                      <EmailListInput
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="Introduce correos electrónicos y pulsa Enter"
                      />
                    )}
                  />
                  <FieldError message={errors.emails?.message} />
                </div>
                <div className="grid gap-2">
                  <Label>Emails en copia (CC)</Label>
                  <Controller
                    name="ccEmails"
                    control={control}
                    render={({ field }) => (
                      <EmailListInput
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="Introduce correos en copia y pulsa Enter"
                      />
                    )}
                  />
                  <FieldError message={errors.ccEmails?.message} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer-contact">Información de contacto</Label>
                <Textarea
                  id="customer-contact"
                  rows={3}
                  aria-invalid={errors.contactInfo ? 'true' : undefined}
                  {...register('contactInfo')}
                />
                <FieldError message={errors.contactInfo?.message} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>
                    País
                    <RequiredMark />
                  </Label>
                  <Controller
                    name="countryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={(v) => field.onChange(v ?? '')}
                      >
                        <SelectTrigger
                          className="w-full"
                          aria-invalid={errors.countryId ? 'true' : undefined}
                        >
                          <SelectValue placeholder="Selecciona un país" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={String(country.id)}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.countryId?.message} />
                </div>

                <div className="grid gap-2">
                  <Label>
                    Estado operativo
                    <RequiredMark />
                  </Label>
                  <Controller
                    name="operationalStatus"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={(v) => field.onChange(v ?? '')}
                      >
                        <SelectTrigger
                          className="w-full"
                          aria-invalid={errors.operationalStatus ? 'true' : undefined}
                        >
                          <SelectValue placeholder="Selecciona el estado operativo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="alta_operativa">Alta operativa</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.operationalStatus?.message} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>
                    Forma de pago
                    <RequiredMark />
                  </Label>
                  <Controller
                    name="paymentTermId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={(v) => field.onChange(v ?? '')}
                      >
                        <SelectTrigger
                          className="w-full"
                          aria-invalid={errors.paymentTermId ? 'true' : undefined}
                        >
                          <SelectValue
                            placeholder={
                              paymentTermsLoading ? 'Cargando…' : 'Selecciona forma de pago'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {(paymentTermOptions || []).map((opt) => (
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
                  <Label>
                    Transporte
                    <RequiredMark />
                  </Label>
                  <Controller
                    name="transportId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={(v) => field.onChange(v ?? '')}
                      >
                        <SelectTrigger
                          className="w-full"
                          aria-invalid={errors.transportId ? 'true' : undefined}
                        >
                          <SelectValue
                            placeholder={transportsLoading ? 'Cargando…' : 'Selecciona transporte'}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {(transportOptions || []).map((opt) => (
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

                <div className="grid gap-2">
                  <Label>Repartidor</Label>
                  <Controller
                    name="fieldOperatorId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ? String(field.value) : FIELD_OPERATOR_NONE}
                        onValueChange={(v) => field.onChange(v === FIELD_OPERATOR_NONE ? '' : v)}
                      >
                        <SelectTrigger
                          className="w-full"
                          aria-invalid={errors.fieldOperatorId ? 'true' : undefined}
                        >
                          <SelectValue
                            placeholder={
                              fieldOperatorsLoading ? 'Cargando…' : 'Selecciona el repartidor'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={FIELD_OPERATOR_NONE}>Sin repartidor</SelectItem>
                          {(fieldOperatorOptions || []).map((opt) => (
                            <SelectItem key={opt.value} value={String(opt.value)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.fieldOperatorId?.message} />
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="bg-background flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
