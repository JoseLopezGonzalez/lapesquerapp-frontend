'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/datePicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { notify } from '@/lib/notifications';
import { useCountriesList } from '@/hooks/useCountriesList';
import { useProspectMutations } from '@/hooks/useProspects';
import { format } from 'date-fns';
import { prospectOriginOptions } from './utils';

export default function ProspectFormSheet({ open, onOpenChange, initialData = null }) {
  const isEditing = Boolean(initialData);
  const { data: countries } = useCountriesList({ page: 1, perPage: 250, enabled: open });
  const { createProspect, updateProspect } = useProspectMutations();
  const [form, setForm] = useState({
    companyName: '',
    countryId: '',
    origin: 'inbound_call',
    notes: '',
    commercialInterestNotes: '',
    nextActionAt: null,
    nextActionNote: '',
    speciesInterest: '',
    primaryContactName: '',
    primaryContactRole: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
    status: 'new',
  });
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    if (!open) return;
    setWarnings([]);
    setForm({
      companyName: initialData?.companyName ?? '',
      countryId: initialData?.country?.id ? String(initialData.country.id) : initialData?.countryId ? String(initialData.countryId) : '',
      origin: initialData?.origin ?? 'inbound_call',
      notes: initialData?.notes ?? '',
      commercialInterestNotes: initialData?.commercialInterestNotes ?? '',
      nextActionAt: initialData?.nextActionAt ? new Date(initialData.nextActionAt) : null,
      nextActionNote: initialData?.nextActionNote ?? '',
      speciesInterest: Array.isArray(initialData?.speciesInterest) ? initialData.speciesInterest.join(', ') : '',
      primaryContactName: initialData?.primaryContact?.name ?? '',
      primaryContactRole: initialData?.primaryContact?.role ?? '',
      primaryContactPhone: initialData?.primaryContact?.phone ?? '',
      primaryContactEmail: initialData?.primaryContact?.email ?? '',
      status: initialData?.status ?? 'new',
    });
  }, [open, initialData]);

  const title = useMemo(() => (initialData ? 'Editar prospecto' : 'Nuevo prospecto'), [initialData]);

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.companyName.trim()) {
      notify.error({ title: 'El nombre de empresa es obligatorio' });
      return;
    }

    const payload = {
      companyName: form.companyName.trim(),
      countryId: form.countryId ? Number(form.countryId) : null,
      origin: form.origin,
      status: form.status,
      notes: form.notes.trim() || null,
      commercialInterestNotes: form.commercialInterestNotes.trim() || null,
      nextActionAt: form.nextActionAt ? format(form.nextActionAt, 'yyyy-MM-dd') : null,
      nextActionNote: form.nextActionNote.trim().slice(0, 255) || null,
      speciesInterest: form.speciesInterest
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    };
    if (!isEditing) {
      payload.primaryContact = {
        name: form.primaryContactName.trim() || undefined,
        role: form.primaryContactRole.trim() || null,
        phone: form.primaryContactPhone.trim() || null,
        email: form.primaryContactEmail.trim() || null,
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
    } catch {}
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
              ? 'Edición de datos generales y agenda comercial del prospecto.'
              : 'Alta de prospecto con contacto principal y agenda comercial.'}
          </DialogDescription>
        </DialogHeader>

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
              <Label htmlFor="company-name">Nombre de empresa</Label>
              <Input
                id="company-name"
                value={form.companyName}
                onChange={(event) => handleChange('companyName', event.target.value)}
                placeholder="Nombre de la empresa"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>País</Label>
                <Select value={form.countryId} onValueChange={(value) => handleChange('countryId', value)}>
                  <SelectTrigger className="w-full">
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
              </div>
              <div className="grid gap-2">
                <Label>Origen</Label>
                <Select value={form.origin} onValueChange={(value) => handleChange('origin', value)}>
                  <SelectTrigger className="w-full">
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
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="species-interest">Especies de interés</Label>
              <Input
                id="species-interest"
                value={form.speciesInterest}
                onChange={(event) => handleChange('speciesInterest', event.target.value)}
                placeholder="langostino, pulpo, choco"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="commercial-interest">Interés comercial</Label>
              <Textarea
                id="commercial-interest"
                rows={4}
                value={form.commercialInterestNotes}
                onChange={(event) => handleChange('commercialInterestNotes', event.target.value)}
                placeholder="Formato, calibre, mercado objetivo, referencias..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" rows={4} value={form.notes} onChange={(event) => handleChange('notes', event.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Próxima acción</Label>
              <DatePicker date={form.nextActionAt} onChange={(value) => handleChange('nextActionAt', value)} formatStyle="short" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="next-action-note">Descripción de la próxima acción (opcional)</Label>
              <Input
                id="next-action-note"
                value={form.nextActionNote}
                onChange={(e) => handleChange('nextActionNote', e.target.value)}
                placeholder="Enviar oferta, volver a llamar, preparar muestra..."
                maxLength={255}
              />
            </div>

            {!isEditing && (
              <div className="rounded-xl border p-4">
                <div className="mb-4">
                  <h3 className="font-medium">Contacto principal</h3>
                  <p className="text-sm text-muted-foreground">Se usará también para precargar ofertas y convertir el prospecto en cliente.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="primary-contact-name">Nombre</Label>
                    <Input
                      id="primary-contact-name"
                      value={form.primaryContactName}
                      onChange={(event) => handleChange('primaryContactName', event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="primary-contact-role">Cargo</Label>
                    <Input
                      id="primary-contact-role"
                      value={form.primaryContactRole}
                      onChange={(event) => handleChange('primaryContactRole', event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="primary-contact-phone">Teléfono</Label>
                    <Input
                      id="primary-contact-phone"
                      value={form.primaryContactPhone}
                      onChange={(event) => handleChange('primaryContactPhone', event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="primary-contact-email">Email</Label>
                    <Input
                      id="primary-contact-email"
                      type="email"
                      value={form.primaryContactEmail}
                      onChange={(event) => handleChange('primaryContactEmail', event.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex flex-col-reverse gap-2 border-t bg-background p-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createProspect.isPending || updateProspect.isPending}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
