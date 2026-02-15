'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';

export function SettingsEmailSection({
  register,
  errors,
  setValue,
  mailEncryption,
  companyName,
  emailPassword,
  setEmailPassword,
  showPassword,
  setShowPassword,
  hadPreviousConfig,
}) {
  return (
    <div className="p-0 space-y-4">
      <h2 className="text-lg font-semibold mb-2">Configuración de Emails Salientes</h2>
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>Importante:</strong> Todos los campos marcados con * son obligatorios.
        </p>
      </div>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-3">Servidor SMTP</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="company.mail.host">Servidor SMTP *</Label>
              <Input id="company.mail.host" {...register('company.mail.host')} placeholder="smtp.gmail.com" autoComplete="off" />
              {errors['company.mail.host'] && <p className="text-sm text-destructive mt-1">{errors['company.mail.host'].message}</p>}
            </div>
            <div>
              <Label htmlFor="company.mail.port">Puerto *</Label>
              <Input id="company.mail.port" type="number" min={1} max={65535} {...register('company.mail.port')} autoComplete="off" />
              {errors['company.mail.port'] && <p className="text-sm text-destructive mt-1">{errors['company.mail.port'].message}</p>}
            </div>
            <div>
              <Label htmlFor="company.mail.encryption">Encriptación *</Label>
              <Select value={mailEncryption || 'tls'} onValueChange={(v) => setValue('company.mail.encryption', v)}>
                <SelectTrigger id="company.mail.encryption">
                  <SelectValue placeholder="Selecciona encriptación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tls">TLS</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                </SelectContent>
              </Select>
              {errors['company.mail.encryption'] && <p className="text-sm text-destructive mt-1">{errors['company.mail.encryption'].message}</p>}
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-3">Credenciales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company.mail.username">Usuario/Email *</Label>
              <Input id="company.mail.username" type="email" {...register('company.mail.username')} placeholder="noreply@empresa.com" autoComplete="off" />
              {errors['company.mail.username'] && <p className="text-sm text-destructive mt-1">{errors['company.mail.username'].message}</p>}
            </div>
            <div>
              <Label htmlFor="company.mail.password">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="company.mail.password"
                  type={showPassword ? 'text' : 'password'}
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder={hadPreviousConfig ? '•••••••• (deja vacío para mantener actual)' : '••••••••'}
                  autoComplete="new-password"
                  required={!hadPreviousConfig}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {hadPreviousConfig ? 'Deja vacío para mantener la contraseña actual' : 'La contraseña SMTP es obligatoria'}
              </p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-3">Remitente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company.mail.from_address">Email Remitente *</Label>
              <Input id="company.mail.from_address" type="email" {...register('company.mail.from_address')} placeholder="noreply@empresa.com" autoComplete="off" />
              {errors['company.mail.from_address'] && <p className="text-sm text-destructive mt-1">{errors['company.mail.from_address'].message}</p>}
            </div>
            <div>
              <Label htmlFor="company.mail.from_name">Nombre Remitente</Label>
              <Input id="company.mail.from_name" {...register('company.mail.from_name')} placeholder={companyName || 'Nombre de la empresa'} autoComplete="off" />
            </div>
          </div>
        </div>
      </div>
      <Separator />
    </div>
  );
}
