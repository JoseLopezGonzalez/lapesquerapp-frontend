'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { fetchSuperadmin, SuperadminApiError } from '@/lib/superadminApi';
import { notify } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StatusBadge from '../StatusBadge';
import { Pencil, Loader2 } from 'lucide-react';

const READONLY_FIELDS = ['subdomain', 'database'];

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  subdomain: 'Subdominio',
  database: 'Base de datos',
  status: 'Estado',
  plan: 'Plan',
  renewal_at: 'Renovación',
  timezone: 'Zona horaria',
  branding_image_url: 'Logo URL',
  admin_email: 'Email admin',
  created_at: 'Creado',
  updated_at: 'Actualizado',
};

const DISPLAY_ORDER = [
  'name',
  'subdomain',
  'database',
  'status',
  'plan',
  'admin_email',
  'timezone',
  'renewal_at',
  'branding_image_url',
  'created_at',
  'updated_at',
];

const EDITABLE_FIELDS = [
  'name',
  'plan',
  'renewal_at',
  'timezone',
  'branding_image_url',
  'admin_email',
];

const PLAN_OPTIONS = ['basic', 'professional', 'enterprise'];
const TIMEZONE_OPTIONS = [
  'Europe/Madrid',
  'Atlantic/Canary',
  'Europe/London',
  'Europe/Lisbon',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'America/Mexico_City',
];

interface Tenant {
  id: number | string;
  status: string;
  [key: string]: unknown;
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (key === 'created_at' || key === 'updated_at' || key === 'renewal_at') {
    try {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(String(value)));
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export default function GeneralData({ tenant, onRefresh }: { tenant: Tenant; onRefresh: () => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: EDITABLE_FIELDS.reduce<Record<string, string>>((acc, f) => {
      acc[f] = String(tenant[f] || '');
      return acc;
    }, {}),
  });

  const onSubmit = async (values: Record<string, string>) => {
    setSaving(true);
    try {
      await fetchSuperadmin(`/tenants/${tenant.id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      notify.success({ title: 'Tenant actualizado' });
      setEditOpen(false);
      onRefresh();
    } catch (err) {
      if (err instanceof SuperadminApiError && err.status === 422 && (err.data as { errors?: Record<string, string[]> })?.errors) {
        Object.entries((err.data as { errors: Record<string, string[]> }).errors).forEach(([field, msgs]) => {
          setError(field, { message: msgs[0] });
        });
      } else {
        notify.error({ title: (err as Error).message || 'Error al guardar' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Datos generales</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {DISPLAY_ORDER.map((key) => {
            const value = tenant[key];
            const isReadonly = READONLY_FIELDS.includes(key);
            return (
              <div
                key={key}
                className={`flex items-center gap-4 px-6 py-2.5 ${isReadonly ? 'bg-muted/50' : ''}`}
              >
                <span className="text-muted-foreground w-36 shrink-0 text-sm">
                  {FIELD_LABELS[key] || key}
                </span>
                <span className="text-sm">
                  {key === 'status' ? <StatusBadge status={value} /> : formatValue(key, value)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar tenant</DialogTitle>
            <DialogDescription>
              Modifica los datos del tenant. Los campos subdominio y base de datos no son editables.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {EDITABLE_FIELDS.map((field) => (
              <div key={field} className="grid w-full items-center gap-1.5">
                <Label htmlFor={`edit-${field}`}>{FIELD_LABELS[field] || field}</Label>
                {field === 'plan' ? (
                  <Controller
                    name={field}
                    control={control}
                    render={({ field: f }) => (
                      <Select value={f.value} onValueChange={f.onChange}>
                        <SelectTrigger id={`edit-${field}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLAN_OPTIONS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : field === 'timezone' ? (
                  <Controller
                    name={field}
                    control={control}
                    render={({ field: f }) => (
                      <Select value={f.value} onValueChange={f.onChange}>
                        <SelectTrigger id={`edit-${field}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <Input
                    id={`edit-${field}`}
                    type={
                      field === 'admin_email' ? 'email' : field === 'renewal_at' ? 'date' : 'text'
                    }
                    {...register(field)}
                  />
                )}
                {errors[field] && (
                  <p className="text-destructive text-xs">{errors[field].message}</p>
                )}
              </div>
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
