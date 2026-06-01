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

  const {
    register,
    handleSubmit: formHandleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {},
  });

  const companyName = watch('company.name');
  const mailEncryption = watch('company.mail.encryption');

  useEffect(() => {
    if (!loading && settings && Object.keys(settings).length > 0) {
      reset(settings);
      setEmailPassword('');
      if (
        settings['company.mail.host'] &&
        settings['company.mail.username'] &&
        settings['company.mail.from_address']
      ) {
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
      const msg =
        error?.userMessage ??
        (error?.message?.includes('configuración de email')
          ? 'La configuración de email no está completa.'
          : (error?.message ?? 'Error al guardar.'));
      notify.error({ title: 'Error al guardar configuración', description: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    );

  return (
    <div className="flex h-full w-full flex-col">
      <ScrollArea className="h-full w-full flex-1">
        <form
          onSubmit={formHandleSubmit(onValidSubmit)}
          className="mx-auto min-h-full max-w-7xl space-y-8 p-6"
        >
          <h1 className="mb-4 text-xl font-light">Configuración de la empresa</h1>
          {SECTIONS.map((section, idx) => (
            <div key={section.title} className="space-y-4 p-0">
              <h2 className="mb-2 text-lg font-semibold">{section.title}</h2>
              <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2">
                {section.fields.map((field) => (
                  <div key={field.name}>
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input id={field.name} {...register(field.name)} autoComplete="off" />
                    {errors[field.name] && (
                      <p className="text-destructive mt-1 text-sm">{errors[field.name].message}</p>
                    )}
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
