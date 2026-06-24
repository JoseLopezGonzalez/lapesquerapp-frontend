'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMe } from '@/hooks/useMe';
import { useUpdateMe } from '@/hooks/useUpdateMe';
import type { UpdateMePayload } from '@/services/authService';
import type { FieldValues, UseFormSetError } from 'react-hook-form';

const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio.').max(255),
  email: z.string().email('Introduce un email válido.').max(255),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfilePageClient() {
  const { data: me, isLoading } = useMe();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '' },
  });

  const { mutate, isPending } = useUpdateMe(setError as UseFormSetError<FieldValues>);

  useEffect(() => {
    if (me) {
      reset({
        name: me.name ?? '',
        email: me.email ?? '',
      });
    }
  }, [me, reset]);

  const onSubmit = (data: ProfileFormValues) => {
    const payload: UpdateMePayload = {};
    if (data.name !== me?.name) payload.name = data.name;
    if (data.email !== me?.email) payload.email = data.email;
    if (Object.keys(payload).length === 0) return;
    mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const name = me?.name ?? '';

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-xl font-light">Mi cuenta</h1>

      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 rounded-xl">
          <AvatarFallback className="rounded-xl text-lg">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-muted-foreground text-sm">{me?.role ?? ''}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información personal</CardTitle>
          <CardDescription>Actualiza tu nombre y dirección de email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name" className="">Nombre</Label>
              <Input id="name" {...register('name')} autoComplete="name" />
              {errors.name && (
                <p className="text-destructive text-xs">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="">Email</Label>
              <Input id="email" type="email" {...register('email')} autoComplete="email" />
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending || !isDirty}>
                {isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
