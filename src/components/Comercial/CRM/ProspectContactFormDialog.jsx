'use client';

import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { notify } from '@/lib/notifications';
import { ApiError } from '@/lib/api/apiHelpers';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';
import { useProspectMutations } from '@/hooks/useProspects';
import {
  getDefaultProspectContactFormValues,
  prospectContactFormValuesFromContact,
  prospectContactPayloadFromFormValues,
  prospectContactFormSchema,
} from './schemas/prospectContactFormSchema';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-sm text-red-500">{message}</p>;
}

export default function ProspectContactFormDialog({ open, onOpenChange, prospectId, contact = null }) {
  const isEditing = Boolean(contact);
  const { createContact, updateContact } = useProspectMutations();

  const defaultValues = useMemo(() => getDefaultProspectContactFormValues(), []);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(prospectContactFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  useEffect(() => {
    if (!open) return;
    reset(prospectContactFormValuesFromContact(contact));
  }, [open, contact, reset]);

  const onValidSubmit = async (values) => {
    const payload = prospectContactPayloadFromFormValues(values);

    try {
      const response = await notify.promise(
        isEditing
          ? updateContact.mutateAsync({ prospectId, contactId: contact.id, payload })
          : createContact.mutateAsync({ prospectId, payload }),
        {
          loading: isEditing ? 'Actualizando contacto...' : 'Guardando contacto...',
          success: isEditing ? 'Contacto actualizado' : 'Contacto guardado',
          error: (error) => error?.message || 'No se pudo guardar el contacto',
        }
      );

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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar contacto' : 'Añadir contacto'}</DialogTitle>
          <DialogDescription>Puedes registrar varios contactos. Solo uno quedará como principal.</DialogDescription>
        </DialogHeader>

        <form id="prospect-contact-form" className="grid gap-4" onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="contact-name">Nombre</Label>
              <Input id="contact-name" autoComplete="name" aria-invalid={errors.name ? 'true' : undefined} {...register('name')} />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact-role">Cargo</Label>
              <Input id="contact-role" aria-invalid={errors.role ? 'true' : undefined} {...register('role')} />
              <FieldError message={errors.role?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact-phone">Teléfono</Label>
              <Input
                id="contact-phone"
                type="tel"
                autoComplete="tel"
                aria-invalid={errors.phone ? 'true' : undefined}
                {...register('phone')}
              />
              <FieldError message={errors.phone?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                autoComplete="email"
                aria-invalid={errors.email ? 'true' : undefined}
                {...register('email')}
              />
              <FieldError message={errors.email?.message} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Controller
              name="isPrimary"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  />
                  Marcar como principal
                </label>
              )}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createContact.isPending || updateContact.isPending}>
              {isEditing ? 'Actualizar contacto' : 'Guardar contacto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

