'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { notify } from '@/lib/notifications';
import { updateSettings } from '@/services/settingsService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSettings } from '@/context/SettingsContext';
import { Separator } from '@/components/ui/separator';
import Loader from '@/components/Utilities/Loader';
import { settingsSchema } from '@/schemas/settingsSchema';
import { SECTIONS } from './config/sectionsConfig';
import { SettingsEmailSection } from './SettingsEmailSection';

export default function SettingsForm() {
  const { settings, loading, setSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailPassword, setEmailPassword] = useState('');
  const [hadPreviousConfig, setHadPreviousConfig] = useState(false);

  const { register, handleSubmit: formHandleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {},
  });

  const companyName = watch('company.name');
  const mailEncryption = watch('company.mail.encryption');

  useEffect(() => {
    if (!loading && settings && Object.keys(settings).length > 0) {
      reset(settings);
      setEmailPassword('');
      if (settings['company.mail.host'] && settings['company.mail.username'] && settings['company.mail.from_address']) {
        setHadPreviousConfig(true);
      }
    }
  }, [loading, settings, reset]);

  const onValidSubmit = async (data) => {
    if (!hadPreviousConfig && !emailPassword) {
      notify.error({
        title: 'Contraseña SMTP requerida',
        description: 'Introduce la contraseña del correo SMTP para guardar la configuración.',
      });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...data };
      if (emailPassword) payload['company.mail.password'] = emailPassword;
      const result = await updateSettings(payload);
      if (result && result.authError) return;
      setSettings(payload);
      setEmailPassword('');
      setHadPreviousConfig(true);
      notify.success({
        title: 'Configuración guardada',
        description: 'Los cambios de configuración se han guardado correctamente.',
      });
    } catch (error) {
      const msg = error?.userMessage ?? (error?.message?.includes('configuración de email') ? 'La configuración de email no está completa.' : error?.message ?? 'Error al guardar.');
      notify.error({ title: 'Error al guardar configuración', description: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader />
      </div>
    );

  return (
    <div className="h-full w-full flex flex-col">
      <ScrollArea className="flex-1 h-full w-full">
        <form onSubmit={formHandleSubmit(onValidSubmit)} className="max-w-7xl mx-auto p-6 space-y-8 min-h-full">
          <h1 className="text-xl font-light mb-4">Configuración de la empresa</h1>
          {SECTIONS.map((section, idx) => (
            <div key={section.title} className="p-0 space-y-4">
              <h2 className="text-lg font-semibold mb-2">{section.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                {section.fields.map((field) => (
                  <div key={field.name}>
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input id={field.name} {...register(field.name)} autoComplete="off" />
                    {errors[field.name] && <p className="text-sm text-destructive mt-1">{errors[field.name].message}</p>}
                  </div>
                ))}
              </div>
              {idx < SECTIONS.length - 1 && <Separator />}
            </div>
          ))}
          <SettingsEmailSection
            register={register}
            errors={errors}
            setValue={setValue}
            mailEncryption={mailEncryption}
            companyName={companyName}
            emailPassword={emailPassword}
            setEmailPassword={setEmailPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            hadPreviousConfig={hadPreviousConfig}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </div>
  );
}
