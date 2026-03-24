'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/datePicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { notify } from '@/lib/notifications';
import { ApiError } from '@/lib/api/apiHelpers';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';
import { useCountriesList } from '@/hooks/useCountriesList';
import { useProspectMutations } from '@/hooks/useProspects';
import { format } from 'date-fns';
import { prospectOriginOptions } from './utils';
import {
  getProspectFormSchema,
  getDefaultProspectFormValues,
  prospectFormValuesFromInitial,
} from './schemas/prospectFormSchema';

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

export default function ProspectFormSheet({ open, onOpenChange, initialData = null }) {
  const isEditing = Boolean(initialData);
  const { data: countries } = useCountriesList({ page: 1, perPage: 250, enabled: open });
  const { createProspect, updateProspect } = useProspectMutations();
  const [warnings, setWarnings] = useState([]);

  const prospectSchema = useMemo(() => getProspectFormSchema(isEditing), [isEditing]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(prospectSchema),
    defaultValues: getDefaultProspectFormValues(),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (!open) return;
    setWarnings([]);
    reset(prospectFormValuesFromInitial(initialData));
  }, [open, initialData, reset]);

  const title = useMemo(() => (initialData ? 'Editar prospecto' : 'Nuevo prospecto'), [initialData]);
  const scheduleNextAction = watch('scheduleNextAction');
  const includePrimaryContact = watch('includePrimaryContact');

  const onValidSubmit = async (values) => {
    const payload = {
      companyName: values.companyName,
      address: values.address.trim() || null,
      website: values.website.trim() || null,
      countryId: values.countryId ? Number(values.countryId) : null,
      origin: values.origin,
      status: values.status,
      notes: values.notes.trim() || null,
      commercialInterestNotes: values.commercialInterestNotes.trim() || null,
      nextActionAt:
        values.scheduleNextAction && values.nextActionAt ? format(values.nextActionAt, 'yyyy-MM-dd') : null,
      nextActionNote: values.scheduleNextAction ? values.nextActionNote.trim().slice(0, 255) || null : null,
      speciesInterest: values.speciesInterest
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    };
    if (!isEditing && values.includePrimaryContact) {
      payload.primaryContact = {
        name: values.primaryContactName.trim() || undefined,
        role: values.primaryContactRole.trim() || null,
        phone: values.primaryContactPhone.trim() || null,
        email: values.primaryContactEmail.trim() || null,
      };
    }

    try {
      const response = await notify.promise(
        initialData
          ? updateProspect.mutateAsync({ id: initialData.id, payload })
          : createProspect.mutateAsync(payload),
        {
          loading: initialData ? 'Actualizando prospecto...' : 'Creando prospecto...',
          success: initialData ? 'Prospecto actualizado' : 'Prospecto creado',
          error: (error) => error?.message || 'No se pudo guardar el prospecto',
        }
      );
      setWarnings(response?.warnings ?? []);
      if (!response?.warnings?.length) {
        onOpenChange(false);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.data?.errors) {
        setErrorsFrom422(setError, err.data.errors);
        return;
      }
    }
  };

  const onInvalidSubmit = (formErrors) => {
    const n = Object.keys(formErrors).length;
    notify.error({
      title: 'Revisa el formulario',
      description: n > 1 ? `Hay ${n} campos con errores.` : 'Corrige el error indicado antes de guardar.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="5xl"
        className={`flex flex-col gap-0 overflow-hidden p-0 ${
          isEditing ? 'max-h-[calc(100vh-2rem)]' : 'h-[calc(100vh-2rem)]'
        }`}
      >
        <DialogHeader className="border-b p-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edición de datos generales y comerciales del prospecto.'
              : 'Alta de prospecto: datos comerciales y, si aplica, contacto y agenda.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="prospect-form"
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
          noValidate
        >
          <ScrollArea className="min-h-0 flex-1">
            <div className="grid gap-4 p-4">
              {warnings.length > 0 && (
                <Alert>
                  <AlertTitle>Posibles duplicados detectados</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4">
                      {warnings.map((warning, index) => (
                        <li key={`${warning.type}-${index}`}>{warning.message}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="company-name">
                  Nombre de empresa
                  <RequiredMark />
                </Label>
                <Input
                  id="company-name"
                  autoComplete="organization"
                  placeholder="Nombre de la empresa"
                  aria-invalid={errors.companyName ? 'true' : undefined}
                  {...register('companyName')}
                />
                <FieldError message={errors.companyName?.message} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="prospect-address">Dirección</Label>
                <Textarea
                  id="prospect-address"
                  rows={3}
                  placeholder="Calle, número, CP, ciudad…"
                  aria-invalid={errors.address ? 'true' : undefined}
                  {...register('address')}
                />
                <FieldError message={errors.address?.message} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="prospect-website">Sitio web</Label>
                <Input
                  id="prospect-website"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="https://empresa.com o empresa.com"
                  aria-invalid={errors.website ? 'true' : undefined}
                  {...register('website')}
                />
                <FieldError message={errors.website?.message} />
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
                        <SelectTrigger className="w-full" aria-invalid={errors.countryId ? 'true' : undefined}>
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
                    Origen
                    <RequiredMark />
                  </Label>
                  <Controller
                    name="origin"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={(v) => field.onChange(v ?? '')}
                      >
                        <SelectTrigger className="w-full" aria-invalid={errors.origin ? 'true' : undefined}>
                          <SelectValue placeholder="Origen del lead" />
                        </SelectTrigger>
                        <SelectContent>
                          {prospectOriginOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.origin?.message} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="species-interest">
                  Especies de interés
                  <RequiredMark />
                </Label>
                <Input
                  id="species-interest"
                  placeholder="langostino, pulpo, choco"
                  aria-invalid={errors.speciesInterest ? 'true' : undefined}
                  {...register('speciesInterest')}
                />
                <FieldError message={errors.speciesInterest?.message} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="commercial-interest">
                  Interés comercial
                  <RequiredMark />
                </Label>
                <Textarea
                  id="commercial-interest"
                  rows={4}
                  placeholder="Formato, calibre, mercado objetivo, referencias..."
                  aria-invalid={errors.commercialInterestNotes ? 'true' : undefined}
                  {...register('commercialInterestNotes')}
                />
                <FieldError message={errors.commercialInterestNotes?.message} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  aria-invalid={errors.notes ? 'true' : undefined}
                  {...register('notes')}
                />
                <FieldError message={errors.notes?.message} />
              </div>

              {!isEditing && (
                <div className="rounded-xl border p-4">
                  <div className="mb-4">
                    <h3 className="font-medium">Próxima acción</h3>
                    <p className="text-sm text-muted-foreground">
                      Activa la casilla para fijar fecha y, si quieres, una nota en la agenda comercial.
                    </p>
                  </div>
                  <Controller
                    name="scheduleNextAction"
                    control={control}
                    render={({ field }) => (
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          id="prospect-schedule-next-action"
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            const on = checked === true;
                            field.onChange(on);
                            if (!on) {
                              setValue('nextActionAt', null);
                              setValue('nextActionNote', '');
                            }
                          }}
                        />
                        <span>Programar próxima acción</span>
                      </label>
                    )}
                  />
                  {scheduleNextAction ? (
                    <div className="mt-4 grid gap-4 rounded-xl border bg-muted/10 p-4">
                      <div className="grid gap-2">
                        <Label>Fecha</Label>
                        <Controller
                          name="nextActionAt"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              date={field.value ?? null}
                              onChange={field.onChange}
                              formatStyle="short"
                            />
                          )}
                        />
                        <FieldError message={errors.nextActionAt?.message} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="next-action-note">Descripción</Label>
                        <Input
                          id="next-action-note"
                          placeholder="Enviar oferta, volver a llamar, preparar muestra..."
                          maxLength={255}
                          aria-invalid={errors.nextActionNote ? 'true' : undefined}
                          {...register('nextActionNote')}
                        />
                        <FieldError message={errors.nextActionNote?.message} />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {!isEditing && (
                <div className="rounded-xl border p-4">
                  <div className="mb-4">
                    <h3 className="font-medium">Contacto principal</h3>
                    <p className="text-sm text-muted-foreground">
                      Opcional. Sirve para precargar ofertas y convertir el prospecto en cliente cuando lo indiques.
                    </p>
                  </div>
                  <Controller
                    name="includePrimaryContact"
                    control={control}
                    render={({ field }) => (
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          id="prospect-include-primary-contact"
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            const on = checked === true;
                            field.onChange(on);
                            if (!on) {
                              setValue('primaryContactName', '');
                              setValue('primaryContactRole', '');
                              setValue('primaryContactPhone', '');
                              setValue('primaryContactEmail', '');
                            }
                          }}
                        />
                        <span>Incluir contacto principal</span>
                      </label>
                    )}
                  />
                  {includePrimaryContact ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2 rounded-xl border bg-muted/10 p-4">
                      <div className="grid gap-2">
                        <Label htmlFor="primary-contact-name">Nombre</Label>
                        <Input
                          id="primary-contact-name"
                          autoComplete="name"
                          aria-invalid={errors.primaryContactName ? 'true' : undefined}
                          {...register('primaryContactName')}
                        />
                        <FieldError message={errors.primaryContactName?.message} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="primary-contact-role">Cargo</Label>
                        <Input
                          id="primary-contact-role"
                          aria-invalid={errors.primaryContactRole ? 'true' : undefined}
                          {...register('primaryContactRole')}
                        />
                        <FieldError message={errors.primaryContactRole?.message} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="primary-contact-phone">Teléfono</Label>
                        <Input
                          id="primary-contact-phone"
                          type="tel"
                          autoComplete="tel"
                          aria-invalid={errors.primaryContactPhone ? 'true' : undefined}
                          {...register('primaryContactPhone')}
                        />
                        <FieldError message={errors.primaryContactPhone?.message} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="primary-contact-email">Email</Label>
                        <Input
                          id="primary-contact-email"
                          type="email"
                          autoComplete="email"
                          aria-invalid={errors.primaryContactEmail ? 'true' : undefined}
                          {...register('primaryContactEmail')}
                        />
                        <FieldError message={errors.primaryContactEmail?.message} />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <input type="hidden" {...register('status')} />
            </div>
          </ScrollArea>

          <div className="flex flex-col-reverse gap-2 border-t bg-background p-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createProspect.isPending || updateProspect.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
