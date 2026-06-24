'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { fetchSuperadmin, SuperadminApiError } from '@/lib/superadminApi';
import { notify } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SubdomainField from './SubdomainField';
import { Loader2, ArrowLeft } from 'lucide-react';

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

export default function TenantForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<Record<string, string>>({
    defaultValues: {
      name: '',
      subdomain: '',
      admin_email: '',
      plan: 'basic',
      timezone: 'Europe/Madrid',
      branding_image_url: '',
    },
  });

  const onSubmit = async (values: Record<string, string>) => {
    setSaving(true);
    try {
      const res = await fetchSuperadmin('/tenants', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          branding_image_url: values.branding_image_url || null,
        }),
      });
      const json = await res.json();
      const newId = (json.data || json).id;
      notify.success({ title: 'Tenant creado', description: 'Onboarding en progreso.' });
      router.push(`/superadmin/tenants/${newId}`);
    } catch (err) {
      if (err instanceof SuperadminApiError && err.status === 422) {
        const errData = err.data as { errors?: Record<string, string[]> };
        if (errData.errors) {
          Object.entries(errData.errors).forEach(([field, msgs]) => {
            setError(field, { message: msgs[0] });
          });
        }
      } else {
        notify.error({ title: (err as Error).message || 'Error al crear el tenant' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push('/superadmin/tenants')}
          aria-label="Volver a la lista"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Crear tenant</h1>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Datos del tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="tf-name">Nombre empresa</Label>
              <Input
                id="tf-name"
                {...register('name', { required: 'El nombre es obligatorio' })}
                placeholder="Mi Empresa S.L."
                maxLength={255}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>

            <Controller
              name="subdomain"
              control={control}
              rules={{ required: 'El subdominio es obligatorio' }}
              render={({ field }) => (
                <SubdomainField
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.subdomain?.message}
                />
              )}
            />

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="tf-email">Email administrador</Label>
              <Input
                id="tf-email"
                type="email"
                {...register('admin_email', { required: 'El email es obligatorio' })}
                placeholder="admin@empresa.es"
              />
              {errors.admin_email && (
                <p className="text-destructive text-xs">{errors.admin_email.message}</p>
              )}
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="tf-plan">Plan</Label>
              <Controller
                name="plan"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tf-plan">
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
              {errors.plan && <p className="text-destructive text-xs">{errors.plan.message}</p>}
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="tf-tz">Zona horaria</Label>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tf-tz">
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
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="tf-logo">URL logo (opcional)</Label>
              <Input
                id="tf-logo"
                type="url"
                {...register('branding_image_url')}
                placeholder="https://..."
              />
              {errors.branding_image_url && (
                <p className="text-destructive text-xs">{errors.branding_image_url.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/superadmin/tenants')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear tenant'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
